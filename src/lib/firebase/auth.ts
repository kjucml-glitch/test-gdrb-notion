import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  type User as FirebaseUser,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db, isConfigured } from "./config";
import type { User } from "@/types";

export async function registerUser(
  email: string,
  password: string,
  displayName: string
): Promise<FirebaseUser> {
  if (!auth || !db) throw new Error("Firebase is not configured");
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName });

  await setDoc(doc(db!, "users", cred.user.uid), {
    id: cred.user.uid,
    email: cred.user.email,
    displayName,
    avatar: "",
    bio: "",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return cred.user;
}

export async function loginUser(
  email: string,
  password: string
): Promise<FirebaseUser> {
  if (!auth) throw new Error("Firebase is not configured");
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function loginWithGoogle(): Promise<FirebaseUser> {
  if (!auth || !db) throw new Error("Firebase is not configured");
  const provider = new GoogleAuthProvider();
  const cred = await signInWithPopup(auth, provider);

  const userRef = doc(db, "users", cred.user.uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    await setDoc(userRef, {
      id: cred.user.uid,
      email: cred.user.email,
      displayName: cred.user.displayName || "",
      avatar: cred.user.photoURL || "",
      bio: "",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  return cred.user;
}

export async function logoutUser(): Promise<void> {
  if (!auth) throw new Error("Firebase is not configured");
  await signOut(auth);
}

export function onAuthChange(callback: (user: FirebaseUser | null) => void) {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

export function firebaseUserToUser(fbUser: FirebaseUser): User {
  return {
    id: fbUser.uid,
    email: fbUser.email || "",
    displayName: fbUser.displayName || "",
    avatar: fbUser.photoURL || "",
    bio: "",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}
