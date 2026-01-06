// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract SupplyChain {
    
    enum StepStatus { Pending, Completed }

    struct Step {
        string description;
        address[] validators;
        address validatedBy;
        uint256 validatedAt;
        StepStatus status;
    }

    // Packed struct to save gas
    struct Lot {
        uint256 id;           // slot 0
        address creator;      // slot 1 (20 bytes) + 12 bytes padding
        uint64 createdAt;     // slot 2 (8 bytes)
        uint128 quantity;     // slot 2 (16 bytes) - packed with createdAt
        bool exists;          // slot 3 (1 byte)
        string title;         // slot 4+
        string description;   // slot 5+
        string unit;          // slot 6+
        string origin;        // slot 7+
    }

    mapping(uint256 => Lot) public lots;
    mapping(uint256 => Step[]) public lotSteps;
    
    uint256 public nextLotId;

    event LotCreated(uint256 indexed lotId, string title, address indexed creator);
    event StepAdded(uint256 indexed lotId, uint256 stepIndex, string description);
    event StepValidated(uint256 indexed lotId, uint256 stepIndex, address validator);

    function createLot(
        string memory _title, 
        string memory _description,
        uint256 _quantity,
        string memory _unit,
        string memory _origin,
        string[] memory _stepDescriptions, 
        address[][] memory _stepValidators
    ) public returns (uint256) {
        require(_stepDescriptions.length == _stepValidators.length, "Steps data mismatch");
        require(_quantity > 0, "Quantity must be greater than 0");
        require(_quantity <= type(uint128).max, "Quantity too large");

        uint256 lotId = nextLotId;
        
        lots[lotId] = Lot({
            id: lotId,
            title: _title,
            description: _description,
            quantity: uint128(_quantity),
            unit: _unit,
            origin: _origin,
            creator: msg.sender,
            createdAt: uint64(block.timestamp),
            exists: true
        });

        // Unchecked for gas optimization (array length is bounded)
        unchecked {
            for (uint256 i = 0; i < _stepDescriptions.length; i++) {
                Step memory newStep = Step({
                    description: _stepDescriptions[i],
                    validators: _stepValidators[i],
                    validatedBy: address(0),
                    validatedAt: 0,
                    status: StepStatus.Pending
                });
                lotSteps[lotId].push(newStep);
                emit StepAdded(lotId, i, _stepDescriptions[i]);
            }
        }

        emit LotCreated(lotId, _title, msg.sender);
        unchecked {
            nextLotId++;
        }
        return lotId;
    }

    function validateStep(uint256 _lotId, uint256 _stepIndex) public {
        require(lots[_lotId].exists, "Lot does not exist");
        require(_stepIndex < lotSteps[_lotId].length, "Step does not exist");
        
        Step storage step = lotSteps[_lotId][_stepIndex];
        require(step.status == StepStatus.Pending, "Step already completed");
        
        if (_stepIndex > 0) {
            require(lotSteps[_lotId][_stepIndex - 1].status == StepStatus.Completed, "Previous step not completed");
        }

        // Optimize validator check
        bool isAuthorized = false;
        if (step.validators.length == 0) {
             isAuthorized = true;
        } else {
            // Unchecked for gas optimization
            unchecked {
                for (uint256 i = 0; i < step.validators.length; i++) {
                    if (step.validators[i] == msg.sender) {
                        isAuthorized = true;
                        break;
                    }
                }
            }
        }
        
        require(isAuthorized, "Not authorized to validate this step");

        step.status = StepStatus.Completed;
        step.validatedBy = msg.sender;
        step.validatedAt = block.timestamp;

        emit StepValidated(_lotId, _stepIndex, msg.sender);
    }


    function getLot(uint256 _lotId) public view returns (Lot memory) {
        return lots[_lotId];
    }

    function getLotStepsCount(uint256 _lotId) public view returns (uint256) {
        return lotSteps[_lotId].length;
    }

    function getStep(uint256 _lotId, uint256 _stepIndex) public view returns (
        string memory description,
        address[] memory validators,
        address validatedBy,
        uint256 validatedAt,
        StepStatus status
    ) {
        Step storage step = lotSteps[_lotId][_stepIndex];
        return (step.description, step.validators, step.validatedBy, step.validatedAt, step.status);
    }
}
