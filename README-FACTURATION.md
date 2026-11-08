# API Facturation et Utilisateurs

Documentation des routes exposées par `FacturationModule` et `UtilisateurModule`.
Les exemples ci-dessous utilisent `http://localhost:3000`. Les montants calculés
sont retournés en chaînes décimales à deux chiffres (`"1250.00"`). Les corps
JSON appliquent une validation stricte : les propriétés inconnues sont refusées.

## Conventions

- `:id`, `:ligneId`, `:pieceId`, `:im`, `prestataireId`, `acteId` et `factureId`
  sont des entiers positifs.
- Les dates sont au format `AAAA-MM-JJ`; les mois de paie au format `AAAA-MM`.
- `cloturee` indique si `dateCloture` est définie. Une facture clôturée est
  verrouillée pour les modifications; l'ajout d'une pièce jointe reste permis.
- `statut` appartient à `ENREGISTREE`, `EN_VALIDATION`, `RETOURNEE`, `VALIDEE`,
  `SORTIE`, `A_CORRIGER`, `SUPPRESSION_DEMANDEE`, `SUPPRIMEE`.
- Les routes de paie ne lisent que les lignes dont `moisAffectation` correspond
  au premier jour du mois et dont la facture est clôturée.

## Factures globales

### `GET /factures`

Liste les factures, par défaut sans celles au statut `SUPPRIMEE`.

Query facultative :

| Paramètre | Valeurs | Description |
|---|---|---|
| `statut` | valeur de `StatutFacture` | Filtre par statut; `SUPPRIMEE` permet de voir les supprimées |
| `cloturee` | `true`, `false` | Filtre selon la clôture |
| `rapprochement` | `CONFORME`, `ECART`, `INCOMPLET` | Filtre selon le contrôle calculé |

Réponse `200`: tableau d'objets facture. Les champs sont ceux de la facture
globale (`id`, `refSociale`, `annee`, `dateReception`, `numFacture`,
`dateFacture`, `moisPrestation`, `refAgence`, `remarque`, `montantTotal`,
`total100Cem`, `totalDepassement`, `tauxCem`, `statut`, `dateValidation`,
`moisPaie`, `dateCloture`, `prestataireId`, `enregistreParId`, `valideParId`,
`createdAt`, `updatedAt`), plus `prestataire`, `piecesJointes` et `cloturee`.
Les valeurs de type Date sont sérialisées en ISO; les décimaux sont des
chaînes à deux chiffres.

### `GET /factures/:id`

Réponse `200`: objet facture avec les mêmes champs que la liste, plus
`nombrePiecesJointes` (au lieu du tableau `piecesJointes`). `moisPaie` et
`dateCloture` sont des dates ISO ou `null`; `cloturee` est un booléen. `404`
si absente.

### `POST /factures`

Crée une facture globale; `refSociale`, statut initial et montants de départ
sont générés par le serveur.

```json
{
  "prestataireId": 12,
  "numFacture": "FAC-2026-001",
  "dateFacture": "2026-03-10",
  "dateReception": "2026-03-12",
  "moisPrestation": "2026-03-01",
  "refAgence": "AG-01"
}
```

`refAgence` est facultatif. Réponse `201`: objet facture créé (structure de
`GET /factures/:id`) et `avertissements: string[]` éventuels concernant un
numéro déjà utilisé chez ce prestataire. `404` si le prestataire est inconnu;
`422` si aucune règle de prise en charge ne s'applique.

### `PATCH /factures/:id`

Modifie une ou plusieurs informations générales; fournir au moins un champ.

```json
{
  "prestataireId": 12,
  "numFacture": "FAC-2026-001-R",
  "dateFacture": "2026-03-10",
  "dateReception": "2026-03-12",
  "moisPrestation": "2026-03-01",
  "refAgence": "AG-01",
  "remarque": "Facture corrigée",
  "motif": "Erreur de référence"
}
```

Tous les champs sont facultatifs. Réponse `200`: facture mise à jour, les
montants décimaux sérialisés et un message de succès. `409` si le statut ou la
clôture interdit la modification.

