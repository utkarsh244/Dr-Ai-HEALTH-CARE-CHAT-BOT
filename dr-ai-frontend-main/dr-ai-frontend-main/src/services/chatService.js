/**
 * chatService.js — All Firestore operations for chat history
 * Updated: messages now support imageUrl field
 */

import {
  collection, doc, addDoc, setDoc,
  getDocs, query, where, orderBy, serverTimestamp,
  deleteDoc
} from "firebase/firestore";
import { db } from "../firebase";

export async function createConversation(uid, firstMessage, memberId = "self") {
  const title  = generateTitle(firstMessage);
  const docRef = await addDoc(collection(db, "conversations"), {
    uid, title, memberId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function saveMessage(conversationId, role, text, meta = "", imageUrl = "") {
  const messageData = { role, text, meta, timestamp: serverTimestamp() };
  if (imageUrl) messageData.imageUrl = imageUrl;

  await addDoc(collection(db, "conversations", conversationId, "messages"), messageData);
  await setDoc(doc(db, "conversations", conversationId), { updatedAt: serverTimestamp() }, { merge: true });
}

export async function loadConversations(uid, memberId = "self") {
  const q = query(
    collection(db, "conversations"),
    where("uid",      "==", uid),
    where("memberId", "==", memberId),
    orderBy("updatedAt", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id, ...doc.data(),
    updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
    createdAt: doc.data().createdAt?.toDate?.() || new Date(),
  }));
}

export async function loadMessages(conversationId) {
  const q = query(
    collection(db, "conversations", conversationId, "messages"),
    orderBy("timestamp", "asc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function deleteConversation(conversationId) {
  const messagesRef = collection(db, "conversations", conversationId, "messages");
  const snapshot    = await getDocs(messagesRef);
  await Promise.all(snapshot.docs.map(d => deleteDoc(d.ref)));
  await deleteDoc(doc(db, "conversations", conversationId));
}

function generateTitle(message) {
  if (!message) return "New Consultation";
  const cleaned = message.trim().replace(/[^\w\s]/gi, "");
  const words   = cleaned.split(" ").slice(0, 6).join(" ");
  return words.length > 0 ? words : "New Consultation";
}

export function formatTime(date) {
  if (!date) return "";
  const now = new Date(), diff = now - date;
  const mins = Math.floor(diff / 60000), hours = Math.floor(diff / 3600000), days = Math.floor(diff / 86400000);
  if (mins < 1)   return "Just now";
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7)   return `${days}d ago`;
  return date.toLocaleDateString();
}