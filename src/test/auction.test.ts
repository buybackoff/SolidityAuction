import { AceToken, TeamToken, AuctionHub, Auction } from '../contracts'
import { W3, getStorage, Storage, TestRPC, toBN, testAccounts, testPrivateKeys } from 'soltsice';
import * as Ganache from 'ganache-cli';
import { access } from 'fs';

// Replace w3 ctor to test on a real testnet, not TestRPC/ganache
// let w3 = new W3(new W3.providers.HttpProvider('http://localhost:8544'));
let w3: W3 = new W3(Ganache.provider({
    network_id: 314,
    accounts: [
        { balance: '0xD3C21BCECCEDA1000000', secretKey: '0x' + testPrivateKeys[0] },
        { balance: '0xD3C21BCECCEDA1000000', secretKey: '0x' + testPrivateKeys[1] },
        { balance: '0xD3C21BCECCEDA1000000', secretKey: '0x' + testPrivateKeys[2] }
    ]
}));

// let address = W3.EthUtils.bufferToHex(W3.EthUtils.privateToAddress(new Buffer(testPrivateKeys[0], 'hex')));
// console.log('CALCULATED ADDRESS', address);

W3.default = w3;
let testrpc = new TestRPC(w3);

// testnet account with some ether
let activeAccount = testAccounts[0];

let storage: Storage;

let maxGasParams = W3.TX.txParamsDefaultDeploy(activeAccount);
let sendParams = W3.TX.txParamsDefaultSend(activeAccount);

let accounts: string[];
let auctionAddress: string;
let end = (new Date(2018, 3, 25).getTime() / 1000);
let weiPerToken = w3.toBigNumber('2400000000000000');
let maxTokensInEther = weiPerToken.mul(50);

let aceToken: AceToken;
let teamToken: TeamToken;   

beforeAll(async () => {

    if (!(await w3.isTestRPC)) {
        console.log('NOT ON TESTRPC');
        await w3.unlockAccount(activeAccount, 'Rinkeby', 150000);
    } else {
        accounts = await w3.accounts;
        activeAccount = accounts[0];
        maxGasParams = W3.TX.txParamsDefaultDeploy(activeAccount);
        sendParams = W3.TX.txParamsDefaultSend(activeAccount);
        console.log('ACTIVE ACCOUNT', activeAccount);
    }

    w3.defaultAccount = activeAccount;
    storage = await getStorage(w3, activeAccount);

});

beforeEach(async () => {
    // Testnets are SLOW compared to TestRPC
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 18000000;
    if ((await w3.networkId) === '1') {
        console.log('NOT ON TESTNET');
    } else {
        maxGasParams.gasPrice = 20000000000;
        sendParams.gasPrice = 20000000000;
    }
    expect((await w3.networkId)).not.toBe('1');
});


it('Could deploy auction factory and create auction', async () => {
    
    aceToken = await AceToken.new(maxGasParams, undefined, w3);
    teamToken = await TeamToken.new(maxGasParams, undefined, w3);

    let tokenAddress = await aceToken.address;
    console.log('TOKEN ADDRESS', tokenAddress);

    let minPrice = weiPerToken;

    let hub = await AuctionHub.new(maxGasParams, {_wallet: activeAccount, _tokens: [aceToken.address, teamToken.address], _rates: [weiPerToken, weiPerToken], _decimals: [0, 4]}, w3);
    console.log('FACTORY ADDRESS', await hub.address);

    expect(await hub.isBot(activeAccount)).toBe(true);
    console.log('IS BOT');

    let auctionTx = await hub.createAuction(end, maxTokensInEther, minPrice, 'test_item', true, maxGasParams);

    console.log('AUCTION TX', auctionTx);
    let args = auctionTx.logs[0].args;

    console.log('ARGS', args);

    auctionAddress = args.auction;

    let auction = await Auction.at(auctionAddress, w3);

    let actualAddress = await auction.address;

    expect(actualAddress).toBe(auctionAddress);
    let item = await auction.item();
    console.log('TEST ITEM: ', item);
    expect(item).toBe('test_item');
})


it('Could send manage bid', async () => {

    let bid = weiPerToken;
    let auction = await Auction.at(auctionAddress, w3);

    console.log('SEND PARAMS', maxGasParams);
    let tx = await auction.managedBid(42, bid, maxGasParams);

    console.log('MANAGED BID TX', tx);

    let bidder = (await auction.highestManagedBidder()).toNumber();
    expect(bidder).toBe(42);

    let highestBid = (await auction.highestBid());
    expect(highestBid).toEqual(bid);
})


