import React from "react";

export default function UnsavedWarningModal({ onDiscard, onSave }) {
  return (
    <div className="warning-overlay" role="alertdialog" aria-modal="true" aria-labelledby="warn-title">
      <div className="warning-icon">⚠️</div>
      <h3 id="warn-title" className="warning-title">Unsaved changes</h3>
      <p className="warning-body">
        You have unsaved changes on this step. What would you like to do?
      </p>
      <div className="warning-actions">
        <button className="btn btn-secondary" onClick={onDiscard}>Discard changes</button>
        <button className="btn btn-primary" onClick={onSave}>Save &amp; continue</button>
      </div>
    </div>
  );
}