import { Injectable } from "@nestjs/common";
import { PrismaClient, Prisma } from "../../generated/prisma/client.js";
import type { DbClient } from "../../infrastructure/prisma/db-client.type.js";
import { Sexe } from "../personne/personne.types.js";
import { CodeFamille } from "./types/idp.types.js";
import type {
  BeneficiaryLien,
  CreateBeneficiary,
  ReadBeneficiary,
  ReadBeneficiaryBase,
  ReadBeneficiaryByMatricule,
  UpdateObservationBeneficiary,
} from "./types/beneficiary.types.js";
import { buildCodeFamille } from "./utils/build-idp.js";
import { HandlePrismaErrors } from "../../common/decorators/handle-prisma-errors.decorator.js";

const BENEFICIARY_INCLUDE = {
  personne: {
    include: {
      agent: true,
      familleAgent: {
        include: { conjoint: true, enfant: true },
      },
    },
  },
} satisfies Prisma.BeneficiaireInclude;

type BeneficiaryWithRelations = Prisma.BeneficiaireGetPayload<{
  include: typeof BENEFICIARY_INCLUDE;
}>;

@Injectable()
@HandlePrismaErrors({
  exclude: [
    "toReadBeneficiary",
    "toReadBeneficiaryByMatricule",
    "resolveLien",
    "resolveCodeFamille",
  ],
})
export class BeneficiaryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private client(tx?: DbClient): DbClient {
    return tx ?? this.prisma;
  }

  private resolveLien(
    personne: BeneficiaryWithRelations["personne"],
  ): BeneficiaryLien | null {
    const { agent, familleAgent } = personne;

    if (agent) {
      return { type: "AGENT", matricule: agent.matricule };
    }
    if (familleAgent?.conjoint) {
      return {
        type: "CONJOINT",
        numConjoint: familleAgent.conjoint.numConjoint,
        agentMatricule: familleAgent.agentMatricule,
        carteSocialePath: familleAgent.carteSocialePath,
      };
    }
    if (familleAgent?.enfant) {
      return {
        type: "ENFANT",
        numEnfant: familleAgent.enfant.numEnfant,
        agentMatricule: familleAgent.agentMatricule,
        carteSocialePath: familleAgent.carteSocialePath,
      };
    }
    return null;
  }

  private resolveCodeFamille(
    personne: BeneficiaryWithRelations["personne"],
  ): CodeFamille {
    if (personne.agent) return CodeFamille.AGENT;
    if (personne.familleAgent?.conjoint) return CodeFamille.CONJOINT;
    if (personne.familleAgent?.enfant) return CodeFamille.ENFANT;
    throw new Error(
      `La personne ${personne.id} n'est ni agent, ni conjoint, ni enfant`,
    );
  }

  private toReadBeneficiary(
    beneficiary: BeneficiaryWithRelations,
  ): ReadBeneficiary {
    const { personne, ...rest } = beneficiary;
    const { agent: _agent, familleAgent: _famille, ...identite } = personne;

    return {
      ...identite,
      sexe: Sexe[personne.sexe],
      id: rest.id,
      idp: rest.idp,
      observationIDP: rest.observationIDP,
      lien: this.resolveLien(personne),
    };
  }

  private toReadBeneficiaryByMatricule(
    beneficiary: BeneficiaryWithRelations,
    matricule: string,
  ): ReadBeneficiaryByMatricule {
    const { personne } = beneficiary;
    const { agent, familleAgent } = personne;

    return {
      nom: personne.nom,
      prenom: personne.prenom,
      dateNaissance: personne.dateNaissance,
      sexe: Sexe[personne.sexe],
      idp: beneficiary.idp,
      observationIDP: beneficiary.observationIDP,
      matricule,
      codeFamille: this.resolveCodeFamille(personne),
      carteSocialePath: familleAgent?.carteSocialePath ?? null,
      carteProfessionnellePath: agent?.carteProfessionnellePath ?? null,
    };
  }

  async create(
    beneficiary: CreateBeneficiary,
    tx?: DbClient,
  ): Promise<ReadBeneficiaryBase> {
    const { id, observationIDP, codeFamille, numConjoint, numEnfant } =
      beneficiary;

    const idp = buildCodeFamille(
      id,
      codeFamille,
      numEnfant ?? undefined,
      numConjoint ?? undefined,
    );

    const created = await this.client(tx).beneficiaire.create({
      data: { id, idp, observationIDP: observationIDP ?? null },
      select: { id: true, idp: true, observationIDP: true },
    });
    return created;
  }

  async updateObservation(
    idp: string,
    input: UpdateObservationBeneficiary,
    tx?: DbClient,
  ): Promise<void> {
    await this.client(tx).beneficiaire.update({
      where: { idp },
      data: { observationIDP: input.observationIDP },
    });
  }

  async findByMatricule(
    matricule: string,
    tx?: DbClient,
  ): Promise<ReadBeneficiaryByMatricule[]> {
    const beneficiaries = await this.client(tx).beneficiaire.findMany({
      where: {
        personne: {
          OR: [
            { agent: { is: { matricule } } },
            { familleAgent: { is: { agentMatricule: matricule } } },
          ],
        },
      },
      include: BENEFICIARY_INCLUDE,
      orderBy: [{ personne: { nom: "asc" } }, { personne: { prenom: "asc" } }],
    });

    return beneficiaries.map((b) =>
      this.toReadBeneficiaryByMatricule(b, matricule),
    );
  }
}