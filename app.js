import fastify from 'fastify'
import Web3 from 'web3'
import utils from 'ethereumjs-util'
import Transaction from 'ethereumjs-tx'

const web3 = new Web3(new Web3.providers.HttpProvider(process.env.WEB3 || 'http://localhost:8544'))

// could paste private key right here
const privateKeyHex = '' || process.env.PRIVATE_KEY;
const publicKeyHex = utils.bufferToHex(utils.privateToAddress(new Buffer(privateKeyHex, 'hex')));
if (process.env.FROM && process.env.FROM !== publicKeyHex) {
  throw new Error('Provided address in process.env.FROM doesn\'t match the private key');
}

const CONSTANTS = {
  networkId: 1,
  from: publicKeyHex,
  privateKey: new Buffer(privateKeyHex, 'hex'),
  gasPrice: parseInt(process.env.GAS_PRICE || 2000000000)
}
const server = fastify()

web3.eth.net.getId((err, result) => {
  CONSTANTS.networkId = err || result
})

async function makeTransaction(to, value, data, gasLimit, gasPrice) {
  const nonce = utils.bufferToHex(await web3.eth.getTransactionCount(CONSTANTS.from))
  const tx = new Transaction({
    to,
    value,
    data,
    gasLimit,
    gasPrice,
    nonce
  }, CONSTANTS.networkId)

  tx.sign(CONSTANTS.privateKey)
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
  const address = request.body.at || json.networks[CONSTANTS.networkId].address
  const method = request.body.method
  let args = request.body.args || []
  const contract = new web3.eth.Contract(json.abi, address)


  const contractMethod = contract.methods[method](...args)

  contractMethod.estimateGas({ gas: 5 * 1e6 }, (error, estimateGas) => {
    if (error) {
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
      const data = contractMethod.encodeABI()
      makeTransaction(address, 0, data, estimateGas, CONSTANTS.gasPrice)
        .then(result => reply.send({
          result,
          statusCode: 200
        }))
        .catch(error => reply.send({
          error: 'Internal Server Error',
          message: error,
          statusCode: 500
        }))
    }
  })
})

server.get('/events/*', async (request, reply) => {

  const commands = request.params['*'].split('/')

  const json = require(`./src/artifacts/Auction.json`)
  const address = commands[0] || request.body.at || json.networks[CONSTANTS.networkId].address
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