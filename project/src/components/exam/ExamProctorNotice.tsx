
import { useState } from "react";
import { Camera, Mic, Timer, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface ExamProctorNoticeProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  examTitle: string;
}

const ExamProctorNotice = ({
  isOpen,
  onClose,
  onConfirm,
  examTitle,
}: ExamProctorNoticeProps) => {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      // In a real implementation, we would request camera and mic permissions here
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate permission request
      onConfirm();
    } catch (error) {
      console.error("Error requesting permissions:", error);
      toast.error("Failed to access camera or microphone. Please check your device permissions.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-500">
            <AlertTriangle className="h-5 w-5" />
            Exam Proctoring Notice
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm">
            You are about to begin your exam: <strong>{examTitle}</strong>. For the integrity and fairness of this assessment, the following measures will be active during the exam:
          </p>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="bg-muted p-2 rounded-full">
                <Camera className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Camera Access</p>
                <p className="text-sm text-muted-foreground">Your webcam will be used to monitor you throughout the exam session.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="bg-muted p-2 rounded-full">
                <Mic className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Microphone Access</p>
                <p className="text-sm text-muted-foreground">Your microphone will record background audio for proctoring purposes.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="bg-muted p-2 rounded-full">
                <Timer className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Timer Activation</p>
                <p className="text-sm text-muted-foreground">The exam is time-bound. Once started, the timer will count down automatically and cannot be paused.</p>
              </div>
            </div>
          </div>
          
          <div className="bg-muted/50 p-3 rounded-md border border-muted">
            <p className="font-medium mb-2">🔒 Important:</p>
            <ul className="space-y-1 text-sm">
              <li>• Do not switch tabs or minimize the browser.</li>
              <li>• Make sure you're in a quiet and well-lit environment.</li>
              <li>• Keep your face clearly visible at all times.</li>
            </ul>
          </div>
          
          <p className="text-sm italic">
            By clicking "Start Exam", you agree to these conditions and consent to be monitored.
          </p>
        </div>

        <DialogFooter className="flex gap-2 sm:justify-between">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={loading} 
            className="bg-green-600 hover:bg-green-700"
          >
            {loading ? "Preparing..." : "Start Exam"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExamProctorNotice;
