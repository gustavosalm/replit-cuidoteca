import { createContext, useContext, useEffect, useState } from "react";
import { User } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Verify token and get user data
      apiRequest('GET', '/api/users/me')
        .then(res => res.json())
        .then(userData => {
          setUser(userData);
        })
        .catch(() => {
          localStorage.removeItem('token');
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      });
      
      if (!response.ok) {
        throw new Error('Login failed');
      }
      
      const data = await response.json();
      localStorage.setItem('token', data.token);
      setUser(data.user);
    } catch (error) {
      throw new Error('Login failed');
    }
  };

  const register = async (userData: any) => {
    try {
      const response = await apiRequest('POST', '/api/auth/register', userData);
      const data = await response.json();
      
      localStorage.setItem('token', data.token);
      setUser(data.user);
    } catch (error: any) {
      // The apiRequest function throws errors in format "status: responseText"
      // Extract the actual error message from the backend
      if (error.message && error.message.includes(':')) {
        const errorMessage = error.message.split(':', 2)[1].trim();
        try {
          // Try to parse as JSON to get the structured error message
          const errorData = JSON.parse(errorMessage);
          throw new Error(errorData.message || 'Registration failed');
        } catch {
          // If not JSON, use the error message directly
          throw new Error(errorMessage || 'Registration failed');
        }
      }
      throw new Error('Registration failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    // Clear all query cache to prevent state leakage between users
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
