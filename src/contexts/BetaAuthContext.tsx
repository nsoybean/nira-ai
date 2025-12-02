"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";

interface BetaAuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  authenticate: (password: string) => Promise<boolean>;
  logout: () => void;
}

const BetaAuthContext = createContext<BetaAuthContextType | undefined>(
  undefined
);

const STORAGE_KEY = "beta_auth_token";

export function BetaAuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Load token from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem(STORAGE_KEY);
    if (storedToken) {
      setToken(storedToken);
      setIsAuthenticated(true);
    }
  }, []);

  const authenticate = useCallback(async (password: string): Promise<boolean> => {
    try {
      // Verify the password against the server
      const response = await fetch("/api/auth/beta-verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        const { token: verifiedToken } = await response.json();

        // Store the token
        setToken(verifiedToken);
        setIsAuthenticated(true);
        localStorage.setItem(STORAGE_KEY, verifiedToken);

        return true;
      }

      return false;
    } catch (error) {
      console.error("Error authenticating:", error);
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setIsAuthenticated(false);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <BetaAuthContext.Provider
      value={{
        isAuthenticated,
        token,
        authenticate,
        logout,
      }}
    >
      {children}
    </BetaAuthContext.Provider>
  );
}

export function useBetaAuth() {
  const context = useContext(BetaAuthContext);
  if (!context) {
    throw new Error("useBetaAuth must be used within BetaAuthProvider");
  }
  return context;
}
