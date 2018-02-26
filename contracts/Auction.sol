pragma solidity ^0.4.18;

import 'soltsice/contracts/BotManageable.sol';

contract ERC20Basic {
    function totalSupply() public view returns (uint256);
    function transferFrom(address from, address to, uint256 value) public returns (bool);
    function transfer(address to, uint256 value) public returns (bool);
}


contract AuctionHub is BotManageable {

    /*
     *  Data structures
     */
    struct TokenBalance {
        address token;
        uint256 value;
    }

    struct BidderState {
        uint256 etherBalance;
        uint256 tokensBalanceInEther;
        uint256 managedBid;
        TokenBalance[] tokenBalances;
    }

    struct ActionState {
        uint256 endSeconds;
        uint256 maxTokenBidInEther;
        uint256 minPrice;
        
        uint256 highestBid;
        
        // next 5 fields should be packed into one 32-bytes slot
        address highestBidder;
        uint64 highestManagedBidder;
        bool allowManagedBids;
        bool cancelled;
        bool finalized;

        mapping(address => BidderState) bidderStates;

        string item;
    }

    /*
     *  Storage
     */
    mapping(address => ActionState) public auctionStates;
    mapping(address => uint256) public tokenRates;

    /*
     *  Events
     */

    event NewAction(address indexed auction, string item);
    event Bid(address indexed auction, address bidder, uint256 totalBidInEther, uint256 indexed tokensBidInEther);
    event TokenBid(address indexed auction, address bidder, address token, uint256 numberOfTokens);
    event ManagedBid(address indexed auction, uint64 bidder, uint256 bid, address knownManagedBidder);
    event NewHighestBidder(address indexed auction, address bidder, uint64 managedBidder, uint256 totalBid);
    event Withdrawal(address indexed auction, address bidder, uint256 etherAmount);
    event Charity(address indexed auction, address bidder, uint256 etherAmount, uint256 tokensAmount);
    event Finalized(address indexed auction, address highestBidder, uint64 highestManagedBidder, uint256 amount);
    event FinalizedTokenTransfer(address indexed auction, address token, uint256 tokensAmount);
    event FinalizedEtherTransfer(address indexed auction, uint256 etherAmount);
    event ExtendedEndTime(address indexed auction, uint256 newEndtime);
    event Cancelled(address indexed auction);

    /*
     *  Modifiers
     */

    modifier onlyActive {
        // NB this modifier also serves as check that an auction exists (otherwise endSeconds == 0)
        ActionState storage auctionState = auctionStates[msg.sender];
        require (now < auctionState.endSeconds && !auctionState.cancelled);
        _;
    }

    modifier onlyBeforeEnd {
        // NB this modifier also serves as check that an auction exists (otherwise endSeconds == 0)
        ActionState storage auctionState = auctionStates[msg.sender];
        require (now < auctionState.endSeconds);
        _;
    }

    modifier onlyAfterEnd {
        ActionState storage auctionState = auctionStates[msg.sender];
        require (now > auctionState.endSeconds && auctionState.endSeconds > 0);
        _;
    }

    modifier onlyNotCancelled {
        ActionState storage auctionState = auctionStates[msg.sender];
        require (!auctionState.cancelled);
        _;
    }

    modifier onlyAllowedManagedBids {
        ActionState storage auctionState = auctionStates[msg.sender];
        require (auctionState.allowManagedBids);
        _;
    }


    function AuctionHub 
        (address _wallet, address[] _tokens, uint256[] _rates)
        public
        BotManageable(_wallet)
    {
        // make sender a bot to avoid an additional step
        botsStartEndTime[msg.sender] = uint128(now) << 64;

        require(_tokens.length == _rates.length);

        // save initial token list
        for (uint i = 0; i < _tokens.length; i++) {
            require(_tokens[i] != 0x0);
            require(_rates[i] > 0);
            ERC20Basic token = ERC20Basic(_tokens[i]);
            require(token.totalSupply() > 0);
            tokenRates[token] = _rates[i];
        }
    }

    function createAuction(
        uint _endSeconds, 
        uint256 _maxTokenBidInEther,
        uint256 _minPrice,
        string _item,
        bool _allowManagedBids
    )
        onlyBot
        public
        returns (address)
    {
        require (_endSeconds > now);
        require(_maxTokenBidInEther <= 1000);
        require(_minPrice > 0);

        Auction auction = new Auction(this, wallet);

        ActionState storage auctionState = auctionStates[auction];

        auctionState.endSeconds = _endSeconds;
        auctionState.maxTokenBidInEther = _maxTokenBidInEther;
        auctionState.minPrice = _minPrice;
        auctionState.allowManagedBids = _allowManagedBids;
        auctionState.item = _item;

        NewAction(auction, _item);
        return address(auction);
    }

    function () 
        payable
        public
    {
        // It's charity!
        require(wallet.send(msg.value));
        Charity(0x0, msg.sender, msg.value, 0);
    }

    function bid(address _bidder, address _token, uint256 _tokensNumber)
        payable
        onlyActive
        public
        returns (bool isHighest)
    {

        // mapping(address => BidderState) bidderStates;
        ActionState storage auctionState = auctionStates[msg.sender];
        BidderState storage bidderState = auctionStates[msg.sender].bidderStates[_bidder];
        
        uint256 totalBid;
        if (_tokensNumber > 0) {
            totalBid = tokenBid(msg.sender, _bidder,  _token, _tokensNumber);
        } else {
            require(msg.value > 0);
        }

        uint256 etherBid = bidderState.etherBalance + msg.value;
        bidderState.etherBalance = etherBid;
        totalBid = totalBid + etherBid + bidderState.managedBid;

        if (totalBid > auctionState.highestBid && totalBid >= auctionState.minPrice) {
            auctionState.highestBid = totalBid;
            auctionState.highestBidder = _bidder;
            auctionState.highestManagedBidder = 0;
            NewHighestBidder(msg.sender, _bidder, 0, totalBid);
            if ((auctionState.endSeconds - now) < 1800) {
                uint256 newEnd = now + 1800;
                auctionState.endSeconds = newEnd;
                ExtendedEndTime(msg.sender, newEnd);
            }
            isHighest = true;
        }

        Bid(msg.sender, _bidder, totalBid, totalBid - etherBid);

        return isHighest;
    }

    function tokenBid(address _auction, address _bidder, address _token, uint256 _tokensNumber)
        internal
        returns (uint256 tokenBid)
    {

        // mapping(address => BidderState) bidderStates;
        ActionState storage auctionState = auctionStates[_auction];
        BidderState storage bidderState = auctionStates[_auction].bidderStates[_bidder];
        
        // start with tokens only, this variable is reused in the first if conditoin
        uint256 totalBid = bidderState.tokensBalanceInEther;

        uint256 tokenRate = tokenRates[_token];
        require(tokenRate > 0);

        // find token index
        uint256 index = bidderState.tokenBalances.length;
        for (uint i = 0; i < index; i++) {
            if (bidderState.tokenBalances[i].token == _token) {
                index = i;
                break;
            }
        }

        // array was empty/token not found - push empty to the end
        if (index == bidderState.tokenBalances.length) {
            bidderState.tokenBalances.push(TokenBalance(_token, 0));
        }

        // sender must approve transfer before calling this function
        require(ERC20Basic(_token).transferFrom(_bidder, this, _tokensNumber));

        // safe math is already in transferFrom
        bidderState.tokenBalances[index].value += _tokensNumber;

        // TODO decimals

        // by now totalBid still only includes token build, see comment before if() 
        totalBid = totalBid + _tokensNumber * tokenRate;
        require(totalBid <= auctionState.maxTokenBidInEther);

        bidderState.tokensBalanceInEther = totalBid;

        TokenBid(_auction, _bidder, _token, _tokensNumber);

        return totalBid;
    }

}


