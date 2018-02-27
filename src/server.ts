import * as fastify from 'fastify';
import { W3 } from 'soltsice';
import { config } from './config';

// synchronous globals setup
const w3 = new W3(new W3.providers.HttpProvider(config.web3));
const u = W3.EthUtils;
const privateKey = config.privateKey.startsWith('0x') ? config.privateKey : '0x' + config.privateKey;

const ownerAddress = u.bufferToHex(u.privateToAddress(u.toBuffer(privateKey)));
console.log('OWNER', ownerAddress);
w3.defaultAccount = ownerAddress;

W3.Default = w3;

const gasPrice = config.gasPrice || 2000000000;

const server = fastify();

async function start() {
    let nid = +(await w3.networkId);
    if (nid != config.networkId) {
        throw new Error('Network Id does not match config.');
    }
}

start();