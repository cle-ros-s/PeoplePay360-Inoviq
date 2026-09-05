const prisma = require('../../config/prisma');
const { hashPassword } = require('../../utils/password');
const { getPaginationParams } = require('../../utils/pagination');
const { formatListResponse, AppError } = require('../../utils/responseFormatter');
const { globalCache } = require('../../utils/cache');

function invalidateUserCache() {
  globalCache.invalidatePrefix('users:');
}

async function listUsers(query) {
  const { page, pageSize, skip, take } = getPaginationParams(query);
  const { search, role } = query;
  const cacheKey = `users:list:${search || ''}:${role || ''}:${page}:${pageSize}`;

  return globalCache.getOrFetch(cacheKey, async () => {
    const where = {};
    if (role) {
      where.role = role;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          employee: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return formatListResponse(users, total, page, pageSize);
  }, 60000);
}

async function getUserById(id) {
  const cacheKey = `users:detail:${id}`;

  return globalCache.getOrFetch(cacheKey, async () => {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        employee: {
          select: { id: true, firstName: true, lastName: true, jobPosition: true, departmentId: true },
        },
      },
    });

    if (!user) {
      throw new AppError('USER_NOT_FOUND', 'User not found', 404);
    }

    return user;
  }, 60000);
}

async function createUser(data) {
  const existing = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase().trim() },
  });
  if (existing) {
    throw new AppError('DUPLICATE_EMAIL', 'A user with this email already exists', 409);
  }

  const passwordHash = await hashPassword(data.password);

  const user = await prisma.user.create({
    data: {
      email: data.email.toLowerCase().trim(),
      passwordHash,
      name: data.name,
      role: data.role || 'EMPLOYEE',
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  invalidateUserCache();
  return user;
}

async function updateUser(id, data) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new AppError('USER_NOT_FOUND', 'User not found', 404);
  }

  const updateData = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.role !== undefined) updateData.role = data.role;
  if (data.email !== undefined) {
    const email = data.email.toLowerCase().trim();
    if (email !== user.email) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        throw new AppError('DUPLICATE_EMAIL', 'A user with this email already exists', 409);
      }
      updateData.email = email;
    }
  }
  if (data.password) {
    updateData.passwordHash = await hashPassword(data.password);
  }

  const updated = await prisma.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      employee: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });

  invalidateUserCache();
  return updated;
}

async function deleteUser(id) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new AppError('USER_NOT_FOUND', 'User not found', 404);
  }

  await prisma.user.delete({ where: { id } });
  invalidateUserCache();
  return { message: 'User deleted successfully' };
}

module.exports = {
  listUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  invalidateUserCache,
};

