// onboard.js (animated + validation + tooltips)
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
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Elements & state
const form = document.getElementById("onboard-form");
const steps = Array.from(document.querySelectorAll(".onboard-step"));
let currentStep = 0;

const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
const skipBtn = document.getElementById("skip-btn");
const finalActions = document.getElementById("final-actions");
const finalSkip = document.getElementById("final-skip");

// Tooltip behavior
document.querySelectorAll(".tooltip").forEach(t => {
  const tip = t.getAttribute("data-tooltip");
  if (!tip) return;
  t.addEventListener("mouseenter", () => showTooltip(t, tip));
  t.addEventListener("focus", () => showTooltip(t, tip));
  t.addEventListener("mouseleave", () => hideTooltip());
  t.addEventListener("blur", () => hideTooltip());
});
let tooltipEl = null;
function showTooltip(target, text) {
  hideTooltip();
  tooltipEl = document.createElement("div");
  tooltipEl.className = "onboard-tooltip";
  tooltipEl.textContent = text;
  document.body.appendChild(tooltipEl);
  const rect = target.getBoundingClientRect();
  tooltipEl.style.left = rect.left + window.scrollX + "px";
  tooltipEl.style.top = rect.bottom + window.scrollY + 8 + "px";
}
function hideTooltip() {
  if (tooltipEl) {
    tooltipEl.remove();
    tooltipEl = null;
  }
}

// Chips
const chips = Array.from(document.querySelectorAll(".chip"));
chips.forEach(c => {
  c.addEventListener("click", () => {
    c.classList.toggle("chip--active");
    c.setAttribute("aria-pressed", c.classList.contains("chip--active"));
    // small pop animation
    c.animate([{ transform: 'scale(0.98)' }, { transform: 'scale(1)' }], { duration: 140 });
  });
});

// Accessibility: allow option labels to toggle inputs on Enter
document.querySelectorAll(".option[tabindex]").forEach(label => {
  label.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      const input = label.querySelector("input");
      if (input) input.click();
    }
  });
});

// Helper: show step
function showStep(index) {
  steps.forEach((s, i) => {
    const hidden = i !== index;
    s.style.display = hidden ? "none" : "block";
    s.setAttribute("aria-hidden", hidden ? "true" : "false");
    if (!hidden) {
      // entrance animation
      s.animate([{ opacity: 0, transform: "translateY(8px)" }, { opacity: 1, transform: "translateY(0px)" }], { duration: 300, easing: "ease-out" });
    }
  });

  // Buttons
  prevBtn.disabled = index === 0;
  if (index === steps.length - 1) {
    nextBtn.style.display = "none";
    finalActions.style.display = "flex";
  } else {
    nextBtn.style.display = "inline-block";
    finalActions.style.display = "none";
  }
}

// Validation per step
function validateStep(index) {
  clearErrors();
  if (index === 0) {
    const gender = form.gender.value;
    if (!gender) {
      showError("error-gender", "Please select how you identify so we can match you better.");
      return false;
    }
  }
  if (index === 1) {
    const seeking = Array.from(form.querySelectorAll('input[name="seeking"]:checked'));
    if (seeking.length === 0) {
      showError("error-seeking", "Choose at least one purpose (e.g., Dating or Friendship).");
      return false;
    }
  }
  if (index === 2) {
    const activeChips = document.querySelectorAll(".chip.chip--active");
    const custom = document.getElementById("custom-interests").value.trim();
    if (activeChips.length === 0 && !custom) {
      showError("error-interests", "Pick at least one interest or add a custom interest.");
      return false;
    }
  }
  return true;
}

function showError(id, message) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = message;
  el.style.display = "block";
  el.setAttribute("aria-hidden", "false");
  // shake animation
  const card = document.getElementById("onboard-card");
  card.animate([{ transform: "translateX(-6px)" }, { transform: "translateX(6px)" }, { transform: "translateX(0)" }], { duration: 240 });
}

function clearErrors() {
  document.querySelectorAll(".error").forEach(e => { e.textContent = ""; e.style.display = "none"; e.setAttribute("aria-hidden", "true"); });
}

// Navigation handlers
nextBtn.addEventListener("click", () => {
  if (!validateStep(currentStep)) return;
  currentStep = Math.min(currentStep + 1, steps.length - 1);
  showStep(currentStep);
});

prevBtn.addEventListener("click", () => {
  currentStep = Math.max(currentStep - 1, 0);
  showStep(currentStep);
});

// Final submit logic (save preferences)
function gatherData() {
  const gender = form.gender.value;
  const seeking = Array.from(form.querySelectorAll('input[name="seeking"]:checked')).map(i => i.value);
  const visibility = form.visibility.value;
  const chipsActive = Array.from(document.querySelectorAll(".chip.chip--active")).map(b => b.getAttribute("data-value"));
  const custom = document.getElementById("custom-interests").value;
  const customList = custom.split(",").map(s => s.trim()).filter(Boolean);
  const interests = Array.from(new Set([...chipsActive, ...customList]));
  return { gender, seeking, visibility, interests };
}

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

// Submit handler
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  // validate last step before submit
  if (!validateStep(currentStep)) return;

  const user = auth.currentUser;
  if (!user) {
    alert("Please login first.");
    window.location.href = "login.html";
    return;
  }

  const prefs = gatherData();
  nextBtn.disabled = true;
  prevBtn.disabled = true;
  finalActions.querySelector(".primary")?.classList.add("loading");
  const ok = await savePreferences(user.uid, prefs);
  finalActions.querySelector(".primary")?.classList.remove("loading");
  nextBtn.disabled = false;
  prevBtn.disabled = false;
  if (ok) {
    // success animation then redirect
    document.getElementById("onboard-sub").textContent = "Preferences saved — redirecting you to your profile...";
    document.querySelector(".onboard-card").animate([{ opacity: 1 }, { opacity: 0.95 }, { opacity: 1 }], { duration: 700 });
    setTimeout(() => window.location.href = "profile.html", 800);
  } else {
    alert("Failed to save preferences. Try again.");
  }
});

// Skip handlers
skipBtn.addEventListener("click", handleSkip);
finalSkip.addEventListener("click", handleSkip);

async function handleSkip() {
  const user = auth.currentUser;
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  const ok = await savePreferences(user.uid, { skipped: true });
  if (ok) window.location.href = "profile.html";
  else alert("Failed to skip. Try again.");
}

// Auth check & redirect if already onboarded
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  const userDoc = await getDoc(doc(db, "users", user.uid));
  if (userDoc.exists() && userDoc.data().onboardingComplete) {
    // small fade then redirect
    document.querySelector(".onboard-card").animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300 });
    setTimeout(() => window.location.href = "profile.html", 350);
    return;
  }
});

// Init
showStep(currentStep);
