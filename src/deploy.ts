import { W3 } from 'soltsice';
import { config } from './config';
import { TokenStarsAuctionHub } from './contracts';

// throw new Error('Comment this line to deploy the auction hub');

const w3 = new W3(new W3.providers.HttpProvider(config.web3));
const u = W3.EthUtils;
const privateKey = config.privateKey.startsWith('0x') ? config.privateKey : '0x' + config.privateKey;
const ownerAddress = u.bufferToHex(u.privateToAddress(u.toBuffer(privateKey)));
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
            let hub = await TokenStarsAuctionHub.new(txParams, {}, w3, undefined, privateKey);
            console.log('TokenStarsAuctionHub ADDRESS: ', hub.address);
            let testAuctionTx = await hub.createAuction((new Date(2018, 5, 1).getTime()) / 1000, 10e18, 1, "test_auction", true, txParams, privateKey);
            console.log('AUCTION TX: ', testAuctionTx);
            console.log('AUCTION TX LOGS: ', testAuctionTx.logs);
            let testAuctionaddress = testAuctionTx.logs![0].args!.auction;
            console.log('TEST AUCTION ADDRESS: ', testAuctionaddress);
        } else {
            console.log('SKIPPING DEPLOY: Config already has the hub address');
        }
    } catch (e) {
        console.log('Cannot deploy TokenStarsAuctionHub: ', e);
    }
    process.exit(0);
}

deploy();
