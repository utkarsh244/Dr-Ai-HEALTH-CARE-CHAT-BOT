import React, { useState, useEffect } from "react";
import {
  loadFamilyMembers, addFamilyMember,
  updateFamilyMember, deleteFamilyMember
} from "./services/familyService";
import "./FamilyManager.css";

const AVATARS   = ["👤","👶","👦","👧","👩","👨","👴","👵","🧒","🧑","🧓","👩‍⚕️","👨‍⚕️"];
const RELATIONS = ["Spouse","Son","Daughter","Father","Mother","Brother","Sister","Grandfather","Grandmother","Uncle","Aunt","Other"];
const BLOOD_GROUPS = ["A+","A-","B+","B-","AB+","AB-","O+","O-","Unknown"];

const EMPTY_FORM = {
  name: "", relation: "", age: "", gender: "",
  bloodGroup: "", allergies: "", notes: "", avatar: "👤"
};

export default function FamilyManager({ currentUser, activeMember, onSwitchMember, onClose }) {
  const [members, setMembers]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [editingId, setEditingId]   = useState(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [saving, setSaving]         = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError]           = useState("");

  const selfMember = {
    id: "self", name: currentUser.displayName || currentUser.email?.split("@")[0] || "You",
    relation: "Myself", avatar: "👤", isSelf: true,
  };

  useEffect(() => { fetchMembers(); }, []);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const data = await loadFamilyMembers(currentUser.uid);
      setMembers(data);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  const openAdd = () => {
    setEditingId(null); setForm(EMPTY_FORM);
    setError(""); setShowForm(true);
  };

  const openEdit = (m) => {
    setEditingId(m.id);
    setForm({
      name: m.name, relation: m.relation, age: m.age || "",
      gender: m.gender || "", bloodGroup: m.bloodGroup || "",
      allergies: m.allergies || "", notes: m.notes || "", avatar: m.avatar || "👤"
    });
    setError(""); setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setError("Name is required"); return; }
    if (!form.relation)    { setError("Relation is required"); return; }
    setSaving(true); setError("");
    try {
      if (editingId) {
        await updateFamilyMember(currentUser.uid, editingId, form);
        setMembers(prev => prev.map(m => m.id === editingId ? { ...m, ...form } : m));
      } else {
        const newId = await addFamilyMember(currentUser.uid, form);
        setMembers(prev => [...prev, { id: newId, ...form }]);
      }
      setShowForm(false);
    } catch(e) { setError("Failed to save. Try again."); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Remove ${name} from family profiles?`)) return;
    setDeletingId(id);
    try {
      await deleteFamilyMember(currentUser.uid, id);
      setMembers(prev => prev.filter(m => m.id !== id));
      // If deleted member was active, switch to self
      if (activeMember?.id === id) onSwitchMember(selfMember);
    } catch(e) { console.error(e); }
    finally { setDeletingId(null); }
  };

  const allMembers = [selfMember, ...members];

  return (
    <div className="fm-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="fm-modal">

        {/* Header */}
        <div className="fm-header">
          <div className="fm-header-left">
            <div className="fm-logo">🧑‍🧑‍🧒‍🧒</div>
            <div>
              <h2>Family Profiles</h2>
              <p>Manage health profiles for your family</p>
            </div>
          </div>
          <button className="fm-close" onClick={onClose}>✕</button>
        </div>

        {/* Active member banner */}
        <div className="fm-active-banner">
          <span className="fm-active-label">Currently consulting for:</span>
          <span className="fm-active-name">
            {activeMember?.avatar} {activeMember?.name}
          </span>
        </div>

        {/* Member grid */}
        <div className="fm-body">
          {loading ? (
            <div className="fm-loading"><div className="fm-spinner" /><p>Loading profiles...</p></div>
          ) : (
            <div className="fm-grid">
              {allMembers.map(m => (
                <div key={m.id}
                  className={`fm-card ${activeMember?.id === m.id ? "active" : ""}`}
                  onClick={() => { onSwitchMember(m); onClose(); }}>

                  <div className="fm-card-avatar">{m.avatar || "👤"}</div>
                  <div className="fm-card-name">{m.name}</div>
                  <div className="fm-card-relation">{m.relation}</div>

                  {m.age && <div className="fm-card-detail">🎂 {m.age} yrs</div>}
                  {m.bloodGroup && m.bloodGroup !== "Unknown" &&
                    <div className="fm-card-detail">🩸 {m.bloodGroup}</div>}

                  {activeMember?.id === m.id &&
                    <div className="fm-active-badge">✓ Active</div>}

                  {!m.isSelf && (
                    <div className="fm-card-actions" onClick={e => e.stopPropagation()}>
                      <button className="fm-btn-edit" onClick={() => openEdit(m)}>✏️</button>
                      <button className="fm-btn-delete"
                        disabled={deletingId === m.id}
                        onClick={() => handleDelete(m.id, m.name)}>
                        {deletingId === m.id ? "..." : "🗑️"}
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {/* Add new card */}
              <div className="fm-card fm-card-add" onClick={openAdd}>
                <div className="fm-add-icon">+</div>
                <div className="fm-card-name">Add Member</div>
                <div className="fm-card-relation">Family profile</div>
              </div>
            </div>
          )}
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <div className="fm-form-overlay" onClick={e => e.target === e.currentTarget && setShowForm(false)}>
            <div className="fm-form">
              <div className="fm-form-header">
                <h3>{editingId ? "Edit Member" : "Add Family Member"}</h3>
                <button onClick={() => setShowForm(false)}>✕</button>
              </div>

              {/* Avatar picker */}
              <div className="fm-avatar-picker">
                {AVATARS.map(a => (
                  <button key={a}
                    className={`fm-avatar-btn ${form.avatar === a ? "selected" : ""}`}
                    onClick={() => setForm(p => ({ ...p, avatar: a }))}>
                    {a}
                  </button>
                ))}
              </div>

              <div className="fm-form-grid">
                <div className="fm-field">
                  <label>Name *</label>
                  <input type="text" placeholder="e.g. Priya"
                    value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                </div>

                <div className="fm-field">
                  <label>Relation *</label>
                  <select value={form.relation} onChange={e => setForm(p => ({ ...p, relation: e.target.value }))}>
                    <option value="">Select relation</option>
                    {RELATIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>

                <div className="fm-field">
                  <label>Age</label>
                  <input type="number" placeholder="e.g. 32" min="0" max="120"
                    value={form.age} onChange={e => setForm(p => ({ ...p, age: e.target.value }))} />
                </div>

                <div className="fm-field">
                  <label>Gender</label>
                  <select value={form.gender} onChange={e => setForm(p => ({ ...p, gender: e.target.value }))}>
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="fm-field">
                  <label>Blood Group</label>
                  <select value={form.bloodGroup} onChange={e => setForm(p => ({ ...p, bloodGroup: e.target.value }))}>
                    <option value="">Select</option>
                    {BLOOD_GROUPS.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>

                <div className="fm-field">
                  <label>Known Allergies</label>
                  <input type="text" placeholder="e.g. Penicillin, Peanuts"
                    value={form.allergies} onChange={e => setForm(p => ({ ...p, allergies: e.target.value }))} />
                </div>

                <div className="fm-field fm-field-full">
                  <label>Medical Notes</label>
                  <textarea placeholder="e.g. Diabetic, takes metformin..."
                    value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
                </div>
              </div>

              {error && <div className="fm-error">⚠️ {error}</div>}

              <div className="fm-form-actions">
                <button className="fm-btn-cancel" onClick={() => setShowForm(false)}>Cancel</button>
                <button className="fm-btn-save" onClick={handleSave} disabled={saving}>
                  {saving ? "Saving..." : editingId ? "Save Changes" : "Add Member"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
