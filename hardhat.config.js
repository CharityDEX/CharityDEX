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

task("deploy-test", "Deploys Charity and CharitySwap with default testnet parameters")
  .addParam("weth", "The WETH contract address")
  .setAction(async (taskArgs) => {
    await hre.run('compile');

    const charityAddresses = [(await hre.ethers.getSigners())[0].address];
    const uri = "https://test.net/";
    const factoryV2 = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
    const factoryV3 = "0x1F98431c8aD98523631AE4a59f267346ea31F984";
    const positionManager = "0xC36442b4a4522E871399CD717aBDD847Ab11FE88";
    const charityFee = 50000; // 5%

    const Charity = await ethers.getContractFactory("Charity");
    const charity = await Charity.deploy(charityAddresses, uri);
    await charity.deployTransaction.wait()

    console.log("Charity deployed to:", charity.address);

    const CharitySwap = await ethers.getContractFactory("CharitySwap");
    const charitySwap = await CharitySwap.deploy(factoryV2, factoryV3, positionManager, taskArgs.weth, charity.address, charityFee);
    await charitySwap.deployTransaction.wait()

    console.log("CharitySwap deployed to:", charitySwap.address);
  });

// task("deploy-all", "Deploys Charity and CharitySwap")
//   .addParam("weth", "The WETH contract address")
//   .addOptionalParam("charityAddresses", "The addresses donations are sent to")
//   .addOptionalParam("uri", "The metadata URI")
//   .addOptionalParam("charityFee", "The part of the swap that goes to charity")
//   .setAction(async (taskArgs) => {
//     await hre.run('compile');

//     const charityFee = taskArgs.charityFee || process.env.CHARITY_FEE || 50000; // defaults to 5%

//     const CharitySwap = await ethers.getContractFactory("CharitySwap");
//     const charitySwap = await CharitySwap.deploy(taskArgs.factoryV2, taskArgs.factoryV3, taskArgs.positionManager, taskArgs.weth, taskArgs.charity, charityFee);
//     await charitySwap.deployTransaction.wait()

//     console.log("CharitySwap deployed to:", charitySwap.address);
//   });

const solidity089 = {
  version: "0.8.9",
  settings: {
    optimizer: {
      enabled: true,
      runs: 200,
    },
  },
}

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
    overrides: {
      "contracts/Charity.sol": solidity089,
      "locallibs/openzeppelin/contracts-4.7.3/access/Ownable.sol": solidity089,
      "locallibs/openzeppelin/contracts-4.7.3/utils/Context.sol": solidity089,
      "locallibs/openzeppelin/contracts-4.7.3/token/ERC1155/ERC1155.sol": solidity089,
      "locallibs/openzeppelin/contracts-4.7.3/utils/introspection/ERC165.sol": solidity089,
      "locallibs/openzeppelin/contracts-4.7.3/utils/introspection/IERC165.sol": solidity089,
      "locallibs/openzeppelin/contracts-4.7.3/token/ERC1155/IERC1155Receiver.sol": solidity089,
      "locallibs/openzeppelin/contracts-4.7.3/token/ERC1155/IERC1155.sol": solidity089,
      "locallibs/openzeppelin/contracts-4.7.3/token/ERC1155/extensions/IERC1155MetadataURI.sol": solidity089,
      "locallibs/openzeppelin/contracts-4.7.3/utils/Address.sol": solidity089,
    },
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
