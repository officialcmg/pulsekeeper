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

        vm.prank(user);
        registry.register(30, backups);

        assertTrue(registry.isRegistered(user));
        assertEq(registry.getPulsePeriod(user), 30);
        assertEq(registry.getLastCheckIn(user), block.timestamp);
        assertEq(registry.getDeadline(user), block.timestamp + 30 days);
        assertTrue(registry.isActive(user));
        assertFalse(registry.isDistributing(user));
    }

    function test_CheckIn() public {
        // First register
        PulseKeeperRegistry.Backup[] memory backups = new PulseKeeperRegistry.Backup[](1);
        backups[0] = PulseKeeperRegistry.Backup(backup1, 10000);

        vm.prank(user);
        registry.register(7, backups);

        uint256 initialDeadline = registry.getDeadline(user);

        // Advance time
        vm.warp(block.timestamp + 3 days);

        // Check in
        vm.prank(user);
        registry.checkIn();

        assertEq(registry.getLastCheckIn(user), block.timestamp);
        // Deadline should be updated to new timestamp + 7 days
        assertEq(registry.getDeadline(user), block.timestamp + 7 days);
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

        vm.prank(user);
        registry.register(7, backups);

        // Advance time past deadline
        vm.warp(block.timestamp + 8 days);

        assertFalse(registry.isActive(user));
        assertTrue(registry.isDistributing(user));
    }

    function test_SetBackups() public {
        // First register
        PulseKeeperRegistry.Backup[] memory initialBackups = new PulseKeeperRegistry.Backup[](1);
        initialBackups[0] = PulseKeeperRegistry.Backup(backup1, 10000);

        vm.prank(user);
        registry.register(30, initialBackups);

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
        registry.register(30, backups);

        uint256 lastCheckIn = registry.getLastCheckIn(user);

        // Update pulse period
        vm.prank(user);
        registry.setPulsePeriod(14);

        assertEq(registry.getPulsePeriod(user), 14);
        // Deadline should be recalculated from lastCheckIn
        assertEq(registry.getDeadline(user), lastCheckIn + 14 days);
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
        registry.register(30, backups);
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
        registry.register(30, backups);
    }

    function test_GetDeadline() public {
        PulseKeeperRegistry.Backup[] memory backups = new PulseKeeperRegistry.Backup[](1);
        backups[0] = PulseKeeperRegistry.Backup(backup1, 10000);

        vm.prank(user);
        registry.register(30, backups);

        uint256 expectedDeadline = block.timestamp + 30 days;
        assertEq(registry.getDeadline(user), expectedDeadline);
    }

    function test_GetUserConfig() public {
        PulseKeeperRegistry.Backup[] memory backups = new PulseKeeperRegistry.Backup[](2);
        backups[0] = PulseKeeperRegistry.Backup(backup1, 6000);
        backups[1] = PulseKeeperRegistry.Backup(backup2, 4000);

        vm.prank(user);
        registry.register(14, backups);

        (
            bool registered,
            uint256 lastCheckIn,
            uint256 deadline,
            uint256 pulsePeriodDays,
            PulseKeeperRegistry.Backup[] memory storedBackups
        ) = registry.getUserConfig(user);

        assertTrue(registered);
        assertEq(lastCheckIn, block.timestamp);
        assertEq(deadline, block.timestamp + 14 days);
        assertEq(pulsePeriodDays, 14);
        assertEq(storedBackups.length, 2);
    }

    function test_IsRegistered_False_WhenNotRegistered() public {
        assertFalse(registry.isRegistered(user));
    }

    function test_Events_UserRegistered() public {
        PulseKeeperRegistry.Backup[] memory backups = new PulseKeeperRegistry.Backup[](1);
        backups[0] = PulseKeeperRegistry.Backup(backup1, 10000);

        vm.expectEmit(true, false, false, true);
        emit PulseKeeperRegistry.UserRegistered(user, 30, block.timestamp, block.timestamp + 30 days);

        vm.prank(user);
        registry.register(30, backups);
    }

    function test_Events_CheckIn() public {
        PulseKeeperRegistry.Backup[] memory backups = new PulseKeeperRegistry.Backup[](1);
        backups[0] = PulseKeeperRegistry.Backup(backup1, 10000);

        vm.prank(user);
        registry.register(7, backups);

        vm.warp(block.timestamp + 3 days);

        vm.expectEmit(true, false, false, true);
        emit PulseKeeperRegistry.CheckIn(user, block.timestamp, block.timestamp + 7 days);

        vm.prank(user);
        registry.checkIn();
    }
}
