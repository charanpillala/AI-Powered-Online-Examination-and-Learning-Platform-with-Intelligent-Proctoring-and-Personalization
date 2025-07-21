
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";
import { Loader2 } from "lucide-react";

interface JoinClassFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const JoinClassForm = ({ onSuccess, onCancel }: JoinClassFormProps) => {
  const [invitationCode, setInvitationCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!invitationCode.trim()) {
      toast.error("Please enter an invitation code");
      return;
    }

    if (!user || user.role !== "student") {
      toast.error("Only students can join a class");
      return;
    }

    try {
      setIsSubmitting(true);

      // First, check if the invitation code exists and is valid
      const { data: codes, error: codeError } = await supabase
        .from('invitation_codes')
        .select('id, teacher_id, is_used, expires_at')
        .eq('code', invitationCode.trim())
        .single();

      if (codeError || !codes) {
        toast.error("Invalid invitation code");
        return;
      }

      // Check if code is expired
      if (new Date(codes.expires_at) < new Date()) {
        toast.error("This invitation code has expired");
        return;
      }

      // Check if code is already used
      if (codes.is_used) {
        toast.error("This invitation code has already been used");
        return;
      }

      // Create teacher-student relationship
      const { error: relationshipError } = await supabase
        .from('teacher_students')
        .insert({
          teacher_id: codes.teacher_id,
          student_id: user.id
        });

      if (relationshipError) {
        if (relationshipError.code === '23505') { // Unique constraint violation
          toast.warning("You are already in this teacher's class");
        } else {
          throw relationshipError;
        }
      } else {
        toast.success("Successfully joined the class!");
      }

      // Mark the invitation code as used
      await supabase
        .from('invitation_codes')
        .update({
          is_used: true,
          used_by: user.id
        })
        .eq('id', codes.id);

      onSuccess();
    } catch (error) {
      console.error("Error joining class:", error);
      toast.error("Failed to join class. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="invitation-code">Invitation Code</Label>
        <Input
          id="invitation-code"
          placeholder="Enter the code provided by your teacher"
          value={invitationCode}
          onChange={(e) => setInvitationCode(e.target.value)}
          disabled={isSubmitting}
          required
          autoComplete="off"
          className="font-mono"
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Joining...
            </>
          ) : (
            "Join Class"
          )}
        </Button>
      </div>
    </form>
  );
};

export default JoinClassForm;
