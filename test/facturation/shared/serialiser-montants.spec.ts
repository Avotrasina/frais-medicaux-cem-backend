import { Prisma } from '../../../src/generated/prisma/client.js';
import { serialiserMontants } from '../../../src/modules/facturation/shared/serialiser-montants.js';

describe('serialiserMontants', () => {
  it('sérialise les valeurs Decimal à deux décimales sans modifier les dates', () => {
    const date = new Date('2026-03-01T00:00:00.000Z');
    const donnees = {
      montantTotal: new Prisma.Decimal('6000000'),
      totaux: [new Prisma.Decimal('0'), new Prisma.Decimal('125.5')],
      date,
    };

    expect(serialiserMontants(donnees)).toEqual({
      montantTotal: '6000000.00',
      totaux: ['0.00', '125.50'],
      date,
    });
  });
});
