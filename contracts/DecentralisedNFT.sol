// contracts/DecentralisedNFT.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract DecentralisedNFT is ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    // Base URI required to interact with IPFS
    string private _baseURIExtended;

    constructor() ERC721("DecentralisedNFT", "DNFT") {
        _setBaseURI("ipfs://");
    }

    // Sets the base URI for the collection
    function _setBaseURI(string memory baseURI) private {
        _baseURIExtended = baseURI;
    }

    // Overrides the default function to enable ERC721URIStorage to get the updated baseURI
    function _baseURI() internal view override returns (string memory) {
        return _baseURIExtended;
    }

    // Allows minting of a new NFT 
    function mintCollectionNFT(address collector, string memory metadataURI) public onlyOwner() {
        _tokenIds.increment(); // NFT IDs start at 1

        uint256 tokenId = _tokenIds.current();
        _safeMint(collector, tokenId);
        _setTokenURI(tokenId, metadataURI);

    }

}