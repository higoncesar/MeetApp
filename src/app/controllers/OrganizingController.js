import Meetup from '../models/Meetup';

class Organizing {
  async index(req, res) {
    const { page = 1 } = req.query;
    const { userId: user_id } = req;

    const meetups = await Meetup.findAll({
      where: { user_id },
      order: [['id', 'ASC']],
      limit: 10,
      offset: 10 * page - 10,
    });

    return res.json(meetups);
  }
}

export default new Organizing();
