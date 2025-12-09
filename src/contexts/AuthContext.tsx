"use client";

import { createContext, useContext, ReactNode } from "react";
import { authClient } from "@/lib/auth-client";

// Export auth hooks for convenience
export const useSession = () => {
  return authClient.useSession();
};

// Placeholder context for future extension
const AuthContext = createContext<{}>({});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  return <AuthContext.Provider value={{}}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
