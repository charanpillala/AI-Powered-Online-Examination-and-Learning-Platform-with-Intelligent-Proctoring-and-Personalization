
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Search, UserPlus, Loader2, ClipboardCopy, RefreshCcw } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const Students = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [invitationCode, setInvitationCode] = useState("");
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [expiryDays, setExpiryDays] = useState(7);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setIsLoading(true);
        if (!user || user.role !== "teacher") return;

        // Fetch students that are connected to this teacher
        const { data: teacherStudents, error: teacherStudentsError } = await supabase
          .from('teacher_students')
          .select('student_id')
          .eq('teacher_id', user.id);

        if (teacherStudentsError) throw teacherStudentsError;

        if (teacherStudents && teacherStudents.length > 0) {
          const studentIds = teacherStudents.map(ts => ts.student_id);
          
          const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .in('id', studentIds)
            .eq('role', 'student');

          if (error) throw error;
          setStudents(data || []);
        } else {
          setStudents([]);
        }
      } catch (error) {
        console.error('Error fetching students:', error);
        toast.error('Failed to load student data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudents();
  }, [user]);

  const generateInvitationCode = async () => {
    try {
      setIsGeneratingCode(true);
      if (!user || user.role !== "teacher") {
        toast.error("Only teachers can generate invitation codes");
        return;
      }

      // Generate a random 8-character code
      const randomCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      
      // Calculate expiry date (default: 7 days from now)
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + expiryDays);

      // Insert the code into the database
      const { data, error } = await supabase
        .from('invitation_codes')
        .insert({
          code: randomCode,
          teacher_id: user.id,
          expires_at: expiryDate.toISOString()
        })
        .select();

      if (error) {
        throw error;
      }

      setInvitationCode(randomCode);
      toast.success("Invitation code generated successfully");
    } catch (error) {
      console.error("Error generating invitation code:", error);
      toast.error("Failed to generate invitation code");
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const copyCodeToClipboard = () => {
    navigator.clipboard.writeText(invitationCode);
    toast.success("Code copied to clipboard");
  };

  const filteredStudents = students.filter(student => 
    student.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Students</h1>
        <p className="text-muted-foreground">Manage your students and classes</p>
      </div>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Student Directory</CardTitle>
          <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <UserPlus className="h-4 w-4" />
                Invite Student
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite a Student</DialogTitle>
                <DialogDescription>
                  Generate an invitation code for a student to join your class. 
                  They will need to enter this code to gain access to your materials and quizzes.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="expiryDays">Code expires after (days)</Label>
                  <Input 
                    id="expiryDays"
                    type="number" 
                    value={expiryDays} 
                    onChange={(e) => setExpiryDays(parseInt(e.target.value) || 7)} 
                    min={1} 
                    max={30}
                  />
                </div>
                
                {invitationCode ? (
                  <div className="space-y-2">
                    <Label>Invitation Code</Label>
                    <div className="flex items-center gap-2">
                      <div className="bg-muted p-3 rounded-md flex-1 text-center font-mono tracking-wider">
                        {invitationCode}
                      </div>
                      <Button variant="outline" size="icon" onClick={copyCodeToClipboard}>
                        <ClipboardCopy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      This code will expire in {expiryDays} days. Share it with your student.
                    </p>
                  </div>
                ) : null}
              </div>
              
              <DialogFooter>
                {invitationCode ? (
                  <Button onClick={() => {
                    setInvitationCode("");
                    generateInvitationCode();
                  }} className="gap-2" disabled={isGeneratingCode}>
                    <RefreshCcw className="h-4 w-4" />
                    Generate New Code
                  </Button>
                ) : (
                  <Button onClick={generateInvitationCode} className="gap-2" disabled={isGeneratingCode}>
                    {isGeneratingCode ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> 
                        Generating...
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4" /> 
                        Generate Code
                      </>
                    )}
                  </Button>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search students..." 
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredStudents.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.full_name || 'Unnamed'}</TableCell>
                    <TableCell>{student.email}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">View</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-12">
              {searchTerm ? 'No students found matching your search.' : 'No students available. Invite students to get started.'}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Students;
