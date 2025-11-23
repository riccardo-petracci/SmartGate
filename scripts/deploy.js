const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Deploy Encryptor
  const Encryptor = await hre.ethers.getContractFactory("Encryptor");
  const encryptor = await Encryptor.deploy();
  //await encryptor.deployed();
  console.log("Encryptor deployed at:", encryptor.target);

  // Deploy StatsEngine
  const StatsEngine = await hre.ethers.getContractFactory("StatsEngine");
  const statsEngine = await StatsEngine.deploy();
  //await statsEngine.deployed();
  console.log("StatsEngine deployed at:", statsEngine.target);

  // Deploy SmartGate
  const SmartGate = await hre.ethers.getContractFactory("SmartGate");
  const smartGate = await SmartGate.deploy();
  //await smartGate.deployed();
  console.log("SmartGate deployed at:", smartGate.target);

  // ⚡ Set the module addresses AFTER deployment
  const tx1 = await smartGate.setEncryptorAddress(encryptor.target);
  await tx1.wait();
  const tx2 = await smartGate.setStatsEngineAddress(statsEngine.target);
  await tx2.wait();

  console.log("\n✅ All contracts deployed and configured!");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
