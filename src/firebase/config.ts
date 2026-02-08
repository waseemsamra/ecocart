// This configuration is used for client-side Firebase services.
// It's safe to expose these values as they are used for connecting to your
// Firebase project, and security is enforced by Firestore Security Rules.

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// A function to check if the Firebase configuration is valid.
export function isFirebaseConfigValid(config: object): boolean {
  return Object.values(config).every(value => Boolean(value));
}
