
export function validateField(field, value) {

  const isEmpty =
    value === undefined ||
    value === null ||
    String(value).trim() === "";



  // =========================
  // Required validation
  // =========================

  if (field.required && isEmpty) {
    return `${field.label} is required`;
  }



  // Optional empty field
  if (isEmpty) {
    return null;
  }



  // =========================
  // Custom validation
  // =========================

  if (field.validation) {

    const v = field.validation;



    // Regex pattern
    if (v.pattern) {

      const regex = new RegExp(v.pattern);

      if (!regex.test(String(value))) {
        return v.message || "Invalid format";
      }
    }



    // Min validation
    if (
      v.min !== undefined &&
      !isNaN(Number(value)) &&
      Number(value) < v.min
    ) {
      return `Must be at least ${v.min}`;
    }



    // Max validation
    if (
      v.max !== undefined &&
      !isNaN(Number(value)) &&
      Number(value) > v.max
    ) {
      return `Must be at most ${v.max}`;
    }
  }



  // =========================
  // Select validation
  // =========================

  if (
    field.type === "select" &&
    Array.isArray(field.options)
  ) {

    if (!field.options.includes(value)) {
      return "Invalid selection";
    }
  }



  // =========================
  // Radio validation
  // =========================

  if (
    field.type === "radio" &&
    Array.isArray(field.options)
  ) {

    if (!field.options.includes(value)) {
      return "Invalid selection";
    }
  }



  return null;
}




export function validateStep(
  step,
  answers = {}
) {

  const errors = {};

  for (const field of step.fields) {

    const err = validateField(
      field,
      answers[field.id]
    );

    if (err) {
      errors[field.id] = err;
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}




export function validateAllSteps(
  config,
  allAnswers = {}
) {

  const stepErrors = {};

  let valid = true;

  for (const step of config.steps) {

    const {
      valid: stepValid,
      errors,
    } = validateStep(
      step,
      allAnswers[step.id] || {}
    );

    if (!stepValid) {

      stepErrors[step.id] = errors;

      valid = false;
    }
  }

  return {
    valid,
    stepErrors,
  };
}

