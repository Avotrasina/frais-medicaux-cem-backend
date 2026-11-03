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

### Workflow Facturation

Nouvelles routes : `POST /factures/:id/reouverture`,
`POST /factures/:id/demande-suppression`,
`POST /factures/:id/validation-suppression` et
`POST /factures/:id/refus-suppression`. `POST /factures/:id/annulation` est
supprimée. Les deux demandes utilisent le champ `motif` obligatoire.

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
sont modifiables uniquement en `ENREGISTREE` ou `A_REVALIDER`; leur suppression
est physique. `GET /factures/:id/lignes/proposition?idp=&acteId=&dateActe=`
lit les dépassements T5_x sans les recopier automatiquement.
`numPec` est l’identifiant entier d’une `Attestation`; une attestation
introuvable ou déjà affectée à une autre ligne produit un avertissement.

`PATCH /factures/:id/retenue` affecte `refPaie` et le premier jour du
`moisAffectation` à plusieurs identifiants de ligne.
`GET /factures/:id/controle-totaux` compare les sommes des lignes aux montants
de la facture. L’envoi en validation et la validation exigent des totaux
concordants, ou `confirmerEcartTotaux: true` accompagné d’une `remarque`.
