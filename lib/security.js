// export function sanitize(value) {
//   return value.replace(/[<>"'`;]/g, "").trim();
// }

// export function stripHtml(value) {
//   return value.replace(/<[^>]*>/g, "").trim();
// }

// export function isValidEmail(email) {
//   return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
// }

// export function isValidUsername(username) {
//   return /^[a-zA-Z0-9_]{3,20}$/.test(username);
// }

// export function getPasswordStrength(password) {
//   let score = 0;
//   if (password.length >= 8) score++;
//   if (password.length >= 12) score++;
//   if (/[A-Z]/.test(password)) score++;
//   if (/[0-9]/.test(password)) score++;
//   if (/[^A-Za-z0-9]/.test(password)) score++;
//   if (score <= 1) return { label: "Weak", color: "#ef4444", percent: 25 };
//   if (score <= 2) return { label: "Fair", color: "#f97316", percent: 50 };
//   if (score <= 3) return { label: "Good", color: "#eab308", percent: 75 };
//   return { label: "Strong", color: "#22c55e", percent: 100 };
// }

// ── Input sanitization ────────────────────────────────────

export function sanitize(value) {
  if (typeof value !== "string") return "";
  return value.replace(/[<>"'`;\\]/g, "").trim();
}

export function sanitizeEmail(value) {
  if (typeof value !== "string") return "";
  // Only trim spaces — never remove @ or dots from email
  return value.trim().toLowerCase();
}

export function stripHtml(value) {
  if (typeof value !== "string") return "";
  return value.replace(/<[^>]*>/g, "").trim();
}

// ── Validation ────────────────────────────────────────────

export function isValidEmail(email) {
  if (typeof email !== "string") return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function isValidUsername(username) {
  if (typeof username !== "string") return false;
  return /^[a-zA-Z0-9_]{3,20}$/.test(username.trim());
}

export function isValidPassword(password) {
  if (typeof password !== "string") return false;
  return password.length >= 8;
}

// ── Password strength ─────────────────────────────────────

export function getPasswordStrength(password) {
  if (typeof password !== "string") {
    return { label: "Weak", color: "#ef4444", percent: 25 };
  }
  let score = 0;
  if (password.length >= 8)          score++;
  if (password.length >= 12)         score++;
  if (/[A-Z]/.test(password))        score++;
  if (/[0-9]/.test(password))        score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 1) return { label: "Weak",   color: "#ef4444", percent: 25  };
  if (score <= 2) return { label: "Fair",   color: "#f97316", percent: 50  };
  if (score <= 3) return { label: "Good",   color: "#eab308", percent: 75  };
  return           { label: "Strong", color: "#22c55e", percent: 100 };
}

// ── Rate limiter (client side — extra layer) ──────────────

const limiters = {};

export function checkRateLimit(key, maxAttempts = 5, windowMs = 60000) {
  const now = Date.now();
  if (!limiters[key]) {
    limiters[key] = { count: 0, resetAt: now + windowMs };
  }
  const limiter = limiters[key];
  if (now > limiter.resetAt) {
    limiter.count  = 0;
    limiter.resetAt = now + windowMs;
  }
  limiter.count++;
  if (limiter.count > maxAttempts) {
    const secondsLeft = Math.ceil((limiter.resetAt - now) / 1000);
    return {
      blocked: true,
      message: `Too many attempts. Try again in ${secondsLeft} seconds.`,
    };
  }
  return { blocked: false };
}

export function resetRateLimit(key) {
  delete limiters[key];
}