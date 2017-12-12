import { AuctionFactory, Auction, AceToken } from '../contracts'
import { W3, getStorage, Storage, TestRPC } from 'soltsice';
import * as Ganache from 'ganache-cli';

// let w3 = new W3(new W3.providers.HttpProvider('http://localhost:8544'));
let w3: W3 = new W3(Ganache.provider({
    network_id: 314,
    accounts: [{ balance: '0xD3C21BCECCEDA1000000', secretKey: '0x1ce01934dbcd6fd84e68faca8c6aebca346162823d20f0562135fe3e4f275bce'}]    
}));

// let address = W3.EthUtils.bufferToHex(W3.EthUtils.privateToAddress(new Buffer('1ce01934dbcd6fd84e68faca8c6aebca346162823d20f0562135fe3e4f275bce', 'hex')));
// console.log('CALCULATED ADDRESS', address);

W3.Default = w3;
let testrpc = new TestRPC(w3);

let activeAccount = '0xc08d5fe987c2338d28fd020b771a423b68e665e4';

let storage: Storage;

let deployParams = W3.TC.txParamsDefaultDeploy(activeAccount);
let sendParams = W3.TC.txParamsDefaultSend(activeAccount);

let auctionAddress: string;

beforeAll(async () => {

    if (!(await w3.isTestRPC)) {
        console.log('NOT ON TESTRPC');
        await w3.unlockAccount(activeAccount, 'Ropsten1', 150000);
    } else {
        let accs = await w3.accounts;
        activeAccount = accs[0];
        deployParams = W3.TC.txParamsDefaultDeploy(activeAccount);
        sendParams = W3.TC.txParamsDefaultSend(activeAccount);
        console.log('ACTIVE ACCOUNT', activeAccount);
    }

    w3.defaultAccount = activeAccount;
    storage = await getStorage(w3, activeAccount);

});

beforeEach(async () => {
    // Testnets are SLOW compared to TestRPC
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 1800000;
    if ((await w3.networkId) === '1') {
        console.log('NOT ON TESTNET');
    } else {
        deployParams.gasPrice = 20000000000;
        sendParams.gasPrice = 20000000000;
    }
    expect((await w3.networkId)).not.toBe('1');
});


it('Could deploy auction factory and create auction', async () => {
    expect(true).toBe(true);
    let factory = await AuctionFactory.New(deployParams, w3);
    console.log('FACTORY ADDRESS', await factory.address);

    let token = await AceToken.New(deployParams, undefined, w3);
    
    let tokenAddress = await token.address;
    console.log('TOKEN ADDRESS', tokenAddress);

    let end = (new Date(2017, 12, 25).getTime() / 1000);
    let weiPerToken = w3.toBigNumber('4000000000000000');
    let auctionTx = await factory.produceForOwnerCustomToken(activeAccount, activeAccount, tokenAddress, end, weiPerToken, 50, 'test_item', true, deployParams);

    console.log('AUCTION TX', auctionTx);
    let args = auctionTx.logs[0].args;

    console.log('ARGS', args);

    auctionAddress = args.addr;

    let auction = await Auction.At(auctionAddress, w3);

    let actualAddress = await auction.address;

    expect(actualAddress).toBe(auctionAddress);
    expect(await auction.item()).toBe('test_item');
})


it('Could send manage bid', async () => {
    let auction = await Auction.At(auctionAddress, w3);

    console.log('SEND PARAMS', deployParams);
    let tx = await auction.managedBid(42, 123, deployParams);

    console.log('MANAGED BID TX', tx);

    let bidder = (await auction.highestManagedBidder()).toNumber();
    expect(bidder).toBe(42);

    let highestBid = (await auction.highestBid()).toNumber();
    expect(highestBid).toBe(123);
})


it('Could extend end time', async () => {
    if (await w3.isTestRPC) {
        let auction = await Auction.At(auctionAddress, w3);

        let end = (new Date(2017, 12, 25).getTime() / 1000);

        let contractEnd = (await auction.endSeconds()).toNumber();

        expect(contractEnd).toBe(end);

        let minutesLeft = 10;

        await testrpc.increaseTimeTo(end - 60 * minutesLeft);

        let tx = await auction.managedBid(43, 124, deployParams);

        let newContractEnd = (await auction.endSeconds()).toNumber();

        expect(newContractEnd).toBeGreaterThan(contractEnd);
        expect(newContractEnd - contractEnd).toBe(60 * (30 - minutesLeft));

        console.log('NEW-OLD END', newContractEnd - contractEnd);

        let bidder = (await auction.highestManagedBidder()).toNumber();
        expect(bidder).toBe(43);

        let highestBid = (await auction.highestBid()).toNumber();
        expect(highestBid).toBe(124);
    }
})


