import { format, parseISO } from 'date-fns';
import pt from 'date-fns/locale/pt';
import Mail from '../../lib/Mail';

class NewSubscriberMail {
  get key() {
    return 'NewSubscriberMail';
  }

  async handle({ data }) {
    console.log('Job NewSubscriberMail executou');
    const { meetup, user } = data;

    const date = format(
      parseISO(meetup.date),
      "'dia 'dd' de 'MMMM', às 'H:mm' h'",
      {
        locale: pt,
      }
    );

    await Mail.sendMail({
      to: `"${meetup.owner.name}" <${meetup.owner.email}>`,
      subject: 'Nova Incrição',
      template: 'newSubscriber',
      context: {
        subscriber: user.name,
        owner: meetup.owner.name,
        meetup: {
          title: meetup.title,
          date,
          location: meetup.location,
        },
      },
    });
  }
}

export default new NewSubscriberMail();