contract Auction {

    AuctionHub public owner;
    address public wallet;

    event Bid(address indexed bidder, uint256 totalBidInEther, uint256 tokensBid);
    event ManagedBid(uint64 indexed bidder, uint256 bid);
    event ManagedBid2(uint64 indexed bidder, uint256 bid, address knownManagedBidder);
    event NewHighestBidder(address indexed bidder, uint64 indexed managedBidder, uint256 bid);
    event NewHighestBidder2(address indexed bidder, uint256 bid, uint256 managedBid);
    event Withdrawal(address indexed withdrawer, uint256 etherAmount, uint256 tokensAmount);
    event Charity(address indexed withdrawer, uint256 etherAmount, uint256 tokensAmount);
    event Finalized(address indexed bidder, uint64 managedBidder, uint256 amount);
    event FinalizedTokenTransfer(uint256 tokensAmount);
    event FinalizedEtherTransfer(uint256 etherAmount);

    event ExtendedEndTime(uint256 newEndtime);
    event Cancelled();

    modifier onlyOwner {
        require(owner.isBot(msg.sender));
        _;
    }

    modifier onlyNotOwner {
        require(!owner.isBot(msg.sender));
        _;
    }

    function Auction(
        address _owner,
        address _wallet
    ) 
        public 
    {
        require(_owner != address(0x0));
        require(_wallet != address(0x0));
        
        owner = AuctionHub(_owner);
        wallet = _wallet;
    }

    function () 
        payable
        public
    {
        bid(0x0, 0);
    }

    function bid(address _token, uint256 _tokensNumber)
        payable
        public
        returns (bool isHighest)
    {
        return owner.bid(msg.sender, _token, _tokensNumber);
    }

    // function managedBid(uint64 _managedBidder, uint256 _managedBid)
    //     onlyBeforeEnd
    //     onlyNotCancelled
    //     onlyOwner
    //     onlyAllowedManagedBids
    //     public
    //     returns (bool isHighest)
    // {
    //     if (_managedBid > highestBid && _managedBid >= minPrice) {
    //         highestBid = _managedBid;
    //         highestBidder = address(0);
    //         highestManagedBidder = _managedBidder;
    //         NewHighestBidder(highestBidder, highestManagedBidder, highestBid);
    //         if ((endSeconds - now) < 1800) {
    //             endSeconds = now + 1800;
    //             ExtendedEndTime(endSeconds);
    //         }
    //     }
    //     ManagedBid(_managedBidder, _managedBid);
    //     return highestBid == _managedBid;
    // }

    // function managedBid2(uint64 _managedBidder, uint256 _managedBid, address _knownManagedBidder)
    //     onlyBeforeEnd
    //     onlyNotCancelled
    //     onlyOwner
    //     onlyAllowedManagedBids
    //     public
    //     returns (bool isHighest)
    // {
    //     // NB: _managedBid is the total amount of all bids from backend
    //     // calculated without any direct bid. It is important to calculate direct bids
    //     // inside this transaction and make the _knownManagedBidder the highest
    //     // to prevent this wallet to withdraw money and remain the highest

    //     require(_knownManagedBidder != address(0));

    //     require(_managedBid > managedBids[_knownManagedBidder]);
    //     managedBids[_knownManagedBidder] = _managedBid;

    //     uint256 direct = totalDirectBid(_knownManagedBidder);
    //     uint256 totalBid = direct + _managedBid;
    //     if (totalBid > highestBid && totalBid >= minPrice) {
    //         highestBid = totalBid;
    //         highestBidder = _knownManagedBidder;
    //         highestManagedBidder = 0;
    //         NewHighestBidder2(highestBidder, highestBid, _managedBid);
    //         if ((endSeconds - now) < 1800) {
    //             endSeconds = now + 1800;
    //             ExtendedEndTime(endSeconds);
    //         }
    //     }
    //     ManagedBid2(_managedBidder, _managedBid, _knownManagedBidder);
    //     return highestBid == totalBid;
    // }

    // function totalDirectBid(address _address)
    //     constant
    //     public
    //     returns (uint256 _totalBid)
    // {
    //     return tokenBalancesInEther[_address] + etherBalances[_address];
    // }


    // function setWeiPerToken(uint256 _weiPerToken)
    //     onlyBeforeEnd
    //     onlyNotCancelled
    //     onlyOwner
    //     public
    // {
    //     require (_weiPerToken > (1e15) && _weiPerToken < (1e16));
    //     weiPerToken = _weiPerToken;
    // }

    // function withdraw()
    //     public
    //     returns (bool success)
    // {
    //     // anyone could withdraw at any time except the highest bidder
    //     // if canceled, the highest bidder could withdraw as well
    //     require((msg.sender != highestBidder) || cancelled);

    //     uint256 tokenBid = tokenBalances[msg.sender];
    //     if (tokenBid > 0) {
    //         tokenBalances[msg.sender] = 0;
    //         require(token.transfer(msg.sender, tokenBid));
    //     }

    //     uint256 etherBid = etherBalances[msg.sender];
    //     if (etherBid > 0) {
    //         etherBalances[msg.sender] = 0;
    //         require(msg.sender.send(etherBid));
    //     }

    //     require(tokenBid > 0 || etherBid > 0);

    //     Withdrawal(msg.sender, etherBid, tokenBid);

    //     return true;
    // }

    // function finalize()
    //     onlyOwner
    //     onlyNotCancelled
    //     onlyAfterEnd
    //     public
    //     returns (bool)
    // {
    //     require(!finalized);

    //     if (highestBidder != address(0)) {
    //         uint256 tokenBid = tokenBalances[highestBidder];
    //         if (tokenBid > 0) {
    //             tokenBalances[highestBidder] = 0;
    //             require(token.transfer(wallet, tokenBid));
    //             FinalizedTokenTransfer(tokenBid);
    //         }

    //         uint256 etherBid = etherBalances[highestBidder];
    //         if (etherBid > 0) {
    //             etherBalances[highestBidder] = 0;
    //             require(wallet.send(etherBid));
    //             FinalizedEtherTransfer(etherBid);
    //         }

    //         require(tokenBid > 0 || etherBid > 0);

    //         // this condition could break after we have added ability to change the rate after ctor
    //         // and it won't be possible to set weiPerToken due to onlyAfterEnd/onlyBeforeEnd different modifiers
    //         // also it could differ after managedBid2
    //         // ... require(tokenBid * weiPerToken + etherBid == highestBid);
    //     }

    //     finalized = true;
    //     Finalized(highestBidder, highestManagedBidder, highestBid);
    //     return true;
    // }

    // function cancel()
    //     onlyOwner
    //     onlyBeforeEnd
    //     onlyNotCancelled
    //     public
    //     returns (bool success)
    // {
    //     cancelled = true;
    //     Cancelled();
    //     return true;
    // }
}


