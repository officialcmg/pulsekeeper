// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {PulseKeeperRegistry} from "../src/PulseKeeperRegistry.sol";

contract PulseKeeperRegistryTest is Test {
    PulseKeeperRegistry public registry;
    
    address public user = address(0x1);
    address public backup1 = address(0x2);
    address public backup2 = address(0x3);
    address public backup3 = address(0x4);

    function setUp() public {
        registry = new PulseKeeperRegistry();
    }

    function test_Register() public {
        PulseKeeperRegistry.Backup[] memory backups = new PulseKeeperRegistry.Backup[](2);
        backups[0] = PulseKeeperRegistry.Backup(backup1, 5000);
        backups[1] = PulseKeeperRegistry.Backup(backup2, 5000);

        uint256 pulsePeriodSeconds = 30 days; // 30 days in seconds
        vm.prank(user);
        registry.register(pulsePeriodSeconds, backups);

        assertTrue(registry.isRegistered(user));
        assertEq(registry.getPulsePeriod(user), pulsePeriodSeconds);
        assertEq(registry.getLastCheckIn(user), block.timestamp);
        assertEq(registry.getDeadline(user), block.timestamp + pulsePeriodSeconds);
        assertTrue(registry.isActive(user));
        assertFalse(registry.isDistributing(user));
    }

    function test_CheckIn() public {
        // First register
        PulseKeeperRegistry.Backup[] memory backups = new PulseKeeperRegistry.Backup[](1);
        backups[0] = PulseKeeperRegistry.Backup(backup1, 10000);

        uint256 pulsePeriodSeconds = 7 days;
        vm.prank(user);
        registry.register(pulsePeriodSeconds, backups);

        uint256 initialDeadline = registry.getDeadline(user);

        // Advance time
        vm.warp(block.timestamp + 3 days);

        // Check in
        vm.prank(user);
        registry.checkIn();

        assertEq(registry.getLastCheckIn(user), block.timestamp);
        // Deadline should be updated to new timestamp + pulsePeriodSeconds
        assertEq(registry.getDeadline(user), block.timestamp + pulsePeriodSeconds);
        assertTrue(registry.isActive(user));
    }

    function test_CheckIn_RevertWhen_NotRegistered() public {
        vm.prank(user);
        vm.expectRevert(PulseKeeperRegistry.NotRegistered.selector);
        registry.checkIn();
    }

    function test_IsDistributing_AfterDeadline() public {
        PulseKeeperRegistry.Backup[] memory backups = new PulseKeeperRegistry.Backup[](1);
        backups[0] = PulseKeeperRegistry.Backup(backup1, 10000);

        uint256 pulsePeriodSeconds = 7 days;
        vm.prank(user);
        registry.register(pulsePeriodSeconds, backups);

        // Advance time past deadline
        vm.warp(block.timestamp + pulsePeriodSeconds + 1);

        assertFalse(registry.isActive(user));
        assertTrue(registry.isDistributing(user));
    }

    function test_SetBackups() public {
        // First register
        PulseKeeperRegistry.Backup[] memory initialBackups = new PulseKeeperRegistry.Backup[](1);
        initialBackups[0] = PulseKeeperRegistry.Backup(backup1, 10000);

        vm.prank(user);
        registry.register(30 days, initialBackups);

        // Update backups
        PulseKeeperRegistry.Backup[] memory newBackups = new PulseKeeperRegistry.Backup[](3);
        newBackups[0] = PulseKeeperRegistry.Backup(backup1, 5000);
        newBackups[1] = PulseKeeperRegistry.Backup(backup2, 3000);
        newBackups[2] = PulseKeeperRegistry.Backup(backup3, 2000);

        vm.prank(user);
        registry.setBackups(newBackups);

        PulseKeeperRegistry.Backup[] memory storedBackups = registry.getBackups(user);
        assertEq(storedBackups.length, 3);
        assertEq(storedBackups[0].allocationBps, 5000);
        assertEq(storedBackups[1].allocationBps, 3000);
        assertEq(storedBackups[2].allocationBps, 2000);
    }

    function test_SetBackups_RevertWhen_NotRegistered() public {
        PulseKeeperRegistry.Backup[] memory backups = new PulseKeeperRegistry.Backup[](1);
        backups[0] = PulseKeeperRegistry.Backup(backup1, 10000);

        vm.prank(user);
        vm.expectRevert(PulseKeeperRegistry.NotRegistered.selector);
        registry.setBackups(backups);
    }

    function test_SetPulsePeriod() public {
        // First register
        PulseKeeperRegistry.Backup[] memory backups = new PulseKeeperRegistry.Backup[](1);
        backups[0] = PulseKeeperRegistry.Backup(backup1, 10000);

        vm.prank(user);
        registry.register(30 days, backups);

        uint256 lastCheckIn = registry.getLastCheckIn(user);

        // Update pulse period to 14 days in seconds
        uint256 newPulsePeriodSeconds = 14 days;
        vm.prank(user);
        registry.setPulsePeriod(newPulsePeriodSeconds);

        assertEq(registry.getPulsePeriod(user), newPulsePeriodSeconds);
        // Deadline should be recalculated from lastCheckIn
        assertEq(registry.getDeadline(user), lastCheckIn + newPulsePeriodSeconds);
    }

    function test_SetPulsePeriod_RevertWhen_NotRegistered() public {
        vm.prank(user);
        vm.expectRevert(PulseKeeperRegistry.NotRegistered.selector);
        registry.setPulsePeriod(14);
    }

    function test_RevertWhen_InvalidAllocation() public {
        PulseKeeperRegistry.Backup[] memory backups = new PulseKeeperRegistry.Backup[](2);
        backups[0] = PulseKeeperRegistry.Backup(backup1, 5000);
        backups[1] = PulseKeeperRegistry.Backup(backup2, 4000); // Only 90%

        vm.prank(user);
        vm.expectRevert(PulseKeeperRegistry.InvalidAllocation.selector);
        registry.register(30 days, backups);
    }

    function test_RevertWhen_ZeroPulsePeriod() public {
        PulseKeeperRegistry.Backup[] memory backups = new PulseKeeperRegistry.Backup[](1);
        backups[0] = PulseKeeperRegistry.Backup(backup1, 10000);

        vm.prank(user);
        vm.expectRevert(PulseKeeperRegistry.InvalidPulsePeriod.selector);
        registry.register(0, backups);
    }

    function test_RevertWhen_NoBackups() public {
        PulseKeeperRegistry.Backup[] memory backups = new PulseKeeperRegistry.Backup[](0);

        vm.prank(user);
        vm.expectRevert(PulseKeeperRegistry.NoBackupsSet.selector);
        registry.register(30 days, backups);
    }

    function test_GetDeadline() public {
        PulseKeeperRegistry.Backup[] memory backups = new PulseKeeperRegistry.Backup[](1);
        backups[0] = PulseKeeperRegistry.Backup(backup1, 10000);

        uint256 pulsePeriodSeconds = 30 days;
        vm.prank(user);
        registry.register(pulsePeriodSeconds, backups);

        uint256 expectedDeadline = block.timestamp + pulsePeriodSeconds;
        assertEq(registry.getDeadline(user), expectedDeadline);
    }

    function test_GetUserConfig() public {
        PulseKeeperRegistry.Backup[] memory backups = new PulseKeeperRegistry.Backup[](2);
        backups[0] = PulseKeeperRegistry.Backup(backup1, 6000);
        backups[1] = PulseKeeperRegistry.Backup(backup2, 4000);

        uint256 pulsePeriodSeconds = 14 days;
        vm.prank(user);
        registry.register(pulsePeriodSeconds, backups);

        (
            bool registered,
            uint256 lastCheckIn,
            uint256 deadline,
            uint256 storedPulsePeriodSeconds,
            PulseKeeperRegistry.Backup[] memory storedBackups
        ) = registry.getUserConfig(user);

        assertTrue(registered);
        assertEq(lastCheckIn, block.timestamp);
        assertEq(deadline, block.timestamp + pulsePeriodSeconds);
        assertEq(storedPulsePeriodSeconds, pulsePeriodSeconds);
        assertEq(storedBackups.length, 2);
    }

    function test_IsRegistered_False_WhenNotRegistered() public {
        assertFalse(registry.isRegistered(user));
    }

    function test_Events_UserRegistered() public {
        PulseKeeperRegistry.Backup[] memory backups = new PulseKeeperRegistry.Backup[](1);
        backups[0] = PulseKeeperRegistry.Backup(backup1, 10000);

        uint256 pulsePeriodSeconds = 30 days;
        vm.expectEmit(true, false, false, true);
        emit PulseKeeperRegistry.UserRegistered(user, pulsePeriodSeconds, block.timestamp, block.timestamp + pulsePeriodSeconds);

        vm.prank(user);
        registry.register(pulsePeriodSeconds, backups);
    }

    function test_Events_CheckIn() public {
        PulseKeeperRegistry.Backup[] memory backups = new PulseKeeperRegistry.Backup[](1);
        backups[0] = PulseKeeperRegistry.Backup(backup1, 10000);

        uint256 pulsePeriodSeconds = 7 days;
        vm.prank(user);
        registry.register(pulsePeriodSeconds, backups);

        vm.warp(block.timestamp + 3 days);

        vm.expectEmit(true, false, false, true);
        emit PulseKeeperRegistry.CheckIn(user, block.timestamp, block.timestamp + pulsePeriodSeconds);

        vm.prank(user);
        registry.checkIn();
    }

    function test_ShortPulsePeriod_Seconds() public {
        // Test with very short period (60 seconds) for demo purposes
        PulseKeeperRegistry.Backup[] memory backups = new PulseKeeperRegistry.Backup[](1);
        backups[0] = PulseKeeperRegistry.Backup(backup1, 10000);

        uint256 pulsePeriodSeconds = 60; // 60 seconds
        vm.prank(user);
        registry.register(pulsePeriodSeconds, backups);

        assertEq(registry.getPulsePeriod(user), 60);
        assertEq(registry.getDeadline(user), block.timestamp + 60);
        assertTrue(registry.isActive(user));

        // Advance 30 seconds - still active
        vm.warp(block.timestamp + 30);
        assertTrue(registry.isActive(user));
        assertFalse(registry.isDistributing(user));

        // Advance past deadline
        vm.warp(block.timestamp + 31);
        assertFalse(registry.isActive(user));
        assertTrue(registry.isDistributing(user));
    }

    function test_RecordDistribution_ETH() public {
        address[] memory backupAddresses = new address[](2);
        backupAddresses[0] = backup1;
        backupAddresses[1] = backup2;

        uint256[] memory amounts = new uint256[](2);
        amounts[0] = 1 ether;
        amounts[1] = 0.5 ether;

        // Expect Distribution events for each backup
        vm.expectEmit(true, true, true, true);
        emit PulseKeeperRegistry.Distribution(user, backup1, address(0), 1 ether, block.timestamp);
        
        vm.expectEmit(true, true, true, true);
        emit PulseKeeperRegistry.Distribution(user, backup2, address(0), 0.5 ether, block.timestamp);
        
        // Expect DistributionBatch event
        vm.expectEmit(true, true, false, true);
        emit PulseKeeperRegistry.DistributionBatch(user, address(0), 1.5 ether, 2, block.timestamp);

        registry.recordDistribution(user, address(0), backupAddresses, amounts);
    }

    function test_RecordDistribution_ERC20() public {
        address token = address(0xdead);
        
        address[] memory backupAddresses = new address[](1);
        backupAddresses[0] = backup1;

        uint256[] memory amounts = new uint256[](1);
        amounts[0] = 1000e18;

        vm.expectEmit(true, true, true, true);
        emit PulseKeeperRegistry.Distribution(user, backup1, token, 1000e18, block.timestamp);
        
        vm.expectEmit(true, true, false, true);
        emit PulseKeeperRegistry.DistributionBatch(user, token, 1000e18, 1, block.timestamp);

        registry.recordDistribution(user, token, backupAddresses, amounts);
    }

    function test_RecordDistribution_RevertWhen_LengthMismatch() public {
        address[] memory backupAddresses = new address[](2);
        backupAddresses[0] = backup1;
        backupAddresses[1] = backup2;

        uint256[] memory amounts = new uint256[](1);
        amounts[0] = 1 ether;

        vm.expectRevert("Length mismatch");
        registry.recordDistribution(user, address(0), backupAddresses, amounts);
    }

    function test_RecordDistribution_RevertWhen_Empty() public {
        address[] memory backupAddresses = new address[](0);
        uint256[] memory amounts = new uint256[](0);

        vm.expectRevert("No distributions");
        registry.recordDistribution(user, address(0), backupAddresses, amounts);
    }
}
