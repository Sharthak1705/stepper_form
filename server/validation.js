/**
 * Validates a single field value against its config.
 * Returns an error string or null if valid.
 */
function validateField(field, value) {
  const isEmpty = value === undefined || value === null || value.toString().trim() === "";

  if (field.required && isEmpty) {
    return `${field.label} is required`;
  }

  if (!isEmpty && field.validation) {
    const v = field.validation;
    if (v.pattern) {
      const regex = new RegExp(v.pattern);
      if (!regex.test(value)) return v.message || "Invalid format";
    }
    if (v.min !== undefined && Number(value) < v.min) return `Must be at least ${v.min}`;
    if (v.max !== undefined && Number(value) > v.max) return `Must be at most ${v.max}`;
  }

  if (!isEmpty && field.type === "select" && field.options) {
    if (!field.options.includes(value)) return "Invalid option selected";
  }

  if (!isEmpty && field.type === "radio" && field.options) {
    if (!field.options.includes(value)) return "Invalid option selected";
  }

  return null;
}

/**
 * Validates all fields in a step.
 * Returns { valid: bool, errors: { fieldId: message } }
 */
function validateStep(step, answers = {}) {
  const errors = {};
  for (const field of step.fields) {
    const err = validateField(field, answers[field.id]);
    if (err) errors[field.id] = err;
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

/**
 * Validates the entire form (all steps) for submission.
 * Returns { valid: bool, stepErrors: { stepId: { fieldId: message } } }
 */
function validateForm(config, allAnswers = {}) {
  const stepErrors = {};
  let valid = true;
  for (const step of config.steps) {
    const { valid: stepValid, errors } = validateStep(step, allAnswers[step.id] || {});
    if (!stepValid) {
      stepErrors[step.id] = errors;
      valid = false;
    }
  }
  return { valid, stepErrors };
}

/**
 * Determines if a step is "completed" — all required fields are valid.
 */
function isStepComplete(step, answers = {}) {
  const { valid } = validateStep(step, answers);
  // A step with only optional fields counts as completed when it has been visited (answers object exists)
  const hasRequiredFields = step.fields.some(f => f.required);
  if (!hasRequiredFields) return true;
  return valid;
}

module.exports = { validateField, validateStep, validateForm, isStepComplete };