// library AuctionFactory {

//     event AuctionProduced(address indexed addr, string _item);

//     function produce(
//         address _wallet, 
//         uint _endSeconds, 
//         uint256 _weiPerToken, 
//         uint256 _maxTokens, 
//         string _item, 
//         uint256 _minPrice, 
//         bool _allowManagedBids
//     )
//         public
//         returns (address)
//     {
//         address addr = new Auction(msg.sender, _wallet, 0x06147110022B768BA8F99A8f385df11a151A9cc8, _endSeconds, _weiPerToken, _maxTokens, _item, _minPrice, _allowManagedBids);
//         AuctionProduced(addr, _item);
//         return addr;
//     }

//     function produceForOwner(
//         address _owner, 
//         address _wallet, 
//         uint _endSeconds, 
//         uint256 _weiPerToken, 
//         uint256 _maxTokens, 
//         string _item, 
//         uint256 _minPrice, 
//         bool _allowManagedBids
//     )
//         public
//         returns (address)
//     {
//         address addr = new Auction(_owner, _wallet, 0x06147110022B768BA8F99A8f385df11a151A9cc8, _endSeconds, _weiPerToken, _maxTokens, _item, _minPrice, _allowManagedBids);
//         AuctionProduced(addr, _item);
//         return addr;
//     }

//     // token for testing
//     function produceForOwnerCustomToken(
//         address _owner, 
//         address _wallet, 
//         address _token,
//         uint _endSeconds, 
//         uint256 _weiPerToken, 
//         uint256 _maxTokens, 
//         string _item, 
//         uint256 _minPrice, 
//         bool _allowManagedBids
//     )
//         public
//         returns (address)
//     {
//         address addr = new Auction(_owner, _wallet, _token, _endSeconds, _weiPerToken, _maxTokens, _item, _minPrice, _allowManagedBids);
//         AuctionProduced(addr, _item);
//         return addr;
//     }
// }
