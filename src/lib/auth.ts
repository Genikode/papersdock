export const AUTH_TOKEN_STORAGE_KEY = "accessToken";
export const USER_DATA_STORAGE_KEY = "currentUser";

export interface UserData {
  id: string;
  name: string;
  email: string;
  isApproved: string; // 'Y' | 'N'
  isFeesPaid: string; // 'Y' | 'N'
  isSecurityBypassed: string; // 'Y' | 'N'
  isBlocked: string; // 'Y' | 'N'
  password: string | null;
  roleName: string;
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
    if (!raw || raw === 'undefined' || raw === 'null') return null;

    // if the token was stringified accidentally, unwrap it
    const maybeParsed = raw.startsWith('"') && raw.endsWith('"') ? JSON.parse(raw) : raw;
    return maybeParsed;
  } catch {
    return null;
  }
}


export function setAccessToken(token: string): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
  } catch {
    // ignore write errors (e.g., storage disabled)
  }
}

export function clearAccessToken(): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function isLoggedIn(): boolean {
  return Boolean(getAccessToken());
}

export function getUserData(): UserData | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = localStorage.getItem(USER_DATA_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as UserData) : null;
  } catch {
    return null;
  }
}

export function setUserData(user: UserData): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    localStorage.setItem(USER_DATA_STORAGE_KEY, JSON.stringify(user));
  } catch {
    // ignore
  }
}

export function clearUserData(): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    localStorage.removeItem(USER_DATA_STORAGE_KEY);
  } catch {
    // ignore
  }
}
