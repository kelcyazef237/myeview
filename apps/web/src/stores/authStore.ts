import { create } from "zustand";
import type { User } from "../types";

interface AuthState {
  /** Current authenticated user, or null if not logged in */
  user: User | null;
  /** JWT access token */
  accessToken: string | null;
  /** Whether auth state has been initialized from storage */
  isHydrated: boolean;
  /** Whether a login/register request is in flight */
  isLoading: boolean;

  /** Set user and token after successful auth */
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  /** Clear auth state (logout) */
  clearAuth: () => void;
  /** Hydrate auth state from localStorage */
  hydrate: () => void;
  /** Set loading state */
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isHydrated: false,
  isLoading: false,

  setAuth: (user, accessToken, refreshToken) => {
    localStorage.setItem("myeview_access_token", accessToken);
    localStorage.setItem("myeview_refresh_token", refreshToken);
    localStorage.setItem("myeview_user", JSON.stringify(user));
    set({ user, accessToken });
  },

  clearAuth: () => {
    localStorage.removeItem("myeview_access_token");
    localStorage.removeItem("myeview_refresh_token");
    localStorage.removeItem("myeview_user");
    set({ user: null, accessToken: null });
  },

  hydrate: () => {
    const token = localStorage.getItem("myeview_access_token");
    const userJson = localStorage.getItem("myeview_user");

    if (token && userJson) {
      try {
        const user = JSON.parse(userJson) as User;
        set({ user, accessToken: token, isHydrated: true });
      } catch {
        // Corrupted data — clear everything
        localStorage.removeItem("myeview_access_token");
        localStorage.removeItem("myeview_refresh_token");
        localStorage.removeItem("myeview_user");
        set({ isHydrated: true });
      }
    } else {
      set({ isHydrated: true });
    }
  },

  setLoading: (isLoading) => set({ isLoading }),
}));
