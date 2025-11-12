# SmartGate

## Overview

**SmartGate** is a modular and extensible smart contract architecture designed to control decentralized computation of statistical functions on-chain, while ensuring user anonymity and rate-limiting.

It is composed of three main contracts:
- **SmartGate.sol** — The core contract. It manages user requests, applies rate limits, and orchestrates operations.
- **Encryptor.sol** — A lightweight contract that anonymizes user identities through hashing.
- **StatsEngine.sol** — A modular analytics engine that performs statistical calculations (e.g., average, minimum, maximum, etc.).

![smartgate diagram](/images/smartgate_workflow.png)

Additionally, the project includes a Types.sol contract, which defines an enumeration representing the available hash functions used for encryption.

When selecting a hash function in Remix, you cannot directly use the enumeration names. Instead, you must input the corresponding numeric values according to the following mappings:

| Value | Hash Function |
|:------:|:---------------|
| 1 | `KECCAK256` |
| 2 | `SHA256` |
| 3 | `RIPEMD160` |

## 🧩 Workflow

1. The **User** calls `gateOperation()` on the **SmartGate** contract, passing a list of values to analyze, an unsigned integer identifying the encryption mode, and a boolean determining whether or not to perform *advanced* analysis on the set of values.
2. **SmartGate** sends the user’s address to the **Encryptor** contract.
3. The **Encryptor** hashes the address (anonymization) and returns a user identifier to **SmartGate**.
4. **SmartGate** stores the timestamp within a `[user_identifier -> timestamps[]]` mapping and checks if the identifier has exceeded the operations rate limit:
    - If yes, the transaction is **reverted**.
    - If not, it proceeds.
5. **SmartGate** forwards the values to the **StatsEngine** contract.
6. The **StatsEngine** computes the following operations:
    - **base mode:** average, minimum, and maximum.
    - **advanced mode:** base mode + variance, median, standard deviation, and percentile.
8. **StatsEngine** returns the results to **SmartGate** which provides them to the user.

---

## 🧱 Contracts

### **1️⃣ SmartGate.sol**

Handles:
- User rate limiting  
- Transactions tracking  
- Coordination of encryptor and statistical processor modules

Key features:
- Immutable `Encryptor` address (fixed at deployment)
- Upgradeable `StatsEngine` address (`onlyOwner`-controlled)

```
function gateOperation(uint[] memory values, Types.EncryptionMode mode, bool advancedMode) 
    public returns 
    (uint avg, uint minVal, uint maxVal, uint variance, uint median, uint standardDeviation, uint percentile, string memory encryptedAddress)
```

#### Rate Limiting

SmartGate prevents spam or abuse through configurable rate limits.

| Parameter | Description | Default |
|:-----------|:-------------|:---------:|
| `timeThresholdInSeconds` | Time window (in seconds) for rate limiting | 3 |
| `maxTransactionsWithinTimeThreshold` | Maximum number of transactions allowed within the time threshold | 5 |
  
If a user exceeds this limit, the contract reverts with:
```
"Too many requests executed in the last X seconds"
```

---

### **2️⃣ Encryptor.sol**

Responsible for anonymizing user addresses.

```
function encryptAddress(address user, Types.EncryptionMode mode) 
    external pure returns 
    (string memory)
```

This returns a fixed-size hash (as `string`) used as an anonymous identifier.

---

### **3️⃣ StatsEngine.sol**

Performs statistical computations on the input array.
Besides the main statistical operation functions, this contract also contains a set of internal utility functions such as:

```
function sqrt(uint x) internal pure returns (uint y)
function quickSort(uint[] memory arr, uint left, uint right) internal pure
function sort (uint[] memory data) internal pure returns (uint[] memory)
```

---

## 🧰 Technologies

- Solidity `^0.8.30`
- OpenZeppelin Contracts (Ownable, Strings)
- Keccak256 cryptographic hashing

