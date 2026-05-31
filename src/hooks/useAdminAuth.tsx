import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AdminProfile, AdminSession } from "../types/admin";
import {
  clearAdminSession,
  fetchAdminProfile,
  getUsableAdminSession,
  signInWithPassword,
  signOutAdmin,
} from "../services/supabaseAuth";
import { isSupabaseConfigured } from "../services/supabaseConfig";

interface AdminAuthContextValue {
  session?: AdminSession;
  profile?: AdminProfile;
  loading: boolean;
  error?: string;
  isConfigured: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextValue | undefined>(
  undefined,
);

export const AdminAuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<AdminSession | undefined>();
  const [profile, setProfile] = useState<AdminProfile | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    let isMounted = true;

    const loadSession = async () => {
      if (!isSupabaseConfigured) {
        setLoading(false);
        return;
      }

      try {
        const restoredSession = await getUsableAdminSession();
        if (!restoredSession) {
          return;
        }

        const restoredProfile = await fetchAdminProfile(restoredSession);
        if (!restoredProfile || restoredProfile.role === "viewer") {
          clearAdminSession();
          return;
        }

        if (isMounted) {
          setSession(restoredSession);
          setProfile(restoredProfile);
        }
      } catch (sessionError) {
        clearAdminSession();
        if (isMounted) {
          setError(
            sessionError instanceof Error
              ? sessionError.message
              : "Could not restore the admin session.",
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setError(undefined);
    const result = await signInWithPassword(email, password);
    setSession(result.session);
    setProfile(result.profile);
  }, []);

  const signOut = useCallback(async () => {
    await signOutAdmin(session);
    setSession(undefined);
    setProfile(undefined);
  }, [session]);

  const value = useMemo<AdminAuthContextValue>(
    () => ({
      session,
      profile,
      loading,
      error,
      isConfigured: isSupabaseConfigured,
      signIn,
      signOut,
    }),
    [error, loading, profile, session, signIn, signOut],
  );

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = (): AdminAuthContextValue => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used inside AdminAuthProvider.");
  }

  return context;
};
