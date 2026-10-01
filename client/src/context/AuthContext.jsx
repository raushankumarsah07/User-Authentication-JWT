import { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true); // true until the first check finishes

  // Ask the backend "who am I?". The browser sends the cookie automatically.
  const checkAuth = useCallback(async () => {
    try {
      const { data } = await api.get("/auth/me");
      setCurrentUser(data.user);
    } catch {
      setCurrentUser(null); // 401 = not logged in (this is normal)
    } finally {
      setLoading(false);
    }
  }, []);

  // Runs once when the app starts
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const register = async (name, email, password) => {
    const { data } = await api.post("/auth/register", { name, email, password });
    return data;
  };

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    setCurrentUser(data.user);
    return data;
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      setCurrentUser(null);
    }
  };

  const value = { currentUser, loading, register, login, logout, checkAuth };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook so components can write: const { currentUser } = useAuth();
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
};
