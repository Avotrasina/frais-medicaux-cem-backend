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
| Providers                 | `/providers`                 |
| Provider categories       | `/provider-categories`       |
| Locations                 | `/locations`                 |
| Organizational structures | `/organizational-structures` |

The old prefixes and action paths are no longer served. API clients must
migrate to these prefixes and the standardized paths listed above.
