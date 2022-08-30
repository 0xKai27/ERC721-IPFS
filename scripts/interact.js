// scripts/interact.js
const { ethers } = require('hardhat');
const path = require('path');
const fs = require('fs');
const fsPromises = fs.promises;
const toBuffer = require('it-to-buffer');

async function main() {
    console.log('Getting the DecentralisedNFT contract...\n');
    const contractAddress = '0x131060B1A88Eebb934FD427C114Acdc819C68d40';
    const decentralisedNFT = await ethers.getContractAt('DecentralisedNFT', contractAddress);
    const signers = await ethers.getSigners();

    // Configure the local IPFS node
    console.log(`Configuring the IPFS instance...`)
    const { create } = await import('ipfs-http-client');
    const ipfs = create();
    const endpointConfig = await ipfs.getEndpointConfig();
    console.log(`IPFS configured to connect via: `);
    console.debug(endpointConfig);
    console.log(` `)

    // name()
    console.log(`Querying NFT collection name...`);
    const name = await decentralisedNFT.name();
    console.log(`Token Collection Name: ${name}\n`);

    // symbol()
    console.log('Querying NFT collection symbol...');
    const symbol = await decentralisedNFT.symbol();
    console.log(`Token Collection Symbol: ${symbol}\n`);

    // imagesSummary object for easier reference to all related data being created
    let imagesSummary = [];

    // Get the images to upload from the local filesystem (/images)
    console.log(`Importing images from the images/ directory...`)
    const imgDirPath = path.join(path.resolve(__dirname, '..'), 'images');
    const filesName = await fsPromises.readdir(imgDirPath, (err) => {
        if (err) {
            console.log("Import from directory failed: ", err);
        }
    })
    const imagesName = filesName.filter((fileName) => fileName.includes('.png'));
    let imagesData = [];
    for await (const imageName of imagesName) {
        let imageFilePath = path.join(path.resolve(__dirname, '..'), 'images', imageName);
        let imageData = await fsPromises.readFile(imageFilePath);
        imagesData.push(imageData);
    };
    console.log(`Imported images as buffered data\n`)

    // Uploading images to IPFS
    console.log(`Uploading image data to IPFS...`);
    let imageCIDs = [];
    for await (const imageData of imagesData) {
        let {cid: imageCID} = await ipfs.add({
            content: imageData
        });
        imageCIDs.push(imageCID);
        imagesSummary.push({imageCID});
        console.log(`Image added to IPFS with CID of ${imageCID}`);
    }
    console.log(` `)

    // Helper function to form the metadata JSON object
    function populateNFTMetadata(name, description, CID) {
        return {
            name,
            description,
            image: CID
        };
    }

    // Add the metadata to IPFS
    console.log(`Adding metadata to IPFS...`);
    let metadataCIDs = [];
    for await (const imageCID of imageCIDs) {
        console.log(imageCID)
        const {cid: metadataCID} = await ipfs.add({
            // NOTE: You can implement different name & descriptions for each metadata
            content: JSON.stringify(populateNFTMetadata("Screenshots", "Medium & Twitter Screenshots", imageCID.toString()))
        })
        metadataCIDs.push(metadataCID);
        for (let i = 0; i < imagesSummary.length; i ++) {
            if (imagesSummary[i].imageCID == imageCID) {
                imagesSummary[i].metadataCID = metadataCID
            }
        };
        console.log(`Metadata with image CID ${imageCID} added to IPFS with CID of ${metadataCID}`);
    }
    console.log(` `);

    // Mint new NFTs from the collection using custom function mintCollectionNFT()
    console.log('Minting new NFTs from the collection to the contractOwner...');
    const contractOwner = signers[0].address;
    let mintedNFTIds = [];
    for await (const metadataCID of metadataCIDs) {
        const deployedTokenId = await decentralisedNFT.mintCollectionNFT(contractOwner, metadataCID.toString());
        await deployedTokenId.wait();
        console.log(`NFT with CID ${metadataCID} minted to ${contractOwner}`);

        // Querying the latest transfer event to get the minted token ID
        console.log(`Getting the latest Transfer event...`);
        const transferEvents = await decentralisedNFT.queryFilter("Transfer"); // Logs will be ordered by earliest, assumes no other transfers while running
        const mintedNFTId = transferEvents[transferEvents.length-1].args.tokenId.toString();
        mintedNFTIds.push(mintedNFTId);
        for (let i = 0; i < imagesSummary.length; i++) {
            if (imagesSummary[i].metadataCID == metadataCID) {
                imagesSummary[i].mintedNFTId = mintedNFTId;
            }
        };
        console.log(`NFT with CID ${metadataCID} was minted with token ID ${mintedNFTId}`);
    }
    console.log(` `);

    // Get the URI stored on the blockchain
    console.log(`Getting URI stored on blockchain...`)
    let metadataURIs = [];
    for await (const mintedNFTId of mintedNFTIds) {
        console.log(`Querying blockchain for tokenURI of token ID ${mintedNFTId}`)
        const metadataURI = await decentralisedNFT.tokenURI(mintedNFTId);
        metadataURIs.push(metadataURI);
        for (let i = 0; i < imagesSummary.length; i++) {
            if (imagesSummary[i].mintedNFTId == mintedNFTId) {
                imagesSummary[i].metadataURI = metadataURI;
            }
        };
        console.log(`Token ID ${mintedNFTId} tokenURI: ${metadataURI}`)
    }
    console.log(` `);

    // Query IPFS based on the blockchain stored URI
    console.log(`Using queried URI to check metadata on IPFS...`)
    for await (const metadataURI of metadataURIs) {
        const bufferedQuery = await toBuffer(ipfs.cat(metadataURI.replace("ipfs://", "")));
        const metadataJSON = JSON.parse(bufferedQuery);
        console.log(`IPFS metadata based on metadata CID ${metadataURI}: `);
        console.log(metadataJSON);
        for (let i = 0; i < imagesSummary.length; i++) {
            if (imagesSummary[i].metadataURI == metadataURI) {
                imagesSummary[i].metadataJSON = metadataJSON;
            }
        };
    }
    console.log(` `);

    // Log the imagesSummary to see all related image data:
    console.log(`Logging the final imageSummary state...`)
    console.debug(imagesSummary);
}
  
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    });