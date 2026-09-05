const prisma = require('../../config/prisma');
const { comparePassword } = require('../../utils/password');
const { signToken } = require('../../utils/jwt');
const { AppError } = require('../../utils/responseFormatter');

async function login(email, password) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    include: {
      employee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          jobPosition: true,
          departmentId: true,
        },
      },
    },
  });

  if (!user) {
    throw new AppError('INVALID_CREDENTIALS', 'Invalid email or password', 401);
  }

  const isValidPassword = await comparePassword(password, user.passwordHash);
  if (!isValidPassword) {
    throw new AppError('INVALID_CREDENTIALS', 'Invalid email or password', 401);
  }

  const token = signToken({
    id: user.id,
    role: user.role,
    employeeId: user.employee ? user.employee.id : null,
  });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      employeeId: user.employee ? user.employee.id : null,
      employee: user.employee,
    },
  };
}

async function getMe(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      employee: {
        include: {
          department: true,
          schedule: true,
        },
      },
    },
  });

  if (!user) {
    throw new AppError('USER_NOT_FOUND', 'User record not found', 404);
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    employeeId: user.employee ? user.employee.id : null,
    employee: user.employee,
  };
}

module.exports = {
  login,
  getMe,
};
