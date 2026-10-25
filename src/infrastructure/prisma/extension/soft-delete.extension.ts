
import { AsyncLocalStorage } from "node:async_hooks";
import { Prisma, type PrismaClient } from "../../../generated/prisma/client.js";
import { SuppresionStatut } from "../../../generated/prisma/enums.js";
import {
  DeletionNotPendingError,
  DeletionValidationRequiredError,
  EntityDeletedError,
  HardDeleteForbiddenError,
} from "../../../common/errors/soft-delete.errors.js";

export type SoftDeleteOperation = "find" | "create" | "update" | "delete";

export interface SoftDeleteConfig {
  operations: readonly SoftDeleteOperation[];
  models?: readonly Prisma.ModelName[];
}

export const deletionValidationContext = new AsyncLocalStorage<boolean>();

const SOFT_DELETE_FIELD = "suppressionStatut";

const modelsWithSoftDelete = Object.values(Prisma.ModelName).filter((name) => {
  const fields = (Prisma as any)[`${name}ScalarFieldEnum`];
  return !!fields && SOFT_DELETE_FIELD in fields;
});

const OPERATION_GROUP: Record<string, SoftDeleteOperation> = {
  findUnique: "find",
  findUniqueOrThrow: "find",
  findFirst: "find",
  findFirstOrThrow: "find",
  findMany: "find",
  count: "find",
  aggregate: "find",
  groupBy: "find",
  create: "create",
  createMany: "create",
  createManyAndReturn: "create",
  update: "update",
  updateMany: "update",
  updateManyAndReturn: "update",
  upsert: "update",
};

const LIST_READS = new Set(["findMany", "count", "aggregate", "groupBy"]);
const BULK_WRITES = new Set(["updateMany", "updateManyAndReturn"]);

const NOT_REJECTED = {
  OR: [{ suppressionStatut: null }, { suppressionStatut: SuppresionStatut.EN_ATTENTE }],
};

const asArray = (v: unknown): unknown[] => (v == null ? [] : Array.isArray(v) ? v : [v]);

const withActive = (where?: Record<string, any>) => ({
  ...where,
  AND: [...asArray(where?.AND), NOT_REJECTED],
});

const delegateName = (model: string) => model.charAt(0).toLowerCase() + model.slice(1);

const isNotFound = (e: unknown): boolean =>
  e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025";

function throwHardDeleteForbidden(model: string): never {
  throw new HardDeleteForbiddenError(model);
}

export function createSoftDeleteExtension(base: PrismaClient, config: SoftDeleteConfig) {
  const models = new Set<string>(
    config.models
      ? modelsWithSoftDelete.filter((m) => config.models!.includes(m))
      : modelsWithSoftDelete,
  );
  const blocked = new Set<SoftDeleteOperation>(config.operations);

  const raw = (model: string): any => (base as any)[delegateName(model)];


  async function assertNotRejected(
    model: string,
    where?: Record<string, any>,
    delegate: any = raw(model),
  ) {
    if (!where) return;
    const hit = await delegate.findFirst({
      where: { AND: [where, { suppressionStatut: SuppresionStatut.REJETE }] },
      select: { suppressionStatut: true },
    });
    if (hit) throw new EntityDeletedError(model);
  }

  function guardStatus(model: string, data: any) {
    if (!data) return;
    const value = data.suppressionStatut;
    const next = value && typeof value === "object" ? value.set : value;
    if (next === SuppresionStatut.REJETE && !deletionValidationContext.getStore()) {
      throw new DeletionValidationRequiredError(model);
    }
  }

  return base.$extends({
    name: "soft-delete",

    model: {
      $allModels: {
        async delete(this: any, args: any) {
          const ctx = Prisma.getExtensionContext(this) as any;
          const model: string = ctx.$name;

          if (!models.has(model)) {
            return ctx.$parent[delegateName(model)].delete(args);
          }

          return throwHardDeleteForbidden(model);
        },

        async deleteMany(this: any, args?: any) {
          const ctx = Prisma.getExtensionContext(this) as any;
          const model: string = ctx.$name;

          if (!models.has(model)) {
            return ctx.$parent[delegateName(model)].deleteMany(args);
          }

          return throwHardDeleteForbidden(model);
        },

        async requestDeletion(this: any, where: Record<string, any>) {
          const ctx = Prisma.getExtensionContext(this) as any;
          const model: string = ctx.$name;

          if (!models.has(model)) {
            throw new Error(`requestDeletion indisponible : ${model} n'a pas de champ ${SOFT_DELETE_FIELD}`);
          }
          if (!where || Object.keys(where).length === 0) {
            throw new Error("requestDeletion exige un where");
          }

          return ctx.updateMany({
            where: {
              AND: [where, { suppressionStatut: null }],
            },
            data: { suppressionStatut: SuppresionStatut.EN_ATTENTE },
          });
        },

        async validateDeletion(this: any, where: Record<string, any>) {
          const ctx = Prisma.getExtensionContext(this) as any;
          const model: string = ctx.$name;

          if (!models.has(model)) {
            throw new Error(`validateDeletion indisponible : ${model} n'a pas de champ ${SOFT_DELETE_FIELD}`);
          }
          if (!where || Object.keys(where).length === 0) {
            throw new Error("validateDeletion exige un where");
          }

          const pending = await ctx.findFirst({
            where: {
              AND: [where, { suppressionStatut: SuppresionStatut.EN_ATTENTE }],
            },
            select: { suppressionStatut: true },
          });

          if (!pending) {
            throw new DeletionNotPendingError(model);
          }

          return deletionValidationContext.run(true, async () => {
            return await ctx.updateMany({
              where: {
                AND: [where, { suppressionStatut: SuppresionStatut.EN_ATTENTE }],
              },
              data: { suppressionStatut: SuppresionStatut.REJETE },
            });
          });
        },

        async rejectDeletion(this: any, where: Record<string, any>) {
          const ctx = Prisma.getExtensionContext(this) as any;
          const model: string = ctx.$name;

          if (!models.has(model)) {
            throw new Error(`rejectDeletion indisponible : ${model} n'a pas de champ ${SOFT_DELETE_FIELD}`);
          }
          if (!where || Object.keys(where).length === 0) {
            throw new Error("rejectDeletion exige un where");
          }

          return ctx.updateMany({
            where: {
              AND: [where, { suppressionStatut: { not: null } }],
            },
            data: { suppressionStatut: null },
          });
        },
      },
    },

    // ---------- 2. filtres et gardes sur les autres opérations ----------
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }: any) {
          if (!models.has(model)) return query(args);
          const a = args as Record<string, any>;

          const group = OPERATION_GROUP[operation];
          if (!group || !blocked.has(group)) return query(args);

          // --- find ---
          if (group === "find") {
            if (LIST_READS.has(operation)) {
              return query({ ...a, where: withActive(a.where) });
            }
            let notFound: unknown;
            try {
              const result = await query({ ...a, where: withActive(a.where) });
              if (result !== null) return result;
            } catch (e) {
              if (!isNotFound(e)) throw e;
              notFound = e;
            }
            await assertNotRejected(model, a.where);
            if (notFound) throw notFound;
            return null;
          }

          // --- create ---
          if (group === "create") {
            asArray(a.data).forEach((r) => guardStatus(model, r));
            return query(args);
          }

          // --- update ---
          [a.data, a.create, a.update].filter(Boolean).forEach((r) => guardStatus(model, r));

          if (BULK_WRITES.has(operation)) {
            return query({ ...a, where: withActive(a.where) });
          }
          await assertNotRejected(model, a.where);
          return query({ ...a, where: withActive(a.where) });
        },
      },
    },
  });
}