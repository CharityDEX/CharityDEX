// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../locallibs/openzeppelin/contracts-4.7.3/token/ERC1155/ERC1155.sol";
import "../locallibs/openzeppelin/contracts-4.7.3/access/Ownable.sol";


contract Charity is ERC1155, Ownable {
    uint private constant TOKEN = 0;
    address payable[] charityAddresses;
    uint public totalDonations = 0; 
    mapping (address => bool) private charityMap;
    mapping (uint => uint) public tokenPrice;
    mapping (uint => string) public tokenUri;

    constructor(address payable[] memory _charityAddresses, string memory _uri) ERC1155(_uri) {
        charityAddresses = _charityAddresses;
        for (uint i=0; i < _charityAddresses.length; i++) {
            charityMap[_charityAddresses[i]] = true;
        }
    }

    function getCharityAddresses() public view returns (address payable[] memory addresses) {
        return charityAddresses;
    }

    function uri(uint id) public view virtual override returns (string memory){
        return string(abi.encodePacked(super.uri(id), tokenUri[id]));
    }
    
    function donate() external payable { 
        donateFrom(msg.sender);
    }
       
    function donateTo(address payable charityAddress) external payable {
        donateToFrom(charityAddress, msg.sender);
    }

    function donateFrom(address donor) public payable { 
        _mint(donor, TOKEN, msg.value, "");
        uint index = block.number % charityAddresses.length;
        charityAddresses[index].transfer(msg.value);
        totalDonations += msg.value;
    }
       
    function donateToFrom(address payable charityAddress, address donor) public payable {
        require(charityMap[charityAddress], "Wrong address");
        
        _mint(donor, TOKEN, msg.value, "");
        charityAddress.transfer(msg.value);
        totalDonations += msg.value;
    }
    
    function buy(uint id, uint count) external {
        uint price = count * tokenPrice[id];
        require(price > 0, "Invalid id");
        require(balanceOf(msg.sender, TOKEN) >= price, "Not enough funds");

        _burn(msg.sender, TOKEN, price);
        _mint(msg.sender, id, count, "");    
    }

    function setCharityAddresses(address payable[] memory _charityAddresses) external onlyOwner {
        for (uint i=0; i < charityAddresses.length; i++) {
            charityMap[charityAddresses[i]] = false;
        }
      
        charityAddresses = _charityAddresses;
        for (uint i=0; i < _charityAddresses.length; i++) {
            charityMap[_charityAddresses[i]] = true;
        }
    }

    function setPrice(uint id, uint price) external onlyOwner {
        require(id != TOKEN, "Invalid id");

        tokenPrice[id] = price;
    }     

    function setTokenUri(uint id, string calldata newTokenUri) external onlyOwner {
        tokenUri[id] = newTokenUri;

        emit URI(uri(id), id);  
    } 
}