# Supply Ta Chain

## 1. Pitch

“Notre solution blockchain pour la supply chain permet de garantir la traçabilité, la transparence et la confiance entre tous les acteurs. Grâce à seulement 4 smart contracts clés, nous assurons la certification des produits, l’automatisation des paiements, la gestion des livraisons et le suivi de conformité, tout en réduisant les coûts administratifs et les risques de fraude.”

## 2. Business Model
### Proposition de valeur
*   Transparence totale sur le cycle de vie des produits.
*   Réduction des fraudes et contrefaçons.
*   Gain de temps dans les paiements et contrôles.
*   Renforcement de la confiance entre partenaires.

### Acteurs concernés
*   Fournisseurs
*   Distributeurs
*   Clients finaux
*   Auditeurs / Régulateurs

### Revenus possibles
*   Abonnement SaaS pour l’accès à la plateforme.
*   Frais de transaction sur les smart contracts.
*   Services premium de reporting et certification.

## 3. Process principaux

### 1. Enregistrement de la production
Le fournisseur crée un lot sur la blockchain en enregistrant les informations clés : origine, date de production, caractéristiques du produit et identifiant unique du lot. Ces données deviennent immuables et traçables.

### 2. Définition du workflow de validation
L’utilisateur (ex. donneur d’ordre ou distributeur) définit les étapes de validation du lot : acteurs impliqués, conditions à respecter (ex. contrôle qualité, conformité réglementaire) et règles de validation avant livraison finale.

### 3. Transfert et suivi du transport
Le transporteur désigné confirme la prise en charge du lot et enregistre à chaque étape les informations de transport (localisation, température, horodatage). Chaque mise à jour est ajoutée à l’historique du lot.

### 4. Contrôle, audit et consultation
Les régulateurs, auditeurs ou partenaires autorisés peuvent consulter l’historique complet et infalsifiable du lot afin de vérifier la conformité, la traçabilité et le respect des règles définies.

## 4. Architecture Blockchain

Nous utilisons 4 Smart Contracts interconnectés :

1.  **ContractLot** : Enregistrement des lots produits (identité, origine, caractéristiques).
2.  **ContractTransport** : Suivi du transport (étapes, localisation, conditions).
3.  **ContractDelivery** : Validation des livraisons et conformité.
4.  **ContractPayment** : Gestion des paiements automatiques à la livraison validée.

## 5. Technologies

*   Next.js (Frontend)
*   Ethers.js (Interaction Blockchain)
*   Polygon (Testnet Amoy)
*   Smart Contracts Custom (Solidity)

## Installation et Démarrage

1.  **Installer les dépendances** :
    ```bash
    npm install
    cd blockchain && npm install
    ```

2.  **Compiler les contrats** :
    ```bash
    cd blockchain
    npx hardhat compile
    ```

3.  **Lancer l'application** :
    ```bash
    npm run dev
    ```
