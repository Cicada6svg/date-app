
  // auth.js
import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

/**
 * Signs out the current user and redirects to login page.
 * Returns a Promise that resolves when signOut completes.
 */
export async function logout() {
  const auth = getAuth();
  try {
    await signOut(auth);
    // Optional: clear app-specific localStorage/sessionStorage keys here
    // localStorage.removeItem('someKey');
    // sessionStorage.removeItem('anotherKey');

    // Redirect to login page
    window.location.href = "login.html";
  } catch (err) {
    console.error("Error during logout:", err);
    // If needed, show a user-friendly message
    alert("Failed to log out: " + (err && err.message ? err.message : err));
    throw err;
  }
}

/**
 * Optional helper: call with a callback to react to auth state changes.
 * Example:
 *   import { onAuthChanged } from './auth.js';
 *   onAuthChanged(user => { ... });
 */
export function onAuthChanged(callback) {
  const auth = getAuth();
  return onAuthStateChanged(auth, callback);
}
