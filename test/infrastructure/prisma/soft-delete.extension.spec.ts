import { describe, expect, it, vi } from 'vitest';
import type { PrismaClient } from '../../../src/generated/prisma/client.js';
import { HardDeleteForbiddenError } from '../../../src/common/errors/soft-delete.errors.js';
import { createSoftDeleteExtension } from '../../../src/infrastructure/prisma/extension/soft-delete.extension.js';

describe('createSoftDeleteExtension', () => {
  it('only installs hard-delete guards on managed models', async () => {
    const base = {
      $extends: vi.fn((extension) => extension),
    } as unknown as PrismaClient;

    const extension = createSoftDeleteExtension(base, {
      models: ['Agent'],
      operations: [],
    }) as any;

    expect(extension.model.$allModels).not.toHaveProperty('delete');
    expect(extension.model.$allModels).not.toHaveProperty('deleteMany');
    expect(extension.model.Agent.delete).toEqual(expect.any(Function));
    expect(extension.model.Agent.deleteMany).toEqual(expect.any(Function));
    expect(extension.model.Acte).toBeUndefined();

    await expect(
      extension.model.Agent.delete.call({ $name: 'Agent' }),
    ).rejects.toBeInstanceOf(HardDeleteForbiddenError);
    await expect(
      extension.model.Agent.deleteMany.call({ $name: 'Agent' }),
    ).rejects.toBeInstanceOf(HardDeleteForbiddenError);
  });
});
