ALTER TABLE "facturation"."facture_globale"
ADD COLUMN "montant_80_cem" DECIMAL(15, 2),
ADD COLUMN "montant_20_agent" DECIMAL(15, 2),
ADD COLUMN "total_charge_agent" DECIMAL(15, 2);

UPDATE "facturation"."facture_globale"
SET
    "montant_80_cem" = ROUND(
        ("montant_total" - "total_100_cem" - "total_depassement")
        * "taux_cem" / 100,
        2
    ),
    "montant_20_agent" =
        ("montant_total" - "total_100_cem" - "total_depassement")
        - ROUND(
            ("montant_total" - "total_100_cem" - "total_depassement")
            * "taux_cem" / 100,
            2
        ),
    "total_charge_agent" = "total_depassement"
        + ("montant_total" - "total_100_cem" - "total_depassement")
        - ROUND(
            ("montant_total" - "total_100_cem" - "total_depassement")
            * "taux_cem" / 100,
            2
        )
WHERE "montant_total" IS NOT NULL;
