const prisma = require('../../config/prisma');
const { comparePassword } = require('../../utils/password');
const { signToken } = require('../../utils/jwt');
const { AppError } = require('../../utils/responseFormatter');

const meCache = new Map();
const ME_CACHE_TTL = 5 * 60 * 1000;

function invalidateMeCache(userId) {
  if (userId) meCache.delete(userId);
  else meCache.clear();
}

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
    email: user.email,
    name: user.name,
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
  const cached = meCache.get(userId);
  if (cached && Date.now() - cached.timestamp < ME_CACHE_TTL) {
    return cached.data;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      employee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          jobPosition: true,
          departmentId: true,
          department: {
            select: { id: true, name: true, code: true },
          },
        },
      },
    },
  });

  if (!user) {
    throw new AppError('USER_NOT_FOUND', 'User record not found', 404);
  }

  const resData = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    employeeId: user.employee ? user.employee.id : null,
    employee: user.employee,
  };

  meCache.set(userId, { timestamp: Date.now(), data: resData });
  return resData;
}

module.exports = {
  login,
  getMe,
  invalidateMeCache,
};
