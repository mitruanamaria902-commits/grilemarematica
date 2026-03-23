import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Platform } from "react-native";
import * as Linking from "expo-linking";
import { authClient, setBearerToken, clearAuthTokens } from "@/lib/auth";

interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name?: string) => Promise<void>;
  signOut: () => Promise<void>;
  fetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function extractErrorMessage(error: any, fallback: string): string {
  if (!error) return fallback;
  // status 0 = network unreachable
  if (error.status === 0) return 'Nu se poate conecta la server. Verifică conexiunea la internet.';
  if (typeof error === 'string') return error;
  if (error.message) return error.message;
  if (error.statusText) return error.statusText;
  if (error.code) return error.code;
  return fallback;
}

function openOAuthPopup(provider: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const popupUrl = `${window.location.origin}/auth-popup?provider=${provider}`;
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      popupUrl,
      "oauth-popup",
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes`
    );

    if (!popup) {
      reject(new Error("Failed to open popup. Please allow popups."));
      return;
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === "oauth-success" && event.data?.token) {
        window.removeEventListener("message", handleMessage);
        clearInterval(checkClosed);
        resolve(event.data.token);
      } else if (event.data?.type === "oauth-error") {
        window.removeEventListener("message", handleMessage);
        clearInterval(checkClosed);
        reject(new Error(event.data.error || "OAuth failed"));
      }
    };

    window.addEventListener("message", handleMessage);

    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        window.removeEventListener("message", handleMessage);
        reject(new Error("Authentication cancelled"));
      }
    }, 500);
  });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser();

    const subscription = Linking.addEventListener("url", (event) => {
      console.log("[AuthContext] Deep link received, refreshing user session");
      fetchUser();
    });

    const intervalId = setInterval(() => {
      fetchUser();
    }, 5 * 60 * 1000);

    return () => {
      subscription.remove();
      clearInterval(intervalId);
    };
  }, []);

  const fetchUser = async () => {
    try {
      setLoading(true);
      console.log('[AuthContext] fetchUser: calling getSession');
      const session = await authClient.getSession();
      console.log('[AuthContext] fetchUser: session result:', JSON.stringify(session?.data?.user ?? null));
      if (session?.data?.user) {
        setUser(session.data.user as User);
        if (session.data.session?.token) {
          await setBearerToken(session.data.session.token);
        }
      } else {
        setUser(null);
        await clearAuthTokens();
      }
    } catch (error) {
      console.error("[AuthContext] fetchUser failed:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    console.log('[AuthContext] signInWithEmail called for:', email);
    let result: any;
    try {
      result = await authClient.signIn.email({ email, password });
    } catch (e: any) {
      console.error('[AuthContext] signInWithEmail threw exception:', e);
      throw new Error(e?.message || 'Autentificare eșuată. Verifică datele și încearcă din nou.');
    }
    console.log('[AuthContext] signInWithEmail raw result:', JSON.stringify(result));
    if (result?.error) {
      const msg = extractErrorMessage(result.error, 'Autentificare eșuată. Verifică datele și încearcă din nou.');
      console.error('[AuthContext] signInWithEmail error:', msg, JSON.stringify(result.error));
      throw new Error(msg);
    }
    console.log('[AuthContext] signInWithEmail success');
    // Store token immediately if returned, before fetchUser
    if (result?.data?.session?.token) {
      console.log('[AuthContext] signInWithEmail: storing bearer token from response');
      await setBearerToken(result.data.session.token);
    }
    await fetchUser();
  };

  const signUpWithEmail = async (email: string, password: string, name?: string) => {
    console.log('[AuthContext] signUpWithEmail called for:', email, 'name:', name);
    let result: any;
    try {
      result = await authClient.signUp.email({ email, password, name: name || '' });
    } catch (e: any) {
      console.error('[AuthContext] signUpWithEmail threw exception:', e);
      throw new Error(e?.message || 'Înregistrare eșuată. Încearcă din nou.');
    }
    console.log('[AuthContext] signUpWithEmail raw result:', JSON.stringify(result));
    if (result?.error) {
      const msg = extractErrorMessage(result.error, 'Înregistrare eșuată. Încearcă din nou.');
      console.error('[AuthContext] signUpWithEmail error:', msg, JSON.stringify(result.error));
      throw new Error(msg);
    }
    console.log('[AuthContext] signUpWithEmail success, data:', JSON.stringify(result?.data));
    // Better Auth may not auto-create a session after sign-up, so explicitly sign in
    console.log('[AuthContext] signUpWithEmail: signing in after registration');
    let signInResult: any;
    try {
      signInResult = await authClient.signIn.email({ email, password });
    } catch (e: any) {
      console.error('[AuthContext] signUpWithEmail: auto sign-in threw exception:', e);
      // Still try fetchUser in case a session was created anyway
      await fetchUser();
      return;
    }
    console.log('[AuthContext] signUpWithEmail: auto sign-in result:', JSON.stringify(signInResult));
    if (signInResult?.error) {
      console.warn('[AuthContext] signUpWithEmail: auto sign-in failed, trying fetchUser anyway:', JSON.stringify(signInResult.error));
    }
    // Store token immediately if returned by signIn, before fetchUser
    if (signInResult?.data?.session?.token) {
      console.log('[AuthContext] signUpWithEmail: storing bearer token from sign-in response');
      await setBearerToken(signInResult.data.session.token);
    }
    await fetchUser();
  };

  const signOut = async () => {
    console.log('[AuthContext] signOut called');
    try {
      await authClient.signOut();
    } catch (error) {
      console.error("[AuthContext] signOut API call failed:", error);
    } finally {
      setUser(null);
      await clearAuthTokens();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        fetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
