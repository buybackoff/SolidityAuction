import { W3 } from 'soltsice';
import { config } from './config';
import { VotingHub, AceToken, TeamToken } from './contracts';

// throw new Error('Comment this line to deploy the auction hub');

const w3 = new W3(new W3.providers.HttpProvider(config.web3));
const u = W3.EthUtils;
const privateKey = config.privateKey.startsWith('0x') ? config.privateKey : '0x' + config.privateKey;
const ownerAddress = u.bufferToHex(u.privateToAddress(u.toBuffer(privateKey)));
console.log('OWNER ADDRESS: ', ownerAddress);
w3.defaultAccount = ownerAddress;
W3.default = w3;

let txParams = W3.TX.txParamsDefaultDeploy(ownerAddress);
txParams.gas = 2000000;
txParams.gasPrice = 5000000000;

async function deploy() {
    let nid = +(await w3.networkId);
    // if (nid === 1) {
    //     console.log('Will not automatically deploy on mainnet. Comment out this check.');
    //     return;
    // }
    // if (nid !== config.networkId) {
    //     throw new Error('Network Id does not match config.');
    // }

    try {
        if (!config.votingAddress) {
            console.log('DEPLOYING...');

            if (nid === 1) {
                let aceAddress = '0x06147110022B768BA8F99A8f385df11a151A9cc8';
                console.log('USING ACE TOKEN MOCK AT: ', aceAddress);

                let teamAddress = '0x1c79ab32C66aCAa1e9E81952B8AAa581B43e54E7';
                console.log('USING TEAM TOKEN MOCK AT: ', teamAddress);

                let wallet = '0x963dF7904cF180aB2C033CEAD0be8687289f05EC';

                txParams.gas = 2000000;
                txParams.gasPrice = 3000000000;

                let votingHub = await VotingHub.new(txParams, { _wallet: wallet, _tokens: [aceAddress, teamAddress], _rates: [1, 1], _decimals: [0, 4] }, w3, undefined, privateKey);
                console.log('VOTING HUB ADDRESS. Add this VotingHub address to config/config.json to use it on backend. ', votingHub.address);

            } else {

                let aceAddress = '0x56d5E18401256DE7190Bc3E18bE75cD61FAdbB36';
                console.log('DEPLOYED ACE TOKEN MOCK AT: ', aceAddress);

                let teamAddress = '0x23cd32d4c9362bafd47aba8e008451019c48daef';
                console.log('DEPLOYED TEAM TOKEN MOCK AT: ', teamAddress);

                let votingHub = await VotingHub.new(txParams, { _wallet: ownerAddress, _tokens: [aceAddress, teamAddress], _rates: [1, 1], _decimals: [0, 4] }, w3, undefined, privateKey);
                console.log('VOTING HUB ADDRESS. Add this VotingHub address to config/config.json to use it on backend. ', votingHub.address);

                let testVotingTx = await votingHub.createVoting((new Date(2018, 5, 1).getTime()) / 1000, 'test voting', ['first choice', 'second choice', 'third choice'], 10, txParams, privateKey);
                console.log('VOTING TX: ', testVotingTx);
                console.log('VOTING TX LOGS: ', testVotingTx.logs);
            }

        } else {

            console.log('SKIPPING DEPLOY: Config already has the hub address');
            let votingHub = await VotingHub.at(config.votingAddress);
            console.log('VOTING HUB ADDRESS: ', votingHub.address);
            let voteData = await votingHub.vote.data(10, 1);
            console.log('VOTE DATA: ', voteData);
            // let voteTx = await votingHub.vote(1, 1, txParams, privateKey);
            // console.log('VOTE TX: ', voteTx);

            // console.log(W3.sha3('vote(uint256,uint256)'));
            // console.log(W3.sha3('vote(uint32,uint32)'));

            // let votingTx1 = await votingHub.createVoting(1523491199, 'Betting of sports events 2', ['No', 'Yes'], 10000, txParams, privateKey);
            // console.log('VOTING TX1: ', votingTx1);

            // let votingTx2 = await votingHub.createVoting(1524095999, '2018 Soccer World Cup Winner',
            //     ['Germany',
            //         'Brazil',
            //         'France',
            //         'Spain',
            //         'Argentina',
            //         'England',
            //         'Portugal',
            //         'Uruguay',
            //         'Russia',
            //         'South Korea',
            //         'Japan',
            //         'Other Team'
            //     ], 10000, txParams, privateKey);
            // console.log('VOTING TX2: ', votingTx2);

            // let votingTx3 = await votingHub.createVoting(1524095999, 'Exchange for TEAM listing',
            //     ['Bittrex',
            //         'Livecoin',
            //         'Huobi',
            //         'Kucoin',
            //         'HitBTC',
            //         'Gate.io',
            //         'Cryptopia',
            //         'Binance',
            //         'Liqui',
            //         'UpBit'
            //     ],
            //     10000, txParams, privateKey);
            // console.log('VOTING TX3: ', votingTx3);
            // let votingData = await votingHub.createVoting.data(1523491199, 'Betting of sports events 2', ['No', 'Yes'], 10000);
            // console.log('VOTING DATA: ', votingData);

        }
    } catch (e) {
        console.log('Cannot deploy VotingHub: ', e);
    }
    process.exit(0);
}

deploy();
