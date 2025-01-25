jest.setTimeout(30000);
import supertest from 'supertest';
import { TestServerFixture } from './tests/fixtures';

describe('Webinar Routes E2E', () => {
  let fixture: TestServerFixture;

  beforeAll(async () => {
    fixture = new TestServerFixture();
    await fixture.init();
  });

  beforeEach(async () => {
    await fixture.reset();
  });

  afterAll(async () => {
    await fixture.stop();
  });

  describe('Scenario: Update webinar seats', () => {
    it('should update webinar seats', async () => {
      // ARRANGE
      const prisma = fixture.getPrismaClient();
      const server = fixture.getServer();

      const webinar = await prisma.webinar.create({
        data: {
          id: 'test-webinar',
          title: 'Webinar Test',
          seats: 10,
          startDate: new Date(),
          endDate: new Date(),
          organizerId: 'test-user', // L'organisateur du webinar
        },
      });

      // ACT
      const response = await supertest(server)
        .post(`/webinars/${webinar.id}/seats`)
        .send({ seats: 30, userId: 'test-user' }) // Inclure l'ID de l'utilisateur organisateur
        .expect(200);

      // ASSERT
      expect(response.body).toEqual({ message: 'Seats updated' });

      const updatedWebinar = await prisma.webinar.findUnique({
        where: { id: webinar.id },
      });
      expect(updatedWebinar?.seats).toBe(30);
    });

    it('should return 404 if webinar is not found', async () => {
      // ARRANGE
      const server = fixture.getServer();

      // ACT
      const response = await supertest(server)
        .post(`/webinars/non-existent-webinar/seats`)
        .send({ seats: 30, userId: 'test-user' }) // Inclure l'ID de l'utilisateur
        .expect(404);

      // ASSERT
      expect(response.body).toEqual({
        error: 'Webinar not found',
      });
    });

    it('should return 403 if user is not the organizer', async () => {
      // ARRANGE
      const prisma = fixture.getPrismaClient();
      const server = fixture.getServer();

      const webinar = await prisma.webinar.create({
        data: {
          id: 'test-webinar',
          title: 'Webinar Test',
          seats: 10,
          startDate: new Date(),
          endDate: new Date(),
          organizerId: 'test-user', // L'organisateur du webinar
        },
      });

      // ACT
      const response = await supertest(server)
        .post(`/webinars/${webinar.id}/seats`)
        .send({ seats: 30, userId: 'non-organizer-user' }) // Simuler un utilisateur non organisateur
        .expect(403);

      // ASSERT
      expect(response.body).toEqual({
        error: 'User is not allowed to update this webinar',
      });
    });
  });
});