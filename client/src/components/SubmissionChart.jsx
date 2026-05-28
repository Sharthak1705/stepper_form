import React from "react";

export default function SubmissionCard({ submission, onOpen, onDelete }) {
  const { completed, total } = submission.progress;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="submission-card">
      <div className="card-main">
        <div className="card-header-row">
          <span className="card-title">{submission.title}</span>
          <span className={`badge badge-${submission.status}`}>{submission.status}</span>
        </div>
        <div className="progress-row">
          <div className="progress-bar-track">
            <div
              className="progress-bar-fill"
              style={{ width: `${pct}%` }}
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
          <span className="progress-label">{completed}/{total} steps</span>
        </div>
      </div>
      <div className="card-actions">
        <button
          className={`btn btn-sm ${submission.status === "completed" ? "btn-secondary" : "btn-primary"}`}
          onClick={() => onOpen(submission.id)}
        >
          {submission.status === "completed" ? "View" : "Continue"}
        </button>
        <button
          className="btn btn-sm btn-danger"
          onClick={() => onDelete(submission.id)}
        >
          Delete
        </button>
      </div>
    </div>
  );
}