### `PATCH /factures/:id/montants`

Met à jour les montants globaux; au moins un montant doit être présent.

```json
{
  "montantTotal": 125000,
  "total100Cem": 25000,
  "totalDepassement": 10000,
  "motif": "Correction des totaux"
}
```

`motif` est facultatif. Les montants acceptent au plus deux décimales.
Réponse `200`: facture actualisée et message. `409` si clôturée/non modifiable.

### Mouvements et transitions

#### `GET /factures/:id/mouvements?type=VALIDATION`

Liste les mouvements, dans leur ordre d'enregistrement; `type` est facultatif
et doit être une valeur de `TypeMouvement` (dont `CLOTURE`). Réponse `200`:
tableau de mouvements avec auteur, destinataire éventuel, date métier et
horodatage technique.
Chaque élément a la forme `{id, factureGlobaleId, type, date, createdAt,
remarque, service, effectueParId, adresseAId, effectuePar, adresseA}`.
Réponse `404` si la facture est absente.

#### `GET /factures/:id/transitions`

Réponse `200`: tableau des transitions disponibles selon le statut et le rôle.
Chaque transition contient `{type, statutResultat, champsRequis}`. Une facture
clôturée retourne `[]`; `404` si absente.

#### `PATCH /factures/:id/statut`

Corps commun : `type` est obligatoire. Les autres propriétés dépendent de
l'action; propriétés non pertinentes refusées.

| `type` | Champs requis | Champs facultatifs |
|---|---|---|
| `ENVOI_VALIDATION` | `destinataireId` (utilisateur ADJOINT ou CHEF) | `remarque`, `date` |
| `RETOUR_POUR_CORRECTION` | `remarque` | `date` |
| `RETOUR_PRESTATAIRE` | `remarque` | `date` |
| `VALIDATION` | aucun | `remarque` |
| `SORTIE` | `service`: `AUTHENTIFICATION` ou `CONTROLE` | `date` |
| `DEMANDE_SUPPRESSION` | `remarque` (motif) | — |
| `REFUS_SUPPRESSION` | aucun | `remarque` |
| `SUPPRESSION` | aucun | `remarque` |

Exemple :

```json
{
  "type": "ENVOI_VALIDATION",
  "destinataireId": 9002,
  "remarque": "Pour validation",
  "date": "2026-03-20"
}
```

Réponse `200`: objet facture (structure de `GET /factures/:id`) avec la
propriété `mouvement` (structure du mouvement ci-dessus) ajoutée. `400` pour une
action/corps invalide; `409` pour une transition ou une clôture incompatible;
`422` pour les montants non rapprochés ou l'utilisation d'un type de mouvement
qui n'est pas une action.

## Lignes de facture individuelle (T6)

Les routes ci-dessous sont sous `/factures/:id`.

### `POST /factures/:id/lignes`

```json
{
  "libelle": "Consultation généraliste",
  "dateActe": "2026-03-10",
  "idp": "IDP-AGENT-001",
  "acteId": 1,
  "numPec": 42,
  "montantActe": 25000,
  "montantDepassementActe": 0,
  "montantDepassementPlafond": 0,
  "montantCemIntegral": 0,
  "observationDepassement": "Sans dépassement"
}
```

Requis : `libelle`, `dateActe`, `idp`, `acteId`, `montantActe`. Les montants
de dépassement et `montantCemIntegral` sont facultatifs et valent zéro par
défaut; `numPec` et `observationDepassement` sont facultatifs. Réponse `201`:
`LigneFactureCalculee`: `{id, numLigne, libelle, dateActe, idp,
acte:{id,code,nom}, montantActe, montantDepassementActe,
montantDepassementPlafond, observationDepassement, tauxCem,
montantCemIntegral, montantCem, montantAgent, montantDepassement,
totalChargeAgent, numPec, refPaie, moisAffectation, avertissements}`.
Les montants sont des chaînes à deux décimales; `moisAffectation` et
`refPaie` sont initialement `null`.

