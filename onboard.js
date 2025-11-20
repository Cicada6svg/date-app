// onboard.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Use same firebaseConfig as your other files
export firebaseConfig = {
  apiKey: "AIzaSyC830lhq-2I0lBMxdT-SPFJVNkVtK96z38",
  authDomain: "campus-crush-b.firebaseapp.com",
  projectId: "campus-crush-b",
  storageBucket: "campus-crush-b.firebasestorage.app",
  messagingSenderId: "862850121932",
  appId: "1:862850121932:web:7b8d75688564d02f988269",
  measurementId: "G-M6K5200C05"

};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const form = document.getElementById("onboard-form");
const skipBtn = document.getElementById("skip-btn");

// Chip selection logic
document.querySelectorAll(".chip").forEach((btn) => {
  btn.addEventListener("click", () => {
    btn.classList.toggle("chip--active");
  });
});

// Helper to gather form data
function gatherData() {
  const gender = form.gender.value;
  const seeking = Array.from(form.querySelectorAll('input[name="seeking"]:checked')).map(i => i.value);
  const visibility = form.visibility.value;
  const chips = Array.from(document.querySelectorAll(".chip.chip--active")).map(b => b.textContent.trim());
  const custom = document.getElementById("custom-interests").value;
  const customList = custom.split(",").map(s => s.trim()).filter(Boolean);
  const interests = Array.from(new Set([...chips, ...customList]));

  return { gender, seeking, visibility, interests };
}

// Save preferences
async function savePreferences(uid, prefs) {
  const userRef = doc(db, "users", uid);
  try {
    const snapshot = await getDoc(userRef);
    if (snapshot.exists()) {
      await updateDoc(userRef, {
        preferences: prefs,
        onboardingComplete: true
      });
    } else {
      // Create minimal user doc if missing
      await setDoc(userRef, {
        preferences: prefs,
        onboardingComplete: true,
        createdAt: new Date()
      });
    }
    return true;
  } catch (err) {
    console.error("Error saving preferences:", err);
    return false;
  }
}

// Auth check
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    // Not logged in -> go to login
    window.location.href = "login.html";
    return;
  }

  // If user already completed onboarding, redirect to profile
  const userDoc = await getDoc(doc(db, "users", user.uid));
  if (userDoc.exists() && userDoc.data().onboardingComplete) {
    window.location.href = "profile.html";
    return;
  }
});

// Form submit
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const user = auth.currentUser;
  if (!user) {
    alert("Please login first.");
    window.location.href = "login.html";
    return;
  }

  const prefs = gatherData();
  const ok = await savePreferences(user.uid, prefs);
  if (ok) {
    window.location.href = "profile.html";
  } else {
    alert("Failed to save preferences. Try again.");
  }
});

// Skip
skipBtn.addEventListener("click", async () => {
  const user = auth.currentUser;
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  const ok = await savePreferences(user.uid, { skipped: true });
  if (ok) window.location.href = "profile.html";
});
