# CEM Medical Expenses - Backend

## Description

```text
A billing tracking system for employees of the Caisse d'Epargne de Madagascar.
The system manages employees, providers, beneficiaries, medical coverage, and invoices on behalf of CEM.
```

### Stack

The backend is built with:

- Nest.JS
- Prisma
- PostgreSQL

### Structure du projet

├── package-lock.json
├── package.json
├── prisma
├── prisma7.config.ts
├── src
│ └──
├── tsconfig.build.json
├── tsconfig.build.tsbuildinfo
├── tsconfig.json
├── vitest.config.e2e.ts
└── vitest.config.ts

### Source Code and API Conventions

- Business logic is grouped by feature under `src/modules/<module>`.
- Repositories are located in `repositories/`, use cases in `use-cases/`,
  DTOs in `dtos/`, and module types in `types/`.
- Directory names use kebab-case. Controllers expose plural collections and
  kebab-case paths.
- Handlers use the verbs `create`, `find`, `search`, `update`,
  `requestDeletion`, `validateDeletion`, and `rejectDeletion` as appropriate.
- Function and method names use camelCase, with consistent resource lookup
  names such as `findAll`, `findById`, and `findDeletionRequests`.
- Shared module contracts (for example `Create...`, `Update...`, and `Read...`)
  live in the module's `types/` directory. Prisma query payloads and
  repository-only input shapes stay local to the repository that uses them.
- Deletion requests can be listed at `GET /<collection>/deletion-requests`.
  A request uses `DELETE /<collection>/:id`; validation and rejection use
  `POST /<collection>/:id/deletion-validation` and
  `POST /<collection>/:id/deletion-rejection`.

Routes were renamed without compatibility aliases. The main prefixes are:

| Resource                  | Prefix                       |
| ------------------------- | ---------------------------- |
| Agents                    | `/agents`                    |
| Agent categories          | `/agent-categories`          |
| Agent families            | `/agent-families`            |
| Attestations              | `/attestations`              |
| Beneficiaries             | `/beneficiaries`             |
| Acts                      | `/actes`                     |
| Act categories            | `/categories-actes`          |
| Ceilings                  | `/plafonds`                  |
| Providers                 | `/providers`                 |
| Provider categories       | `/provider-categories`       |
| Locations                 | `/locations`                 |
| Organizational structures | `/organizational-structures` |
| Users                     | `/utilisateurs`              |

The old prefixes and action paths are no longer served. API clients must
migrate to these prefixes and the standardized paths listed above.

### Seed initial medical acts

After configuring the database connection in `.env`, apply migrations and seed
the initial categories, acts, and act-level ceilings from the supplied list:

```sh
npx prisma migrate deploy
npx prisma generate
npm run build
npx prisma db seed
```

The seed is safe to rerun: categories, acts, and ceilings are upserted by their
IDs, codes, and owner/scope respectively. Category IDs are taken from the
numbered sections in the source list (for example, `01` is ID `1`, and the
category name is `CONSULTATIONS MÉDICALES`). The workbook contains no
category-wide ceilings, so the seeder does not create any.

Actes, catégories d'actes et plafonds sont gérés respectivement par
`/actes`, `/categories-actes` et `/plafonds`, avec les opérations CRUD.
Un plafond doit être rattaché à un seul acte ou à une seule catégorie. Son
unité `MONTANT` exige `montant` et exclut `nbSeances`; son unité `SEANCES`
exige `nbSeances` et exclut `montant`.
La création d'un acte peut aussi inclure ses plafonds dans `POST /actes`;
`POST /categories-actes` accepte de la même façon les plafonds partagés de la
catégorie. Les routes CRUD historiques, notamment `/plafonds`, restent
disponibles.

### Organisation du module Facturation

`src/modules/facturation/facturation.module.ts` compose les modules
fonctionnels `FacturesModule`, `SuiviModule` et `PiecesJointesModule`; chacun
déclare les contrôleurs de sa fonctionnalité.
`FacturationCoreModule` regroupe les services métier
partagés et leurs dépendances Nest (`PrismaModule`, `PlafondModule`,
`ReglesPriseEnChargeModule` et `StorageModule`). Les noms de fichiers suivent
le kebab-case et les classes de modules le suffixe `Module`.
La gestion transversale des comptes et la route `/utilisateurs` appartiennent
au `UtilisateurModule`, indépendant de Facturation et importé par
`AppModule`.

### Workflow Facturation

Les actions de workflow passent par `PATCH /factures/:id/statut`, avec un
`type` et les champs propres à l’action. `GET /factures/:id/transitions` expose
les actions disponibles et leurs champs requis. `GET /factures/:id/mouvements`
renvoie l’historique (filtrable par `type`) dans l’ordre de création; la date
du mouvement est métier et `createdAt` est son horodatage technique.
Les dix routes d’action `POST` et `GET /factures/:id/historique` restent
disponibles mais sont dépréciées. `GET /utilisateurs?role=ADJOINT,CHEF` fournit
les valideurs disponibles. Les dates d’action sont limitées à la date
d’enregistrement de la facture et à aujourd’hui.