### `PUT /factures/:id/lignes/:ligneId`

Tous les champs du DTO de création, sauf qu'ils sont facultatifs; fournir au
moins une propriété à modifier. Réponse `200`: même `LigneFactureCalculee` que
la création. `409` si la
facture est clôturée ou son statut interdit l'édition.

### `DELETE /factures/:id/lignes/:ligneId`

Supprime la ligne. Réponse `200`: corps vide (`void`). `404` si la ligne n'appartient pas à cette
facture; `409` si verrouillée.

### `GET /factures/:id/lignes`

Réponse `200` :

```json
{
  "lignes": [
    {
      "id": 101,
      "numLigne": 1,
      "libelle": "Consultation généraliste",
      "dateActe": "2026-03-10",
      "montantActe": "25000.00",
      "montantCem": "20000.00",
      "montantAgent": "5000.00",
      "montantDepassement": "0.00",
      "totalChargeAgent": "5000.00",
      "moisAffectation": null,
      "refPaie": null
    }
  ],
  "totaux": {
    "montantActe": "25000.00",
    "montantCemIntegral": "0.00",
    "montantCem": "20000.00",
    "montantAgent": "5000.00",
    "montantDepassement": "0.00",
    "totalChargeAgent": "5000.00"
  }
}
```

### `GET /factures/:id/lignes/proposition?idp=...&acteId=1&dateActe=2026-03-10`

Recherche le dépassement de suivi correspondant. Réponse `200` :
`{"montantDepassementActe":"0.00","montantDepassementPlafond":"0.00"}` ou
`null` lorsqu'aucune proposition ne correspond. `400` si les paramètres sont
absents ou invalides.

### `PATCH /factures/:id/retenue`

Saisit une référence de paie libre sur plusieurs lignes cochées; ne modifie
jamais le mois d'affectation.

```json
{
  "ligneIds": [101, 102],
  "refPaie": "PAIE-MARS-2026-01"
}
```

Réponse `200`: objet `{ligneIds: number[], refPaie: string}` :
`{"ligneIds":[101,102],"refPaie":"PAIE-MARS-2026-01"}`.
`409` si facture clôturée; `404` si une ligne n'est pas dans la facture.

### `GET /factures/:id/controle-totaux`

Réponse `200` :

```json
{
  "nombreLignes": 1,
  "concordant": true,
  "sommes": {
    "montantActe": "25000.00",
    "montantCemIntegral": "0.00",
    "depassement": "0.00"
  },
  "facture": {
    "montantTotal": "25000.00",
    "total100Cem": "0.00",
    "totalDepassement": "0.00"
  },
  "ecarts": {
    "montantActe": "0.00",
    "montantCemIntegral": "0.00",
    "depassement": "0.00"
  }
}
```

## Clôture et états de paie

### `POST /paies/:mois/cloture`

`mois` doit être `AAAA-MM`. Toutes les factures doivent exister, ne pas être
supprimées ni clôturées, et avoir un rapprochement `CONFORME`.

```json
{
  "dateCloture": "2026-03-31",
  "factureIds": [41, 42]
}
```

Réponse `200` :

```json
{
  "moisPaie": "2026-03",
  "dateCloture": "2026-03-31",
  "factures": [
    {
      "id": 41,
      "refSociale": "2026-000041",
      "nombreLignes": 3,
      "totalAgent": "25000.00"
    }
  ]
}
```

La réponse `409` contient un tableau `[{factureId, refSociale, raison}]`;
pour un `ECART`, l'élément fournit aussi `detail` (champ, montant facture,
total lignes, écart). La transaction est annulée si une facture échoue ou en
cas de conflit concurrent.

### `GET /paies`

Réponse `200`: tableau de mois clôturés, du plus récent au plus ancien :
`[{ "moisPaie":"2026-03", "nombreFactures":2, "nombreLignes":4, "totalAgent":"25000.00" }]`.

### `GET /paies/:mois/lignes`

