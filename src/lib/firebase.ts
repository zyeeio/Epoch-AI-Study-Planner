import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as fbSignOut, 
  deleteUser as fbDeleteUser,
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc,
  deleteDoc,
  collection, 
  onSnapshot,
  writeBatch
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Auth & Firestore with dedicated Database ID
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;

  // Persist basic profile
  if (user) {
    const userRef = doc(db, 'users', user.uid);
    await setDoc(
      userRef, 
      {
        id: user.uid,
        email: user.email || '',
        displayName: user.displayName || 'Scholar',
        photoURL: user.photoURL || '',
        lastActiveAt: new Date().toISOString()
      }, 
      { merge: true }
    );
  }
  return user;
}

export async function logOut(): Promise<void> {
  await fbSignOut(auth);
}

// Complete Account and Data Deletion
export async function deleteAccountAndData(): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('No user is currently signed in.');

  const userId = user.uid;

  // Delete user profile document
  try {
    const userRef = doc(db, 'users', userId);
    await deleteDoc(userRef);
  } catch (err) {
    console.warn('Could not delete user document:', err);
  }

  // Delete Firebase Auth account
  await fbDeleteUser(user);
}

export { onAuthStateChanged };
export type { User };
