// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {PulseKeeperRegistry} from "../src/PulseKeeperRegistry.sol";

contract DeployScript is Script {
    function setUp() public {}

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);

        PulseKeeperRegistry registry = new PulseKeeperRegistry();
        
        console.log("PulseKeeperRegistry deployed at:", address(registry));

        vm.stopBroadcast();
    }
}
