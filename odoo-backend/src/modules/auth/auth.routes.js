const express = require('express');
const authController = require('./auth.controller');
const { validate } = require('../../middleware/validate.middleware');
const { loginSchema } = require('./auth.schema');
const { authenticate } = require('../../middleware/auth.middleware');

const router = express.Router();

router.post('/login', validate(loginSchema), authController.login);
router.get('/me', authenticate, authController.getMe);

module.exports = router;
