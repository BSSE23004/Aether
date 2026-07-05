// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../../src/Governor.sol";

contract MockERC20Votes is ERC20, IVotingToken {
    mapping(address => uint256) private _votes;
    mapping(uint256 => uint256) private _pastTotalSupply;

    constructor(string memory name, string memory symbol) ERC20(name, symbol) {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function delegate(address delegatee) external override {
        _votes[delegatee] = balanceOf(delegatee);
    }

    function getVotes(address account) external view override returns (uint256) {
        return _votes[account] > 0 ? _votes[account] : balanceOf(account);
    }

    function getTotalSupply() external view returns (uint256) {
        return totalSupply();
    }

    function getPastTotalSupply(uint256 timepoint) external view override returns (uint256) {
        return _pastTotalSupply[timepoint];
    }
}
