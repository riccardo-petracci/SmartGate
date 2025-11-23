// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

contract StatsEngine{
    function average (uint[] memory values) public pure returns (uint) {
        require(values.length > 0, "Array must have at least one element");
        uint sum = 0;
        for (uint i = 0; i < values.length; i++) {
            unchecked { sum += values[i]; }
        }
        return sum / values.length;
    }

    function minimum(uint[] memory values) public pure returns (uint) {
        require(values.length > 0, "Array must have at least one element");
        uint minVal = values[0];
        for(uint i = 1; i < values.length; i++){
            if (values[i] < minVal){
                minVal = values[i];
            }
        }
        return minVal;
    }

    function maximum(uint[] memory values) public pure returns (uint) {
        require (values.length > 0, "Array must have at least one element");
        uint maxVal = values[0];
        for(uint i = 1; i < values.length; i++){
            if(values[i] > maxVal){
                maxVal = values[i];
            }
        }
        return maxVal;
    }

    function variance(uint[] memory values) public pure returns (uint){
        uint avg = average(values);
        uint sumSq = 0;
        for (uint i = 0; i < values.length; i++){
            uint diff = values[i] > avg ? values[i] - avg : avg - values[i];
            	unchecked { sumSq += diff * diff; }

        }
        return sumSq / values.length;
    }

    function sqrt(uint x) internal pure returns (uint y){
        if (x == 0) return 0;
        uint z = (x + 1) / 2;
        y = x;
        while (z < y){
            y = z;
            z = (x / z + z) / 2;
        }
    }

    function standardDeviation(uint[] memory values) public pure returns (uint){
        return sqrt(variance(values));
    }

    // Quicksort function for median and percentile
    function quickSort(uint[] memory arr, uint left, uint right) internal pure {
        uint i = left;
        uint j = right;
        if(i >= j) return;

        uint pivot = arr[uint(left + (right - left) /2 )];
        while (i <= j){
            while (arr[uint(i)] < pivot) i++;
            while (pivot < arr[uint(j)]) j--;
            if (i <= j){
                (arr[uint(i)], arr[uint(j)]) = (arr[uint(j)], arr[uint(i)]);
                i++;
                j--;
            }
        }
        if (left < j) quickSort(arr, left, j);
        if (i < right) quickSort(arr, i, right);
    }

    function sort (uint[] memory data) internal pure returns (uint[] memory) {
        if (data.length > 1) {
            quickSort(data, 0, data.length - 1);
        }
        return data;
    }

    function median(uint[] memory values) public pure returns (uint) {
        uint[] memory sorted = sort(values);
        uint n = sorted.length;
        if (n % 2 == 1){
            return sorted[n / 2];
        } else {
            return (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
        }
    }

    function percentile(uint[] memory values, uint p) public pure returns (uint){
        require(p <= 100, "p must be 0-100");
        uint[] memory sorted = sort(values);
        uint n = sorted.length;
        if (p == 0) return sorted[0];
        if (p == 100) return sorted[n - 1];

        uint rank = (p * n + 99) / 100;
        if(rank == 0) rank = 1;
        return sorted[rank - 1];
    }
}