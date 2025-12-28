import create from "zustand";
import api from "../lib/api";
import Router from "next/router";

type User = {
  id: string;
  email: string;
  username: string;
  name?: string | null;
};

type AuthState = {
  token: string | null;
  user: User | null;
  loading: boolean;
  initDone: boolean;
  setToken: (token: string | null) => void;
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: { email: string; password: string; username: string; name?: string }) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
};

export const useAuth = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  loading: false,
  initDone: false,
  setToken: (token) => {
    if (typeof window !== "undefined") {
      if (token) localStorage.setItem("token", token);
      else localStorage.removeItem("token");
    }
    set({ token });
  },
  setUser: (user) => set({ user }),
  login: async (email, password) => {
    set({ loading: true });
    try {
      const res = await api.post("/api/auth/login", { email, password });
      const token = res.data.token;
      set({ token });
      if (typeof window !== "undefined") localStorage.setItem("token", token);
      // fetch current user
      await get().fetchMe();
      Router.push("/");
    } finally {
      set({ loading: false });
    }
  },
  register: async (payload) => {
    set({ loading: true });
    try {
      const res = await api.post("/api/auth/register", payload);
      const token = res.data.token;
      set({ token });
      if (typeof window !== "undefined") localStorage.setItem("token", token);
      await get().fetchMe();
      Router.push("/");
    } finally {
      set({ loading: false });
    }
  },
  logout: () => {
    set({ token: null, user: null });
    if (typeof window !== "undefined") localStorage.removeItem("token");
    Router.push("/login");
  },
  fetchMe: async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        set({ user: null, initDone: true });
        return;
      }
      const res = await api.get("/api/auth/me");
      set({ user: res.data.user, initDone: true });
    } catch (err) {
      set({ user: null, initDone: true });
    }
  },
}));