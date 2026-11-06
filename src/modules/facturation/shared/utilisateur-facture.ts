import { UnauthorizedException } from '@nestjs/common';

export interface RequeteAvecUtilisateur {
  user?: { id: number };
}

export function obtenirUtilisateurId(requete: RequeteAvecUtilisateur): number {
  const utilisateurId = requete.user?.id;
  if (utilisateurId !== undefined && Number.isInteger(utilisateurId)) {
    return utilisateurId;
  }

  const utilisateurTestId = process.env.FACTURATION_UTILISATEUR_TEST_ID;
  if (
    process.env.NODE_ENV === 'development' &&
    utilisateurTestId !== undefined
  ) {
    if (!/^[1-9]\d*$/.test(utilisateurTestId)) {
      throw new UnauthorizedException(
        'FACTURATION_UTILISATEUR_TEST_ID doit être un identifiant entier positif.',
      );
    }

    const identifiant = Number(utilisateurTestId);
    if (Number.isSafeInteger(identifiant)) {
      return identifiant;
    }
  }

  throw new UnauthorizedException(
    'Aucun utilisateur authentifié n’est disponible. En développement, définissez FACTURATION_UTILISATEUR_TEST_ID avec l’identifiant d’un utilisateur existant.',
  );
}
