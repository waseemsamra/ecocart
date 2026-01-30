// This configuration is used for client-side Firebase services.
// It's safe to expose these values as they are used for connecting to your
// Firebase project, and security is enforced by Firestore Security Rules.

export const firebaseConfig = {
  apiKey: "AIzaSyDESV16oEMoLNVerPqrziE3wrdXhjGaHok",
  authDomain: "clothcard-6aa62.firebaseapp.com",
  projectId: "clothcard-6aa62",
  storageBucket: "clothcard-6aa62.firebasestorage.app",
  messagingSenderId: "1005428583335",
  appId: "1:1005428583335:web:7d87c8155ff8f31b656482"
};

// A function to check if the Firebase configuration is valid.
export function isFirebaseConfigValid(config: object): boolean {
  return Object.values(config).every(value => Boolean(value));
}
