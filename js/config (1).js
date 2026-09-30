// Firebase configuration — MyShop
// Realtime Database is used for products, orders and chat.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyCarOraHCljMFuvWZdurAvJdwsPtKZyFnI",
  authDomain: "appp-da89f.firebaseapp.com",
  databaseURL: "https://appp-da89f.firebaseio.com",
  projectId: "appp-da89f",
  storageBucket: "appp-da89f.firebasestorage.app",
  messagingSenderId: "536593644065",
  appId: "1:536593644065:web:a18879577530371c340160",
  measurementId: "G-KHNKDJKXRV"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
