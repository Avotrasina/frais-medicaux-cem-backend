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

## Repérage rapide des routes par entité

Cette table indique l’entité principale concernée par chaque groupe de routes.
Certaines routes sont transversales et apparaissent donc sous plusieurs entités.

| Entité(s) concernée(s)              | Routes                                                                                                                                                                                                                                           |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Facture globale                     | `GET /factures`, `POST /factures`, `GET /factures/:id`, `PATCH /factures/:id`, `PATCH /factures/:id/statut`, `GET /factures/:id/mouvements`, `GET /factures/:id/transitions`                                                                     |
| Lignes de facture individuelle (T6) | `POST /factures/:id/lignes`, `GET /factures/:id/lignes`, `PUT /factures/:id/lignes/:ligneId`, `DELETE /factures/:id/lignes/:ligneId`, `GET /factures/:id/lignes/proposition`, `PATCH /factures/:id/retenue`, `GET /factures/:id/controle-totaux` |
| Actes et catégories d’acte          | `GET /suivis/cibles` retourne les actes et catégories nécessitant un suivi à la date demandée. `GET /suivis` consulte le suivi pour un acte et un bénéficiaire. Gestion des actes : `/actes`; gestion des catégories : `/categories-actes`.      |
| Suivi des plafonds (T5_x)           | `POST /factures/:id/suivis`, `GET /suivis/cibles`, `GET /suivis`, `PATCH /suivis/lignes/:ligneId`, `DELETE /suivis/lignes/:ligneId`                                                                                                              |
| Pièces jointes de facture           | `POST`, `GET` sur `/factures/:id/pieces-jointes`, `GET /factures/:id/pieces-jointes/:pieceId`, `DELETE /factures/:id/pieces-jointes/:pieceId`                                                                                                    |
| Paie (factures et lignes clôturées) | `POST /paies/:mois/cloture`, `GET /paies`, `GET /paies/:mois/lignes`, `GET /paies/:mois/consommation`, `GET /paies/:mois/etat`, `GET /paies/:mois/agents/:im`                                                                                    |
| Utilisateur                         | `GET /utilisateurs`, `GET /utilisateurs/:id`, `POST /utilisateurs`, `PATCH /utilisateurs/:id`, `DELETE /utilisateurs/:id`                                                                                                                        |

> **Cibles de suivi :** la route actuellement exposée est `GET /suivis/cibles`,
> et non `GET /factures/cibles`. Elle concerne à la fois l’entité **Acte** et
> l’entité **Catégorie d’acte**; le champ `type` de chaque résultat indique
> laquelle (`ACTE` ou `CATEGORIE`).

### Routes de gestion des actes et catégories d’acte

Ces routes ne créent pas un suivi : elles gèrent les référentiels utilisés par
les lignes de facture et les suivis de plafonds.

| Entité           | Routes                                                                                                                                        |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Acte             | `GET /actes`, `GET /actes/:id`, `POST /actes`, `PATCH /actes/:id`, `DELETE /actes/:id`                                                        |
| Catégorie d’acte | `GET /categories-actes`, `GET /categories-actes/:id`, `POST /categories-actes`, `PATCH /categories-actes/:id`, `DELETE /categories-actes/:id` |

Les modifications de plafonds passent par la route de leur cible. Envoyez à
`PATCH /actes/:id` un payload de plafond avec `acteID` égal à `:id`, ou à
`PATCH /categories-actes/:id` avec `categorieActeID` égal à `:id` :

```json
{
  "porteePlafond": "PAR_ACTE",
  "unite": "MONTANT",
  "montant": 125000,
  "acteID": 12
}
```

Les identifiants de cible peuvent être omis; la route détermine alors la cible.
`porteePlafond` peut être omise si une seule portée est ouverte pour la cible;
elle est requise si plusieurs plafonds sont ouverts. Une cible incohérente est
refusée (`400`), l’absence de plafond ouvert donne `404`, et un plafond déjà
utilisé par des lignes de suivi reste non modifiable (`409`). Si des champs
d’acte/catégorie et de plafond sont envoyés ensemble, leur mise à jour est
transactionnelle.

## Factures globales

### `GET /factures`

Liste les factures, par défaut sans celles au statut `SUPPRIMEE`.

Query facultative :

| Paramètre       | Valeurs                          | Description                                                  |
| --------------- | -------------------------------- | ------------------------------------------------------------ |
| `statut`        | valeur de `StatutFacture`        | Filtre par statut; `SUPPRIMEE` permet de voir les supprimées |
| `cloturee`      | `true`, `false`                  | Filtre selon la clôture                                      |
| `rapprochement` | `CONFORME`, `ECART`, `INCOMPLET` | Filtre selon le contrôle calculé                             |

