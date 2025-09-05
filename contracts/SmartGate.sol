// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "contracts/Encryptor.sol";
import "contracts/StatsEngine.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "contracts/Types.sol";

contract SmartGate{
    
    address encryptorAddress;
    address statsEngineAddress;
    address typesAddress;
    uint maxTransactionsWithinTimeThreshold;
    uint timeThresholdInSeconds;
    uint precisionPerc;
    
    uint[] senderTransactionsHistory;

    mapping(string => uint[]) encryptedAddressToTransactions;

    constructor(){
        defaultParameters();
    }

    function defaultParameters() private {
        timeThresholdInSeconds = 5 minutes;
        maxTransactionsWithinTimeThreshold = 3;
        precisionPerc = 98;
    }

    function setMaxTransactionsWithinTimeThreshold(uint _maxTransactionsWithinTimeThreshold) public {
        maxTransactionsWithinTimeThreshold = _maxTransactionsWithinTimeThreshold;
    }

    function getMaxTransactionsWithinTimeThreshold() public view returns (uint){
        return maxTransactionsWithinTimeThreshold;
    }

    function setPrecisionPerc(uint _precisionPerc) public {
        require(_precisionPerc <= 100, "p must be 0-100");
        precisionPerc = _precisionPerc;
    }

    function getPrecisionPerc() public view returns (uint){
        return precisionPerc;
    }

        function setTimeThresholdInSeconds(uint _timeThresholdInSeconds) public {
        timeThresholdInSeconds = _timeThresholdInSeconds;
    }

    function getTimeThresholdInSeconds() public view returns (uint){
        return timeThresholdInSeconds;
    }

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


    // function performOperation(int[] memory values) private pure returns (int){
    //     int average;
    //     int sum = 0;
    //     for (uint i = 0; i < values.length; i++) {
    //         sum += values[i];
    //     }
    //     average = sum / int(values.length);
    //     return average;
    // }

    function gateOperation(uint[] memory values, Types.EncryptionMode mode, bool advancedMode) public returns (uint avg, uint minVal, uint maxVal, uint variance, uint median, uint standardDeviation, uint percentile, string memory encryptedAddress) {
        Encryptor encryptor = Encryptor(encryptorAddress);
        encryptedAddress = encryptor.encryptAddress(msg.sender, mode);
        encryptedAddressToTransactions[encryptedAddress].push(block.timestamp);
        if(!checkSenderTransactions(encryptedAddress)){
            revert(string.concat(
                "Too many requests executed in the last ", 
                Strings.toString(timeThresholdInSeconds), 
                " seconds"
                ));
        }
        StatsEngine stats = StatsEngine(statsEngineAddress);
        avg    = stats.average(values);
        minVal = stats.minimum(values);
        maxVal = stats.maximum(values);
        
        if(!advancedMode) return (avg, minVal, maxVal,0,0,0,0, encryptedAddress);
        (variance, median, standardDeviation, percentile) = advancedAnalytics(values);
        return (avg, minVal, maxVal, variance, median, standardDeviation, percentile, encryptedAddress);
    }

    function advancedAnalytics(uint[] memory values) private view returns (uint variance, uint median, uint standardDeviation, uint percentile) {
        StatsEngine stats = StatsEngine(statsEngineAddress);
        variance = stats.variance(values);
        median = stats.median(values);
        standardDeviation = stats.standardDeviation(values);
        percentile = stats.percentile(values, precisionPerc);
    }

    function setEncryptorAddress(address encryptorContractAddress) public {
        encryptorAddress = encryptorContractAddress;
    }

    function setStatsEngineAddress(address statsContractAddress) public {
        statsEngineAddress = statsContractAddress;
    }
}