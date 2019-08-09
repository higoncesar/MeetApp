import { isBefore, startOfDay, endOfDay, parseISO } from 'date-fns';
import * as Yup from 'yup';
import { Op } from 'sequelize';

import Meetup from '../models/Meetup';
import User from '../models/User';

class MeetupController {
  async index(req, res) {
    const { page = 1, date } = req.query;
    let where = null;

    if (date) {
      const searchDate = parseISO(date);
      where = {
        date: {
          [Op.between]: [startOfDay(searchDate), endOfDay(searchDate)],
        },
      };
    }

    const meetups = await Meetup.findAll({
      where,
      include: {
        model: User,
        as: 'owner',
      },
      order: [['date', 'ASC']],
      limit: 10,
      offset: 10 * page - 10,
    });

    return res.json(meetups);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      title: Yup.string().required(),
      description: Yup.string().required(),
      location: Yup.string().required(),
      date: Yup.date().required(),
    });

    await schema.validate(req.body, { abortEarly: false }).catch(error => {
      return res.status(400).json({ erros: error.inner });
    });

    const { date } = req.body;

    if (isBefore(date, new Date())) {
      return res
        .status(400)
        .json({ error: { message: 'Is not allow create meetup in past' } });
    }

    const meetup = await Meetup.create({ ...req.body, user_id: req.userId });
    return res.json(meetup);
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      title: Yup.string(),
      description: Yup.string(),
      location: Yup.string(),
      date: Yup.date(),
    });

    await schema.validate(req.body, { abortEarly: false }).catch(error => {
      return res.status(400).json({ erros: error.inner });
    });

    const { id } = req.params;

    const meetup = await Meetup.findByPk(id);

    if (!meetup) {
      return res.status(400).json({ error: { message: 'Meetup not found' } });
    }

    if (meetup.user_id !== req.userId) {
      return res.status(401).json({
        error: {
          message: "You don't have permission about this meetup",
        },
      });
    }

    await meetup.update(req.body);

    return res.json(meetup);
  }

  async delete(req, res) {
    const { id } = req.params;
    const meetup = await Meetup.findByPk(id);

    if (!meetup) {
      return res.status(400).json({ error: { message: 'Meetup not found' } });
    }

    if (meetup.user_id !== req.userId) {
      return res.status(401).json({
        error: { message: "You don't have permission about this meetup" },
      });
    }

    await meetup.destroy();

    return res.json();
  }
}

export default new MeetupController();
