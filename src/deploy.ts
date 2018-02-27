import { W3 } from 'soltsice';
import { config } from './config';
import { TokenStarsAuctionHub } from './contracts';

const w3 = new W3(new W3.providers.HttpProvider(config.web3));
const u = W3.EthUtils;
const privateKey = config.privateKey.startsWith('0x') ? config.privateKey : '0x' + config.privateKey;
const ownerAddress = u.bufferToHex(u.privateToAddress(u.toBuffer(privateKey)));
let txParams = W3.TX.txParamsDefaultDeploy(ownerAddress);

TokenStarsAuctionHub.New(txParams, {}, w3, undefined, privateKey)
    .then(async hub => {
        console.log('TokenStarsAuctionHub ADDRESS: ', hub.address);
    })
    .catch(e => {
        console.log('Cannot deploy TokenStarsAuctionHub: ', e);
    });