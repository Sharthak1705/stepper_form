import React from "react";

export default function StepperHeader({ steps, currentStep, completedSteps, onStepClick }) {
  return (
    <div className="stepper-header" role="tablist" aria-label="Form steps">
      {steps.map((step, i) => {
        const isCompleted = completedSteps.includes(step.id);
        const isCurrent = i === currentStep;
        const state = isCurrent ? "current" : isCompleted ? "completed" : "upcoming";
        return (
          <button
            key={step.id}
            role="tab"
            aria-selected={isCurrent}
            aria-label={`Step ${i + 1}: ${step.title}${isCompleted ? " (completed)" : ""}`}
            className={`stepper-step stepper-step--${state}`}
            onClick={() => onStepClick(i)}
          >
            <div className="stepper-bar" />
            <span className="stepper-label">{step.title}</span>
          </button>
        );
      })}
    </div>
  );
}