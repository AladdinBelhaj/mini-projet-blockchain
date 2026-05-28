// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract IdentityManager is AccessControl {
    bytes32 public constant EDITOR_ROLE = keccak256("EDITOR_ROLE");
    bytes32 public constant VIEWER_ROLE = keccak256("VIEWER_ROLE");

    struct Identity {
        string displayName;
        bool isActive;
        uint256 registeredAt;
    }

    mapping(address => Identity) private identities;

    event IdentityRegistered(address indexed user, string displayName);
    event RoleRevokedFromUser(address indexed user, bytes32 role, address indexed revokedBy);
    event RoleAssignedToUser(address indexed user, bytes32 role, address indexed assignedBy);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        identities[msg.sender] = Identity({
            displayName: "System Admin",
            isActive: true,
            registeredAt: block.timestamp
        });
        emit IdentityRegistered(msg.sender, "System Admin");
    }

    modifier onlyActive(address user) {
        require(identities[user].isActive, "Identity not active");
        _;
    }

    function registerIdentity(string calldata displayName) external {
        require(!identities[msg.sender].isActive, "Already registered");
        require(bytes(displayName).length > 0, "Display name required");

        identities[msg.sender] = Identity({
            displayName: displayName,
            isActive: true,
            registeredAt: block.timestamp
        });

        // Default to viewer role
        _grantRole(VIEWER_ROLE, msg.sender);

        emit IdentityRegistered(msg.sender, displayName);
    }

    function assignRole(address user, bytes32 role) external onlyRole(DEFAULT_ADMIN_ROLE) onlyActive(user) {
        grantRole(role, user);
        emit RoleAssignedToUser(user, role, msg.sender);
    }

    function revokeRoleFromUser(address user, bytes32 role) external onlyRole(DEFAULT_ADMIN_ROLE) {
        revokeRole(role, user);
        emit RoleRevokedFromUser(user, role, msg.sender);
    }

    function getIdentity(address user) external view returns (string memory displayName, bool isActive, uint256 registeredAt) {
        Identity memory id = identities[user];
        return (id.displayName, id.isActive, id.registeredAt);
    }
}
