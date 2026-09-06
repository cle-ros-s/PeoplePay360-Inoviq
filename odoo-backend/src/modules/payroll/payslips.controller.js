const payslipsService = require('./payslips.service');

async function listPayslips(req, res, next) {
  try {
    const result = await payslipsService.listPayslips(req.query, req.scopedEmployeeId);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function getPayslipById(req, res, next) {
  try {
    const result = await payslipsService.getPayslipById(req.params.id, req.scopedEmployeeId);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function updatePayslip(req, res, next) {
  try {
    const result = await payslipsService.updatePayslip(req.params.id, req.body);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function getPayslipPdf(req, res, next) {
  try {
    const pdfBuffer = await payslipsService.getPayslipPdf(req.params.id, req.scopedEmployeeId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', pdfBuffer.length);
    res.setHeader('Content-Disposition', `inline; filename="payslip-${req.params.id}.pdf"`);
    return res.status(200).end(pdfBuffer);
  } catch (error) {
    next(error);
  }
}

async function sendPayslipEmail(req, res, next) {
  try {
    const customRecipient = req.body?.recipientEmail || req.body?.email;
    const result = await payslipsService.sendSinglePayslipEmail(req.params.id, customRecipient);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listPayslips,
  getPayslipById,
  updatePayslip,
  getPayslipPdf,
  sendPayslipEmail,
};
