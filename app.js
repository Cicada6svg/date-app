// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, setDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// 🔥 Your Firebase configuration

// Import the functions you need from the SDKs you need

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
const analytics = getAnalytics(app);
// 🎓 Handle Sign-Up Form
const signupForm = document.querySelector(".signup-form");

signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = signupForm.name.value;
  const email = signupForm.email.value;
  const password = signupForm.password.value;
  const school = signupForm.school.value;

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Save user info in Firestore
    await setDoc(doc(db, "users", user.uid), {
      name,
      email,
      school,
      createdAt: new Date()
    });

    alert("🎉 Welcome to CampusCrush, " + name + "!");
    signupForm.reset();
  } catch (error) {
    alert("❌ Error: " + error.message);
  }
});
