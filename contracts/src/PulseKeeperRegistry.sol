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
        uint256 pulsePeriodSeconds; // Changed from days to seconds for flexibility
        Backup[] backups;
    }

    mapping(address => UserConfig) private userConfigs;

    // Events with all data needed for indexer
    event UserRegistered(
        address indexed user,
        uint256 pulsePeriodSeconds,
        uint256 timestamp,
        uint256 deadline
    );
    
    event CheckIn(
        address indexed user,
        uint256 timestamp,
        uint256 deadline
    );
    
    event BackupsUpdated(address indexed user, Backup[] backups);
    event PulsePeriodUpdated(address indexed user, uint256 pulsePeriodSeconds, uint256 newDeadline);
    
    // Distribution events for indexer - emitted when funds are sent to backups
    event Distribution(
        address indexed user,
        address indexed backup,
        address indexed token,  // address(0) for native ETH
        uint256 amount,
        uint256 timestamp
    );
    
    event DistributionBatch(
        address indexed user,
        address indexed token,  // address(0) for native ETH
        uint256 totalAmount,
        uint256 backupCount,
        uint256 timestamp
    );

    error InvalidAllocation();
    error NoBackupsSet();
    error InvalidPulsePeriod();
    error NotRegistered();

    /**
     * @notice Register a new user with initial configuration
     * @param pulsePeriodSeconds The number of seconds between required check-ins
     * @param backups Array of backup addresses with their allocation percentages
     */
    function register(uint256 pulsePeriodSeconds, Backup[] calldata backups) external {
        if (pulsePeriodSeconds == 0) revert InvalidPulsePeriod();
        if (backups.length == 0) revert NoBackupsSet();
        
        _validateBackups(backups);
        
        UserConfig storage config = userConfigs[msg.sender];
        uint256 currentTime = block.timestamp;
        uint256 newDeadline = currentTime + pulsePeriodSeconds;
        
        config.isRegistered = true;
        config.lastCheckIn = currentTime;
        config.deadline = newDeadline;
        config.pulsePeriodSeconds = pulsePeriodSeconds;
        
        // Clear existing backups and add new ones
        delete config.backups;
        for (uint256 i = 0; i < backups.length; i++) {
            config.backups.push(backups[i]);
        }

        emit UserRegistered(msg.sender, pulsePeriodSeconds, currentTime, newDeadline);
        emit BackupsUpdated(msg.sender, backups);
    }

    /**
     * @notice Check in to reset the pulse timer
     */
    function checkIn() external {
        UserConfig storage config = userConfigs[msg.sender];
        if (!config.isRegistered) revert NotRegistered();
        
        uint256 currentTime = block.timestamp;
        uint256 newDeadline = currentTime + config.pulsePeriodSeconds;
        
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
     * @param pulsePeriodSeconds The number of seconds between required check-ins
     */
    function setPulsePeriod(uint256 pulsePeriodSeconds) external {
        UserConfig storage config = userConfigs[msg.sender];
        if (!config.isRegistered) revert NotRegistered();
        if (pulsePeriodSeconds == 0) revert InvalidPulsePeriod();
        
        config.pulsePeriodSeconds = pulsePeriodSeconds;
        // Recalculate deadline from last check-in with new period
        uint256 newDeadline = config.lastCheckIn + pulsePeriodSeconds;
        config.deadline = newDeadline;
        
        emit PulsePeriodUpdated(msg.sender, pulsePeriodSeconds, newDeadline);
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
     * @return The pulse period in seconds
     */
    function getPulsePeriod(address user) external view returns (uint256) {
        return userConfigs[user].pulsePeriodSeconds;
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
     * @return pulsePeriodSeconds The pulse period in seconds
     * @return backups Array of backup addresses with allocations
     */
    function getUserConfig(address user) external view returns (
        bool registered,
        uint256 lastCheckIn,
        uint256 deadline,
        uint256 pulsePeriodSeconds,
        Backup[] memory backups
    ) {
        UserConfig storage config = userConfigs[user];
        return (config.isRegistered, config.lastCheckIn, config.deadline, config.pulsePeriodSeconds, config.backups);
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

    /**
     * @notice Record a distribution event for indexing purposes
     * @dev Called by the redemption service after successfully transferring funds
     * @param user The user whose funds were distributed
     * @param token The token address (address(0) for native ETH)
     * @param backupAddresses Array of backup addresses that received funds
     * @param amounts Array of amounts sent to each backup
     */
    function recordDistribution(
        address user,
        address token,
        address[] calldata backupAddresses,
        uint256[] calldata amounts
    ) external {
        require(backupAddresses.length == amounts.length, "Length mismatch");
        require(backupAddresses.length > 0, "No distributions");
        
        uint256 totalAmount = 0;
        uint256 currentTime = block.timestamp;
        
        for (uint256 i = 0; i < backupAddresses.length; i++) {
            emit Distribution(user, backupAddresses[i], token, amounts[i], currentTime);
            totalAmount += amounts[i];
        }
        
        emit DistributionBatch(user, token, totalAmount, backupAddresses.length, currentTime);
    }
}
