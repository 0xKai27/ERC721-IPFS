// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.

const { ethers } = require("hardhat");

async function main() {

  // Get the contract owner
  const contractOwner = await ethers.getSigners();
  console.log(`Deploying contract from: ${contractOwner[0].address}`);

  // Hardhat helper to get the ethers contractFactory object
  const DecentralisedNFT = await ethers.getContractFactory('DecentralisedNFT');

  // Deploy the contract
  console.log('Deploying DecentralisedNFT...');
  const decentralisedNFT = await DecentralisedNFT.deploy();
  await decentralisedNFT.deployed();
  console.log(`DecentralisedNFT deployed to: ${decentralisedNFT.address}`)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });