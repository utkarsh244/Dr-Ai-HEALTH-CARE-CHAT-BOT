import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./AdminPanel.css";
import BACKEND_URL from "./config";

export default function AdminPanel({ onClose }) {
  const [documents, setDocuments]   = useState({});
  const [uploading, setUploading]   = useState(false);
  const [ragStatus, setRagStatus]   = useState(null);
  const [source, setSource]         = useState("Admin Upload");
  const [tags, setTags]             = useState("");
  const [toast, setToast]           = useState("");
  const [dragOver, setDragOver]     = useState(false);
  const fileInputRef                = useRef();

  useEffect(() => {
    fetchStatus();
    fetchDocuments();
  }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const fetchStatus = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/admin/rag-status`);
      setRagStatus(res.data);
    } catch { setRagStatus({ status: "error" }); }
  };

  const fetchDocuments = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/admin/documents`);
      setDocuments(res.data.documents || {});
    } catch(e) { console.error(e); }
  };

  const handleUpload = async (file) => {
    if (!file || !file.name.endsWith(".pdf")) {
      showToast("⚠️ Please select a PDF file"); return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("source", source || "Admin Upload");
      fd.append("tags", tags);
      await axios.post(`${BACKEND_URL}/admin/upload-pdf`, fd);
      showToast("✅ PDF uploaded! Processing in background...");
      // Poll for status update
      setTimeout(() => { fetchDocuments(); fetchStatus(); }, 3000);
      setTimeout(() => { fetchDocuments(); fetchStatus(); }, 8000);
    } catch(e) {
      showToast("❌ Upload failed. Is the backend running?");
    } finally { setUploading(false); }
  };

  const handleDelete = async (docId, filename) => {
    if (!window.confirm(`Delete "${filename}" from RAG?`)) return;
    try {
      await axios.delete(`${BACKEND_URL}/admin/delete-pdf/${docId}`);
      setDocuments(prev => { const updated = {...prev}; delete updated[docId]; return updated; });
      showToast("🗑️ Document removed from RAG");
      fetchStatus();
    } catch { showToast("❌ Delete failed"); }
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

  const docList = Object.entries(documents);

  return (
    <div className="admin-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="admin-panel">
        {/* Header */}
        <div className="admin-header">
          <div className="admin-title">
            <span className="admin-icon">🛠️</span>
            <div>
              <h2>RAG Admin Panel</h2>
              <p>Manage medical knowledge base</p>
            </div>
          </div>
          <button className="admin-close" onClick={onClose}>✕</button>
        </div>

        {/* RAG Status */}
        {ragStatus && (
          <div className={`rag-status ${ragStatus.status === "healthy" ? "healthy" : "error"}`}>
            <span>{ragStatus.status === "healthy" ? "🟢" : "🔴"}</span>
            <span>
              {ragStatus.status === "healthy"
                ? `RAG Active — ${ragStatus.total_chunks?.toLocaleString()} chunks indexed across ${ragStatus.total_documents} documents`
                : "RAG Unavailable — Check if backend is running"}
            </span>
            <button className="refresh-btn" onClick={() => { fetchStatus(); fetchDocuments(); }}>↻</button>
          </div>
        )}

        {/* Upload Area */}
        <div className="upload-section">
          <h3>Upload New PDF</h3>

          <div className="upload-meta">
            <input
              type="text" placeholder="Source (e.g. WHO Guidelines)"
              value={source} onChange={e => setSource(e.target.value)}
              className="admin-input"
            />
            <input
              type="text" placeholder="Tags (e.g. cardiology, diabetes)"
              value={tags} onChange={e => setTags(e.target.value)}
              className="admin-input"
            />
          </div>

          <div
            className={`drop-zone ${dragOver ? "drag-over" : ""} ${uploading ? "uploading" : ""}`}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => !uploading && fileInputRef.current?.click()}
          >
            {uploading ? (
              <>
                <div className="upload-spinner"></div>
                <p>Uploading and processing PDF...</p>
              </>
            ) : (
              <>
                <div className="drop-icon">📄</div>
                <p><strong>Drop PDF here</strong> or click to browse</p>
                <small>Supports all medical PDFs — will be indexed into RAG immediately</small>
              </>
            )}
            <input ref={fileInputRef} type="file" accept=".pdf" style={{ display:"none" }}
              onChange={e => handleUpload(e.target.files[0])} />
          </div>
        </div>

        {/* Document List */}
        <div className="doc-section">
          <h3>Indexed Documents ({docList.length})</h3>

          {docList.length === 0 ? (
            <div className="doc-empty">No documents indexed yet. Upload a PDF to get started.</div>
          ) : (
            <div className="doc-list">
              {docList.map(([docId, doc]) => (
                <div key={docId} className="doc-item">
                  <div className="doc-icon">📑</div>
                  <div className="doc-info">
                    <div className="doc-name">{doc.filename}</div>
                    <div className="doc-meta">
                      {doc.source && <span className="doc-tag">{doc.source}</span>}
                      {doc.tags?.map((t, i) => t && <span key={i} className="doc-tag">{t}</span>)}
                      {doc.chunk_count > 0 && <span className="doc-chunks">{doc.chunk_count} chunks</span>}
                    </div>
                  </div>
                  <div className={`doc-status ${doc.status}`}>
                    {doc.status === "indexed"    && "✅ Indexed"}
                    {doc.status === "processing" && "⏳ Processing"}
                    {doc.status === "failed"     && "❌ Failed"}
                  </div>
                  <button className="doc-delete" onClick={() => handleDelete(docId, doc.filename)}
                    title="Remove from RAG">🗑️</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {toast && <div className="admin-toast">{toast}</div>}
      </div>
    </div>
  );
}
