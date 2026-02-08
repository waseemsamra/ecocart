'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useFirebaseAuth, useFirestore } from '@/firebase/provider';

interface AuthUser extends User {
  role?: string;
  displayName?: string;
  photoURL?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  signup: (email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  signup: async () => {},
  logout: async () => {},
  resetPassword: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const auth = useFirebaseAuth();
  const db = useFirestore();

  useEffect(() => {
    if (!auth) {
        setUser(null);
        setLoading(false);
        return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        
        if (!db) {
            setUser({
              ...firebaseUser,
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              role: 'customer',
              displayName: firebaseUser.email?.split('@')[0] || 'User',
              photoURL: firebaseUser.photoURL,
            });
            setLoading(false);
            return;
        }
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const roles = userData?.roles || [];
            const primaryRole = roles.includes('admin') ? 'admin' : roles[0] || 'customer';

            setUser({
              ...firebaseUser,
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              role: primaryRole,
              displayName: userData?.firstName || firebaseUser.email?.split('@')[0] || 'User',
              photoURL: userData?.photoURL || firebaseUser.photoURL,
            });
          } else {
             setUser({
              ...firebaseUser,
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              role: 'customer',
              displayName: firebaseUser.email?.split('@')[0] || 'User',
              photoURL: firebaseUser.photoURL,
            });
          }

        } catch (error) {
          console.error('Error fetching user data:', error);
          setUser(firebaseUser as AuthUser);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [auth, db]);

  const login = (email: string, password: string) => {
    if (!auth) return Promise.reject(new Error("Firebase not initialized"));
    return signInWithEmailAndPassword(auth, email, password);
  };
  
  const signup = (email: string, password: string) => {
    if (!auth) return Promise.reject(new Error("Firebase not initialized"));
    return createUserWithEmailAndPassword(auth, email, password);
  };

  const logout = () => {
    if (!auth) return Promise.reject(new Error("Firebase not initialized"));
    return signOut(auth);
  };

  const resetPassword = (email: string) => {
    if (!auth) return Promise.reject(new Error("Firebase not initialized"));
    return sendPasswordResetEmail(auth, email);
  };
  
  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}
