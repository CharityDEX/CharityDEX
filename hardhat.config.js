require("@nomiclabs/hardhat-waffle");
require('solidity-coverage');
require('hardhat-abi-exporter');
require('dotenv').config();

const MNEMONIC = process.env.MNEMONIC;
const PRIVATE_KEY = process.env.PRIVATE_KEY
const ACCOUNTS = MNEMONIC ? { "mnemonic": MNEMONIC } : [PRIVATE_KEY];

const GOERLI_URL = process.env.GOERLI_URL || "";
const ETHEREUM_URL = process.env.ETHEREUM_URL || "";

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

task("deploy", "Deploys Charity Swap")
  .addParam("swapRouter", "The Uniswap Swap Router address")
  .addParam("weth", "The WETH contract address")
  .addParam("charity", "The Charity contract address")
  .addOptionalParam("charityFee", "The part of the swap that goes to charity")
  .setAction(async (taskArgs) => {
    await hre.run('compile');

    const charityFee = taskArgs.charityFee || process.env.CHARITY_FEE || 50000; // defaults to 5%

    const CharitySwap = await ethers.getContractFactory("CharitySwap");
    const charitySwap = await CharitySwap.deploy(taskArgs.swapRouter, taskArgs.weth, taskArgs.charity, charityFee);
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
      url: GOERLI_URL,
      accounts: ACCOUNTS,
    },
    ethereum: {
      url: ETHEREUM_URL,
      accounts: ACCOUNTS,
    },
  },
};
