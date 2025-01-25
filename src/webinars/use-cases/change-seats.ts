import { Executable } from 'src/shared/executable';
import { User } from 'src/users/entities/user.entity';
import { WebinarNotFoundException } from 'src/webinars/exceptions/webinar-not-found';
import { WebinarNotOrganizerException } from 'src/webinars/exceptions/webinar-not-organizer';
import { WebinarReduceSeatsException } from 'src/webinars/exceptions/webinar-reduce-seats';
import { WebinarTooManySeatsException } from 'src/webinars/exceptions/webinar-too-many-seats';
import { IWebinarRepository } from 'src/webinars/ports/webinar-repository.interface';

type Request = {
  user: User;
  webinarId: string;
  seats: number;
};

type Response = void;

export class ChangeSeats implements Executable<Request, Response> {
  constructor(private readonly webinarRepository: IWebinarRepository) {}

  async execute({ webinarId, user, seats }: Request): Promise<Response> {
    // Vérifier si le webinaire existe
    const webinar = await this.webinarRepository.findById(webinarId);
    if (!webinar) {
      throw new WebinarNotFoundException();
    }

    // Vérifier si l'utilisateur est l'organisateur du webinaire
    if (!webinar.isOrganizer(user)) {
      throw new WebinarNotOrganizerException();
    }

    // Vérifier que le nouveau nombre de sièges n'est pas inférieur à l'existant
    if (seats < webinar.props.seats) {
      throw new WebinarReduceSeatsException();
    }

    // Mettre à jour le nombre de sièges
    webinar.update({ seats });

    // Vérifier que le nouveau nombre de sièges ne dépasse pas la limite maximale
    if (webinar.hasTooManySeats()) {
      throw new WebinarTooManySeatsException();
    }

    // Sauvegarder les modifications dans le repository
    await this.webinarRepository.update(webinar);

    return;
  }
}
