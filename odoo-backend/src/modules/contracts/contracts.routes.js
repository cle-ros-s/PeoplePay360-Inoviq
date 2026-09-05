const express = require('express');
const contractsController = require('./contracts.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { requireRole } = require('../../middleware/rbac.middleware');
const { scopeEmployee } = require('../../middleware/scopeEmployee.middleware');
const { validate } = require('../../middleware/validate.middleware');
const {
  createContractSchema,
  updateContractSchema,
  listContractsSchema,
  getContractByIdSchema,
} = require('./contracts.schema');

const router = express.Router();

router.use(authenticate);

router.get('/', scopeEmployee, validate(listContractsSchema), contractsController.listContracts);
router.get('/:id', scopeEmployee, validate(getContractByIdSchema), contractsController.getContractById);

router.post(
  '/',
  requireRole('ADMIN', 'HR_MANAGER', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER'),
  validate(createContractSchema),
  contractsController.createContract
);

router.patch(
  '/:id',
  requireRole('ADMIN', 'HR_MANAGER', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER'),
  validate(updateContractSchema),
  contractsController.updateContract
);

router.delete(
  '/:id',
  requireRole('ADMIN', 'HR_MANAGER', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER'),
  validate(getContractByIdSchema),
  contractsController.deleteContract
);

module.exports = router;
