import { Op } from 'sequelize';
import Meetup from '../models/Meetup';
import User from '../models/User';
import Subscription from '../models/Subscription';

import Queue from '../../lib/Queue';
import NewSubscriberMail from '../jobs/NewSubscriberMail';

class SubscriptionController {
  async index(req, res) {
    const { page = 1 } = req.query;
    const { userId: user_id } = req;

    const meetups = await Subscription.findAll({
      where: { user_id },
      include: {
        model: Meetup,
        where: {
          date: {
            [Op.gt]: new Date(),
          },
        },
      },
      order: [[Meetup, 'date']],
      limit: 10,
      offset: 10 * page - 10,
    });

    return res.json(meetups);
  }

  async store(req, res) {
    const { id: meetupId } = req.params;

    const user = await User.findByPk(req.userId);

    const meetup = await Meetup.findByPk(meetupId, {
      include: [
        {
          model: Subscription,
          where: { user_id: user.id },
          required: false,
        },
        {
          model: User,
          as: 'owner',
        },
      ],
    });

    if (!meetup) {
      return res.status(400).json('Meetup not found');
    }

    if (meetup.user_id === user.id) {
      return res.status(400).json({
        error: { message: "You can't subscribe for your own meetup" },
      });
    }

    if (meetup.past) {
      return res.status(400).json({
        error: { message: "You can't subscribe for a meetup in past" },
      });
    }

    if (meetup.Subscriptions.length > 0) {
      return res.status(400).json({
        error: {
          message: 'You already subscribed for this meetup',
        },
      });
    }

    const checkDate = await Subscription.findOne({
      where: { user_id: user.id },
      include: {
        model: Meetup,
        where: {
          date: meetup.date,
        },
      },
    });

    if (checkDate) {
      return res.status(400).json({
        error: {
          message:
            'You already subscribed for another meetup at this same time',
        },
      });
    }

    const subscription = await Subscription.create({
      user_id: user.id,
      meetup_id: meetup.id,
    });

    await Queue.add(NewSubscriberMail.key, { user, meetup });

    return res.json(subscription);
  }
}

export default new SubscriptionController();
