UPDATE facturation.facture_individuelle
SET mois_affectation = date_trunc('month', created_at)::date
WHERE mois_affectation IS NULL;
