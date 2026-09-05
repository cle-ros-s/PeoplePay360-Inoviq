const express = require('express');
const usersController = require('./users.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { requireRole } = require('../../middleware/rbac.middleware');
const { validate } = require('../../middleware/validate.middleware');
const {
  createUserSchema,
  updateUserSchema,
  listUsersSchema,
  getUserByIdSchema,
} = require('./users.schema');

const router = express.Router();

router.use(authenticate);
router.use(requireRole('ADMIN'));

router.get('/', validate(listUsersSchema), usersController.listUsers);
router.get('/:id', validate(getUserByIdSchema), usersController.getUserById);
router.post('/', validate(createUserSchema), usersController.createUser);
router.patch('/:id', validate(updateUserSchema), usersController.updateUser);
router.delete('/:id', validate(getUserByIdSchema), usersController.deleteUser);

module.exports = router;
