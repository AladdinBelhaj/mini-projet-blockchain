// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./IdentityManager.sol";

contract DocumentRegistry {
    IdentityManager public identityManager;

    struct Document {
        string cid;              
        bytes32 contentHash;     
        address owner;
        string fileName;
        uint256 uploadedAt;
        bool isEncrypted;
        bool isActive;
    }

    uint256 private documentCount;
    mapping(uint256 => Document) public documents;
    mapping(uint256 => mapping(address => bool)) private accessControl;

    event DocumentUploaded(uint256 indexed docId, address indexed owner, string cid);
    event AccessGranted(uint256 indexed docId, address indexed user, address indexed grantedBy);
    event AccessRevoked(uint256 indexed docId, address indexed user, address indexed revokedBy);
    event DocumentAccessed(uint256 indexed docId, address indexed user, uint256 timestamp);

    constructor(address _identityManager) {
        identityManager = IdentityManager(_identityManager);
    }

    modifier onlyRegistered() {
        (, bool isActive, ) = identityManager.getIdentity(msg.sender);
        require(isActive, "User not registered in IdentityManager");
        _;
    }

    modifier canUpload() {
        (, bool isActive, ) = identityManager.getIdentity(msg.sender);
        require(isActive, "User not registered in IdentityManager");
        require(
            identityManager.hasRole(identityManager.DEFAULT_ADMIN_ROLE(), msg.sender) ||
            identityManager.hasRole(identityManager.EDITOR_ROLE(), msg.sender),
            "Requires EDITOR_ROLE or ADMIN_ROLE"
        );
        _;
    }

    function uploadDocument(string calldata cid, bytes32 contentHash, string calldata fileName, bool isEncrypted) external canUpload {
        documentCount++;
        uint256 newDocId = documentCount;

        documents[newDocId] = Document({
            cid: cid,
            contentHash: contentHash,
            owner: msg.sender,
            fileName: fileName,
            uploadedAt: block.timestamp,
            isEncrypted: isEncrypted,
            isActive: true
        });

        // Owner always has access
        accessControl[newDocId][msg.sender] = true;

        emit DocumentUploaded(newDocId, msg.sender, cid);
    }

    function grantAccess(uint256 docId, address user) external {
        require(documents[docId].owner == msg.sender, "Only owner can grant access");
        require(documents[docId].isActive, "Document not active");
        
        (, bool isActive, ) = identityManager.getIdentity(user);
        require(isActive, "Grantee must be registered user");

        accessControl[docId][user] = true;
        emit AccessGranted(docId, user, msg.sender);
    }

    function revokeAccess(uint256 docId, address user) external {
        require(documents[docId].owner == msg.sender, "Only owner can revoke access");
        require(user != msg.sender, "Owner cannot revoke own access");
        
        accessControl[docId][user] = false;
        emit AccessRevoked(docId, user, msg.sender);
    }

    function getDocument(uint256 docId) external onlyRegistered returns (Document memory) {
        require(documents[docId].isActive, "Document is inactive");
        require(accessControl[docId][msg.sender], "Access denied");

        emit DocumentAccessed(docId, msg.sender, block.timestamp);
        return documents[docId];
    }

    function hasAccess(uint256 docId, address user) external view returns (bool) {
        return accessControl[docId][user];
    }

    function getMyDocuments() external view onlyRegistered returns (uint256[] memory) {
        uint256 count = 0;
        for (uint256 i = 1; i <= documentCount; i++) {
            if (documents[i].owner == msg.sender && documents[i].isActive) {
                count++;
            }
        }
        
        uint256[] memory myDocs = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 1; i <= documentCount; i++) {
            if (documents[i].owner == msg.sender && documents[i].isActive) {
                myDocs[index] = i;
                index++;
            }
        }
        return myDocs;
    }

    function getAccessibleDocuments() external view onlyRegistered returns (uint256[] memory) {
        uint256 count = 0;
        for (uint256 i = 1; i <= documentCount; i++) {
            if (accessControl[i][msg.sender] && documents[i].isActive && documents[i].owner != msg.sender) {
                count++;
            }
        }
        
        uint256[] memory sharedDocs = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 1; i <= documentCount; i++) {
            if (accessControl[i][msg.sender] && documents[i].isActive && documents[i].owner != msg.sender) {
                sharedDocs[index] = i;
                index++;
            }
        }
        return sharedDocs;
    }

    function verifyIntegrity(uint256 docId, bytes32 hash) external view onlyRegistered returns (bool) {
        require(documents[docId].isActive, "Document is inactive");
        return documents[docId].contentHash == hash;
    }

    function getTotalDocumentCount() external view returns (uint256) {
        return documentCount;
    }
}
