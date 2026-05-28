import React, { useState, useRef, useEffect } from "react";
import { api } from "../api/client";
import { validateStep, validateAllSteps } from "../validation"
import FieldRenderer from "./FieldRenderer";
import StepperHeader from "./StepperHeader";
import UnsavedWarningModal from "./UnsavedwarningModal";

export default function FormModal({ submission, config, onClose, onUpdate }) {
  const [currentStep, setCurrentStep] = useState(submission.currentStep || 0);
  const [answers, setAnswers] = useState(() => {
    const init = {};
    config.steps.forEach((s) => { init[s.id] = { ...(submission.answers?.[s.id] || {}) }; });
    return init;
  });
  const [completedSteps, setCompletedSteps] = useState(submission.completedSteps || []);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [unsaved, setUnsaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [warnPending, setWarnPending] = useState(null); // null | "close" | stepIndex
  const savedAnswers = useRef(JSON.parse(JSON.stringify(answers)));
  const isCompleted = submission.status === "completed";
  const step = config.steps[currentStep];
  const isLastStep = currentStep === config.steps.length - 1;

  // Track unsaved state
  useEffect(() => {
    const changed = JSON.stringify(answers[step.id]) !== JSON.stringify(savedAnswers.current[step.id]);
    setUnsaved(changed);
  }, [answers, step.id]);

  // Warn on browser back/refresh
  useEffect(() => {
    const handler = (e) => {
      if (unsaved) { e.preventDefault(); e.returnValue = ""; }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [unsaved]);

  const handleFieldChange = (fieldId, value) => {
    setAnswers((prev) => ({ ...prev, [step.id]: { ...prev[step.id], [fieldId]: value } }));
    setErrors((prev) => ({ ...prev, [fieldId]: null }));
    setTouched((prev) => ({ ...prev, [fieldId]: true }));
    setSubmitError(null);
  };

  const doSave = async (moveNext = false) => {
    // Client-side validation before saving
    if (moveNext) {
      const { valid, errors: stepErrors } = validateStep(step, answers[step.id]);
      if (!valid) {
        setErrors(stepErrors);
        const allTouched = {};
        step.fields.forEach((f) => { allTouched[f.id] = true; });
        setTouched((prev) => ({ ...prev, ...allTouched }));
        return false;
      }
    }

    setLoading(true);
    setSubmitError(null);
    try {
      const res = await api.saveStep(submission.id, currentStep, answers[step.id], moveNext);
      savedAnswers.current = JSON.parse(JSON.stringify(answers));
      setUnsaved(false);
      setCompletedSteps(res.data.completedSteps);
      onUpdate(res.data);
      if (moveNext && currentStep < config.steps.length - 1) {
        setCurrentStep((s) => s + 1);
        setErrors({});
        setTouched({});
      }
      return true;
    } catch (e) {
      setSubmitError(e.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const attemptNavigate = (target) => {
    if (unsaved) { setWarnPending(target); return; }
    executeNavigate(target);
  };

  const executeNavigate = (target) => {
    if (target === "close") { onClose(); return; }
    setCurrentStep(target);
    setErrors({});
    setTouched({});
  };

  const handleWarnSave = async () => {
    const saved = await doSave(false);
    if (saved) { setWarnPending(null); executeNavigate(warnPending); }
  };

  const handleWarnDiscard = () => {
    setAnswers((prev) => ({ ...prev, [step.id]: { ...(savedAnswers.current[step.id] || {}) } }));
    setUnsaved(false);
    const target = warnPending;
    setWarnPending(null);
    executeNavigate(target);
  };

  const handleSubmit = async () => {
    const { valid, stepErrors } = validateAllSteps(config, answers);
    if (!valid) {
      const firstStepId = Object.keys(stepErrors)[0];
      const idx = config.steps.findIndex((s) => s.id === firstStepId);
      setSubmitError("Please complete all required fields.");
      if (idx !== -1) setCurrentStep(idx);
      setErrors(stepErrors[firstStepId] || {});
      const allTouched = {};
      config.steps[idx]?.fields.forEach((f) => { allTouched[f.id] = true; });
      setTouched(allTouched);
      return;
    }
    // Save last step first, then submit
    await doSave(false);
    setLoading(true);
    try {
      const res = await api.submitForm(submission.id);
      onUpdate(res.data);
      onClose();
    } catch (e) {
      setSubmitError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="modal">
        {warnPending !== null && (
          <UnsavedWarningModal onSave={handleWarnSave} onDiscard={handleWarnDiscard} />
        )}

        {/* Header */}
        <div className="modal-top">
          <div>
            <div id="modal-title" className="modal-submission-title">{submission.title}</div>
            <div className="modal-config-name">{config.title}</div>
          </div>
          <button className="modal-close" onClick={() => attemptNavigate("close")} aria-label="Close">×</button>
        </div>

        {unsaved && !isCompleted && (
          <div className="unsaved-banner">✏️ Unsaved changes on this step</div>
        )}

        <StepperHeader
          steps={config.steps}
          currentStep={currentStep}
          completedSteps={completedSteps}
          onStepClick={(i) => attemptNavigate(i)}
        />

        {/* Step fields */}
        <div className="modal-body">
          {step.fields.map((field) => (
            <FieldRenderer
              key={field.id}
              field={field}
              value={answers[step.id]?.[field.id]}
              onChange={isCompleted ? () => {} : handleFieldChange}
              error={errors[field.id]}
              touched={touched[field.id]}
            />
          ))}
        </div>

        {submitError && <div className="error-banner" role="alert">{submitError}</div>}

        {/* Footer */}
        {!isCompleted && (
          <div className="modal-footer">
            <div>
              {currentStep > 0 && (
                <button className="btn btn-secondary" onClick={() => attemptNavigate(currentStep - 1)} disabled={loading}>
                  Back
                </button>
              )}
            </div>
            <div className="footer-right">
              <button className="btn btn-secondary" onClick={() => doSave(false)} disabled={loading}>
                {loading ? "Saving..." : "Save"}
              </button>
              {!isLastStep ? (
                <button className="btn btn-primary" onClick={() => doSave(true)} disabled={loading}>
                  Save and Next
                </button>
              ) : (
                <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
                  {loading ? "Submitting..." : "Submit"}
                </button>
              )}
            </div>
          </div>
        )}

        {isCompleted && (
          <div className="modal-footer">
            <div />
            <button className="btn btn-secondary" onClick={onClose}>Close</button>
          </div>
        )}
      </div>
    </div>
  );
}