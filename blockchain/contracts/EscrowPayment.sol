// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface ISupplyChain {
    function getLot(uint256 _lotId) external view returns (
        uint256 id,
        string memory title,
        string memory description,
        uint256 quantity,
        string memory unit,
        string memory origin,
        uint256 price,
        address creator,
        uint256 createdAt,
        bool exists
    );
    function getLotPriceAndCreator(uint256 _lotId) external view returns (uint128 price, address creator, bool exists);
    function getLotStepsCount(uint256 _lotId) external view returns (uint256);
    function getStep(uint256 _lotId, uint256 _stepIndex) external view returns (
        string memory description,
        address[] memory validators,
        address validatedBy,
        uint256 validatedAt,
        uint8 status
    );
}

contract EscrowPayment {
    
    ISupplyChain public immutable supplyChain;

    // Packed struct to save gas (8 slots -> 6 slots)
    struct Payment {
        uint256 lotId;        // slot 0
        address buyer;        // slot 1 (20 bytes) + 12 bytes padding
        address seller;       // slot 2 (20 bytes) + 12 bytes padding
        uint128 amount;       // slot 3 (16 bytes)
        uint64 createdAt;     // slot 3 (8 bytes) - packed with amount
        uint64 releasedAt;    // slot 3 (8 bytes) - packed with amount
        bool released;        // slot 4 (1 byte) + 7 bytes padding
    }

    mapping(uint256 => Payment) public payments;
    uint256[] public paymentLotIds;
    mapping(address => uint256) public totalReceived;
    mapping(address => uint256) public totalSpent;
    
    event PaymentDeposited(uint256 indexed lotId, address indexed buyer, address indexed seller, uint256 amount);
    event PaymentReleased(uint256 indexed lotId, address indexed seller, uint256 amount);
    event PaymentRefunded(uint256 indexed lotId, address indexed buyer, uint256 amount);

    constructor(address _supplyChainAddress) {
        supplyChain = ISupplyChain(_supplyChainAddress);
    }

    function depositPayment(uint256 _lotId) external payable {
        require(payments[_lotId].amount == 0, "Payment already exists for this lot");

        // Use optimized function if available, otherwise fallback to getLot
        uint128 price;
        address creator;
        bool exists;
        
        // Try optimized function first (if exists in SupplyChain)
        try supplyChain.getLotPriceAndCreator(_lotId) returns (uint128 p, address c, bool e) {
            price = p;
            creator = c;
            exists = e;
        } catch {
            // Fallback to full getLot (more expensive but works)
            (,,,,, , uint256 p, address c,, bool e) = supplyChain.getLot(_lotId);
            require(p <= type(uint128).max, "Price too large");
            price = uint128(p);
            creator = c;
            exists = e;
        }
        
        require(exists, "Lot does not exist");
        require(creator != msg.sender, "Cannot buy your own lot");
        require(price > 0, "Lot has no price set");
        require(msg.value == price, "Payment must equal lot price");

        payments[_lotId] = Payment({
            lotId: _lotId,
            buyer: msg.sender,
            seller: creator,
            amount: uint128(msg.value),
            createdAt: uint64(block.timestamp),
            releasedAt: 0,
            released: false
        });

        paymentLotIds.push(_lotId);
        unchecked {
            totalSpent[msg.sender] += msg.value;
        }

        emit PaymentDeposited(_lotId, msg.sender, creator, msg.value);
    }

    function releasePayment(uint256 _lotId) external {
        Payment storage payment = payments[_lotId];
        require(payment.amount > 0, "No payment found");
        require(!payment.released, "Payment already released");
        require(_isLotCompleted(_lotId), "Lot not fully validated");

        payment.released = true;
        payment.releasedAt = uint64(block.timestamp);
        
        uint256 amount = payment.amount;
        unchecked {
            totalReceived[payment.seller] += amount;
        }

        (bool success, ) = payable(payment.seller).call{value: amount}("");
        require(success, "Transfer failed");

        emit PaymentReleased(_lotId, payment.seller, amount);
    }

    function refundPayment(uint256 _lotId) external {
        Payment storage payment = payments[_lotId];
        require(payment.amount > 0, "No payment found");
        require(!payment.released, "Payment already released");
        require(payment.buyer == msg.sender, "Only buyer can request refund");
        require(!_isLotCompleted(_lotId), "Lot already completed, cannot refund");

        uint256 amount = payment.amount;
        payment.amount = 0;
        payment.released = true;
        payment.releasedAt = uint64(block.timestamp);
        
        unchecked {
            totalSpent[msg.sender] -= amount;
        }

        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Refund failed");

        emit PaymentRefunded(_lotId, msg.sender, amount);
    }

    function _isLotCompleted(uint256 _lotId) internal view returns (bool) {
        uint256 stepsCount = supplyChain.getLotStepsCount(_lotId);
        if (stepsCount == 0) return false;

        // Unchecked loop for gas optimization (stepsCount is bounded)
        unchecked {
            for (uint256 i = 0; i < stepsCount; i++) {
                (,,,, uint8 status) = supplyChain.getStep(_lotId, i);
                if (status != 1) return false; // 1 = Completed
            }
        }
        return true;
    }

    function getPayment(uint256 _lotId) external view returns (Payment memory) {
        return payments[_lotId];
    }

    function getPaymentsCount() external view returns (uint256) {
        return paymentLotIds.length;
    }

    function getPaymentByIndex(uint256 _index) external view returns (Payment memory) {
        require(_index < paymentLotIds.length, "Index out of bounds");
        return payments[paymentLotIds[_index]];
    }

    function isLotCompleted(uint256 _lotId) external view returns (bool) {
        return _isLotCompleted(_lotId);
    }

    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function getLotPrice(uint256 _lotId) external view returns (uint256) {
        (,,,,,,uint256 price,,,) = supplyChain.getLot(_lotId);
        return price;
    }
}
