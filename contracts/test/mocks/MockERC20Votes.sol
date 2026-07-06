// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../../src/Governor.sol";

/**
 * @title MockERC20Votes
 * @notice Mock ERC20 token with voting power tracking for Governor tests
 * @dev Simplified voting delegation — tracks delegated votes and snapshots total supply
 */
contract MockERC20Votes is ERC20, IVotingToken {
    mapping(address => address) private _delegates;
    mapping(address => uint256) private _votes;
    // Stores total supply snapshots keyed by timestamp
    mapping(uint256 => uint256) private _pastTotalSupply;
    uint256 private _lastSnapshotTime;

    constructor(string memory _name, string memory _symbol) ERC20(_name, _symbol) {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
        // Snapshot total supply at this timestamp
        _pastTotalSupply[block.timestamp] = totalSupply();
        _lastSnapshotTime = block.timestamp;

        // Auto-update votes if already delegated
        address delegatee = _delegates[to];
        if (delegatee != address(0)) {
            _votes[delegatee] += amount;
        }
    }

    function delegate(address delegatee) external override {
        address oldDelegatee = _delegates[msg.sender];
        _delegates[msg.sender] = delegatee;

        // Remove votes from old delegatee
        if (oldDelegatee != address(0)) {
            uint256 currentBalance = balanceOf(msg.sender);
            if (_votes[oldDelegatee] >= currentBalance) {
                _votes[oldDelegatee] -= currentBalance;
            } else {
                _votes[oldDelegatee] = 0;
            }
        }

        // Add votes to new delegatee
        if (delegatee != address(0)) {
            _votes[delegatee] += balanceOf(msg.sender);
        }
    }

    function getVotes(address account) external view override returns (uint256) {
        return _votes[account];
    }

    function getTotalSupply() external view returns (uint256) {
        return totalSupply();
    }

    function getPastTotalSupply(uint256 timepoint) external view override returns (uint256) {
        // Return the snapshot at or before the requested timepoint
        if (_pastTotalSupply[timepoint] != 0) {
            return _pastTotalSupply[timepoint];
        }
        // Fallback: return the last known snapshot if timepoint is after it
        if (timepoint >= _lastSnapshotTime && _lastSnapshotTime != 0) {
            return _pastTotalSupply[_lastSnapshotTime];
        }
        return 0;
    }
}