Réponse `200`: tableau d'objets facture. Les champs sont ceux de la facture
globale (`id`, `refSociale`, `annee`, `dateReception`, `numFacture`,
`dateFacture`, `moisPrestation`, `refAgence`, `remarque`, `montantTotal`,
`total100Cem`, `totalDepassement`, `tauxCem`, `montant80Cem`,
`montant20Agent`, `totalChargeAgent`, `statut`, `dateValidation`, `moisPaie`,
`dateCloture`, `prestataireId`, `enregistreParId`, `valideParId`, `createdAt`,
`updatedAt`), plus `prestataire`, `piecesJointes`, `cloturee` et `mouvements`.
`mouvements` contient l'historique complet, trié par identifiant décroissant
(du plus récent au plus ancien); chaque élément contient son type, sa date
métier, son horodatage technique, sa remarque, son service, son auteur et son
destinataire éventuel. Les montants calculés sont `null` tant que `montantTotal`
n'est pas renseigné. Les valeurs de type Date sont sérialisées en ISO; les
décimaux sont des chaînes à deux chiffres.

### `GET /factures/:id`

Réponse `200`: objet facture avec les champs de la liste, plus
`nombrePiecesJointes` (au lieu du tableau `piecesJointes`). Il contient aussi
`mouvements`, l'historique complet trié par identifiant décroissant. L'endpoint
`GET /factures/:id/mouvements` reste disponible avec son filtre par type.
`moisPaie` et `dateCloture` sont des dates ISO ou `null`; `cloturee` est un
booléen. `404` si absente.

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

`moisPrestation` et `refAgence` sont facultatifs et peuvent être ajoutés
ultérieurement avec `PATCH /factures/:id`. Réponse `201`: objet facture créé (structure de
`GET /factures/:id`) et `avertissements: string[]` éventuels concernant un
numéro déjà utilisé chez ce prestataire. `404` si le prestataire est inconnu;
`422` si aucune règle de prise en charge ne s'applique.

### `PATCH /factures/:id`

Modifie une ou plusieurs informations générales et/ou des montants; fournir au
moins un champ à modifier. Les montants acceptent au plus deux décimales.

```json
{
  "prestataireId": 12,
  "numFacture": "FAC-2026-001-R",
  "dateFacture": "2026-03-10",
  "dateReception": "2026-03-12",
  "moisPrestation": "2026-03-01",
  "refAgence": "AG-01",
  "montantTotal": 125000,
  "total100Cem": 25000,
  "totalDepassement": 10000,
  "montant80Cem": 72000,
  "montant20Agent": 18000,
  "totalChargeAgent": 28000,
  "remarque": "Facture corrigée",
  "motif": "Erreur de référence"
}
```

Les trois montants calculés sont facultatifs individuellement seulement si
aucun n'est envoyé; dès qu'un est fourni, les trois doivent être présents et
correspondre au calcul serveur, sinon la route répond `400`. Le serveur
recalcule et enregistre toujours ces montants quand le montant total est saisi.
Tous les autres champs sont facultatifs. Réponse `200`: facture mise à jour,
les montants décimaux sérialisés et un message de succès. `409` si le statut ou
la clôture interdit la modification.

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

| `type`                   | Champs requis                                  | Champs facultatifs |
| ------------------------ | ---------------------------------------------- | ------------------ |
| `ENVOI_VALIDATION`       | `destinataireId` (utilisateur ADJOINT ou CHEF) | `remarque`, `date` |
| `RETOUR_POUR_CORRECTION` | `remarque`                                     | `date`             |
| `RETOUR_PRESTATAIRE`     | `remarque`                                     | `date`             |
| `VALIDATION`             | aucun                                          | `remarque`         |
| `SORTIE`                 | `service`: `AUTHENTIFICATION` ou `CONTROLE`    | `date`             |
| `DEMANDE_SUPPRESSION`    | `remarque` (motif)                             | —                  |
| `REFUS_SUPPRESSION`      | aucun                                          | `remarque`         |
| `SUPPRESSION`            | aucun                                          | `remarque`         |

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

**Entité principale : ligne de facture individuelle**, rattachée à une facture
globale. Les routes ci-dessous sont sous `/factures/:id`.

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

