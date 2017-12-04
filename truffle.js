module.exports = {
  solc: {
    optimizer: {
      enabled: true,
      runs: 200
    }
  },
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*" // Match any network id
    },

    rinkeby: {
      host: "localhost",
      port: 8544,
      network_id: "4"
    }

  }
};
