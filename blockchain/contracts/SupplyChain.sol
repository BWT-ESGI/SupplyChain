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

    struct Lot {
        uint256 id;
        string title;
        string description;
        uint256 quantity;
        string unit;
        string origin;
        uint256 price; // Price in wei
        address creator;
        uint256 createdAt;
        bool exists;
    }

    mapping(uint256 => Lot) public lots;
    mapping(uint256 => Step[]) public lotSteps;
    
    uint256 public nextLotId;

    event LotCreated(uint256 indexed lotId, string title, address indexed creator, uint256 price);
    event StepAdded(uint256 indexed lotId, uint256 stepIndex, string description);
    event StepValidated(uint256 indexed lotId, uint256 stepIndex, address validator);

    function createLot(
        string memory _title, 
        string memory _description,
        uint256 _quantity,
        string memory _unit,
        string memory _origin,
        uint256 _price,
        string[] memory _stepDescriptions, 
        address[][] memory _stepValidators
    ) public returns (uint256) {
        require(_stepDescriptions.length == _stepValidators.length, "Steps data mismatch");
        require(_quantity > 0, "Quantity must be greater than 0");

        uint256 lotId = nextLotId;
        
        lots[lotId] = Lot({
            id: lotId,
            title: _title,
            description: _description,
            quantity: _quantity,
            unit: _unit,
            origin: _origin,
            price: _price,
            creator: msg.sender,
            createdAt: block.timestamp,
            exists: true
        });

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

        emit LotCreated(lotId, _title, msg.sender, _price);
        nextLotId++;
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

        bool isAuthorized = false;
        if (step.validators.length == 0) {
             isAuthorized = true;
        } else {
            for (uint256 i = 0; i < step.validators.length; i++) {
                if (step.validators[i] == msg.sender) {
                    isAuthorized = true;
                    break;
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
