
import { useState } from "react";
import { UserRole } from "./AuthTypes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useAuth } from "./AuthContext";

interface SignupFormProps {
  onToggleForm: () => void;
}

const SignupForm = ({ onToggleForm }: SignupFormProps) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<UserRole>("student");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { signup } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !password || !confirmPassword) {
      toast.error("Please fill out all fields");
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Make sure role is a valid string that exactly matches one of the enum values
      const safeRole: UserRole = role === "teacher" ? "teacher" : "student";
      
      console.log("Submitting signup form:", {
        name,
        email,
        role: safeRole,
        roleType: typeof safeRole
      });
      
      const result = await signup(name, email, password, safeRole);
      
      console.log("Signup API response:", result);
      
      if (result?.user) {
        toast.success("Account created successfully!");
      } else if (result?.session === null) {
        toast.info("Account created! Please confirm your email to log in.");
      } else {
        toast.success("Account registration in process.");
      }
    } catch (error) {
      console.error("Signup error details:", error);
      if (error instanceof Error) {
        toast.error(`Registration failed: ${error.message}`);
      } else {
        toast.error("Failed to create account");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Full Name</Label>
        <Input
          id="name"
          type="text"
          placeholder="John Doe"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isSubmitting}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="signupEmail">Email</Label>
        <Input
          id="signupEmail"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isSubmitting}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="signupPassword">Password</Label>
        <Input
          id="signupPassword"
          type="password"
          placeholder="At least 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isSubmitting}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="Confirm your password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={isSubmitting}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label>I am a:</Label>
        <RadioGroup 
          value={role} 
          onValueChange={(value) => setRole(value as UserRole)}
          className="flex space-x-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="student" id="signupStudent" />
            <Label htmlFor="signupStudent" className="cursor-pointer">Student</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="teacher" id="signupTeacher" />
            <Label htmlFor="signupTeacher" className="cursor-pointer">Teacher</Label>
          </div>
        </RadioGroup>
      </div>
      
      <div className="space-y-4">
        <Button 
          type="submit" 
          className="w-full bg-quiz-blue hover:bg-quiz-blue-dark"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
              Creating Account...
            </>
          ) : (
            "Sign Up"
          )}
        </Button>
        
        <p className="text-center text-sm">
          Already have an account?{" "}
          <button
            type="button"
            onClick={onToggleForm}
            className="text-quiz-purple hover:underline focus:outline-none"
          >
            Sign in
          </button>
        </p>
      </div>
    </form>
  );
};

export default SignupForm;
