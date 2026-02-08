'use client';

import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { firebaseConfig, isFirebaseConfigValid } from './config';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

interface FirebaseContextType {
  app: FirebaseApp | null;
  auth: Auth | null;
  db: Firestore | null;
}

const FirebaseContext = createContext<FirebaseContextType>({
  app: null,
  auth: null,
  db: null,
});

export function FirebaseProvider({ children }: { children: ReactNode }) {
  const [firebaseInstances, setFirebaseInstances] = useState<FirebaseContextType>({
    app: null,
    auth: null,
    db: null,
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && isFirebaseConfigValid(firebaseConfig)) {
      if (!getApps().length) {
        try {
          const app = initializeApp(firebaseConfig);
          const auth = getAuth(app);
          const db = getFirestore(app);
          setFirebaseInstances({ app, auth, db });
        } catch (e) {
          console.error("Firebase initialization error:", e);
          setFirebaseInstances({ app: null, auth: null, db: null });
        }
      } else {
        const app = getApps()[0];
        const auth = getAuth(app);
        const db = getFirestore(app);
        setFirebaseInstances({ app, auth, db });
      }
    }
  }, []);

  return (
    <FirebaseContext.Provider value={firebaseInstances}>
      {firebaseInstances.db && <FirebaseErrorListener />}
      {children}
    </FirebaseContext.Provider>
  );
}

export const useFirebaseApp = (): FirebaseApp | null => {
  const { app } = useContext(FirebaseContext);
  return app;
};

export const useFirestore = (): Firestore | null => {
  const { db } = useContext(FirebaseContext);
  return db;
};

export const useFirebaseAuth = (): Auth | null => {
  const { auth } = useContext(FirebaseContext);
  return auth;
};
