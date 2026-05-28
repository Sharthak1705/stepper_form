import React from "react";

export default function FieldRenderer({ field, value, onChange, error, touched }) {
  const handleChange = (v) => onChange(field.id, v);
  const hasError = touched && error;

  return (
    <div className="field-group">
      {field.type !== "radio" && (
        <label className="field-label">
          {field.label}
          {field.required && <span className="required-star"> *</span>}
        </label>
      )}

      {field.type === "text" && (
        <input
          type="text"
          className={hasError ? "field-input error" : "field-input"}
          value={value || ""}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={field.placeholder}
          aria-invalid={!!hasError}
          aria-describedby={hasError ? `${field.id}-error` : undefined}
        />
      )}

      {field.type === "select" && (
        <select
          className={hasError ? "field-input error" : "field-input"}
          value={value || ""}
          onChange={(e) => handleChange(e.target.value)}
          aria-invalid={!!hasError}
        >
          <option value="">Select...</option>
          {field.options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      )}

      {field.type === "radio" && (
        <fieldset className="radio-fieldset">
          <legend className="field-label">
            {field.label}
            {field.required && <span className="required-star"> *</span>}
          </legend>
          <div className="radio-group">
            {field.options.map((opt) => (
              <label key={opt} className="radio-label">
                <input
                  type="radio"
                  name={field.id}
                  value={opt}
                  checked={value === opt}
                  onChange={() => handleChange(opt)}
                  className="radio-input"
                />
                {opt}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {hasError && (
        <span id={`${field.id}-error`} className="field-error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}