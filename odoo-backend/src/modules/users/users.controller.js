const usersService = require('./users.service');

async function listUsers(req, res, next) {
  try {
    const result = await usersService.listUsers(req.query);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function getUserById(req, res, next) {
  try {
    const result = await usersService.getUserById(req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function createUser(req, res, next) {
  try {
    const result = await usersService.createUser(req.body);
    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

async function updateUser(req, res, next) {
  try {
    const result = await usersService.updateUser(req.params.id, req.body);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function deleteUser(req, res, next) {
  try {
    const result = await usersService.deleteUser(req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
