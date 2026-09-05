const employeesService = require('./employees.service');

async function listEmployees(req, res, next) {
  try {
    const result = await employeesService.listEmployees(req.query, req.scopedEmployeeId);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function getEmployeeById(req, res, next) {
  try {
    const result = await employeesService.getEmployeeById(req.params.id, req.scopedEmployeeId);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function createEmployee(req, res, next) {
  try {
    const result = await employeesService.createEmployee(req.body);
    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

async function updateEmployee(req, res, next) {
  try {
    const result = await employeesService.updateEmployee(req.params.id, req.body);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function deleteEmployee(req, res, next) {
  try {
    const result = await employeesService.deleteEmployee(req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
};
