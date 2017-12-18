//@ts-check
import fastify from 'fastify'
import Web3 from 'web3'
import utils from 'ethereumjs-util'
import Transaction from 'ethereumjs-tx'

let config = require('./config/config.json');

const web3 = new Web3(new Web3.providers.HttpProvider(config.web3))
const privateKeyHex = config.privateKey;
const networkId = config.networkId || 1;

const gasPrice = parseInt(config.gasPrice || 2000000000);
if (gasPrice > 20000000000) {
  throw new Error('Gas price is above 20 Gwei, remove this check at the beginning of app.js if you know what you are doing (around line 15)');
}

const ownerAddress = utils.bufferToHex(utils.privateToAddress(new Buffer(privateKeyHex, 'hex')));
console.log('OWNER', ownerAddress);
if (process.env.FROM && process.env.FROM !== ownerAddress) {
  throw new Error('Provided address in process.env.FROM doesn\'t match the private key');
}

const privateKey = new Buffer(privateKeyHex, 'hex');

const server = fastify();

web3.eth.net.getId((err, result) => {
  let nid = err || result;
  if (nid !== networkId) {
    throw new Error('Network id in config doesn\'t match web3 running web3 network');
  }
});

async function makeTransaction(to, value, data, gasLimit, gasPrice) {
  const nonce = utils.bufferToHex((await web3.eth.getTransactionCount(ownerAddress)))
  console.log('NONCE', nonce);
  const tx = new Transaction({
    to,
    value,
    data,
    gasLimit,
    gasPrice,
    nonce
  }, networkId)

  tx.sign(privateKey)
  const raw = `0x${tx.serialize().toString('hex')}`

  return new Promise((resolve, reject) => {
    web3.eth.sendSignedTransaction(raw)
      .on('transactionHash', hash => {
        resolve(hash)
      })
      .catch(reject)
  })
}

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
  if (!request.body.contract) {
    return reply.send({
      error: 'Internal Server Error',
      message: `contract name is required`,
      statusCode: 500
    })
  }

  if (!request.body.method) {
    return reply.send({
      error: 'Internal Server Error',
      message: `contract method is required`,
      statusCode: 500
    })
  }

  const json = require(`./src/artifacts/${request.body.contract}`)
  const address = request.body.at || json.networks[networkId].address
  const method = request.body.method
  let args = request.body.args || []
  console.log('ARGS', args);

  const contract = new web3.eth.Contract(json.abi, address)

  const contractMethod = contract.methods[method](...args)

  // @ts-ignore
  contractMethod.estimateGas({ gas: 5 * 1e6 }, (error, estimateGas) => {
    if (error) {
      console.log('ERR1', error);
      return reply.send(error)
    }

    if (contractMethod._method.constant) {
      contractMethod.call({}, (error, result) => {
        if (error) {
          return reply.send(error)
        }
        return reply.send({
          result,
          statusCode: 200
        })
      })
    } else {
      try {
        const data = contractMethod.encodeABI()
        makeTransaction(address, 0, data, estimateGas, gasPrice)
          .then(result => reply.send({
            result,
            statusCode: 200
          }))
          .catch(error => {
            console.log('ERROR', error);
            reply.send({
              error: 'Internal Server Error',
              message: JSON.stringify(error),
              statusCode: 500
            });
          }
          )
      } catch (e) {
        console.log('ERR2', e);
      }
    }
  })
})


server.get('/events/*', async (request, reply) => {

  const commands = request.params['*'].split('/')

  const json = require(`./src/artifacts/Auction.json`)
  const address = commands[0] || request.body.at || json.networks[networkId].address
  const contract = new web3.eth.Contract(json.abi, address)

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
})

server.post('/*', opts, async (request, reply) => {
  const commands = request.params['*'].split('/')

  let func = web3.eth
  let args = request.body.args || []

  for (let part of commands) {
    func = func[part]
  }

  if (!func) {
    return reply.send({
      'error': 'Internal Server Error',
      'message': `web3.eth.${commands.join('.')} is not a function`,
      'statusCode': 500
    })
  }

  func(...args, (error, result) => {
    if (error) {
      return reply.send(error)
    }

    return reply.send({
      result,
      'statusCode': 200
    })
  })
})

// Run the server!
server.listen(3000, function (err) {
  if (err) {
    console.log('ERR:', err);
    throw err;
  }
  console.log(`server listening on ${server.server.address().port}`);
  server.log.info(`server listening on ${server.server.address().port}`)
})