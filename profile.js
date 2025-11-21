// profile.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore, doc, getDoc, updateDoc, setDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
  getStorage,
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

// Replace with your config or import shared firebase-config.js
const firebaseConfig = {
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
const storage = getStorage(app);

// Elements
const profileContent = document.getElementById("profile-content");
const logoutBtn = document.getElementById("logout-btn");

// local state
let currentUser = null;
let uploadedAvatarUrl = null;

// Helper: render profile UI
async function renderProfile(userDocData) {
  const data = userDocData || {};
  const avatarUrl = data.avatar || "default-avatar.png";

  profileContent.innerHTML = `
    <div class="profile-top card" style="display:flex; gap:20px; align-items:center;">
      <img id="profile-avatar" src="${avatarUrl}" alt="Avatar" class="avatar" />
      <div>
        <p style="margin:0;"><strong>${data.name || ""}</strong></p>
        <p style="margin:4px 0; color:var(--muted);">${data.school || ""}</p>
        <button id="change-avatar-btn" class="muted">Change Photo</button>
      </div>
    </div>

    <hr />

    <div id="profile-details" class="card">
      <p><strong>Email:</strong> ${data.email || ""}</p>
      <p><strong>School:</strong> ${data.school || ""}</p>
      <p><strong>Bio:</strong> ${data.bio || "<em>No bio yet.</em>"}</p>
    </div>

    <!-- Hidden area for upload UI -->
    <div id="avatar-uploader" class="card" style="display:none; margin-top:14px;">
      <label for="avatar-input">Select a profile photo</label>
      <input type="file" id="avatar-input" accept="image/*" />
      <div id="preview-wrap" style="margin-top:10px; display:none;">
        <p style="margin:6px 0 8px 0;">Preview:</p>
        <img id="avatar-preview" src="" class="avatar" alt="Preview" />
      </div>
      <div id="upload-progress" style="display:none; margin-top:10px;">
        <progress id="progress-bar" value="0" max="100" style="width:100%;"></progress>
        <div id="progress-text" style="margin-top:6px; font-size:13px; color:#555;">0%</div>
      </div>
      <div style="margin-top:10px; display:flex; gap:8px;">
        <button id="upload-btn" class="primary" disabled>Upload Photo</button>
        <button id="cancel-upload" class="muted">Cancel</button>
      </div>
    </div>
  `;

  // Wire up buttons & inputs
  document.getElementById("change-avatar-btn").addEventListener("click", () => {
    document.getElementById("avatar-uploader").style.display = "block";
    document.getElementById("avatar-input").value = "";
    document.getElementById("preview-wrap").style.display = "none";
    uploadedAvatarUrl = null;
    window.scrollTo({ top: document.getElementById("avatar-uploader").offsetTop - 40, behavior: "smooth" });
  });

  const avatarInput = document.getElementById("avatar-input");
  const previewWrap = document.getElementById("preview-wrap");
  const avatarPreview = document.getElementById("avatar-preview");
  const uploadBtn = document.getElementById("upload-btn");
  const cancelBtn = document.getElementById("cancel-upload");
  const progressBar = document.getElementById("progress-bar");
  const progressText = document.getElementById("progress-text");
  const uploadProgressWrap = document.getElementById("upload-progress");

  avatarInput.addEventListener("change", () => {
    const file = avatarInput.files && avatarInput.files[0];
    if (!file) {
      previewWrap.style.display = "none";
      uploadBtn.disabled = true;
      return;
    }

    // Basic client-side validation (type & size)
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      avatarInput.value = "";
      return;
    }
    const maxMB = 4;
    if (file.size > maxMB * 1024 * 1024) {
      alert("Image is too large. Please choose an image under " + maxMB + "MB.");
      avatarInput.value = "";
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      avatarPreview.src = e.target.result;
      previewWrap.style.display = "block";
      uploadBtn.disabled = false;
    };
    reader.readAsDataURL(file);
  });

  cancelBtn.addEventListener("click", () => {
    document.getElementById("avatar-uploader").style.display = "none";
  });

  uploadBtn.addEventListener("click", async () => {
    const file = avatarInput.files && avatarInput.files[0];
    if (!file) return;
    uploadBtn.disabled = true;
    uploadProgressWrap.style.display = "block";

    const uid = currentUser.uid;
    const fileRef = storageRef(storage, `avatars/${uid}/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(fileRef, file);

    uploadTask.on("state_changed", (snapshot) => {
      const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
      progressBar.value = percent;
      progressText.textContent = percent + "%";
    }, (err) => {
      console.error("Upload error", err);
      alert("Upload failed: " + err.message);
      uploadBtn.disabled = false;
      uploadProgressWrap.style.display = "none";
    }, async () => {
      // Success
      uploadedAvatarUrl = await getDownloadURL(uploadTask.snapshot.ref);
      // Save to Firestore
      try {
        const userRef = doc(db, "users", uid);
        await updateDoc(userRef, { avatar: uploadedAvatarUrl });
      } catch (err) {
        // If user doc doesn't exist, create it
        await setDoc(doc(db, "users", uid), { avatar: uploadedAvatarUrl }, { merge: true });
      }

      // Update UI
      document.getElementById("profile-avatar").src = uploadedAvatarUrl;
      document.getElementById("avatar-uploader").style.display = "none";
      alert("Profile photo updated!");
    });
  });
}

// Auth & load profile
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  currentUser = user;

  if (logoutBtn) logoutBtn.style.display = "inline-block";

  try {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists()) {
      await renderProfile(userDoc.data());
    } else {
      // No doc yet - create minimal doc then render
      const basic = { name: user.displayName || "", email: user.email || "" };
      await setDoc(doc(db, "users", user.uid), basic, { merge: true });
      await renderProfile(basic);
    }
  } catch (err) {
    console.error("Error loading profile:", err);
    profileContent.innerHTML = "<p>Error loading profile.</p>";
  }
});
