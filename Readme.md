# Steps

1. `truffle compile` - to compile contracts
2. `npm run dist` or `make abi` - to copy artifcats and pack generated contracts
3. `npm test` - for tests on in-process TestRPC
4. `npm start` or `make dev` - to run test server
5. `make run` for production server

Need to save owner private key and address in the Makefile as hex.


## API

### Get tx info by tx id:

```
curl --request POST \
  --url http://localhost:3000/getTransaction \
  --header 'content-type: application/json' \
  --data '{"args": ["0xfe42d74d7ea48402aa901d3eca295e6ffe1e17e7526b728e32db9bbab0fe1d9c"]}'

```

### Create new auction

* at - address of deployed factory, should be a part of a config
* args - correspond to solidity signature: `address _owner, address _wallet, address _token, uint _endSeconds, uint256 _weiPerToken, string _item, bool _allowManagedBids`
* _owner - account managing the auction process: '0xHexOfOwnerAddress'
* _wallet - account that will receive payments when the auction ends: '0xHexOfWalletAddress'
* _token - address of a deployed Ace token, '0x06147110022B768BA8F99A8f385df11a151A9cc8' on mainnet
* _endSeconds - end time in Unix seconds, 1514160000 for Dec 25, 2017 (need to double check!)
* _weiPerToken - exchange rate of one Ace token to Ether *wei* (1e-18), 0.0001 BTC is approximately 2400000000000000
* _item - short string desciption of item
* _allowManagedBids - allow managed bids in fiat/BTC from backend, should be true

```
curl --request POST \
  --url http://localhost:3000/contract \
  --header 'content-type: application/json' \
  --data '{"contract": "AuctionFactory",
            "method": "produceForOwnerCustomToken",
            "at": "0xHexOfAuctionFactoryAddress",
            "args": ["0xHexOfOwnerAddress", "0xHexOfWalletAddress", "0x06147110022B768BA8F99A8f385df11a151A9cc8", 1514160000, 2400000000000000, "test_item", true ]}'
  
{
    "result": "0xfe42d74d7ea48402aa901d3eca295e6ffe1e17e7526b728e32db9bbab0fe1d9c",
    "statusCode": 200
}
```

Mined transactions returns a receipt with new Auction contract address available as: `auctionTx.logs[0].args.addr`


### Managed bid

* at - address of deployed auction, should be a part of a config (if deployed manually) or stored somewhere from factory calls
* args - correspond to solidity signature: `uint64 _managedBidder, uint256 _managedBid`
* _managedBidder - intenal id of managed bidder, managed on backend
* _managedBid - bid in Ether Wei (1e-18 unit). Could be a problem with large values, need to test. Will make a wrapper if long numbers cannot be deserialized correctly.

```
curl --request POST \
  --url http://localhost:3000/contract \
  --header 'content-type: application/json' \
  --data '{"contract": "Auction",
            "method": "managedBid",
            "at": "0xHexOfAuctionAddress",
            "args": [42, 123000000000000000000 ]}'
  
{
    "result": "0xfe42d74d7ea48402aa901d3eca295e6ffe1e17e7526b728e32db9bbab0fe1d9c",
    "statusCode": 200
}
```

### SetWeiPerToken

Same as above, a single parameter: `uint256 _weiPerToken` must meet the requirement: `require (_weiPerToken > (1e15) && _weiPerToken < 5 * (1e15));`
We could update the rate daily

###  FinalizeAuction

End auction (after end date), could be called only by owner. Will transfer the highest bid - if it is in Ether - to the wallet address

```
curl --request POST \
  --url http://localhost:3000/contract \
  --header 'content-type: application/json' \
  --data '{"contract": "Auction",
            "method": "finalizeAuction",
            "at": "0xHexOfAuctionAddress",
            "args": []}'
  
{
    "result": "0xfe42d74d7ea48402aa901d3eca295e6ffe1e17e7526b728e32db9bbab0fe1d9c",
    "statusCode": 200
}
```

### CancelAuction

```
curl --request POST \
  --url http://localhost:3000/contract \
  --header 'content-type: application/json' \
  --data '{"contract": "Auction",
            "method": "cancelAuction",
            "at": "0xHexOfAuctionAddress",
            "args": []}'
  
{
    "result": "0xfe42d74d7ea48402aa901d3eca295e6ffe1e17e7526b728e32db9bbab0fe1d9c",
    "statusCode": 200
}
```


### Get All Events

Get request: http://localhost:3000/events/0x305d46467b8c2ebf89b154f8f0c27d9aee75271f/1391507

http://localhost:3000/events/[0xContractAddress]/[block_number]

* block_number could be ommited and then set to zero
* if there are too many events then use block number from the lastest block minus 1 (without decrementing there is a risk of missing some event)

```
curl --request POST --url http://localhost:3000/events --header 'content-type: application/json'  --data '{"contract": "Auction", "at": "0x305d46467b8c2ebf89b154f8f0c27d9aee75271f"}'
  
{
    "result": [array of event logs],
    "statusCode": 200
}
```