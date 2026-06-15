import { supabase } from "./supabase";
import {
  sanitize,
  sanitizeEmail,
  isValidEmail,
  isValidUsername,
  isValidPassword,
  checkRateLimit,
  resetRateLimit,
} from "./security";

// ── Register ──────────────────────────────────────────────

export async function registerUser({ username, email, password }) {

  // 1 — Type checks
  if (typeof username !== "string" ||
      typeof email    !== "string" ||
      typeof password !== "string") {
    throw new Error("Invalid input.");
  }

  // 2 — Sanitize
  const cleanUsername = sanitize(username);
  const cleanEmail    = sanitizeEmail(email);

  // 3 — Validate
  if (!isValidUsername(cleanUsername)) {
    throw new Error("Username must be 3–20 characters. Letters, numbers, underscore only.");
  }
  if (!isValidEmail(cleanEmail)) {
    throw new Error("Please enter a valid email address.");
  }
  if (!isValidPassword(password)) {
    throw new Error("Password must be at least 8 characters.");
  }
  if (!/[A-Z]/.test(password)) {
    throw new Error("Password must contain at least one uppercase letter.");
  }
  if (!/[0-9]/.test(password)) {
    throw new Error("Password must contain at least one number.");
  }

  // 4 — Rate limit (5 attempts per minute per device)
  const limit = checkRateLimit("register", 5, 60000);
  if (limit.blocked) throw new Error(limit.message);

  // 5 — Call Supabase
  const { data, error } = await supabase.auth.signUp({
    email:    cleanEmail,
    password,
    options: {
      data: { username: cleanUsername },
    },
  });

  if (error) {
    // Never expose raw Supabase errors to UI
    if (error.message.includes("already registered") ||
        error.message.includes("already exists")) {
      throw new Error("An account with this email already exists.");
    }
    if (error.message.includes("rate limit")) {
      throw new Error("Too many attempts. Please wait a few minutes.");
    }
    if (error.message.includes("invalid")) {
      throw new Error("Please enter a valid email address.");
    }
    // Generic fallback — never expose internal errors
    console.error("[Register Error]", error.message);
    throw new Error("Registration failed. Please try again.");
  }

  // 6 — Reset rate limit on success
  resetRateLimit("register");
  return data;
}

// ── Login ─────────────────────────────────────────────────

export async function loginUser({ email, password }) {

  // 1 — Type checks
  if (typeof email    !== "string" ||
      typeof password !== "string") {
    throw new Error("Invalid input.");
  }

  // 2 — Sanitize
  const cleanEmail = sanitizeEmail(email);

  // 3 — Validate before hitting server
  if (!isValidEmail(cleanEmail)) {
    throw new Error("Please enter a valid email address.");
  }
  if (!password || password.length < 1) {
    throw new Error("Password is required.");
  }

  // 4 — Rate limit (5 attempts per minute)
  const limit = checkRateLimit("login", 5, 60000);
  if (limit.blocked) throw new Error(limit.message);

  // 5 — Call Supabase
  const { data, error } = await supabase.auth.signInWithPassword({
    email:    cleanEmail,
    password,
  });

  if (error) {
    // Increment failed attempts
    // Never tell user WHICH field is wrong (security best practice)
    if (error.message.includes("Invalid login") ||
        error.message.includes("invalid")       ||
        error.message.includes("not confirmed")) {
      throw new Error("Invalid email or password.");
    }
    if (error.message.includes("rate limit")) {
      throw new Error("Too many attempts. Please wait a few minutes.");
    }
    console.error("[Login Error]", error.message);
    throw new Error("Login failed. Please try again.");
  }

  // 6 — Verify session returned
  if (!data?.session) {
    throw new Error("Login failed. Please try again.");
  }

  // 7 — Reset rate limit on success
  resetRateLimit("login");
  return data;
}

// ── Logout ────────────────────────────────────────────────

export async function logoutUser() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("[Logout Error]", error.message);
    throw new Error("Logout failed. Please try again.");
  }
}

// ── Get current session ───────────────────────────────────

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error("[Session Error]", error.message);
    return null;
  }
  return data?.session ?? null;
}

// ── Get current user ──────────────────────────────────────

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data?.user ?? null;
}