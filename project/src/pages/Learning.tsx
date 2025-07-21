import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileQuestion, Calendar, Clock, Book, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthContext";
import { toast } from "sonner";
import ExamProctorNotice from "@/components/exam/ExamProctorNotice";

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  duration_minutes: number | null;
  created_at: string;
  teacher: {
    full_name: string | null;
  } | null;
}

const Learning = () => {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [showProctorNotice, setShowProctorNotice] = useState(false);

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        setIsLoading(true);
        
        const { data, error } = await supabase
          .from('quizzes')
          .select(`
            id, 
            title, 
            description, 
            duration_minutes,
            created_at,
            teacher:teacher_id(full_name)
          `)
          .eq('is_active', true)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        setQuizzes(data || []);
      } catch (error) {
        console.error("Error fetching quizzes:", error);
        toast.error("Failed to load quizzes");
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchQuizzes();
    }
  }, [user]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    }).format(date);
  };

  const handleStartQuiz = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    setShowProctorNotice(true);
  };

  const handleProctorConfirm = () => {
    setShowProctorNotice(false);
    toast.success(`Starting ${selectedQuiz?.title}`);
  };

  const handleProctorClose = () => {
    setShowProctorNotice(false);
    setSelectedQuiz(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Learning Center</h1>
        <p className="text-muted-foreground">Practice quizzes and study materials</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Available Quizzes</CardTitle>
          <CardDescription>
            Take quizzes to test your knowledge and track your progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : quizzes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {quizzes.map((quiz) => (
                <Card key={quiz.id} className="overflow-hidden">
                  <div className="bg-quiz-purple/10 p-4 flex items-center justify-center">
                    <FileQuestion className="h-8 w-8 text-quiz-purple" />
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-1">{quiz.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {quiz.description || "No description provided"}
                    </p>
                    <div className="space-y-2">
                      {quiz.teacher && (
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Book className="h-3 w-3 mr-1" />
                          <span>By: {quiz.teacher.full_name || "Unknown Teacher"}</span>
                        </div>
                      )}
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>Created: {formatDate(quiz.created_at)}</span>
                      </div>
                      {quiz.duration_minutes && (
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>{quiz.duration_minutes} minutes</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 pt-0 flex justify-end">
                    <Button 
                      size="sm" 
                      className="bg-quiz-purple hover:bg-quiz-purple-dark"
                      onClick={() => handleStartQuiz(quiz)}
                    >
                      Start Quiz
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileQuestion className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No quizzes available yet</p>
              <p className="text-sm text-muted-foreground">
                Check back later or ask your teacher to create some quizzes
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {selectedQuiz && (
        <ExamProctorNotice 
          isOpen={showProctorNotice}
          onClose={handleProctorClose}
          onConfirm={handleProctorConfirm}
          examTitle={selectedQuiz.title}
        />
      )}
    </div>
  );
};

export default Learning;
