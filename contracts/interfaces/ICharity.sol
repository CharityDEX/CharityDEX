// SPDX-License-Identifier: MIT

pragma solidity ^0.7.6;

interface ICharity {
    
    function donate() external payable;
       
    function donateTo(address payable charityAddress) external payable;

    function donateFrom(address donor) external payable;
       
    function donateToFrom(address payable charityAddress, address donor) external payable;
}