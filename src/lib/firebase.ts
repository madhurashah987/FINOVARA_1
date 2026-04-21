import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  verifyPasswordResetCode,
  confirmPasswordReset,
  signInAnonymously
} from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
// @ts-ignore
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();

// Error handling helper
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string | null;
    providerInfo: any[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Helper to create user profile in Firestore
export const createUserProfile = async (user: any, displayName?: string) => {
  const userRef = doc(db, 'users', user.uid);
  await setDoc(userRef, {
    uid: user.uid,
    email: user.email,
    displayName: displayName || user.displayName || 'User',
    photoURL: user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`,
    role: 'user',
    createdAt: serverTimestamp(),
    preferences: {
      currency: 'INR',
      aiPersonality: 'analytical'
    }
  }, { merge: true });
};

// Auth Helpers
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    await createUserProfile(result.user);
    return result.user;
  } catch (error) {
    console.error('Google Login Error:', error);
    throw error;
  }
};

export const signUpWithEmail = async (email: string, pass: string, name: string) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(result.user, { displayName: name });
    await createUserProfile(result.user, name);
    return result.user;
  } catch (error) {
    // Silence console error
    throw error;
  }
};

export const loginWithEmail = async (email: string, pass: string) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, pass);
    return result.user;
  } catch (error) {
    // Silence console error to facilitate clean demo fallback
    throw error;
  }
};

export const logout = () => signOut(auth);

/**
 * Sends a password reset email to the specified address.
 * Includes ActionCodeSettings to ensure the user is redirected back to the app after reset.
 */
export const sendPasswordReset = async (email: string) => {
  const actionCodeSettings = {
    // Redirect the user to our custom reset-password page
    url: `${window.location.origin}/reset-password`,
    handleCodeInApp: true,
  };
  
  try {
    await sendPasswordResetEmail(auth, email, actionCodeSettings);
    console.log('Custom password reset email triggered successfully for:', email);
  } catch (error) {
    console.error('Firebase Auth: sendPasswordResetEmail failed', error);
    throw error;
  }
};

/**
 * Custom Password Reset Helpers
 */
export const verifyResetCode = (code: string) => verifyPasswordResetCode(auth, code);
export const confirmReset = (code: string, pass: string) => confirmPasswordReset(auth, code, pass);

// System Logging Helper
export const logActivity = async (action: string, details: string) => {
  if (!auth.currentUser) return;
  try {
    await addDoc(collection(db, 'system_logs'), {
      userId: auth.currentUser.uid,
      userEmail: auth.currentUser.email,
      action,
      details,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error('Logging Error:', error);
  }
};

// CRITICAL CONSTRAINT: Test Firebase Connection on boot
import { doc as fsDoc, getDocFromCache, getDocFromServer } from 'firebase/firestore';

async function testConnection() {
  try {
    // Attempt to get a dummy doc from server to verify connection
    await getDocFromServer(fsDoc(db, 'test', 'connection'));
    console.log('Firebase connection verified.');
  } catch (error) {
    if (error instanceof Error && error.message.includes('permission-denied')) {
      // Permission denied is actually a good sign - it means we reached the server
      console.log('Firebase reachable (Access restricted).');
    } else {
      console.error("Firebase Connection Error: Please check your Firebase configuration or network.", error);
    }
  }
}

testConnection();
