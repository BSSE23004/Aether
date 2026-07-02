// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title MockMembership
 * @notice Mock membership contract for testing Governor
 */
contract MockMembership {
    mapping(address => bool) public hasMembership;

    function grantMembership(address _user) external {
        hasMembership[_user] = true;
    }

    function revokeMembership(address _user) external {
        hasMembership[_user] = false;
    }
}