it('Could extend end time', async () => {
    if (await w3.isTestRPC) {
        let bid = weiPerToken.add(1);

        let auction = await Auction.at(auctionAddress, w3);

        let contractEnd = (await auction.endSeconds()).toNumber();

        expect(contractEnd).toBe(end);

        let minutesLeft = 10;

        await testrpc.increaseTimeTo(end - 60 * minutesLeft);

        let tx = await auction.managedBid(43, bid, maxGasParams);

        let newContractEnd = (await auction.endSeconds()).toNumber();

        expect(newContractEnd).toBeGreaterThan(contractEnd);
        expect(newContractEnd - contractEnd).toBe(60 * (30 - minutesLeft));

        console.log('NEW-OLD END', newContractEnd - contractEnd);

        let bidder = (await auction.highestManagedBidder()).toNumber();
        expect(bidder).toBe(43);

        let highestBid = (await auction.highestBid());
        expect(highestBid).toEqual(bid);
    }
})

it('Could mint tokens and bid with them', async () => {
    if (await w3.isTestRPC) {
        // scenario: first bid is in tokens + ether, cannot withdraw while the highest
        // then another bidders overbids with ether only
        // after that the token bidder withdraws all (to test withdrawal with tokens) and then bids more
        // then we move time forward and finalize auction, wallet must have tokens and additional ether

        let tokenBidder = accounts[1];
        let onlyEtherBidder = accounts[2];
        expect(tokenBidder).not.toEqual(onlyEtherBidder);

        let initialTokenBidderBalance = 1000;

        let mintedTx = await aceToken.mint(tokenBidder, initialTokenBidderBalance, maxGasParams);
        console.log('MINTED TX', mintedTx);
        let balance = await aceToken.balanceOf(tokenBidder);
        expect(balance.toNumber()).toBe(1000);

        let mintedTx2 = await teamToken.mint(tokenBidder, initialTokenBidderBalance * 10000, maxGasParams);
        console.log('MINTED TX2', mintedTx2);
        
        let tokenBidderParams: W3.TX.TxParams = Object.assign({}, maxGasParams, { from: tokenBidder });

        let approveTxAce = await aceToken.approve(auctionAddress, 100, tokenBidderParams);
        console.log('APPROVE TX ACE', approveTxAce);
        let approveTxTeam = await teamToken.approve(auctionAddress, 500*10000, tokenBidderParams);
        console.log('APPROVE TX TEAM', approveTxTeam);

        let allowance = await aceToken.allowance(tokenBidder, auctionAddress);
        console.log('ALLOWANCE', allowance.toNumber());

        let auction = await Auction.at(auctionAddress, w3);

        try {
            let tokensNumber = maxTokensInEther.div(weiPerToken).add(1);
            let tx = await auction.bid(aceToken.address, tokensNumber, tokenBidderParams);
            console.log('TX', tx);
            expect(true).toBe(false); // fail if reached here
        } catch { }

        let etherBidInTokens = 10;
        let tokenBidderParamsWithValue: W3.TX.TxParams = Object.assign({}, tokenBidderParams, { value: weiPerToken.mul(etherBidInTokens) });

        let tokensNumber = maxTokensInEther.div(weiPerToken).sub(etherBidInTokens);
        console.log('TOKENS NUMBER: ', tokensNumber.toFormat());
        console.log('TOKENS NUMBER IN WEI: ', tokensNumber.mul(weiPerToken).toFormat());
        let highestBid0 = await auction.highestBid();

        console.log('HIGHEST BID0: ', highestBid0.toFixed());
        
        let txAce = await auction.bid(aceToken.address, tokensNumber.div(2), tokenBidderParamsWithValue);
        console.log('TX ACE', txAce);

        let tokenBidderParamsWithValue2 = Object.assign({}, tokenBidderParamsWithValue);
        tokenBidderParamsWithValue2.value = 0;
        let txTeam = await auction.bid(teamToken.address, tokensNumber.div(2).mul(10000), tokenBidderParamsWithValue2);
        console.log('TX TEAM', txTeam);

        let highestBid = await auction.highestBid();
        console.log('HIGHEST BID: ', highestBid.toFixed());
        expect(highestBid).toEqual(maxTokensInEther);
        let highestBidder = await auction.highestBidder();
        expect(highestBidder).toEqual(tokenBidder);

        try {
            // could not withdraw while the highest bidder
            await auction.withdraw(tokenBidderParams);
            expect(true).toBe(false); // fail if reached here
        } catch{ }

        // Ether-only bidder overbids, token bidder should be able to withdraw

        let onlyEtherBidderParams = Object.assign({}, maxGasParams, { from: onlyEtherBidder });

        let newBid = highestBid.add(weiPerToken);
        let onlyEtherBidderParamsWithValue = Object.assign({}, onlyEtherBidderParams, { value: newBid.toNumber() });
        let tx3 = await auction.sendTransaction(onlyEtherBidderParamsWithValue);

        highestBid = await auction.highestBid();
        expect(highestBid).toEqual(newBid);
        highestBidder = await auction.highestBidder();
        expect(highestBidder).toEqual(onlyEtherBidder);

        // now token bidder could withdraw
        console.log(tokenBidderParams);

        // let tokenBalance = await auction.tokenBalances(tokenBidder);
        // let etherBalance = await auction.etherBalances(tokenBidder);
        let auctionTokenBalance = await aceToken.balanceOf(auctionAddress);
        console.log('AUCTION BALANCE: ', auctionTokenBalance.toFixed());

        // expect(tokenBalance).toEqual(auctionTokenBalance);
        expect(highestBidder).not.toEqual(tokenBidderParams.from);

        let withdrawData = await auction.withdraw.data();
        console.log('WITHDRAW DATA: ', withdrawData);
        let withdrawTx = await auction.withdraw(tokenBidderParams);
        console.log('WITHDRAW TX', withdrawTx);
        expect((await aceToken.balanceOf(auctionAddress)).toNumber()).toEqual(0);
        expect((await aceToken.balanceOf(tokenBidder)).toNumber()).toEqual(initialTokenBidderBalance); //  - 1
        

        // second attempt fails
        try {
            await auction.withdraw(tokenBidderParams);
            expect(true).toBe(false);
        } catch{ }


        // re-bid after withdraw so we could test finalization with tokens
        let tx4 = await auction.bid(aceToken.address, maxTokensInEther.div(weiPerToken), tokenBidderParamsWithValue);
        expect(await auction.highestBidder()).toEqual(tokenBidderParamsWithValue.from);

        highestBid = await auction.highestBid();

        // sum managed + direct bids

        let tx5 = await auction.managedBid2(1, weiPerToken, tokenBidderParamsWithValue.from, maxGasParams);
        expect(await auction.highestBidder()).toEqual(tokenBidderParamsWithValue.from);

        let highestBid2 = await auction.highestBid();
        expect(highestBid2).toEqual(highestBid.add(weiPerToken));
        expect(await auction.highestBidder()).toEqual(tokenBidderParamsWithValue.from);

        tokenBidderParamsWithValue = Object.assign({}, tokenBidderParamsWithValue, { value: weiPerToken });
        tokenBidderParamsWithValue.value = toBN(42000);
        console.log('LAST BID PARAMS', tokenBidderParamsWithValue);

        let tx6 = await auction.bid(W3.zeroAddress, 0, tokenBidderParamsWithValue);
        console.log('TX6', tx6);
        let highestBid3 = await auction.highestBid();
        expect(await auction.highestBidder()).toEqual(tokenBidderParamsWithValue.from);
        expect(highestBid3).toEqual(highestBid2.add(42000));

        // This was tested, but we need to finalize (too lazy to recreate an auction just to cancel it and redo all withdrawal logic)
        // let cancelTx = await auction.cancel();
        // console.log('CANCEL TX', cancelTx);
        // console.log(await auction.withdraw(onlyEtherBidderParams));
        // console.log(await auction.withdraw(tokenBidderParams));

        // move time forward to endTime + something
        await testrpc.increaseTimeTo((await auction.endSeconds()).toNumber() + 60);

        let finalizeTx = await auction.finalize(maxGasParams);
        console.log('FINALIZE TX', finalizeTx.logs);

        expect((await aceToken.balanceOf(maxGasParams.from))).toEqual(maxTokensInEther.div(weiPerToken));

        console.log('Wallet balance:', (await w3.getBalance(maxGasParams.from)).toFormat());

    }
})
