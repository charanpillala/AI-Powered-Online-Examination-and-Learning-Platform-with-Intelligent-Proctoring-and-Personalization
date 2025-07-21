
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/components/auth/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { PlusCircle, MinusCircle, Loader2, Save, FileText, Shuffle, Timer, Medal } from "lucide-react";
import aiService, { Question } from "@/services/aiService";

const difficultyLevels = [
  { value: "easy", label: "Easy", points: 1 },
  { value: "medium", label: "Medium", points: 2 },
  { value: "hard", label: "Hard", points: 3 }
];

const CreateExam = () => {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("45"); // Default 45 minutes
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [randomizeQuestions, setRandomizeQuestions] = useState(true);
  
  // Materials state
  const [materials, setMaterials] = useState<any[]>([]);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(null);
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(false);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [aiGeneratedQuestions, setAiGeneratedQuestions] = useState<Question[]>([]);

  // Questions state
  const [questions, setQuestions] = useState<any[]>([
    { 
      id: uuidv4(), 
      text: "", 
      type: "multiple-choice", 
      difficulty: "medium", 
      points: 2,
      options: [
        { id: uuidv4(), text: "", isCorrect: true }, 
        { id: uuidv4(), text: "", isCorrect: false }
      ] 
    }
  ]);

  // Load teacher's materials on component mount
  useState(() => {
    fetchMaterials();
  });

  const fetchMaterials = async () => {
    if (!user) return;
    
    setIsLoadingMaterials(true);
    
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .eq('teacher_id', user.id);
        
      if (error) throw error;
      
      setMaterials(data || []);
    } catch (error) {
      console.error('Error fetching materials:', error);
      toast.error('Failed to load your educational materials');
    } finally {
      setIsLoadingMaterials(false);
    }
  };

  const handleGenerateQuestions = async () => {
    if (!selectedMaterialId) {
      toast.error("Please select a material first");
      return;
    }
    
    setIsGeneratingQuestions(true);
    
    try {
      const material = materials.find(m => m.id === selectedMaterialId);
      
      if (!material) {
        throw new Error("Selected material not found");
      }
      
      // Generate questions using AI
      const questions = await aiService.generateQuestions(`${material.title} ${material.description || ""}`, {
        numQuestions: 5,
        types: ['multiple-choice', 'short-answer', 'essay'],
        fileUrl: material.file_url
      });
      
      setAiGeneratedQuestions(questions);
      toast.success("Questions generated successfully!");
    } catch (error) {
      console.error('Error generating questions:', error);
      toast.error("Failed to generate questions. Please try again.");
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  const handleAddAiQuestion = (question: Question) => {
    let newQuestion = {
      id: question.id,
      text: question.question,
      type: question.type,
      difficulty: "medium",
      points: 2,
      options: question.options ? 
        question.options.map((opt, idx) => ({
          id: uuidv4(),
          text: opt,
          isCorrect: idx === (question.correctAnswer as number)
        })) : []
    };
    
    setQuestions(prev => [...prev, newQuestion]);
    toast.success("Question added to exam");
  };

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      { 
        id: uuidv4(), 
        text: "", 
        type: "multiple-choice", 
        difficulty: "medium", 
        points: 2,
        options: [
          { id: uuidv4(), text: "", isCorrect: true }, 
          { id: uuidv4(), text: "", isCorrect: false }
        ] 
      }
    ]);
  };

  const handleRemoveQuestion = (questionId: string) => {
    setQuestions(questions.filter(q => q.id !== questionId));
  };

  const handleQuestionChange = (questionId: string, field: string, value: any) => {
    setQuestions(questions.map(q => {
      if (q.id !== questionId) return q;
      
      // If changing difficulty, update points to match
      if (field === 'difficulty') {
        const diffLevel = difficultyLevels.find(d => d.value === value);
        return { 
          ...q, 
          [field]: value,
          points: diffLevel ? diffLevel.points : q.points
        };
      }
      
      return { ...q, [field]: value };
    }));
  };

  const handleOptionChange = (questionId: string, optionId: string, field: string, value: any) => {
    setQuestions(questions.map(q => {
      if (q.id !== questionId) return q;
      
      // For isCorrect, we need to set all other options to false
      if (field === 'isCorrect' && value === true) {
        return {
          ...q,
          options: q.options.map((opt: any) => ({
            ...opt,
            isCorrect: opt.id === optionId
          }))
        };
      }
      
      // For other field changes
      return {
        ...q,
        options: q.options.map((opt: any) => 
          opt.id === optionId ? { ...opt, [field]: value } : opt
        )
      };
    }));
  };

  const handleAddOption = (questionId: string) => {
    setQuestions(questions.map(q => 
      q.id === questionId ? { 
        ...q, 
        options: [...q.options, { id: uuidv4(), text: "", isCorrect: false }] 
      } : q
    ));
  };

  const handleRemoveOption = (questionId: string, optionId: string) => {
    setQuestions(questions.map(q => {
      if (q.id !== questionId) return q;
      
      const newOptions = q.options.filter((opt: any) => opt.id !== optionId);
      
      // Ensure at least one option is marked as correct for multiple-choice
      if (q.type === 'multiple-choice' && newOptions.length > 0 && !newOptions.some((opt: any) => opt.isCorrect)) {
        newOptions[0].isCorrect = true;
      }
      
      return { ...q, options: newOptions };
    }));
  };

  const handleSaveExam = async () => {
    try {
      if (!title.trim()) {
        toast.error("Please enter an exam title");
        return;
      }

      if (questions.length === 0) {
        toast.error("Please add at least one question");
        return;
      }

      // Validate all questions have text
      const invalidQuestions = questions.filter(q => !q.text.trim());
      if (invalidQuestions.length > 0) {
        toast.error("Please complete all question texts");
        return;
      }
      
      // Validate all multiple-choice questions have at least 2 options with text
      const invalidMCQuestions = questions.filter(q => 
        q.type === 'multiple-choice' && 
        (q.options.length < 2 || q.options.some((opt: any) => !opt.text.trim()))
      );
      if (invalidMCQuestions.length > 0) {
        toast.error("All multiple-choice questions must have at least 2 options with text");
        return;
      }

      setIsSubmitting(true);

      // Create exam in database
      const examId = uuidv4();
      const { error: quizError } = await supabase
        .from('quizzes')
        .insert({
          id: examId,
          teacher_id: user?.id,
          title,
          description,
          duration_minutes: Number(duration),
          is_active: true,
          material_id: selectedMaterialId || null
        });

      if (quizError) throw quizError;

      // Create questions
      const questionsToInsert = questions.map(q => ({
        id: q.id,
        quiz_id: examId,
        question_text: q.text,
        question_type: q.type,
        points: q.points
      }));

      const { error: questionsError } = await supabase
        .from('questions')
        .insert(questionsToInsert);

      if (questionsError) throw questionsError;

      // Create question options for multiple-choice questions
      const optionsToInsert = questions
        .filter(q => q.type === 'multiple-choice')
        .flatMap(q => 
          q.options.map((opt: any) => ({
            id: opt.id,
            question_id: q.id,
            option_text: opt.text,
            is_correct: opt.isCorrect
          }))
        );

      if (optionsToInsert.length > 0) {
        const { error: optionsError } = await supabase
          .from('question_options')
          .insert(optionsToInsert);

        if (optionsError) throw optionsError;
      }

      toast.success("Exam created successfully!");
      
      // Reset form
      setTitle("");
      setDescription("");
      setDuration("45");
      setSelectedMaterialId(null);
      setAiGeneratedQuestions([]);
      setQuestions([
        { 
          id: uuidv4(), 
          text: "", 
          type: "multiple-choice", 
          difficulty: "medium", 
          points: 2,
          options: [
            { id: uuidv4(), text: "", isCorrect: true }, 
            { id: uuidv4(), text: "", isCorrect: false }
          ] 
        }
      ]);
      
    } catch (error) {
      console.error("Error saving exam:", error);
      toast.error("Failed to save exam. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create Exam</h1>
        <p className="text-muted-foreground">Design comprehensive exams with AI-assisted question generation</p>
      </div>
      
      <Tabs defaultValue="basic" className="w-full">
        <TabsList>
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="ai">AI Generation</TabsTrigger>
          <TabsTrigger value="questions">Questions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="basic">
          <Card>
            <CardHeader>
              <CardTitle>Exam Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Exam Title</Label>
                <Input 
                  id="title"
                  placeholder="Enter exam title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea 
                  id="description"
                  placeholder="Enter exam description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="duration" className="flex items-center gap-2">
                    <Timer className="w-4 h-4" />
                    Duration (minutes)
                  </Label>
                  <Input 
                    id="duration"
                    type="number"
                    placeholder="45"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    min={5}
                    max={180}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="randomize" className="flex items-center gap-2">
                    <Shuffle className="w-4 h-4" />
                    Randomize Questions
                  </Label>
                  <div className="flex items-center space-x-2 pt-2">
                    <Switch 
                      id="randomize" 
                      checked={randomizeQuestions} 
                      onCheckedChange={setRandomizeQuestions} 
                    />
                    <Label htmlFor="randomize" className="text-sm text-muted-foreground">
                      {randomizeQuestions ? "Questions will be presented in random order" : "Questions will be presented in fixed order"}
                    </Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="ai">
          <Card>
            <CardHeader>
              <CardTitle>AI-Assisted Question Generation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="material">Select Educational Material</Label>
                <Select 
                  value={selectedMaterialId || undefined} 
                  onValueChange={(value) => setSelectedMaterialId(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a material" />
                  </SelectTrigger>
                  <SelectContent>
                    {materials.length === 0 ? (
                      <SelectItem value="none" disabled>No materials found</SelectItem>
                    ) : (
                      materials.map(material => (
                        <SelectItem key={material.id} value={material.id}>
                          {material.title}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <Button
                onClick={handleGenerateQuestions}
                disabled={!selectedMaterialId || isGeneratingQuestions}
                className="w-full"
              >
                {isGeneratingQuestions ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing Material...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Generate Questions from Material
                  </>
                )}
              </Button>
              
              {aiGeneratedQuestions.length > 0 && (
                <div className="space-y-4 pt-4">
                  <h3 className="text-lg font-medium">AI-Generated Questions</h3>
                  
                  {aiGeneratedQuestions.map((question) => (
                    <Card key={question.id} className="relative">
                      <CardContent className="pt-6 pb-4">
                        <div className="absolute top-3 right-3">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => handleAddAiQuestion(question)}
                          >
                            <PlusCircle className="h-4 w-4 mr-1" /> 
                            Add to Exam
                          </Button>
                        </div>
                        
                        <div className="flex justify-between mb-2">
                          <span className="font-medium">{question.question}</span>
                          <span className="text-xs bg-muted px-2 py-0.5 rounded capitalize">
                            {question.type}
                          </span>
                        </div>
                        
                        {question.type === 'multiple-choice' && question.options && (
                          <div className="grid gap-2 pl-4 mt-2">
                            {question.options.map((option, optIndex) => (
                              <div key={optIndex} className="flex items-center gap-2">
                                <div className={`h-4 w-4 rounded-full border flex-shrink-0 ${
                                  optIndex === (question.correctAnswer as number) 
                                    ? 'bg-green-500 border-green-500' 
                                    : 'border-gray-300'
                                }`} />
                                <span className="text-sm">{option}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="questions">
          <Card>
            <CardHeader>
              <CardTitle>Exam Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
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
                      <Textarea 
                        id={`question-${question.id}`}
                        placeholder="Enter question"
                        value={question.text}
                        onChange={(e) => handleQuestionChange(question.id, 'text', e.target.value)}
                        rows={2}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Question Type</Label>
                        <Select 
                          value={question.type}
                          onValueChange={(value) => handleQuestionChange(question.id, 'type', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                            <SelectItem value="short-answer">Short Answer</SelectItem>
                            <SelectItem value="essay">Essay</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Medal className="h-4 w-4" />
                          Difficulty
                        </Label>
                        <Select 
                          value={question.difficulty}
                          onValueChange={(value) => handleQuestionChange(question.id, 'difficulty', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select difficulty" />
                          </SelectTrigger>
                          <SelectContent>
                            {difficultyLevels.map(level => (
                              <SelectItem key={level.value} value={level.value}>
                                {level.label} ({level.points} {level.points === 1 ? 'point' : 'points'})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`points-${question.id}`}>Points</Label>
                        <Input 
                          id={`points-${question.id}`}
                          type="number" 
                          value={question.points} 
                          onChange={(e) => handleQuestionChange(question.id, 'points', parseInt(e.target.value, 10))}
                          min={1}
                          max={10}
                        />
                      </div>
                    </div>
                    
                    {question.type === 'multiple-choice' && (
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
                        
                        {question.options.map((option: any, oIndex: number) => (
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
                    )}
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
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button
                onClick={handleSaveExam}
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
                    Save Exam
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CreateExam;
