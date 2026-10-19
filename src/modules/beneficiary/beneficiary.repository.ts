import { Injectable } from "@nestjs/common";
import { Prisma } from "../../generated/prisma/client.js";
import { PrismaService } from "../../infrastructure/prisma/prisma.service.js";
import type { DbClient } from "../../infrastructure/prisma/db-client.type.js";
import { Sexe } from "../personne/personne.types.js";
import { CodeFamille } from "./types/idp.types.js";
import type {
  CreateBeneficiary,
  ReadBeneficiaryBase,
  ReadBeneficiary,
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
  exclude: ["toReadBeneficiary", "resolveCodeFamille", "resolveMatricule"],
})
export class BeneficiaryRepository {
  constructor(private readonly prisma: PrismaService) {}

  private client(tx?: DbClient): DbClient {
    return tx ?? this.prisma;
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

  private resolveMatricule(
    personne: BeneficiaryWithRelations["personne"],
  ): number {
    const matricule =
      personne.agent?.matricule ?? personne.familleAgent?.agentMatricule;
    if (!matricule) {
      throw new Error(`La personne ${personne.id} n'est liée à aucun agent`);
    }
    return matricule;
  }

  private toReadBeneficiary(
    beneficiary: BeneficiaryWithRelations,
  ): ReadBeneficiary {
    const { personne } = beneficiary;
    const { agent, familleAgent } = personne;

    return {
      nom: personne.nom,
      prenom: personne.prenom,
      dateNaissance: personne.dateNaissance,
      sexe: Sexe[personne.sexe],
      idp: beneficiary.idp,
      observationIDP: beneficiary.observationIDP,
      matricule: this.resolveMatricule(personne),
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

    return this.client(tx).beneficiaire.create({
      data: { id, idp, observationIDP: observationIDP ?? null },
      select: { id: true, idp: true, observationIDP: true },
    });
  }

  async updateObservation(
    idp: string,
    input: UpdateObservationBeneficiary,
    tx?: DbClient,
  ): Promise<ReadBeneficiary> {
    const updated = await this.client(tx).beneficiaire.update({
      where: { idp },
      data: { observationIDP: input.observationIDP },
      include: BENEFICIARY_INCLUDE,
    });
    return this.toReadBeneficiary(updated);
  }

  async findByMatricule(
    matricule: number,
    tx?: DbClient,
  ): Promise<ReadBeneficiary[]> {
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

    return beneficiaries.map((b) => this.toReadBeneficiary(b));
  }

  async findByIDP(
    idp: string,
    tx?: DbClient,
  ): Promise<ReadBeneficiary> {
    const beneficiary = await this.client(tx).beneficiaire.findUniqueOrThrow({
      where: { idp },
      include: BENEFICIARY_INCLUDE,
    });
    return this.toReadBeneficiary(beneficiary);
  }
}
