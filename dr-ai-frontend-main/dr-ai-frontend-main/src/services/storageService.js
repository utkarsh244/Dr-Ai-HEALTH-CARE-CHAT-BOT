/**
 * storageService.js — Firebase Storage upload utilities
 * 
 * Handles:
 *  - Uploading chat images to Firebase Storage
 *  - Uploading user documents (reports, prescriptions)
 *  - Getting download URLs
 */

import { storage } from "../firebase";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

// ── Upload image from chat ─────────────────────────────────────────────────────
export async function uploadChatImage(file, userId) {
  const timestamp = Date.now();
  const filename  = `${timestamp}_${file.name}`;
  const path      = `users/${userId}/images/${filename}`;
  const storageRef = ref(storage, path);

  const snapshot = await uploadBytes(storageRef, file);
  const url      = await getDownloadURL(snapshot.ref);

  return { url, path, filename };
}

// ── Upload user document (PDF report, prescription) ───────────────────────────
export async function uploadUserDocument(file, userId) {
  const timestamp  = Date.now();
  const filename   = `${timestamp}_${file.name}`;
  const path       = `users/${userId}/documents/${filename}`;
  const storageRef = ref(storage, path);

  const snapshot = await uploadBytes(storageRef, file);
  const url      = await getDownloadURL(snapshot.ref);

  return { url, path, filename };
}

// ── Upload admin PDF ───────────────────────────────────────────────────────────
export async function uploadAdminPDF(file) {
  const timestamp  = Date.now();
  const filename   = `${timestamp}_${file.name}`;
  const path       = `admin/pdfs/${filename}`;
  const storageRef = ref(storage, path);

  const snapshot = await uploadBytes(storageRef, file);
  const url      = await getDownloadURL(snapshot.ref);

  return { url, path, filename };
}

// ── Delete a file ──────────────────────────────────────────────────────────────
export async function deleteStorageFile(path) {
  const storageRef = ref(storage, path);
  await deleteObject(storageRef);
}