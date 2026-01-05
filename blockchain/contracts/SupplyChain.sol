// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract SupplyChain {
    
    enum StepStatus { Pending, Completed }

    struct Step {
        string description;
        address[] validators; // Liste des adresses pouvant valider cette étape
        address validatedBy;  // Qui a validé
        uint256 validatedAt;  // Quand
        StepStatus status;
    }

    struct Lot {
        uint256 id;
        string title;
        string description;
        address creator;
        uint256 createdAt;
        bool exists;
    }

    // Lot ID => Lot Data
    mapping(uint256 => Lot) public lots;
    // Lot ID => List of Steps
    mapping(uint256 => Step[]) public lotSteps;
    
    uint256 public nextLotId;

    event LotCreated(uint256 indexed lotId, string title, address indexed creator);
    event StepAdded(uint256 indexed lotId, uint256 stepIndex, string description);
    event StepValidated(uint256 indexed lotId, uint256 stepIndex, address validator);

    // Créer un lot avec ses étapes initiales
    function createLot(
        string memory _title, 
        string memory _description, 
        string[] memory _stepDescriptions, 
        address[][] memory _stepValidators
    ) public returns (uint256) {
        require(_stepDescriptions.length == _stepValidators.length, "Steps data mismatch");

        uint256 lotId = nextLotId;
        
        lots[lotId] = Lot({
            id: lotId,
            title: _title,
            description: _description,
            creator: msg.sender,
            createdAt: block.timestamp,
            exists: true
        });

        // Ajouter les étapes dynamiquement
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

        emit LotCreated(lotId, _title, msg.sender);
        nextLotId++;
        return lotId;
    }

    // Valider une étape spécifique
    function validateStep(uint256 _lotId, uint256 _stepIndex) public {
        require(lots[_lotId].exists, "Lot does not exist");
        require(_stepIndex < lotSteps[_lotId].length, "Step does not exist");
        
        Step storage step = lotSteps[_lotId][_stepIndex];
        require(step.status == StepStatus.Pending, "Step already completed");
        
        // Ensure previous step is completed
        if (_stepIndex > 0) {
            require(lotSteps[_lotId][_stepIndex - 1].status == StepStatus.Completed, "Previous step not completed");
        }

        // Vérifier si msg.sender est dans la liste des validateurs autorisés
        bool isAuthorized = false;
        if (step.validators.length == 0) {
            // Si aucun validateur défini, tout le monde peut valider (ou juste le créateur, au choix. Ici: open)
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

        // Update state
        step.status = StepStatus.Completed;
        step.validatedBy = msg.sender;
        step.validatedAt = block.timestamp;

        emit StepValidated(_lotId, _stepIndex, msg.sender);
    }

    // Getters
    function getLot(uint256 _lotId) public view returns (Lot memory) {
        return lots[_lotId];
    }

    function getLotStepsCount(uint256 _lotId) public view returns (uint256) {
        return lotSteps[_lotId].length;
    }

    // Renvoie les infos d'une étape + la liste des validateurs
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

