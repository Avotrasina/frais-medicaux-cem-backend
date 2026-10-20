import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../infrastructure/prisma/prisma.service.js";
import type { Convention } from "../../generated/prisma/client.js";
import type { DbClient } from "../../infrastructure/prisma/db-client.type.js";
import { HandlePrismaErrors } from "../../common/decorators/handle-prisma-errors.decorator.js";
import type { ConventionImageReference, CreateConvention, ReadConvenion } from "./types/convention.types.js"


@Injectable()
@HandlePrismaErrors({exclude:["toReadConvention"]})
export class ConventionRepository{
    constructor(
        private readonly prisma: PrismaService
    ){}

    private client(tx?: DbClient): DbClient {
        return tx ?? this.prisma;
    }
    
    private toReadConvention(convention : Convention):ReadConvenion{
        return{
            id:convention.id,
            path:convention.conventionPath,
            idProvider:convention.idPrestataire
        }
    }

    async create(
    convention:CreateConvention,
    tx?:DbClient
    ):Promise<ReadConvenion>{
        const created = await this.client(tx).convention.create({
            data:{conventionPath:convention.path,idPrestataire:convention.idProvider}
        })

        return this.toReadConvention(created)
    }

    async findByIDProvider(
        idProvider:number,
        tx?:DbClient
    ):Promise<ReadConvenion[]>{
        return ( await this.client(tx).convention.findMany({
            where:{
                idPrestataire:idProvider
            }
        })).map((p)=>{
            return this.toReadConvention(p)
        })
    }

    async findImageReferencesByIDProvider(
        idProvider: number,
        tx?: DbClient,
    ): Promise<ConventionImageReference[]> {
        const conventions = await this.client(tx).convention.findMany({
            where: { idPrestataire: idProvider },
            select: { id: true, conventionPath: true },
        });
        return conventions.map(({ id, conventionPath }) => ({
            id,
            path: conventionPath,
        }));
    }

    async findByID(id: number, tx?: DbClient): Promise<ReadConvenion> {
        const convention = await this.client(tx).convention.findUniqueOrThrow({
            where: { id },
        });
        return this.toReadConvention(convention);
    }

    async findPathsByIDProvider(
        idProvider: number,
        tx?: DbClient,
    ): Promise<string[]> {
        const conventions = await this.client(tx).convention.findMany({
            where: { idPrestataire: idProvider },
            select: { conventionPath: true },
        });
        return conventions.map(({ conventionPath }) => conventionPath);
    }

    async deleteByID(
        id:number,
        tx?:DbClient        
    ):Promise<void>{
        await this.client(tx).convention.delete({
            where:{id}
        })
    }

    async deleteBYProviderID(
        idProvider:number,
        tx?:DbClient        
    ):Promise<void>{
        await this.client(tx).convention.deleteMany({
            where:{idPrestataire:idProvider}
        })
    }
}
