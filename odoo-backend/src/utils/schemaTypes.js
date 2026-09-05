const { z } = require('zod');

// Accepts either YYYY-MM-DD or ISO datetime strings
const flexibleDate = z.string().refine((val) => !isNaN(Date.parse(val)), {
  message: 'Must be a valid date string (e.g. YYYY-MM-DD or ISO 8601)',
});

const optionalFlexibleDate = z
  .union([
    z.string().refine((val) => val === '' || !isNaN(Date.parse(val)), {
      message: 'Must be a valid date string',
    }),
    z.null(),
    z.undefined(),
  ])
  .transform((val) => (val === '' ? null : val));

// Coerces empty string "" to null for optional UUID references
const optionalUuid = z
  .union([z.string().uuid('Invalid UUID'), z.literal(''), z.null(), z.undefined()])
  .transform((val) => (val === '' ? null : val));

const requiredUuid = (msg = 'Invalid UUID') => z.string().uuid(msg);

const flexiblePositiveNumber = (msg = 'Must be a positive number') => z.coerce.number().positive(msg);
const flexibleNonNegativeNumber = (msg = 'Must be a non-negative number') => z.coerce.number().min(0, msg);
const optionalNumber = z.coerce.number().nullable().optional();

module.exports = {
  flexibleDate,
  optionalFlexibleDate,
  optionalUuid,
  requiredUuid,
  flexiblePositiveNumber,
  flexibleNonNegativeNumber,
  optionalNumber,
};
