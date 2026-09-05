const authService = require('./auth.service');

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function getMe(req, res, next) {
  try {
    if (req.user && req.user.id && req.user.email) {
      return res.status(200).json(req.user);
    }
    const user = await authService.getMe(req.user.id);
    return res.status(200).json(user);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  login,
  getMe,
};
