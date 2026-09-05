const departmentsService = require('./departments.service');

async function listDepartments(req, res, next) {
  try {
    const result = await departmentsService.listDepartments(req.query);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function getDepartmentById(req, res, next) {
  try {
    const result = await departmentsService.getDepartmentById(req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function createDepartment(req, res, next) {
  try {
    const result = await departmentsService.createDepartment(req.body);
    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

async function updateDepartment(req, res, next) {
  try {
    const result = await departmentsService.updateDepartment(req.params.id, req.body);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function deleteDepartment(req, res, next) {
  try {
    const result = await departmentsService.deleteDepartment(req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
};
