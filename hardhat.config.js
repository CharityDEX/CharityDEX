require("@nomiclabs/hardhat-waffle");
require('solidity-coverage');
require('hardhat-abi-exporter');
require("@nomiclabs/hardhat-etherscan");
require('dotenv').config();

const MNEMONIC = process.env.MNEMONIC;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const ETHERSCAN_KEY = process.env.ETHERSCAN_KEY;
const ACCOUNTS = MNEMONIC ? { "mnemonic": MNEMONIC } : [PRIVATE_KEY];

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

task("deploy", "Deploys Charity Swap")
  .addParam("factoryV2", "The Uniswap V2 factory")
  .addParam("factoryV3", "The Uniswap V3 factory")
  .addParam("positionManager", "The Uniswap position manager")
  .addParam("weth", "The WETH contract address")
  .addParam("charity", "The Charity contract address")
  .addOptionalParam("charityFee", "The part of the swap that goes to charity")
  .setAction(async (taskArgs) => {
    await hre.run('compile');

    const charityFee = taskArgs.charityFee || process.env.CHARITY_FEE || 50000; // defaults to 5%

    const CharitySwap = await ethers.getContractFactory("CharitySwap");
    const charitySwap = await CharitySwap.deploy(taskArgs.factoryV2, taskArgs.factoryV3, taskArgs.positionManager, taskArgs.weth, taskArgs.charity, charityFee);
    await charitySwap.deployTransaction.wait()

    console.log("CharitySwap deployed to:", charitySwap.address);
  });

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.7.6",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
  networks: {
    goerli: {
      url: process.env.GOERLI_URL || "none",
      accounts: ACCOUNTS,
    },
    ethereum: {
      url: process.env.ETHEREUM_URL || "none",
      accounts: ACCOUNTS,
    },
  },
  etherscan: {
    apiKey: ETHERSCAN_KEY || "none",
  },
};
