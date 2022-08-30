// scripts/transfer.js
const { ethers } = require("hardhat");

async function main() {
    console.log('Getting the DecentralisedNFT contract...\n');
    const contractAddress = '0x131060B1A88Eebb934FD427C114Acdc819C68d40';
    const decentralisedNFT = await ethers.getContractAt('DecentralisedNFT', contractAddress);
    const signers = await ethers.getSigners();
    const contractOwner = signers[0].address;

    // Transfer tokenId 1 to another account
    console.log(`Transferring NFT...`)
    const recipient = "0x2bfc3A4Ef52Fe6cD2c5236dA08005C59EaFB43a7";
    const tokenId = "1";
    let tx = await decentralisedNFT["safeTransferFrom(address,address,uint256)"](contractOwner, recipient, tokenId);
    await tx.wait();
    console.log(`NFT ${tokenId} transferred from ${contractOwner} to ${recipient}`);

}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    });