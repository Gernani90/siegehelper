const HARDCODED_USER = 'swsiege';
const HARDCODED_PASS = 'gorduxo123';
const AUTH_KEY = 'siege_helper_auth';

export interface AuthUser {
  username: string;
}

export function login(username: string, password: string): boolean {
  if (username === HARDCODED_USER && password === HARDCODED_PASS) {
    localStorage.setItem(AUTH_KEY, JSON.stringify({ username }));
    return true;
  }
  return false;
}

export function logout(): void {
  localStorage.removeItem(AUTH_KEY);
}

export function getUser(): AuthUser | null {
  const stored = localStorage.getItem(AUTH_KEY);
  if (stored) {
    try {
      return JSON.parse(stored) as AuthUser;
    } catch {
      return null;
    }
  }
  return null;
}

export function isAuthenticated(): boolean {
  return getUser() !== null;
}