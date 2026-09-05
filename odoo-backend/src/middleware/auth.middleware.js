const { verifyToken } = require('../utils/jwt');
const { formatErrorResponse } = require('../utils/responseFormatter');
const prisma = require('../config/prisma');

// In-memory cache for user auth tokens to bypass DB queries on every HTTP request
const userAuthCache = new Map();
const USER_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function authenticate(req, res, next) {
  try {
    let token = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.query && req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json(formatErrorResponse('UNAUTHORIZED', 'Authentication token required'));
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      return res.status(401).json(formatErrorResponse('UNAUTHORIZED', 'Invalid or expired token'));
    }

    const userId = decoded.sub;
    const now = Date.now();

    // Zero-DB Fast-Path: If JWT token contains full user metadata, populate req.user in 0.001ms
    if (decoded.sub && decoded.role && (decoded.email || decoded.name)) {
      req.user = {
        id: decoded.sub,
        email: decoded.email || decoded.sub,
        name: decoded.name || 'User',
        role: decoded.role,
        employeeId: decoded.employeeId || null,
        employee: decoded.employeeId ? { id: decoded.employeeId } : null,
      };
      userAuthCache.set(userId, { timestamp: now, user: req.user });
      return next();
    }

    const cachedUser = userAuthCache.get(userId);
    if (cachedUser && now - cachedUser.timestamp < USER_CACHE_TTL) {
      req.user = cachedUser.user;
      return next();
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        employee: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    if (!user) {
      return res.status(401).json(formatErrorResponse('UNAUTHORIZED', 'User not found'));
    }

    const reqUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      employeeId: user.employee ? user.employee.id : null,
      employee: user.employee,
    };

    userAuthCache.set(userId, { timestamp: now, user: reqUser });
    req.user = reqUser;

    next();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  authenticate,
};
