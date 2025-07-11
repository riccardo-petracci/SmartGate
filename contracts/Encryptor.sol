// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "@openzeppelin/contracts/utils/Strings.sol";

contract Encryptor {

    function encryptAddress(address addressToEncrypt) public pure returns (string memory) {
        return  Strings.toHexString(uint256(uint160(addressToEncrypt)), 20); //test purposes, change to actual encryption
    }
}