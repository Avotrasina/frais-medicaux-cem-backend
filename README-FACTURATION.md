# Seed de démonstration — Facturation

Ce seed prépare une base de développement pour les essais du frontend :

- trois utilisateurs : `OPERATEUR`, `ADJOINT` et `CHEF` ;
- deux règles de prise en charge applicables depuis le 1er janvier 2026 ;
- catégories, actes et plafonds importés par le script SQL fourni ;
- un agent/bénéficiaire synthétique, trois attestations et une facture T6 de
  démonstration avec trois lignes.

Les utilisateurs et règles sont réutilisés à chaque exécution. Le seed refuse
d’écraser un utilisateur ou une règle sans rapport avec les fixtures. Les IDs
sont réservés aux données de démonstration et configurés dans `.env`.

## Préparer la base

1. Copier `.env.example` vers `.env`, configurer la connexion à une base locale
   ou de développement et conserver `NODE_ENV=development`.
2. Vérifier que `private-data/actes-et-plafonds.sql` est présent. Ce fichier est
   ignoré par Git : il doit être fourni localement.
3. Installer les dépendances, puis appliquer le schéma :

```bash
npm install
npx prisma migrate deploy
npx prisma generate
```

## Exécuter le seed

Dans `.env`, `ALLOW_DEMO_SEED=true` doit être défini. Puis lancer :

```bash
npm run seed:facturation-demo
```

La commande compile le script puis l’exécute contre la base indiquée par les
variables `DB_*`. Elle est réservée au développement et refuse explicitement
`NODE_ENV=production`.

La facture T6 utilise un prestataire déjà présent dans la base, et les actes
`CON-01`, `LAB-01` et `IMG-01` du catalogue. Elle est recréée à chaque exécution
avec un nouveau numéro de référence sociale. Son IDP est
`DEMO-FACTURATION-T6-001` ; les trois lignes ont un ID d’attestation. La
première ligne a une `RefPaie` déjà renseignée, les deux autres sont vides pour
tester la saisie. Le seed affiche l’ID et la référence sociale de la facture.

## Utilisateur de test des routes

En développement, le guard utilise `FACTURATION_UTILISATEUR_TEST_ID` quand
aucun utilisateur n’est fourni par l’authentification. La valeur par défaut
`9001` correspond à l’utilisateur `DEMO FACTURATION - Opérateur`. Les IDs
`9002` et `9003` correspondent respectivement à l’adjoint et au chef ; ils
servent à tester les opérations avec ces rôles. Pour simuler un autre rôle
dans le guard de développement, remplacer temporairement
`FACTURATION_UTILISATEUR_TEST_ID` par `9002` ou `9003`, puis redémarrer l’API.

Les règles de démonstration utilisent les IDs `9004` (`ACTIF`, répartition
80/20) et `9005` (`NON_ACTIF`, charge totale CEM à 100 %), avec `dateEffet`
au 2026-01-01 et sans date de fin.

## Catalogue des actes et plafonds

Le seed exécute `private-data/actes-et-plafonds.sql` tel quel. Ce SQL est
transactionnel et peut être rejoué ; il importe les données du catalogue et
gère les versions des plafonds comme défini dans le fichier. Vérifier la base
ciblée avant chaque exécution.
