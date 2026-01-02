// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title PulseKeeperRegistry
 * @notice Registry contract for PulseKeeper - tracks user check-ins, backup addresses, and pulse periods
 * @dev This contract stores user configurations and check-in timestamps for the PulseKeeper system
 */
contract PulseKeeperRegistry {
    struct Backup {
        address addr;
        uint16 allocationBps; // Basis points (10000 = 100%)
    }

    struct UserConfig {
        bool isRegistered;
        uint256 lastCheckIn;
        uint256 deadline;
        uint256 pulsePeriodDays;
        Backup[] backups;
    }

    mapping(address => UserConfig) private userConfigs;

    // Events with all data needed for indexer
    event UserRegistered(
        address indexed user,
        uint256 pulsePeriodDays,
        uint256 timestamp,
        uint256 deadline
    );
    
    event CheckIn(
        address indexed user,
        uint256 timestamp,
        uint256 deadline
    );
    
    event BackupsUpdated(address indexed user, Backup[] backups);
    event PulsePeriodUpdated(address indexed user, uint256 pulsePeriodDays, uint256 newDeadline);

    error InvalidAllocation();
    error NoBackupsSet();
    error InvalidPulsePeriod();
    error NotRegistered();

    /**
     * @notice Register a new user with initial configuration
     * @param pulsePeriodDays The number of days between required check-ins
     * @param backups Array of backup addresses with their allocation percentages
     */
    function register(uint256 pulsePeriodDays, Backup[] calldata backups) external {
        if (pulsePeriodDays == 0) revert InvalidPulsePeriod();
        if (backups.length == 0) revert NoBackupsSet();
        
        _validateBackups(backups);
        
        UserConfig storage config = userConfigs[msg.sender];
        uint256 currentTime = block.timestamp;
        uint256 newDeadline = currentTime + (pulsePeriodDays * 1 days);
        
        config.isRegistered = true;
        config.lastCheckIn = currentTime;
        config.deadline = newDeadline;
        config.pulsePeriodDays = pulsePeriodDays;
        
        // Clear existing backups and add new ones
        delete config.backups;
        for (uint256 i = 0; i < backups.length; i++) {
            config.backups.push(backups[i]);
        }

        emit UserRegistered(msg.sender, pulsePeriodDays, currentTime, newDeadline);
        emit BackupsUpdated(msg.sender, backups);
    }

    /**
     * @notice Check in to reset the pulse timer
     */
    function checkIn() external {
        UserConfig storage config = userConfigs[msg.sender];
        if (!config.isRegistered) revert NotRegistered();
        
        uint256 currentTime = block.timestamp;
        uint256 newDeadline = currentTime + (config.pulsePeriodDays * 1 days);
        
        config.lastCheckIn = currentTime;
        config.deadline = newDeadline;
        
        emit CheckIn(msg.sender, currentTime, newDeadline);
    }

    /**
     * @notice Update backup addresses
     * @param backups Array of backup addresses with their allocation percentages
     */
    function setBackups(Backup[] calldata backups) external {
        UserConfig storage config = userConfigs[msg.sender];
        if (!config.isRegistered) revert NotRegistered();
        if (backups.length == 0) revert NoBackupsSet();
        _validateBackups(backups);
        
        // Clear existing backups and add new ones
        delete config.backups;
        for (uint256 i = 0; i < backups.length; i++) {
            config.backups.push(backups[i]);
        }

        emit BackupsUpdated(msg.sender, backups);
    }

    /**
     * @notice Update the pulse period
     * @param pulsePeriodDays The number of days between required check-ins
     */
    function setPulsePeriod(uint256 pulsePeriodDays) external {
        UserConfig storage config = userConfigs[msg.sender];
        if (!config.isRegistered) revert NotRegistered();
        if (pulsePeriodDays == 0) revert InvalidPulsePeriod();
        
        config.pulsePeriodDays = pulsePeriodDays;
        // Recalculate deadline from last check-in with new period
        uint256 newDeadline = config.lastCheckIn + (pulsePeriodDays * 1 days);
        config.deadline = newDeadline;
        
        emit PulsePeriodUpdated(msg.sender, pulsePeriodDays, newDeadline);
    }

    /**
     * @notice Get the last check-in timestamp for a user
     * @param user The user address
     * @return The timestamp of the last check-in
     */
    function getLastCheckIn(address user) external view returns (uint256) {
        return userConfigs[user].lastCheckIn;
    }

    /**
     * @notice Get the pulse period for a user
     * @param user The user address
     * @return The pulse period in days
     */
    function getPulsePeriod(address user) external view returns (uint256) {
        return userConfigs[user].pulsePeriodDays;
    }

    /**
     * @notice Get the backup addresses for a user
     * @param user The user address
     * @return Array of backup addresses with allocations
     */
    function getBackups(address user) external view returns (Backup[] memory) {
        return userConfigs[user].backups;
    }

    /**
     * @notice Check if a user is registered
     * @param user The user address
     * @return True if the user has registered
     */
    function isRegistered(address user) external view returns (bool) {
        return userConfigs[user].isRegistered;
    }

    /**
     * @notice Check if a user is still active (within their pulse period)
     * @param user The user address
     * @return True if the user is active, false if they've missed their check-in
     */
    function isActive(address user) external view returns (bool) {
        UserConfig storage config = userConfigs[user];
        if (!config.isRegistered) return false;
        return block.timestamp <= config.deadline;
    }

    /**
     * @notice Check if distribution should be happening for a user
     * @param user The user address
     * @return True if the user has missed their check-in and distribution should occur
     */
    function isDistributing(address user) external view returns (bool) {
        UserConfig storage config = userConfigs[user];
        if (!config.isRegistered) return false;
        if (config.backups.length == 0) return false;
        return block.timestamp > config.deadline;
    }

    /**
     * @notice Get the deadline timestamp for a user's next check-in
     * @param user The user address
     * @return The timestamp when the user's pulse expires
     */
    function getDeadline(address user) external view returns (uint256) {
        return userConfigs[user].deadline;
    }

    /**
     * @notice Get the full user configuration
     * @param user The user address
     * @return registered Whether the user is registered
     * @return lastCheckIn The last check-in timestamp
     * @return deadline The deadline timestamp
     * @return pulsePeriodDays The pulse period in days
     * @return backups Array of backup addresses with allocations
     */
    function getUserConfig(address user) external view returns (
        bool registered,
        uint256 lastCheckIn,
        uint256 deadline,
        uint256 pulsePeriodDays,
        Backup[] memory backups
    ) {
        UserConfig storage config = userConfigs[user];
        return (config.isRegistered, config.lastCheckIn, config.deadline, config.pulsePeriodDays, config.backups);
    }

    /**
     * @dev Validate that backup allocations sum to 100% (10000 bps)
     */
    function _validateBackups(Backup[] calldata backups) internal pure {
        uint256 totalBps = 0;
        for (uint256 i = 0; i < backups.length; i++) {
            if (backups[i].addr == address(0)) revert InvalidAllocation();
            totalBps += backups[i].allocationBps;
        }
        if (totalBps != 10000) revert InvalidAllocation();
    }
}
