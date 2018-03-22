import { AceToken, TeamToken, VotingHub } from '../contracts'
import { W3, TestRPC, toBN, testAccounts, testPrivateKeys } from 'soltsice';
import * as Ganache from 'ganache-cli';
import { BigNumber } from 'bignumber.js';

// Replace w3 ctor to test on a real testnet, not TestRPC/ganache
// let w3 = new W3(new W3.providers.HttpProvider('http://localhost:8544'));
let w3: W3 = new W3(Ganache.provider({
    network_id: 314,
    accounts: [
        { balance: '0xD3C21BCECCEDA1000000', secretKey: '0x' + testPrivateKeys[0] },
        { balance: '0xD3C21BCECCEDA1000000', secretKey: '0x' + testPrivateKeys[1] },
        { balance: '0xD3C21BCECCEDA1000000', secretKey: '0x' + testPrivateKeys[2] }
    ]
}));

// let address = W3.EthUtils.bufferToHex(W3.EthUtils.privateToAddress(new Buffer(testPrivateKeys[0], 'hex')));
// console.log('CALCULATED ADDRESS', address);

W3.default = w3;
let testrpc = new TestRPC(w3);

// testnet account with some ether
let activeAccount = testAccounts[0];

let txDeployParams = W3.TX.txParamsDefaultDeploy(activeAccount);
let txSendParams = W3.TX.txParamsDefaultSend(activeAccount);

let accounts: string[];
let auctionAddress: string;
let end = (new Date(2018, 4, 25).getTime() / 1000);
let weiPerToken = w3.toBigNumber('2400000000000000');
let maxTokensInEther = weiPerToken.mul(50);

let aceToken: AceToken;
let teamToken: TeamToken;

let keythereum = W3.getKeythereum();
let voterCount: number = 500;
let voters: W3.Account[] = [];

let votingHub: VotingHub;


beforeAll(async () => {

    if (!(await w3.isTestRPC)) {
        console.log('NOT ON TESTRPC');
        await w3.unlockAccount(activeAccount, 'Rinkeby', 150000);
    } else {
        accounts = await w3.accounts;
        activeAccount = accounts[0];
        txDeployParams = W3.TX.txParamsDefaultDeploy(activeAccount);
        txSendParams = W3.TX.txParamsDefaultSend(activeAccount);
        console.log('ACTIVE ACCOUNT', activeAccount);
    }

    w3.defaultAccount = activeAccount;
});

beforeEach(async () => {
    // Testnets are SLOW compared to TestRPC
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 18000000;
    if ((await w3.networkId) === '1') {
        console.log('NOT ON TESTNET');
    } else {
        txDeployParams.gasPrice = 20000000000;
        txSendParams.gasPrice = 20000000000;
    }
    expect((await w3.networkId)).not.toBe('1');
});


it('Could mint tokens and create dummy voters', async () => {
    // mint tokens to 10k dummy holders
    if (await w3.isTestRPC) {

        console.time('accountgen');
        for (let i = 0; i < voterCount; i++) {
            let dk = keythereum.create();
            let privateKey = W3.EthUtils.bufferToHex(dk.privateKey);
            let publicKey = W3.EthUtils.bufferToHex(W3.EthUtils.privateToPublic(dk.privateKey));
            let addrBuffer = W3.EthUtils.privateToAddress(dk.privateKey);
            let address = W3.EthUtils.bufferToHex(addrBuffer);
            let account: W3.Account = { privateKey, publicKey, address };
            let trasferTx: W3.Tx = { from: activeAccount, to: address, value: 1e18, gas: 30000, gasPrice: 20000000000 };
            let transferTx: any = await new Promise((resolve, reject) => {
                w3.web3.eth.sendTransaction(trasferTx, (err, res) => {
                    if (err) {
                        console.log(err);
                        reject(err);
                    }
                    resolve(res);
                });
            });
            let tx = await w3.waitTransactionReceipt(transferTx);
            // console.log('TRANSFER TX', tx);
            voters.push(account);
        }
        console.timeEnd('accountgen');
        console.log('Finished generating accounts, total accounts: ', voters.length);


        let initialTokenBidderBalance = 10;
        aceToken = await AceToken.new(txDeployParams, undefined, w3);
        teamToken = await TeamToken.new(txDeployParams, undefined, w3);

        console.time('minting');
        for (let i = 0; i < voterCount; i++) {
            let mintedTx = await aceToken.mint(voters[i].address, initialTokenBidderBalance, txDeployParams);
            let mintedTx2 = await teamToken.mint(voters[i].address, initialTokenBidderBalance * 10000, txDeployParams);
        }
        console.timeEnd('minting');

    }
})


