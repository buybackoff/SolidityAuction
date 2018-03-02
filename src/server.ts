import * as fastify from 'fastify';
import { W3 } from 'soltsice';
import { config } from './config';
import * as http from 'http';
import { TokenStarsAuction, TokenStarsAuctionHub, LegacyAuction } from './contracts'

// synchronous globals setup
const w3 = new W3(new W3.providers.HttpProvider(config.web3));
const u = W3.EthUtils;
const privateKey = config.privateKey.startsWith('0x') ? config.privateKey : '0x' + config.privateKey;

const networkId = config.networkId

const ownerAddress = u.bufferToHex(u.privateToAddress(u.toBuffer(privateKey)));
console.log('OWNER', ownerAddress);
w3.defaultAccount = ownerAddress;

W3.default = w3;

const gasPrice = config.gasPrice || 2000000000;

const server = fastify<http.Server, http.IncomingMessage, http.ServerResponse>();

const opts = {
    schema: {
        body: {
            type: 'object',
            properties: {
                contract: { type: 'string' },
                at: { type: 'string' },
                method: { type: 'string' },
                args: { type: 'array' }
            }
        }
    }
}

server.post('/contract', opts, async (request, reply) => {
    console.log('BODY', request.body);
    if (!request.body.contract || (request.body.contract as string).toLowerCase() != 'auction') {
        return reply.send({
            error: 'Internal Server Error',
            message: `contract name is required to be auction`,
            statusCode: 500
        });
    }

    if (!request.body.contract || (request.body.contract as string).toLowerCase() != 'auction') {
        return reply.send({
            error: 'Internal Server Error',
            message: `contract name is required to be auction`,
            statusCode: 500
        });
    }

    if (!request.body.at || !W3.isValidAddress(request.body.at)) {
        return reply.send({
            error: 'Internal Server Error',
            message: `contract address is required`,
            statusCode: 500
        });
    }

    const address = request.body.at;
    const method = request.body.method;
    let args = request.body.args || [];
    console.log('ARGS', args);

    const contract = await TokenStarsAuction.at(address);

    if (!contract[method]) {
        return reply.send({
            error: 'Internal Server Error',
            message: 'Unknown method: ' + method,
            statusCode: 500
        });
    }

    try {
        const result = await contract[method](...args);
        return reply.send({
            result,
            statusCode: 200
        });
    } catch (e) {
        console.log('ERROR', e);
        return reply.send({
            error: 'Internal Server Error',
            message: JSON.stringify(e),
            statusCode: 500
        });
    }
});


server.get('/events/*', async (request, reply) => {

    const commands = request.params['*'].split('/')

    const address = ((commands[0] || request.body.at) as string).toLowerCase();

    // legacy
    if (address === '0xa4ae66156fb34c237c9dd905149a344672e113e4' || address === '0xa3050e720aa6e35e28187bfa7c9e27677eb17bed') {

        const contract = await LegacyAuction.at(address);

        const fromBlock = commands.length > 1 ? +commands[1] : 0;
        // see https://github.com/ethereum/web3.js/issues/989
        contract.getPastEvents("allEvents", {
            fromBlock: fromBlock,
            toBlock: 'latest'
        }, (error, result) => {
            if (error) {
                console.log('ERR', error);
                return reply.send(error)
            }
            return reply.send({
                result,
                statusCode: 200
            })
        })
    } else {
        throw new Error('TODO Not implemented');
    }


})

server.post('/getTransaction', opts, async (request, reply) => {
    console.log('BODY', request.body);
    try {

        let txHash = request.body.args[0];
        let receipt = await w3.waitTransactionReceipt(txHash);
        let logs: W3.Log[] = [];
        let address = receipt.to ? (receipt.to as string).toLowerCase() : '';
        if (address && receipt.logs) {
            if (address === '0xa4ae66156fb34c237c9dd905149a344672e113e4' || address === '0xa3050e720aa6e35e28187bfa7c9e27677eb17bed') {
                const contract = await LegacyAuction.at(address);
                logs = await contract.parseLogs(receipt.logs);
            } else {
                const contract = await TokenStarsAuction.at(address);
                logs = await contract.parseLogs(receipt.logs);
            }
        }
        let result: W3.TX.TransactionResult = { receipt: receipt, tx: txHash, logs: logs };
        return reply.send({
            result,
            'statusCode': 200
        });
    } catch (e) {
        return reply.send(e);
    }
})



async function start() {
    let nid = +(await w3.networkId);
    if (nid != networkId) {
        throw new Error('Network Id does not match config.');
    }
    // Run the server!
    server.listen(3000, function (err) {
        if (err) {
            console.log('ERR:', err);
            throw err;
        }
        console.log(`server listening on ${server.server.address().port}`);
        server.log.info(`server listening on ${server.server.address().port}`)
    })
}

start();