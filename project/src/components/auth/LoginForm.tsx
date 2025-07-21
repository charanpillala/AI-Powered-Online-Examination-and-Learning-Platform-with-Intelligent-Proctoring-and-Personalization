
import { useState } from "react";
import { useAuth } from "./AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface LoginFormProps {
  onToggleForm: () => void;
  onForgotPassword: () => void;
}

const LoginForm = ({ onToggleForm, onForgotPassword }: LoginFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Please fill out all fields");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await login(email, password);
      toast.success("Logged in successfully!");
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to log in");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isSubmitting}
          required
        />
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label htmlFor="password">Password</Label>
          <button
            type="button"
            onClick={onForgotPassword}
            className="text-xs text-quiz-blue hover:underline focus:outline-none"
          >
            Forgot password?
          </button>
        </div>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isSubmitting}
          required
        />
      </div>
      
      <div className="space-y-4">
        <Button 
          type="submit" 
          className="w-full bg-quiz-purple hover:bg-quiz-purple-dark"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
              Signing in...
            </>
          ) : (
            "Sign In"
          )}
        </Button>
        
        <p className="text-center text-sm">
          Don't have an account?{" "}
          <button
            type="button"
            onClick={onToggleForm}
            className="text-quiz-blue hover:underline focus:outline-none"
          >
            Sign up
          </button>
        </p>
      </div>

      <div className="border-t pt-4">
        <p className="text-center text-xs text-muted-foreground mb-2">Demo credentials:</p>
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <div>
            <p className="font-medium">Teacher:</p>
            <p>teacher@example.com</p>
            <p>password123</p>
          </div>
          <div>
            <p className="font-medium">Student:</p>
            <p>student@example.com</p>
            <p>password123</p>
          </div>
        </div>
      </div>
    </form>
  );
};

export default LoginForm;