Filtres facultatifs : `page` (défaut 1), `limite` (défaut 50, maximum 200),
`im`, `prestataireId`, `factureId`, `direction`.
Réponse `200` :

```json
{
  "total": 1,
  "page": 1,
  "limite": 50,
  "lignes": [
    {
      "moisAffectation": "2026-03-01",
      "refPaie": "PAIE-MARS-2026-01",
      "dateSaisie": "2026-03-12",
      "refSociale": "2026-000041",
      "numFacture": "FAC-2026-001",
      "dateFacture": "2026-03-10",
      "nomEtablissement": "Clinique Exemple",
      "idp": "IDP-AGENT-001",
      "nomPrenomBeneficiaire": "Jean Exemple",
      "codeFam": "AGT",
      "obsIdp": null,
      "im": 101,
      "nomPrenomAgent": "Jean Exemple",
      "direction": "DRH",
      "serviceAgence": "Administration",
      "codeActe": "CON-01",
      "acte": "Consultation généraliste",
      "categorie": "Consultations",
      "dateActe": "2026-03-10",
      "numPec": "0042",
      "montantActe": "25000.00",
      "cem100": "0.00",
      "depassement": "0.00",
      "obsDepassement": null,
      "cem80": "20000.00",
      "agent20": "5000.00",
      "totalAgent": "5000.00"
    }
  ]
}
```

`codeFam` vaut `AGT`, `CJT`, `EFT` ou `null`; `numPec` est une chaîne sur
quatre chiffres ou `null`.

### `GET /paies/:mois/consommation`

Réponse `200`: `{ "agents":[{ "im":101, "prestataires":[{ "nomEtablissement":"Clinique Exemple", "nombreLignes":1, "lignes":[...], "sousTotal":{...} }], "sousTotalAgent":{...} }], "totalGeneral":{...} }`.
Chaque objet de totaux contient `montantActe`, `cem100`, `depassement`,
`cem80`, `agent20`, `totalAgent`, tous à deux décimales.

### `GET /paies/:mois/etat`

Réponse `200`: `{ "agents":[{ "im":101, "nomPrenom":"Jean Exemple", "direction":"DRH", "serviceAgence":"Administration", "montantActe":"25000.00", "cem100":"0.00", "depassement":"0.00", "cem80":"20000.00", "agent20":"5000.00", "totalAgent":"5000.00" }], "total":{...} }`.

### `GET /paies/:mois/agents/:im`

Réponse `200`: `{ "im":101, "nomPrenom":"Jean Exemple", "groupes":[{ "nomEtablissement":"Clinique Exemple", "nombreLignes":1, "lignes":[...], "totalEtablissement":{...} }], "totalGeneral":{...} }`.
Un agent existant sans ligne a des `groupes: []` et des totaux à `"0.00"`;
agent inconnu : `404`.

## Suivi des plafonds (T5_x)

### `POST /factures/:id/suivis`

Ajoute une ligne de suivi à une facture :

```json
{
  "idp": "IDP-AGENT-001",
  "acteId": 1,
  "dateActe": "2026-03-10",
  "montantActe": 25000,
  "libelle": "Consultation"
}
```

`libelle` est facultatif. Réponse `201`: feuille de suivi décrite ci-dessous.

### `GET /suivis/cibles?date=2026-03-10`

