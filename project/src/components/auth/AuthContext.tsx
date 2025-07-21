
import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { UserRole } from "./AuthTypes";
import { useNavigate } from "react-router-dom";

// Add a UserWithProfile type that extends User with our custom fields
export interface UserWithProfile extends User {
  name?: string;
  role?: UserRole;
}

interface AuthContextType {
  user: UserWithProfile | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, role: UserRole) => Promise<any>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserWithProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up listener for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log("Auth event:", event);
        setSession(currentSession);
        
        // If we have a session, fetch the user profile to get the name and role
        if (currentSession?.user) {
          console.log("User authenticated:", currentSession.user.id);
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('full_name, role')
            .eq('id', currentSession.user.id)
            .single();

          if (profileError) {
            console.error("Error fetching profile:", profileError);
          }

          // Extend the user object with profile data
          const userWithProfile: UserWithProfile = {
            ...currentSession.user,
            name: profile?.full_name || '',
            role: profile?.role as UserRole || 'student'
          };
          
          setUser(userWithProfile);
          
          // Redirect logic based on authentication state
          if (event === 'SIGNED_IN') {
            navigate('/dashboard');
          }
        } else {
          setUser(null);
          
          if (event === 'SIGNED_OUT') {
            navigate('/');
          }
        }
        
        setIsLoading(false);
      }
    );

    // Initial session check
    const checkSession = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      setSession(currentSession);
      
      // If we have a session, fetch the user profile to get the name and role
      if (currentSession?.user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('full_name, role')
          .eq('id', currentSession.user.id)
          .single();

        if (profileError) {
          console.error("Error fetching profile:", profileError);
        }

        // Extend the user object with profile data
        const userWithProfile: UserWithProfile = {
          ...currentSession.user,
          name: profile?.full_name || '',
          role: profile?.role as UserRole || 'student'
        };
        
        setUser(userWithProfile);
      } else {
        setUser(null);
      }
      
      setIsLoading(false);
    };

    checkSession();

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const signup = async (name: string, email: string, password: string, role: UserRole) => {
    setIsLoading(true);
    try {
      // Make sure role is a valid string value
      const roleValue = String(role) === "teacher" ? "teacher" : "student";
      
      console.log("Auth signup preparing data:", { 
        name, 
        email, 
        role: roleValue
      });
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            role: roleValue
          }
        }
      });

      if (error) {
        console.error("Signup API error:", error);
        throw error;
      }

      console.log("Signup success, data returned:", data);
      return data;
    } catch (error) {
      console.error("Signup exception:", error);
      setIsLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    setIsLoading(true);
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      setIsLoading(false);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      login, 
      signup, 
      logout, 
      isLoading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
