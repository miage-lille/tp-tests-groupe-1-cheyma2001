import { User } from 'src/users/entities/user.entity';
import { InMemoryWebinarRepository } from '../adapters/webinar-repository.in-memory';
import { ChangeSeats } from './change-seats';
import { Webinar } from '../entities/webinar.entity';
import { WebinarNotFoundException } from '../exceptions/webinar-not-found';
import { WebinarNotOrganizerException } from '../exceptions/webinar-not-organizer';
import { WebinarReduceSeatsException } from '../exceptions/webinar-reduce-seats';

describe('ChangeSeats Use Case', () => {
  let webinarRepository: InMemoryWebinarRepository;
  let useCase: ChangeSeats;

  const organizer = new User({
    id: 'organizer-1',
    email: 'organizer@example.com',
    password: 'password',
  });

  const nonOrganizer = new User({
    id: 'non-organizer',
    email: 'nonorganizer@example.com',
    password: 'password',
  });

  const webinar = new Webinar({
    id: 'webinar-id',
    organizerId: organizer.props.id,
    title: 'Test Webinar',
    startDate: new Date(),
    endDate: new Date(),
    seats: 100,
  });

  beforeEach(() => {
    webinarRepository = new InMemoryWebinarRepository([webinar]);
    useCase = new ChangeSeats(webinarRepository);
  });

  it('should throw WebinarNotFoundException if the webinar does not exist', async () => {
    const payload = {
      user: organizer,
      webinarId: 'non-existent-id',
      seats: 200,
    };

    await expect(useCase.execute(payload)).rejects.toThrow(WebinarNotFoundException);
  });

  it('should throw WebinarNotOrganizerException if the user is not the organizer', async () => {
    const payload = {
      user: nonOrganizer,
      webinarId: 'webinar-id',
      seats: 200,
    };

    await expect(useCase.execute(payload)).rejects.toThrow(WebinarNotOrganizerException);
  });

  it('should throw WebinarReduceSeatsException if the new seats count is lower', async () => {
    const payload = {
      user: organizer,
      webinarId: 'webinar-id',
      seats: 50, // Reduction des sièges
    };

    await expect(useCase.execute(payload)).rejects.toThrow(WebinarReduceSeatsException);
  });

  it('should update the number of seats if all conditions are met', async () => {
    const payload = {
      user: organizer,
      webinarId: 'webinar-id',
      seats: 200,
    };

    await useCase.execute(payload);

    const updatedWebinar = await webinarRepository.findById('webinar-id');
    expect(updatedWebinar?.props.seats).toEqual(200);
  });
});
