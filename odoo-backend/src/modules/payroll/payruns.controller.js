const payrunsService = require('./payruns.service');

async function getEligibleEmployees(req, res, next) {
  try {
    const result = await payrunsService.getEligibleEmployees(req.query);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function listPayruns(req, res, next) {
  try {
    const result = await payrunsService.listPayruns(req.query);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function getPayrunById(req, res, next) {
  try {
    const result = await payrunsService.getPayrunById(req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function createPayrun(req, res, next) {
  try {
    const result = await payrunsService.createPayrun(req.body);
    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

async function computePayrun(req, res, next) {
  try {
    const result = await payrunsService.computePayrun(req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function validatePayrun(req, res, next) {
  try {
    const result = await payrunsService.validatePayrun(req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function markPayrunAsPaid(req, res, next) {
  try {
    const result = await payrunsService.markPayrunAsPaid(req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function sendPayrunPayslips(req, res, next) {
  try {
    const result = await payrunsService.sendBulkPayrunPayslips(req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function deletePayrun(req, res, next) {
  try {
    const result = await payrunsService.deletePayrun(req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getEligibleEmployees,
  listPayruns,
  getPayrunById,
  createPayrun,
  computePayrun,
  validatePayrun,
  markPayrunAsPaid,
  sendPayrunPayslips,
  deletePayrun,
};
