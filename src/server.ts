import * as fastify from 'fastify';
import { W3 } from 'soltsice';
import { config } from './config';
import * as http from 'http';
import { TokenStarsAuction, TokenStarsAuctionHub, LegacyAuction } from './contracts'
import { BigNumber } from 'bignumber.js';

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

const hubAddress = config.hubAddress;
if (!hubAddress) {
    throw new Error('Hub address must be set in config file.')
}
let hubContract: TokenStarsAuctionHub; // created in init() below
let knownAuctions: any = {};

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
    try {
        const commands = request.params['*'].split('/')

        const address = ((commands[0] || request.body.at) as string).toLowerCase();

        const fromBlock = commands.length > 1 ? +commands[1] : 0;

        // legacy
        if (!knownAuctions[address]) {

            const contract = await LegacyAuction.at(address);

            let result = await contract.getEventLogs(fromBlock);

            return reply.send({
                result,
                statusCode: 200
            });

        } else {

            const contract = await TokenStarsAuction.at(address);

            let events = await hubContract.getEventLogs(fromBlock);

            // temp, filter in memory by address
            let result = events
                .filter(ev => ev.args!.auction && ev.args!.auction === address)
                .map(ev => {
                    if (ev.event === 'ManagedBid' && ev.args!.knownManagedBidder !== W3.zeroAddress) {
                        ev.event = 'ManagedBid2';
                    } else if (ev.event === 'Bid') {
                        ev.args!.tokensBid = ev.args!.tokensBidInEther;
                    }else if (ev.event === 'NewHighestBidder') {
                        ev.args!.bid = ev.args!.totalBid;
                    }
                    return ev;
                });
            
            return reply.send({
                result,
                statusCode: 200
            });

            throw new Error('TODO Not implemented');
        }

    } catch (e) {
        return reply.send(e);
    }
})

server.post('/getTransaction', opts, async (request, reply) => {
    console.log('BODY', request.body);
    try {

        let txHash = request.body.args[0];
        let receipt = await w3.waitTransactionReceipt(txHash);
        let logs: W3.EventLog[] = [];
        let address = receipt.to ? (receipt.to as string).toLowerCase() : '';
        if (address && receipt.logs) {
            if (address.toLowerCase() === hubAddress) {
                logs = await hubContract.parseLogs(receipt.logs);
            } else {
                
                const contract = await LegacyAuction.at(address);
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


server.get('/votingresults/*', async (request, reply) => {
    try {
        const commands = request.params['*'].split('/')

        const votingId = +(commands[0]);

        // TODO detect block from endSeconds

        // Values will be above int53 (float64 max for precise int), return as strings
        return [new BigNumber(votingId * 1000000000).mul(1000000000).floor().toFormat(), new BigNumber(votingId * 1000000000).mul(2000000000).floor().toString(), new BigNumber(votingId * 1000000000).mul(3000000000).floor().toString(), new BigNumber(votingId * 1000000000).mul(4000000000).floor().toString()];

    } catch (e) {
        return reply.send(e);
    }
})

server.get('/votingoptions/*', async (request, reply) => {
    try {
        const commands = request.params['*'].split('/')

        const votingId = +(commands[0]);

        // up to 32 ascii symbols
        return ["first" + votingId.toString(), "second", "third", "forth"];

    } catch (e) {
        return reply.send(e);
    }
})

server.get('/votingquorum/*', async (request, reply) => {
    try {
        const commands = request.params['*'].split('/')

        const votingId = +(commands[0]);

        return new BigNumber(votingId * 1000000000).mul(1000000000).floor().toFormat();

    } catch (e) {
        return reply.send(e);
    }
})

server.get('/votingid/*', async (request, reply) => {
    try {
        const commands = request.params['*'].split('/')

        const votingId = +(commands[0]);

        return "Id for voting: " + votingId;

    } catch (e) {
        return reply.send(e);
    }
})


async function start() {
    let nid = +(await w3.networkId);
    if (nid != networkId) {
        throw new Error('Network Id does not match config.');
    }

    hubContract = await TokenStarsAuctionHub.at(hubAddress, w3);

    console.log('ALL LOGS: ', await hubContract.getEventLogs());

    let newActions = await hubContract.getEventLogs(undefined, undefined, 'NewAction');

    newActions.forEach(element => {
        let auctionAddress = element.args!.auction;
        knownAuctions[auctionAddress] = element.args!.item;
    });

    console.log('Known Auctions: ', knownAuctions);

    // Run the server!
    server.listen(3000, async (err) => {
        if (err) {
            console.log('ERR:', err);
            throw err;
        }

        console.log(`server listening on ${server.server.address().port}`);
        server.log.info(`server listening on ${server.server.address().port}`)
    })

}

start();
