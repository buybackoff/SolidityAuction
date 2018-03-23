import { W3 } from 'soltsice';
import { config } from './config';
import { VotingHub, AceToken, TeamToken } from './contracts';

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
        if (!config.votingAddress) {
            console.log('DEPLOYING...');

            let aceAddress = '0x56d5E18401256DE7190Bc3E18bE75cD61FAdbB36';
            console.log('DEPLOYED ACE TOKEN MOCK AT: ', aceAddress);

            let teamAddress = '0x23cd32d4c9362bafd47aba8e008451019c48daef';
            console.log('DEPLOYED TEAM TOKEN MOCK AT: ', teamAddress);

            let votingHub = await VotingHub.new(txParams, {_wallet: ownerAddress, _tokens: [aceAddress, teamAddress], _rates: [1, 1], _decimals: [0, 4]}, w3, undefined, privateKey);
            console.log('VOTING HUB ADDRESS. Add this VotingHub address to config/config.json to use it on backend. ', votingHub.address);

            let testVotingTx = await votingHub.createVoting((new Date(2018, 5, 1).getTime()) / 1000, 'test voting', ['first choice', 'second choice', 'third choice'], 10, txParams, privateKey);
            console.log('VOTING TX: ', testVotingTx);
            console.log('VOTING TX LOGS: ', testVotingTx.logs);

        } else {
            console.log('SKIPPING DEPLOY: Config already has the hub address');
            let votingHub = await VotingHub.at(config.votingAddress);
            console.log('VOTING HUB ADDRESS: ', votingHub.address);
            let voteData = await votingHub.vote.data(1, 1);
            console.log('VOTE DATA: ', voteData);
            // let voteTx = await votingHub.vote(1, 1, txParams, privateKey);
            // console.log('VOTE TX: ', voteTx);
        }
    } catch (e) {
        console.log('Cannot deploy VotingHub: ', e);
    }
    process.exit(0);
}

deploy();
