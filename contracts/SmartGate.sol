// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "./Encryptor.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract SmartGate{
    
    address encryptorAddress;
    
    uint[] senderTransactionsHistory;

    mapping(string => uint[]) encryptedAddressToTransactions;

    uint maxTransactionsWithinTimeThreshold = 3;
    uint timeThresholdInSeconds = 5 minutes;

    function checkSenderTransactions(string memory encryptedAddress) private view returns (bool) {
        uint[] memory transactionsHistory = encryptedAddressToTransactions[encryptedAddress];
        uint transactionsWithinTimeThresholdCount = 0;
        for(uint i = 0; i < transactionsHistory.length; i++){
            if(block.timestamp - transactionsHistory[i] < timeThresholdInSeconds){
                transactionsWithinTimeThresholdCount += 1;
                if(transactionsWithinTimeThresholdCount > maxTransactionsWithinTimeThreshold){
                    return false;
                }
            }
        }
        return true; 
    }


    function performOperation(int[] memory values) private pure returns (int){
        int average;
        int sum = 0;
        for (uint i = 0; i < values.length; i++) {
            sum += values[i];
        }
        average = sum / int(values.length);
        return average;
    }

    function gateOperation(int[] memory values) public returns (int) {
        Encryptor encryptor = Encryptor(encryptorAddress);
        string memory encryptedAddress;
        encryptedAddress = encryptor.encryptAddress(msg.sender);
        encryptedAddressToTransactions[encryptedAddress].push(block.timestamp);
        int result = 0;
        if(checkSenderTransactions(encryptedAddress)){
            result = performOperation(values);
        } 
        else {
            revert(string.concat("Too many requests executed in the last ", Strings.toString(timeThresholdInSeconds), " seconds"));
        }
        return result;
    }

    function setEncryptorAddress(address encryptorContractAddress) public {
        encryptorAddress = encryptorContractAddress;
    }
}