**Entités concernées : paie, facture globale et lignes de facture individuelle.**
La clôture affecte un mois de paie aux factures et lignes; les routes de
consultation lisent ensuite ces données clôturées.

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

**Entités concernées : acte, catégorie d’acte, bénéficiaire et lignes de suivi.**
La route de cibles est commune aux actes et aux catégories; `type` dans la
réponse indique l’entité visée.

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

`libelle` est facultatif. Réponse `201`: `{modele, annee, lignes, totaux}`.
Les métadonnées de feuille (`entete`, `colonnes`, `cible`, `plafonds`) ne sont
incluses ni dans cette réponse ni dans celle de `GET /suivis`.

### `GET /suivis/cibles?date=2026-03-10`

`date` est facultative (par défaut aujourd'hui). Réponse `200`: tableau
d'objets `{type, id, nom, code?, categorieActeId?, categorieActe?, plafonds,
modeleSuivi}`. `type` vaut `ACTE` ou `CATEGORIE`; `plafonds` contient `parAn`
et `parActe`.

### `GET /suivis?idp=IDP-AGENT-001&acteId=1&annee=2026&factureId=41&historique=false`

Requis : `idp`, `acteId`; `annee` par défaut l'année courante; `factureId` et
`historique` facultatifs. Réponse `200`: `{modele, annee, lignes, totaux}`.
`entete`, `colonnes`, `cible` et `plafonds` ne sont pas incluses. Les montants
sont des chaînes à deux décimales; les champs non applicables peuvent être
`null`.

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
`200`: tableau d’utilisateurs avec `id`, `nom`, `role`, `username`, `email` et
`profil`. Pour les comptes existants non encore renseignés, `username`, `email`
et `profil` peuvent être `null`. Le mot de passe n’est jamais retourné.

### `GET /utilisateurs/:id`

Même forme que la réponse de liste. `404` si absent.

### `GET /utilisateurs/:id/profil`

Retourne l’image de profil (`image/jpeg`, `image/png` ou `image/webp`).
`404` si l’utilisateur n’a pas de profil ou si le fichier est absent.

### `POST /utilisateurs`

Requête `multipart/form-data`; `profil` est facultatif. Les champs obligatoires
sont `nom`, `role`, `username`, `email` et `mdp`. L’image `profil` accepte JPEG,
PNG ou WebP, dans la limite de taille configurée pour les images. `mdp` doit
contenir au moins 8 caractères et est stocké sous forme de hash; il n’est jamais
inclus dans les réponses. L’adresse e-mail est normalisée en minuscules et doit
être unique.

```text
nom=Marie Exemple
role=ADJOINT
username=marie.exemple
email=marie@example.com
mdp=mot-de-passe-solide
profil=<fichier image facultatif>
```

Réponse `201`: enveloppe `message` et `utilisateur`. `409` si l’adresse e-mail
est déjà utilisée.

### `PATCH /utilisateurs/:id`

Requête `multipart/form-data`; chaque champ est facultatif, mais au moins un
champ ou une image `profil` doit être fourni. `mdp` remplace le hash existant.
L’image, si fournie, suit les mêmes validations que pour la création.

```text
username=marie.exemple
email=marie@example.com
mdp=nouveau-mot-de-passe
profil=<fichier image facultatif>
```

Réponse `200`: même enveloppe `message` et `utilisateur` que la création.
`404` si absent; `400` si aucun champ n'est fourni ou si un champ est invalide;
`409` si l’adresse e-mail est déjà utilisée.

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

## Jeu de test

Le seed `seed:jeu-test` prépare un jeu cohérent de factures, bénéficiaires,
plafonds et lignes de suivi T5/T6 avec des statuts de démonstration. Il est
idempotent et nettoie uniquement ses données préfixées `DEMO-JEU-TEST-` lorsqu'il
est lancé avec `--clean`. Définir `ALLOW_DEMO_SEED=true` dans `.env`; le seed
refuse `NODE_ENV=production`. Les règles métier doivent déjà être configurées.

```bash
ALLOW_DEMO_SEED=true npm run seed:jeu-test
ALLOW_DEMO_SEED=true npm run seed:jeu-test -- --clean
curl -s "http://localhost:3000/factures?statut=VALIDEE" | jq .
```

En développement, `FACTURATION_UTILISATEUR_TEST_ID` sélectionne le compte
utilisé lorsque l'authentification ne fournit pas d'utilisateur; les IDs
`9001`, `9002` et `9003` correspondent à l'opérateur, l'adjoint et le chef de
démo.
