import React, { useState, useEffect, useCallback } from "react";
import { api } from "./api/client";
import SubmissionCard from "./components/SubmissionChart";
import FormModal from "./components/FormModal";

export default function App() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSubmission, setActiveSubmission] = useState(null);
  const [activeConfig, setActiveConfig] = useState(null);
  const [creating, setCreating] = useState(false);

  const fetchSubmissions = useCallback(async () => {
    try {
      const res = await api.listSubmissions();
      setSubmissions(res.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSubmissions(); }, [fetchSubmissions]);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await api.createSubmission("wellness-intake");
      const sub = res.data;
      const configRes = await api.getConfig(sub.configId);
      setActiveSubmission(sub);
      setActiveConfig(configRes.data);
      fetchSubmissions();
    } catch (e) {
      setError(e.message);
    } finally {
      setCreating(false);
    }
  };

  const handleOpen = async (id) => {
    try {
      const [subRes] = await Promise.all([api.getSubmission(id)]);
      const sub = subRes.data;
      const configRes = await api.getConfig(sub.configId);
      setActiveSubmission(sub);
      setActiveConfig(configRes.data);
    } catch (e) {
      setError(e.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this submission?")) return;
    try {
      await api.deleteSubmission(id);
      fetchSubmissions();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleUpdate = (updated) => {
    setActiveSubmission(updated);
    fetchSubmissions();
  };

  const handleClose = () => {
    setActiveSubmission(null);
    setActiveConfig(null);
    fetchSubmissions();
  };

  return (
    <div className="app">
      <div className="container">
        {/* Page header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">My Forms</h1>
            <p className="page-subtitle">
              {submissions.length} submission{submissions.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button className="btn btn-primary" onClick={handleCreate} disabled={creating}>
            {creating ? "Creating..." : "+ New Submission"}
          </button>
        </div>

        {error && (
          <div className="error-banner" role="alert">
            {error}
            <button className="error-dismiss" onClick={() => setError(null)}>×</button>
          </div>
        )}

        {loading ? (
          <div className="loading-state">Loading submissions…</div>
        ) : submissions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <div className="empty-title">No submissions yet</div>
            <div className="empty-body">Click "New Submission" to get started</div>
          </div>
        ) : (
          <div className="submissions-list">
            {submissions.map((sub) => (
              <SubmissionCard
                key={sub.id}
                submission={sub}
                onOpen={handleOpen}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {activeSubmission && activeConfig && (
        <FormModal
          key={activeSubmission.id}
          submission={activeSubmission}
          config={activeConfig}
          onClose={handleClose}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
}