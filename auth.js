// auth.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Replace with your Firebase con
const firebaseConfig = {
  apiKey: "AIzaSyC830lhq-2I0lBMxdT-SPFJVNkVtK96z38",
  authDomain: "campus-crush-b.firebaseapp.com",
  projectId: "campus-crush-b",
  storageBucket: "campus-crush-b.firebasestorage.app",
  messagingSenderId: "862850121932",
  appId: "1:862850121932:web:7b8d75688564d02f988269",
  measurementId: "G-M6K5200C05"

  
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Elements
const loginForm = document.getElementById("login-form");

// Login handler
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = loginForm.email.value;
    const password = loginForm.password.value;

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Redirect after login
      window.location.href = "profile.html";
    } catch (error) {
      alert("Login failed: " + error.message);
    }
  });
}

// Observe auth state
onAuthStateChanged(auth, async (user) => {
  if (user) {
    // User is signed in.
    // Optionally fetch user profile from Firestore
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userData = userDoc.exists() ? userDoc.data() : null;
      console.log("Logged in user:", user.uid, userData);
    } catch (err) {
      console.error("Error fetching user doc:", err);
    }

    // Show logout UI if present
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) logoutBtn.style.display = "inline-block";
  } else {
    // User is signed out.
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) logoutBtn.style.display = "none";
  }
});

// Logout helper (can be placed on any page)
export async function logout() {
  try {
    await signOut(auth);
    window.location.href = "index.html";
  } catch (error) {
    console.error("Logout error:", error);
    alert("Logout failed: " + error.message);
  }
}