Les listes excluent `SUPPRIMEE` par défaut; `?statut=SUPPRIMEE` permet de
l’inclure. Les rôles sont désactivés par défaut; `PERMISSIONS_ROLES_ACTIVES=true`
active la table de permissions à confirmer.

### Suivi T5_x

Le suivi des consommations est indépendant de `FactureGlobale` :
`POST /factures/:id/suivis`, `GET /suivis`,
`PATCH /suivis/lignes/:ligneId` et `DELETE /suivis/lignes/:ligneId` gèrent les
saisies et recalculent la feuille à l’affichage. Les lignes d’une facture
`SUPPRIMEE` sont exclues des feuilles; une ligne déjà présente dans le T6 est
verrouillée. Les montants calculés sont renvoyés comme chaînes à deux
décimales. `GET /suivis` renvoie un `modele` (`PLAFOND_ANNUEL`, `SEANCES` ou
`PLAFOND_ACTE_ET_ANNUEL`) et les `colonnes` correspondantes. L’entête regroupe
les informations du bénéficiaire, de son agent, de sa direction et de son
service/agence. Chaque ligne expose toutes les clés de calcul, les clés
inapplicables étant `null`; les plafonds comprennent leur date d’effet et
l’indicateur de changement annuel. Les totaux utilisent `montantActe` et
`totalDepassement`.

### Lignes de facture et retenue sur salaire (T6)

Les lignes d’une facture globale sont adressées par son identifiant :
`POST /factures/:id/lignes`, `PUT /factures/:id/lignes/:ligneId`,
`DELETE /factures/:id/lignes/:ligneId` et `GET /factures/:id/lignes`.
Les montants calculés sont renvoyés comme chaînes à deux décimales. Les lignes
sont modifiables uniquement en `ENREGISTREE` ou `A_CORRIGER`; leur suppression
est physique. `GET /factures/:id/lignes/proposition?idp=&acteId=&dateActe=`
lit les dépassements T5_x sans les recopier automatiquement.
`numPec` est l’identifiant entier d’une `Attestation`; une attestation
introuvable ou déjà affectée à une autre ligne produit un avertissement.

`PATCH /factures/:id/retenue` ne saisit que la référence libre `refPaie` sur
les lignes sélectionnées. `moisAffectation` reste vide à la création et est
renseigné uniquement lors de la clôture mensuelle. Une facture clôturée refuse
les modifications; l'ajout d'une pièce jointe reste permis.
`GET /factures/:id/controle-totaux` compare les sommes des lignes aux montants
de la facture. L’envoi en validation et la validation exigent des totaux
concordants. Tout écart ou toute facture sans ligne bloque l’envoi en validation
et la validation.

### Clôture mensuelle et états de paie

`POST /paies/:mois/cloture` clôture atomiquement une liste non vide de factures
conformes pour un mois au format `AAAA-MM`. La date métier est fournie dans
`dateCloture` (`AAAA-MM-JJ`); la clôture affecte le mois aux factures et à leurs
lignes T6 et ajoute un mouvement `CLOTURE`. Une facture déjà clôturée ne peut
pas être réouverte par l'API.

Les routes `GET /paies`, `GET /paies/:mois/lignes`,
`GET /paies/:mois/consommation`, `GET /paies/:mois/etat` et
`GET /paies/:mois/agents/:im` sont en lecture seule. Elles utilisent les lignes
T6 affectées au premier jour du mois demandé, donc excluent les factures non
clôturées. Les montants sont renvoyés sous forme de chaînes décimales à deux
chiffres; les lignes sont paginées par défaut à 50, avec une limite maximale
de 200.

### Pièces jointes des factures

`POST /factures/:id/pieces-jointes` accepte un fichier multipart nommé
`fichier` (PDF, JPEG ou PNG, 10 Mo maximum). Le contenu est validé par sa
signature, indépendamment de son nom et du MIME déclaré. Une facture peut
contenir au plus 20 pièces jointes; l’ajout est permis dans tout statut sauf
`SUPPRIMEE`. Les fichiers sont stockés sous un nom UUID dans la catégorie
`factures` et leur nom d’origine est conservé après nettoyage.

`GET /factures/:id/pieces-jointes` liste les pièces; la route avec `:pieceId`
sert le fichier en ligne uniquement s’il appartient à la facture demandée.
`DELETE /factures/:id/pieces-jointes/:pieceId` est permis en `ENREGISTREE`,
`A_CORRIGER` ou `RETOURNEE`. Le détail `GET /factures/:id` expose aussi
`nombrePiecesJointes`.
