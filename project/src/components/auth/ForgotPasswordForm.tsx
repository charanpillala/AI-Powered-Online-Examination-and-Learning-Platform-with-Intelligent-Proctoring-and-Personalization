
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";

interface ForgotPasswordFormProps {
  onBack: () => void;
}

const ForgotPasswordForm = ({ onBack }: ForgotPasswordFormProps) => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast.error(error.message);
      } else {
        setIsSuccess(true);
        toast.success("Password reset instructions sent to your email");
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to send reset instructions");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <button 
        type="button"
        onClick={onBack}
        className="flex items-center text-sm text-quiz-blue hover:underline mb-2"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Sign In
      </button>
      
      {!isSuccess ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="email">Email Address</Label>
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
          
          <Button 
            type="submit" 
            className="w-full bg-quiz-purple hover:bg-quiz-purple-dark"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                Sending...
              </>
            ) : (
              "Send Reset Instructions"
            )}
          </Button>
        </form>
      ) : (
        <div className="text-center space-y-4">
          <div className="bg-green-50 text-green-700 rounded-lg p-4 border border-green-100">
            <p className="font-medium">Reset instructions sent!</p>
            <p className="text-sm mt-2">
              Check your email for a link to reset your password.
            </p>
          </div>
          
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={onBack}
          >
            Return to Sign In
          </Button>
        </div>
      )}
    </div>
  );
};

export default ForgotPasswordForm;
