/**
 * familyService.js — Firestore CRUD for family member profiles
 */

import {
  collection, doc, addDoc, setDoc,
  getDocs, deleteDoc, serverTimestamp, query, orderBy
} from "firebase/firestore";
import { db } from "../firebase";

// ── Default "self" member built from Firebase user ────────────────────────────
export function buildSelfMember(currentUser) {
  return {
    id:          "self",
    name:        currentUser.displayName || currentUser.email?.split("@")[0] || "You",
    relation:    "Myself",
    age:         "",
    gender:      "",
    bloodGroup:  "",
    allergies:   "",
    notes:       "",
    avatar:      "👤",
    isSelf:      true,
  };
}

// ── Load all family members ───────────────────────────────────────────────────
export async function loadFamilyMembers(uid) {
  const q        = query(collection(db, "users", uid, "family"), orderBy("createdAt", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ── Add a new family member ───────────────────────────────────────────────────
export async function addFamilyMember(uid, member) {
  const ref = await addDoc(collection(db, "users", uid, "family"), {
    ...member,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

// ── Update existing family member ─────────────────────────────────────────────
export async function updateFamilyMember(uid, memberId, updates) {
  await setDoc(doc(db, "users", uid, "family", memberId), updates, { merge: true });
}

// ── Delete a family member ────────────────────────────────────────────────────
export async function deleteFamilyMember(uid, memberId) {
  await deleteDoc(doc(db, "users", uid, "family", memberId));
}
