import { W3 } from 'soltsice';
import { config } from './config';
import { TokenStarsAuctionHub, TokenStarsAuctionHubMock, AceToken, TeamToken, TokenStarsAuction } from './contracts';

// throw new Error('Comment this line to deploy the auction hub');

const w3 = new W3(new W3.providers.HttpProvider(config.web3));
const u = W3.EthUtils;
const privateKey = config.privateKey.startsWith('0x') ? config.privateKey : '0x' + config.privateKey;
const ownerAddress = u.bufferToHex(u.privateToAddress(u.toBuffer(privateKey)));
w3.defaultAccount = ownerAddress;
W3.default = w3;

let txParams = W3.TX.txParamsDefaultDeploy(ownerAddress);
txParams.gas = 6000000;
txParams.gasPrice = 21000000000;

async function deploy() {
    let nid = +(await w3.networkId);
    if (nid === 1) {
        console.log('Will not automatically deploy on mainnet');
        return;
    }
    if (nid !== config.networkId) {
        throw new Error('Network Id does not match config.');
    }
    
    try {
        if (!config.hubAddress) {
            console.log('DEPLOYING...');

            let ace = await AceToken.new(txParams, {}, w3, undefined, privateKey);
            console.log('DEPLOYED ACE TOKEN MOCK AT: ', ace.address);

            let team = await TeamToken.new(txParams, {}, w3, undefined, privateKey);
            console.log('DEPLOYED TEAM TOKEN MOCK AT: ', team.address);

            let hub = await TokenStarsAuctionHubMock.new(txParams, {_wallet: ownerAddress, _tokens: [ace.address, team.address]}, w3, undefined, privateKey);
            console.log('HUB ADDRESS. Add this TokenStarsAuctionHub address to config/config.json to use it on backend. ', hub.address);
            let testAuctionTx = await hub.createAuction((new Date(2018, 5, 1).getTime()) / 1000, 10e18, 1, "test_auction", true, txParams, privateKey);
            // console.log('AUCTION TX: ', testAuctionTx);
            // console.log('AUCTION TX LOGS: ', testAuctionTx.logs);
            let testAuctionaddress = testAuctionTx.logs![0].args!.auction;
            console.log('TEST AUCTION ADDRESS: ', testAuctionaddress);
            console.log('Add this TokenStarsAuctionHub address to config/config.json to use it on backend: ', hub.address);

            let testAuction = await TokenStarsAuction.at(testAuctionaddress);
        } else {
            console.log('SKIPPING DEPLOY: Config already has the hub address');
            let hub = await TokenStarsAuctionHub.at(config.hubAddress);
            console.log('HUB ADDRESS: ', hub.address);
            // let events = await hub.getLogs();
            // console.log('EVENTS: ', events);
        }
    } catch (e) {
        console.log('Cannot deploy TokenStarsAuctionHub: ', e);
    }
    process.exit(0);
}

deploy();
