// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, setDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// 🔥 Your Firebase config (replace with your own)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

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