it('Could deploy voting hub and create dummy voting', async () => {

    votingHub = await VotingHub.new(txDeployParams,
        {
            _wallet: activeAccount,
            _tokens: [aceToken.address, teamToken.address],
            _rates: [1, 1],
            _decimals: [0, 4]
        },
        w3);
    console.log('VOTING HUB ADDRESS', await votingHub.address);


    let votingTx = await votingHub.createVoting(end, 'dummy voting', ['first', 'second', 'third'], 10, txDeployParams);
    console.log('CREATE VOTING TX', votingTx);
    let descriptionFromEvent = votingTx.logs[0].args.description;
    console.log('NEW VOTING DESCRIPTION FROM EVENT', descriptionFromEvent);
    let votingId = (votingTx.logs[0].args.voting as BigNumber).toNumber();
    console.log('NEW VOTING ID FROM EVENT', votingId);

    let descriptionFromHub = await votingHub.getDescription(votingId);
    expect(descriptionFromHub).toEqual(descriptionFromEvent);

    let choices = await votingHub.getChoices(votingId);
    console.log('CHOICES: ', choices);

    // now we are ready to vote!

    for (let i = 0; i < voterCount; i++) {
        let voterTxParams: W3.TX.TxParams = Object.assign(txDeployParams, { from: voters[i].address });
        // console.log('VOTER TX: ', voterTxParams);

        // initial gas: 65k
        let voteTx = await votingHub.vote(votingId, 1, voterTxParams, voters[i].privateKey);
        console.log(`VOTE TX ${i}: `, voteTx.logs[0]);
    }

    let lastVoter = await votingHub.getLastVoter(votingId);
    console.log('LAST VOTER: ', lastVoter);

    let balanceOfLast = await aceToken.balanceOf(lastVoter);
    console.log('BALANCE: ', balanceOfLast.toFixed());
    expect(balanceOfLast.toNumber()).toBeGreaterThan(0);

    let lastVote = await votingHub.getVote(votingId, lastVoter);
    console.log('LASTVOTE: ', lastVote);
    
    // TODO W3.toHex is wrong
    // console.log('LASTVOTE PROTOTYPE: ', Object.getPrototypeOf(lastVote));
    // console.log('IS BIG NUMBER: ', (lastVote as any).isBigNumber);
    // console.log('LAST VOTE: ', lastVote.toString(16));

    let votingResult = await votingHub.getVotesFrom(votingId, lastVoter, txDeployParams);
    console.log('VOTING RESULTS: ', votingResult);

    let votes = (votingResult[0] as BigNumber[]).map(x => x.toNumber());
    console.log('VOTES: ', votes);

    console.log('LAST VOTER: ', votingResult[1]);
    expect(votingResult[1]).toEqual(W3.zeroAddress);

    console.log('GAS USED: ', (new BigNumber(txDeployParams.gas)).sub(votingResult[2]).toNumber());
    // GAS USED:  4028356 for voterCount = 500
    // The function has limit for 100k remaining gas and will return non-zero lastVoter = votingResult[1]
    // if there are more voters to count. Then we need to start from the returned last voter and 
    // sum the returned arrays until the last voter is zero.
    
    // TODO To test this without waiting too long we could set gas at 100 + c.8k X voterCountPerRequest
})


// TODO change vote for existing
// TODO fast forward block after the end, calculate block and votes at the block
