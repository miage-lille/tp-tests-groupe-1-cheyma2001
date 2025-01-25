import { PrismaClient } from '@prisma/client';
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { exec } from 'child_process';
import { PrismaWebinarRepository } from './webinar-repository.prisma';
import { Webinar } from '../entities/webinar.entity';
import { promisify } from 'util';

const asyncExec = promisify(exec);

// Augmenter le délai de Jest
jest.setTimeout(30000);

describe('PrismaWebinarRepository', () => {
  let container: StartedPostgreSqlContainer;
  let prismaClient: PrismaClient;
  let repository: PrismaWebinarRepository;

  beforeAll(async () => {
    // Démarrer la base de données avec TestContainers
    container = await new PostgreSqlContainer()
      .withDatabase('test_db')
      .withUsername('user_test')
      .withPassword('password_test')
      .withExposedPorts(5432)
      .start();

    const dbUrl = container.getConnectionUri();
    prismaClient = new PrismaClient({
      datasources: {
        db: { url: dbUrl },
      },
    });

    // Effectuer les migrations
    await asyncExec(`DATABASE_URL=${dbUrl} npx prisma migrate deploy`);
    await prismaClient.$connect();
  });

  beforeEach(async () => {
    repository = new PrismaWebinarRepository(prismaClient);

    // Nettoyer la base de données avant chaque test
    await prismaClient.webinar.deleteMany();
    await prismaClient.$executeRawUnsafe('DELETE FROM "Webinar" CASCADE');
  });

  afterAll(async () => {
    if (container) {
      await container.stop();
    }
    if (prismaClient) {
      await prismaClient.$disconnect();
    }
  });

  describe('Scenario : repository.create', () => {
    it('should create a webinar', async () => {
      // ARRANGE
      const webinar = new Webinar({
        id: 'webinar-id',
        organizerId: 'organizer-id',
        title: 'Webinar title',
        startDate: new Date('2022-01-01T00:00:00Z'),
        endDate: new Date('2022-01-01T01:00:00Z'),
        seats: 100,
      });

      // ACT
      await repository.create(webinar);

      // ASSERT
      const maybeWebinar = await prismaClient.webinar.findUnique({
        where: { id: 'webinar-id' },
      });
      expect(maybeWebinar).toEqual({
        id: 'webinar-id',
        organizerId: 'organizer-id',
        title: 'Webinar title',
        startDate: new Date('2022-01-01T00:00:00Z'),
        endDate: new Date('2022-01-01T01:00:00Z'),
        seats: 100,
      });
    });
  });
});
describe('PrismaWebinarRepository', () => {
    let container: StartedPostgreSqlContainer;
    let prismaClient: PrismaClient;
    let repository: PrismaWebinarRepository;
  
    beforeAll(async () => {
      container = await new PostgreSqlContainer()
        .withDatabase('test_db')
        .withUsername('user_test')
        .withPassword('password_test')
        .withExposedPorts(5432)
        .start();
  
      const dbUrl = container.getConnectionUri();
      prismaClient = new PrismaClient({
        datasources: {
          db: { url: dbUrl },
        },
      });
  
      await asyncExec(`DATABASE_URL=${dbUrl} npx prisma migrate deploy`);
      await prismaClient.$connect();
    });
  
    beforeEach(async () => {
      repository = new PrismaWebinarRepository(prismaClient);
  
      await prismaClient.webinar.deleteMany();
      await prismaClient.$executeRawUnsafe('DELETE FROM "Webinar" CASCADE');
    });
  
    afterAll(async () => {
      if (container) {
        await container.stop();
      }
      if (prismaClient) {
        await prismaClient.$disconnect();
      }
    });
  
    describe('Scenario : repository.create', () => {
      it('should create a webinar', async () => {
        const webinar = new Webinar({
          id: 'webinar-id',
          organizerId: 'organizer-id',
          title: 'Webinar title',
          startDate: new Date('2022-01-01T00:00:00Z'),
          endDate: new Date('2022-01-01T01:00:00Z'),
          seats: 100,
        });
  
        await repository.create(webinar);
  
        const maybeWebinar = await prismaClient.webinar.findUnique({
          where: { id: 'webinar-id' },
        });
        expect(maybeWebinar).toEqual({
          id: 'webinar-id',
          organizerId: 'organizer-id',
          title: 'Webinar title',
          startDate: new Date('2022-01-01T00:00:00Z'),
          endDate: new Date('2022-01-01T01:00:00Z'),
          seats: 100,
        });
      });
    });
  
    describe('Scenario : repository.findById', () => {
      it('should find a webinar by ID', async () => {
        // ARRANGE
        await prismaClient.webinar.create({
          data: {
            id: 'webinar-id',
            organizerId: 'organizer-id',
            title: 'Webinar title',
            startDate: new Date('2022-01-01T00:00:00Z'),
            endDate: new Date('2022-01-01T01:00:00Z'),
            seats: 100,
          },
        });
  
        // ACT
        const webinar = await repository.findById('webinar-id');
  
        // ASSERT
        expect(webinar?.props.id).toEqual('webinar-id');
        expect(webinar?.props.title).toEqual('Webinar title');
        expect(webinar?.props.seats).toEqual(100);
      });
  
      it('should return null if the webinar does not exist', async () => {
        // ACT
        const webinar = await repository.findById('non-existent-id');
  
        // ASSERT
        expect(webinar).toBeNull();
      });
    });
  
    describe('Scenario : repository.update', () => {
      it('should update a webinar', async () => {
        // ARRANGE
        await prismaClient.webinar.create({
          data: {
            id: 'webinar-id',
            organizerId: 'organizer-id',
            title: 'Webinar title',
            startDate: new Date('2022-01-01T00:00:00Z'),
            endDate: new Date('2022-01-01T01:00:00Z'),
            seats: 100,
          },
        });
  
        const webinar = new Webinar({
          id: 'webinar-id',
          organizerId: 'organizer-id',
          title: 'Updated Webinar Title',
          startDate: new Date('2022-01-01T00:00:00Z'),
          endDate: new Date('2022-01-01T01:00:00Z'),
          seats: 200,
        });
  
        // ACT
        await repository.update(webinar);
  
        // ASSERT
        const updatedWebinar = await prismaClient.webinar.findUnique({
          where: { id: 'webinar-id' },
        });
        expect(updatedWebinar?.title).toEqual('Updated Webinar Title');
        expect(updatedWebinar?.seats).toEqual(200);
      });
  
      it('should throw an error if the webinar does not exist', async () => {
        // ARRANGE
        const webinar = new Webinar({
          id: 'non-existent-id',
          organizerId: 'organizer-id',
          title: 'Non-existent Webinar',
          startDate: new Date('2022-01-01T00:00:00Z'),
          endDate: new Date('2022-01-01T01:00:00Z'),
          seats: 100,
        });
  
        // ACT & ASSERT
        await expect(repository.update(webinar)).rejects.toThrow();
      });
    });
  });
  