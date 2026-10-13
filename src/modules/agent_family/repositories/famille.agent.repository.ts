import { Injectable } from "@nestjs/common";
import { PrismaClient } from "../../../generated/prisma/client.js";
import type { DbClient } from "../../../infrastructure/prisma/db-client.type.js";
import {
  FAMILLE_AGENT_INCLUDE,
  type ReadAgentFamilyDB,
  type ReadAgentFamily
} from "../types/famille.agent.types.js";
import { HandlePrismaErrors } from "../../../common/decorators/handle-prisma-errors.decorator.js";
import { Sexe } from "../../personne/personne.types.js";

@Injectable()
@HandlePrismaErrors({exclude:["toReadAgentFamily"]})
export class FamilleAgentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private client(tx?: DbClient): DbClient {
    return tx ?? this.prisma;
  }

  private toReadAgentFamily(agentFamily:ReadAgentFamilyDB):ReadAgentFamily{
    const family : ReadAgentFamily = {
      id:agentFamily.id,
      nom:agentFamily.personne.nom,
      prenom:agentFamily.personne.prenom,
      dateNaissance:agentFamily.personne.dateNaissance,
      sexe:Sexe[agentFamily.personne.sexe],
      numConjoint:agentFamily.conjoint?.numConjoint ?? null,
      numEnfant: agentFamily.enfant?.numEnfant ?? null,
      carteSocialPath:agentFamily.carteSocialePath,
      agentMatricule:agentFamily.agentMatricule
      
    }
    return family
  }

  async findByAgentMatricule(
    agentMatricule: string,
    tx?: DbClient,
  ): Promise<ReadAgentFamily[]> {
    const agentFamilies = await this.client(tx).familleAgent.findMany({
      where: { agentMatricule },
      include: FAMILLE_AGENT_INCLUDE,
    })
    return agentFamilies.map((agentFamily)=>{
      return this.toReadAgentFamily(agentFamily)
    })
  }

  
}