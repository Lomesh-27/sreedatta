import { db } from '../db/warehouseDB';

export interface AdminAuthRecord {
  passwordHash: string;
  salt: string;
  updatedAt: string;
}

const AUTH_STORAGE_KEY = 'sreedatta_admin_session';
const FAILED_ATTEMPTS_KEY = 'sreedatta_failed_attempts';
const LOCKOUT_UNTIL_KEY = 'sreedatta_lockout_until';
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30000; // 30 seconds lockout after 5 consecutive failures

/**
 * Standard SHA-256 hash using native Web Crypto API
 */
export async function hashPassword(password: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(`${salt}:${password}:${salt}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate a random cryptographic salt
 */
function generateSalt(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Initialize Admin Authentication record in IndexedDB if not present.
 * Default PIN: 1234
 */
export async function initAdminAuth(): Promise<AdminAuthRecord> {
  const existing = await db.app_metadata.get('admin_auth');
  if (existing && existing.value) {
    return existing.value as AdminAuthRecord;
  }

  const salt = 'SREE_DATTA_WEB_SALT_2026_' + generateSalt();
  const defaultPin = '1234';
  const passwordHash = await hashPassword(defaultPin, salt);

  const authRecord: AdminAuthRecord = {
    passwordHash,
    salt,
    updatedAt: new Date().toISOString()
  };

  await db.app_metadata.put({
    key: 'admin_auth',
    value: authRecord,
    updatedAt: authRecord.updatedAt
  });

  return authRecord;
}

/**
 * Check if the user is currently locked out from brute-force attempts
 */
export function checkLockout(): { locked: boolean; remainingSeconds: number } {
  const lockoutUntilStr = localStorage.getItem(LOCKOUT_UNTIL_KEY);
  if (!lockoutUntilStr) return { locked: false, remainingSeconds: 0 };

  const lockoutUntil = parseInt(lockoutUntilStr, 10);
  const now = Date.now();
  if (now < lockoutUntil) {
    const remainingSeconds = Math.ceil((lockoutUntil - now) / 1000);
    return { locked: true, remainingSeconds };
  } else {
    // Lockout expired
    localStorage.removeItem(LOCKOUT_UNTIL_KEY);
    localStorage.removeItem(FAILED_ATTEMPTS_KEY);
    return { locked: false, remainingSeconds: 0 };
  }
}

/**
 * Record a failed login attempt; trigger lockout if limit reached
 */
function recordFailedAttempt(): number {
  const currentAttempts = parseInt(localStorage.getItem(FAILED_ATTEMPTS_KEY) || '0', 10) + 1;
  localStorage.setItem(FAILED_ATTEMPTS_KEY, currentAttempts.toString());

  if (currentAttempts >= MAX_ATTEMPTS) {
    const lockoutUntil = Date.now() + LOCKOUT_DURATION_MS;
    localStorage.setItem(LOCKOUT_UNTIL_KEY, lockoutUntil.toString());
  }

  return currentAttempts;
}

/**
 * Reset failed attempts upon successful login
 */
function resetFailedAttempts() {
  localStorage.removeItem(FAILED_ATTEMPTS_KEY);
  localStorage.removeItem(LOCKOUT_UNTIL_KEY);
}

/**
 * Verify admin password and create an authenticated session
 */
export async function loginAdmin(password: string): Promise<{ success: boolean; error?: string }> {
  // Check brute force lockout
  const lockout = checkLockout();
  if (lockout.locked) {
    return {
      success: false,
      error: `Too many failed attempts. Security cooldown active. Please wait ${lockout.remainingSeconds} seconds.`
    };
  }

  if (!password || password.trim().length === 0) {
    return { success: false, error: 'Password or PIN cannot be empty.' };
  }

  const authRecord = await initAdminAuth();
  const inputHash = await hashPassword(password.trim(), authRecord.salt);

  if (inputHash === authRecord.passwordHash) {
    resetFailedAttempts();
    const sessionToken = {
      username: 'Administrator',
      role: 'ADMIN',
      loggedInAt: new Date().toISOString(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
    };
    sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sessionToken));
    window.dispatchEvent(new Event('auth-change'));
    return { success: true };
  } else {
    const attempts = recordFailedAttempt();
    const remaining = MAX_ATTEMPTS - attempts;
    if (remaining > 0) {
      return {
        success: false,
        error: `Invalid PIN or Password. (Default is 1234). ${remaining} attempt(s) remaining before security cooldown.`
      };
    } else {
      return {
        success: false,
        error: `Too many failed attempts. Security cooldown activated for 30 seconds.`
      };
    }
  }
}

/**
 * Log out and terminate current admin session
 */
export function logoutAdmin() {
  sessionStorage.removeItem(AUTH_STORAGE_KEY);
  window.dispatchEvent(new Event('auth-change'));
}

/**
 * Check whether the active browser session is authenticated
 */
export function isAuthenticated(): boolean {
  try {
    const raw = sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return false;
    const session = JSON.parse(raw);
    if (session.expiresAt && Date.now() > session.expiresAt) {
      logoutAdmin();
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Get active session user info
 */
export function getSessionUser() {
  try {
    const raw = sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Change master admin password
 */
export async function changeAdminPassword(
  currentPass: string,
  newPass: string
): Promise<{ success: boolean; error?: string }> {
  if (!newPass || newPass.trim().length < 4) {
    return { success: false, error: 'New password or PIN must be at least 4 characters.' };
  }

  const authRecord = await initAdminAuth();
  const currentHash = await hashPassword(currentPass.trim(), authRecord.salt);

  if (currentHash !== authRecord.passwordHash) {
    return { success: false, error: 'Current password is incorrect.' };
  }

  const newSalt = 'SREE_DATTA_WEB_SALT_2026_' + generateSalt();
  const newHash = await hashPassword(newPass.trim(), newSalt);

  const updatedRecord: AdminAuthRecord = {
    passwordHash: newHash,
    salt: newSalt,
    updatedAt: new Date().toISOString()
  };

  await db.app_metadata.put({
    key: 'admin_auth',
    value: updatedRecord,
    updatedAt: updatedRecord.updatedAt
  });

  return { success: true };
}