`date` est facultative (par défaut aujourd'hui). Réponse `200`: tableau
d'objets `{type, id, nom, code?, categorieActeId?, categorieActe?, plafonds,
modeleSuivi}`. `type` vaut `ACTE` ou `CATEGORIE`; `plafonds` contient `parAn`
et `parActe`.

### `GET /suivis?idp=IDP-AGENT-001&acteId=1&annee=2026&factureId=41&historique=false`

Requis : `idp`, `acteId`; `annee` par défaut l'année courante; `factureId` et
`historique` facultatifs. Réponse `200`: `{entete, modele, colonnes, cible,
annee, plafonds, lignes, totaux}`. Les montants sont des chaînes à deux
décimales; les champs non applicables peuvent être `null`.

### `PATCH /suivis/lignes/:ligneId`

Au moins un champ :

```json
{
  "acteId": 1,
  "dateActe": "2026-03-11",
  "montantActe": 28000,
  "libelle": "Consultation corrigée"
}
```

Réponse `200`: nouvelle feuille de suivi ou `{ancienne, nouvelle}` si la
modification change l'année/la cible.

### `DELETE /suivis/lignes/:ligneId`

Réponse `200`: feuille de suivi recalculée. `409` si facture clôturée ou ligne
verrouillée par le T6.

## Pièces jointes

### `POST /factures/:id/pieces-jointes`

Corps `multipart/form-data`, champ fichier `fichier`: PDF, JPEG ou PNG, 10 Mo
maximum; au plus 20 pièces jointes par facture. Réponse `201` :

```json
{
  "id": 17,
  "nomFichier": "facture.pdf",
  "typeFichier": "application/pdf",
  "tailleOctets": 12500,
  "createdAt": "2026-03-12T08:30:00.000Z",
  "ajoutePar": { "id": 9001, "nom": "DEMO FACTURATION - Opérateur" }
}
```

### `GET /factures/:id/pieces-jointes`

Réponse `200`: tableau des mêmes métadonnées.

### `GET /factures/:id/pieces-jointes/:pieceId`

Réponse `200`: flux binaire du document (`Content-Type` selon le fichier).
`404` si la pièce n'appartient pas à cette facture ou fichier absent.

### `DELETE /factures/:id/pieces-jointes/:pieceId`

Réponse `204`, sans corps. `409` si la facture est clôturée ou si son statut
ne permet pas la suppression.

## Utilisateurs

Les routes `/utilisateurs` appartiennent au module transversal
`UtilisateurModule`; les rôles disponibles sont `OPERATEUR`, `ADJOINT`, `CHEF`.

### `GET /utilisateurs?role=ADJOINT,CHEF`

Filtre optionnel par un ou plusieurs rôles séparés par des virgules. Réponse
`200`: tableau `[{ "id":9002, "nom":"DEMO FACTURATION - Adjoint", "role":"ADJOINT" }]`.

### `GET /utilisateurs/:id`

Réponse `200`: `{"id":9001,"nom":"DEMO FACTURATION - Opérateur","role":"OPERATEUR"}`.
`404` si absent.

### `POST /utilisateurs`

```json
{ "nom": "Marie Exemple", "role": "ADJOINT" }
```

Réponse `201`: `{"message":"L'utilisateur a été créé avec succès.","utilisateur":{"id":12,"nom":"Marie Exemple","role":"ADJOINT"}}`.

### `PATCH /utilisateurs/:id`

Au moins l'un des champs :

```json
{ "nom": "Marie Exemple", "role": "CHEF" }
```

Réponse `200`: même enveloppe `message` et `utilisateur` que la création.
`404` si absent; `400` si aucun champ n'est fourni.

### `DELETE /utilisateurs/:id`

Réponse `200`: `{"message":"L'utilisateur a été supprimé avec succès."}`.
`404` si absent; `409` si l'utilisateur est référencé par des factures ou
mouvements.

## Seed de démonstration

Le seed prépare trois utilisateurs (`OPERATEUR`, `ADJOINT`, `CHEF`), deux
règles de prise en charge, les actes/plafonds fournis et une facture T6 avec
trois lignes. Voir [`.env.example`](./.env.example) pour les variables de
développement. Pour préparer la base :

```bash
npm install
npx prisma migrate deploy
npx prisma generate
```

Puis définir `ALLOW_DEMO_SEED=true` dans `.env` et lancer
`npm run seed:facturation-demo`. Le seed refuse `NODE_ENV=production`.

En développement, `FACTURATION_UTILISATEUR_TEST_ID` sélectionne le compte
utilisé lorsque l'authentification ne fournit pas d'utilisateur; les IDs
`9001`, `9002` et `9003` correspondent à l'opérateur, l'adjoint et le chef de
démo.
