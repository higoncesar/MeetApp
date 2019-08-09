import * as Yup from 'yup';
import User from '../models/User';

class UserController {
  async store(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      email: Yup.string()
        .email()
        .required(),
      password: Yup.string()
        .required()
        .min(6),
    });

    await schema.validate(req.body, { abortEarly: false }).catch(error => {
      return res.status(400).json({ erros: error.inner });
    });

    const { email } = req.body;
    const userExist = await User.findOne({ where: { email: req.body.email } });

    if (userExist) {
      return res.status(400).json({ error: { message: 'User already exist' } });
    }

    const { id, name } = await User.create(req.body);
    return res.json({ id, name, email });
  }

  async update(req, res) {
    const id = Number(req.params.id);

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(400).json({ error: { message: 'user not found' } });
    }

    if (req.userId !== id) {
      return res.status(401).json({
        error: { message: 'you not has permission for updated this user' },
      });
    }

    const schema = Yup.object().shape({
      name: Yup.string().required(),
      email: Yup.string()
        .email()
        .required(),
      oldPassword: Yup.string().min(6),
      password: Yup.string()
        .min(6)
        .when('oldPassword', (oldPassword, field) =>
          oldPassword ? field.required() : field
        ),
      confirmPassword: Yup.string().when('password', (password, field) =>
        password ? field.required().oneOf([Yup.ref('password')]) : field
      ),
    });

    await schema.validate(req.body, { abortEarly: false }).catch(error => {
      return res.status(400).json({ erros: error.inner });
    });

    if (req.body.email !== user.email) {
      const userExist = await User.findOne({
        where: { email: req.body.email },
      });

      if (userExist) {
        res.status(400).json({
          error: { message: 'email is already in use' },
        });
      }
    }

    const { oldPassword } = req.body;

    if (oldPassword && !(await user.checkPassword(oldPassword))) {
      return res
        .status(401)
        .json({ error: { message: 'Old password does not match' } });
    }

    const { name, email } = await user.update(req.body);

    return res.json({ id, name, email });
  }
}

export default new UserController();
