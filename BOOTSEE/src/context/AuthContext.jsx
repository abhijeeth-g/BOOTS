import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../firebase/config";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        // Check if user is a captain or regular user
        try {
          // First check if user is a captain
          const captainDoc = await getDoc(doc(db, "captains", currentUser.uid));
          if (captainDoc.exists()) {
            setUserRole("captain");
            setUserProfile(captainDoc.data());
          } else {
            // Check if user is a regular user
            const userDoc = await getDoc(doc(db, "users", currentUser.uid));
            if (userDoc.exists()) {
              setUserRole("user");
              setUserProfile(userDoc.data());
            } else {
              // User exists in auth but not in Firestore
              setUserRole(null);
              setUserProfile(null);
            }
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
        }
      } else {
        // User is signed out
        setUserRole(null);
        setUserProfile(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Basic authentication methods
  const login = (email, password) => signInWithEmailAndPassword(auth, email, password);
  const signup = (email, password) => createUserWithEmailAndPassword(auth, email, password);
  const logout = () => signOut(auth);

  // Password reset
  const resetPassword = (email) => sendPasswordResetEmail(auth, email);

  // Profile update methods
  const updateUserProfile = (displayName, photoURL) => {
    if (!auth.currentUser) return Promise.reject("No authenticated user");
    return updateProfile(auth.currentUser, { displayName, photoURL });
  };

  const updateUserEmail = (newEmail, password) => {
    if (!auth.currentUser) return Promise.reject("No authenticated user");

    // Re-authenticate user before changing email
    const credential = EmailAuthProvider.credential(auth.currentUser.email, password);
    return reauthenticateWithCredential(auth.currentUser, credential)
      .then(() => updateEmail(auth.currentUser, newEmail));
  };

  const updateUserPassword = (currentPassword, newPassword) => {
    if (!auth.currentUser) return Promise.reject("No authenticated user");

    // Re-authenticate user before changing password
    const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
    return reauthenticateWithCredential(auth.currentUser, credential)
      .then(() => updatePassword(auth.currentUser, newPassword));
  };

  // Provide auth context value
  const value = {
    user,
    userRole,
    userProfile,
    login,
    signup,
    logout,
    resetPassword,
    updateUserProfile,
    updateUserEmail,
    updateUserPassword,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};