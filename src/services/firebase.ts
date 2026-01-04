
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyADZ1NWOGBKZUZEr_2lnREa8ecorGeqYCI",
  authDomain: "badminton-f68bc.firebaseapp.com",
  projectId: "badminton-f68bc",
  storageBucket: "badminton-f68bc.firebasestorage.app",
  messagingSenderId: "946445729398",
  appId: "1:946445729398:web:4cf3ffc7ecd3b6dff36957",
  measurementId: "G-M42GWQS7S4"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);