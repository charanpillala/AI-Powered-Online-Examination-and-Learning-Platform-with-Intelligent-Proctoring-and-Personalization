
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { UserPlus } from "lucide-react";
import JoinClassForm from "../auth/JoinClassForm";

const JoinClassButton = () => {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-start">
          <UserPlus className="mr-2 h-4 w-4" />
          Join a Class
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Join a Class</DialogTitle>
          <DialogDescription>
            Enter the invitation code provided by your teacher to join their class.
          </DialogDescription>
        </DialogHeader>
        <JoinClassForm 
          onSuccess={() => setDialogOpen(false)} 
          onCancel={() => setDialogOpen(false)} 
        />
      </DialogContent>
    </Dialog>
  );
};

export default JoinClassButton;
