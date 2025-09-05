// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "@openzeppelin/contracts/utils/Strings.sol";
import "contracts/Types.sol";

contract Encryptor {
    using Types for Types.EncryptionMode;

    // function encryptAddress(address addressToEncrypt) public pure returns (string memory) {
    //     return  Strings.toHexString(uint256(uint160(addressToEncrypt)), 20); //test purposes, change to actual encryption
    // }

    // External functions are sometimes more efficient when they receive large arrays of data
    //less cost because can read directly instead of save in memory
    function encryptAddress(address user, Types.EncryptionMode mode) external pure returns (string memory) {
        require(mode == Types.EncryptionMode.KECCAK256 || mode == Types.EncryptionMode.SHA256 || mode == Types.EncryptionMode.RIPEMD160, "Invalid mode");
        bytes32 hash;
        if(mode == Types.EncryptionMode.KECCAK256){
            hash = keccak256(abi.encodePacked(user));
        } else if(mode == Types.EncryptionMode.SHA256){
            hash = sha256(abi.encodePacked(user));
        } else if (mode == Types.EncryptionMode.RIPEMD160){
            hash = ripemd160(abi.encodePacked(user));
        }

        return toHexString(hash);
    }

    function toHexString(bytes32 data) internal pure returns (string memory){
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(64);
        for(uint i = 0; i < 32; i++){
            str[i*2]     = alphabet[uint(uint8(data[i] >> 4))];
            str[i*2 + 1] = alphabet[uint(uint8(data[i] & 0x0f))];
        }

        return string(str);
    }
}