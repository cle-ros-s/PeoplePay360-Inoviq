const { verifyToken } = require('../utils/jwt');
const { formatErrorResponse } = require('../utils/responseFormatter');
const prisma = require('../config/prisma');

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json(formatErrorResponse('UNAUTHORIZED', 'Authentication token required'));
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      return res.status(401).json(formatErrorResponse('UNAUTHORIZED', 'Invalid or expired token'));
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      include: {
        employee: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    if (!user) {
      return res.status(401).json(formatErrorResponse('UNAUTHORIZED', 'User not found'));
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      employeeId: user.employee ? user.employee.id : null,
      employee: user.employee,
    };

    next();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  authenticate,
};
