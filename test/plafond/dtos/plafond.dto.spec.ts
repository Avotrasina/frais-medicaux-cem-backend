import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { CreatePlafondDto, UpdatePlafondDto } from '../../../src/modules/plafond/dtos/plafond.dto.js';

describe('Plafond DTOs', () => {
  it('n’accepte plus dateFin lors de la création', async () => {
    const pipe = new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    await expect(
      pipe.transform(
        { dateFin: '2026-03-01' },
        { type: 'body', metatype: CreatePlafondDto },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('conserve dateFin dans le DTO de modification administrative', async () => {
    const pipe = new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    await expect(
      pipe.transform(
        { dateFin: '2026-03-01' },
        { type: 'body', metatype: UpdatePlafondDto },
      ),
    ).resolves.toMatchObject({ dateFin: '2026-03-01' });
  });
});
