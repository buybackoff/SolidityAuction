import { AuctionFactory, Auction, AceToken } from '../contracts'
import { W3, getStorage, Storage } from 'soltsice';
import * as TRPC from 'ethereumjs-testrpc';

// let w3 = new W3(new W3.providers.HttpProvider('http://localhost:8544'));
let w3: W3 = new W3(TRPC.provider({
    mnemonic: 'tokenstars',
    network_id: 315
}));

W3.Default = w3;
let activeAccount = '0xc08d5fe987c2338d28fd020b771a423b68e665e4';

let storage: Storage;

let deployParams = W3.TC.txParamsDefaultDeploy(activeAccount);
let sendParams = W3.TC.txParamsDefaultSend(activeAccount);

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
    let factory = new AuctionFactory(deployParams, undefined, w3);
    await factory.instance;
    console.log('FACTORY ADDRESS', await factory.address);

    // Rinkeby 0x23d70bd7dee1abe24f5f71b73e3d46fdbad43dd5

    let token = new AceToken(deployParams, undefined, w3);
    await token.instance;
    let tokenAddress = await token.address;
    console.log('TOKEN ADDRESS', tokenAddress);

    let start = Math.floor(Date.now() / 1000) + 60*5;
    let end = (new Date(2017, 12, 25).getTime() / 1000);
    let weiPerToken = w3.toBigNumber('4000000000000000');
    let auctionTx = await factory.produceForOwnerCustomToken(activeAccount, activeAccount, tokenAddress, start, end, weiPerToken, 'test_item', true, deployParams);

    console.log('AUCTION TX', auctionTx);
    let args = auctionTx.logs[0].args;

    console.log('ARGS', args);

    let newAuctionAddress = args.addr;

    let auction = new Auction(newAuctionAddress, undefined, w3);

    let actualAddress = await auction.address;

    // Rinkeby 0x5c7329b96900f07e154083af96a97788fe906311

    expect(actualAddress).toBe(newAuctionAddress);

    expect(await auction.item()).toBe('test_item');

})