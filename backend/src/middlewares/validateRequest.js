import ApiError from '../utils/ApiError.js';

/**
 * Generic Joi-schema validation middleware.
 * Usage: router.post('/', validateRequest(schema), controller)
 */
const validateRequest = (schema, property = 'body') => (req, res, next) => {
  const { error } = schema.validate(req[property], { abortEarly: false });
  if (error) {
    const details = error.details.map((d) => d.message);
    return next(new ApiError(400, 'Validation failed', details));
  }
  return next();
};

export default validateRequest;
