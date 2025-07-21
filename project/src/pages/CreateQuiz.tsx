
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/components/auth/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { PlusCircle, MinusCircle, Loader2, Save } from "lucide-react";

const CreateQuiz = () => {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("30");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [questions, setQuestions] = useState([
    { id: uuidv4(), text: "", type: "multiple-choice", options: [{ id: uuidv4(), text: "", isCorrect: true }, { id: uuidv4(), text: "", isCorrect: false }] }
  ]);

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      { id: uuidv4(), text: "", type: "multiple-choice", options: [{ id: uuidv4(), text: "", isCorrect: true }, { id: uuidv4(), text: "", isCorrect: false }] }
    ]);
  };

  const handleRemoveQuestion = (questionId) => {
    setQuestions(questions.filter(q => q.id !== questionId));
  };

  const handleQuestionChange = (questionId, field, value) => {
    setQuestions(questions.map(q => 
      q.id === questionId ? { ...q, [field]: value } : q
    ));
  };

  const handleOptionChange = (questionId, optionId, field, value) => {
    setQuestions(questions.map(q => {
      if (q.id !== questionId) return q;
      
      // For isCorrect, we need to set all other options to false
      if (field === 'isCorrect' && value === true) {
        return {
          ...q,
          options: q.options.map(opt => ({
            ...opt,
            isCorrect: opt.id === optionId
          }))
        };
      }
      
      // For other field changes
      return {
        ...q,
        options: q.options.map(opt => 
          opt.id === optionId ? { ...opt, [field]: value } : opt
        )
      };
    }));
  };

  const handleAddOption = (questionId) => {
    setQuestions(questions.map(q => 
      q.id === questionId ? { 
        ...q, 
        options: [...q.options, { id: uuidv4(), text: "", isCorrect: false }] 
      } : q
    ));
  };

  const handleRemoveOption = (questionId, optionId) => {
    setQuestions(questions.map(q => {
      if (q.id !== questionId) return q;
      
      const newOptions = q.options.filter(opt => opt.id !== optionId);
      
      // Ensure at least one option is marked as correct
      if (newOptions.length > 0 && !newOptions.some(opt => opt.isCorrect)) {
        newOptions[0].isCorrect = true;
      }
      
      return { ...q, options: newOptions };
    }));
  };

  const handleSaveQuiz = async () => {
    try {
      if (!title.trim()) {
        toast.error("Please enter a quiz title");
        return;
      }

      if (questions.length === 0) {
        toast.error("Please add at least one question");
        return;
      }

      // Validate all questions have text and options
      const invalidQuestions = questions.filter(q => !q.text.trim() || q.options.length < 2 || q.options.some(opt => !opt.text.trim()));
      if (invalidQuestions.length > 0) {
        toast.error("Please complete all questions and their options");
        return;
      }

      setIsSubmitting(true);

      // Create quiz in database
      const quizId = uuidv4();
      const { error: quizError } = await supabase
        .from('quizzes')
        .insert({
          id: quizId,
          teacher_id: user?.id,
          title,
          description,
          duration_minutes: Number(duration),
          is_active: true
        });

      if (quizError) throw quizError;

      // Create questions
      const questionsToInsert = questions.map(q => ({
        id: q.id,
        quiz_id: quizId,
        question_text: q.text,
        question_type: q.type,
        points: 1
      }));

      const { error: questionsError } = await supabase
        .from('questions')
        .insert(questionsToInsert);

      if (questionsError) throw questionsError;

      // Create question options
      const optionsToInsert = questions.flatMap(q => 
        q.options.map(opt => ({
          id: opt.id,
          question_id: q.id,
          option_text: opt.text,
          is_correct: opt.isCorrect
        }))
      );

      const { error: optionsError } = await supabase
        .from('question_options')
        .insert(optionsToInsert);

      if (optionsError) throw optionsError;

      toast.success("Quiz created successfully!");
      
      // Reset form
      setTitle("");
      setDescription("");
      setDuration("30");
      setQuestions([
        { id: uuidv4(), text: "", type: "multiple-choice", options: [{ id: uuidv4(), text: "", isCorrect: true }, { id: uuidv4(), text: "", isCorrect: false }] }
      ]);
      
    } catch (error) {
      console.error("Error saving quiz:", error);
      toast.error("Failed to save quiz. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create Quiz</h1>
        <p className="text-muted-foreground">Create custom quizzes for your students</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Quiz Builder</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Quiz Title</Label>
            <Input 
              id="title"
              placeholder="Enter quiz title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea 
              id="description"
              placeholder="Enter quiz description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="duration">Duration (minutes)</Label>
            <Input 
              id="duration"
              type="number"
              placeholder="30"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              min={5}
              max={180}
            />
          </div>
          
          <div className="pt-4">
            <h3 className="text-lg font-medium mb-4">Questions</h3>
            
            {questions.map((question, qIndex) => (
              <Card key={question.id} className="mb-6">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <h4 className="text-base font-medium">Question {qIndex + 1}</h4>
                    {questions.length > 1 && (
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleRemoveQuestion(question.id)}
                      >
                        <MinusCircle className="h-5 w-5 text-destructive" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor={`question-${question.id}`}>Question Text</Label>
                    <Input 
                      id={`question-${question.id}`}
                      placeholder="Enter question"
                      value={question.text}
                      onChange={(e) => handleQuestionChange(question.id, 'text', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Question Type</Label>
                    <Select 
                      value={question.type}
                      onValueChange={(value) => handleQuestionChange(question.id, 'type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select question type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                        <SelectItem value="true-false">True/False</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-3 pt-2">
                    <div className="flex justify-between items-center">
                      <Label>Answer Options</Label>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleAddOption(question.id)}
                      >
                        <PlusCircle className="h-4 w-4 mr-1" /> Add Option
                      </Button>
                    </div>
                    
                    {question.options.map((option, oIndex) => (
                      <div key={option.id} className="flex items-center space-x-2">
                        <div className="flex-1">
                          <Input 
                            placeholder={`Option ${oIndex + 1}`}
                            value={option.text}
                            onChange={(e) => handleOptionChange(question.id, option.id, 'text', e.target.value)}
                          />
                        </div>
                        <Select 
                          value={option.isCorrect ? "correct" : "incorrect"}
                          onValueChange={(value) => handleOptionChange(question.id, option.id, 'isCorrect', value === "correct")}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="correct">Correct</SelectItem>
                            <SelectItem value="incorrect">Incorrect</SelectItem>
                          </SelectContent>
                        </Select>
                        {question.options.length > 2 && (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleRemoveOption(question.id, option.id)}
                          >
                            <MinusCircle className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
            
            <Button 
              variant="outline" 
              className="w-full"
              onClick={handleAddQuestion}
            >
              <PlusCircle className="h-4 w-4 mr-2" /> Add Question
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button
            onClick={handleSaveQuiz}
            disabled={isSubmitting}
            className="bg-quiz-purple hover:bg-quiz-purple-dark"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Quiz
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default CreateQuiz;
