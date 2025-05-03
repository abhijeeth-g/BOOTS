import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAyaFUTtLbFf6PNj1vCYZD9yrATH2n7ZBc",
  authDomain: "bossde-ff09e.firebaseapp.com",
  projectId: "bossde-ff09e",
  storageBucket: "bossde-ff09e.appspot.com",  // fixed: should be 'appspot.com'
  messagingSenderId: "195516599102",
  appId: "1:195516599102:web:737318f3a1d7d1b4157a6f",
  measurementId: "G-MR6ND6WTJ1"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

