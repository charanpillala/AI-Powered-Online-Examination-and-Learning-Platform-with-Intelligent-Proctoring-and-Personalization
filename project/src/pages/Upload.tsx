
import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/components/auth/AuthContext";
import { toast } from "sonner";
import { FileUp, FileText, FileQuestion, Loader2, Save, AlertCircle } from "lucide-react";
import aiService, { Question } from "@/services/aiService";
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Upload = () => {
  const { user } = useAuth();
  const isTeacher = user?.role === "teacher";
  
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [isSavingQuiz, setIsSavingQuiz] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([]);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [uploadedFileId, setUploadedFileId] = useState<string | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const fileName = selectedFile.name.split('.').slice(0, -1).join('.');
      setTitle(fileName);
    }
  };
  
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      toast.error("Please select a file to upload");
      return;
    }
    
    if (!title.trim()) {
      toast.error("Please enter a title for the material");
      return;
    }
    
    setIsUploading(true);
    
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `materials/${user?.id}/${uuidv4()}.${fileExt}`;
      const fileType = file.type;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('materials')
        .upload(filePath, file);
      
      if (uploadError) {
        throw new Error(`File upload failed: ${uploadError.message}`);
      }
      
      const { data: urlData } = supabase.storage
        .from('materials')
        .getPublicUrl(filePath);
      
      const fileUrl = urlData.publicUrl;
      
      const materialId = uuidv4();
      const { error: dbError } = await supabase
        .from('materials')
        .insert({
          id: materialId,
          teacher_id: user?.id,
          title,
          description,
          file_url: fileUrl,
          file_type: fileType,
          is_public: false
        });
      
      if (dbError) {
        throw new Error(`Database save failed: ${dbError.message}`);
      }
      
      setUploadedFileUrl(fileUrl);
      setUploadedFileId(materialId);
      toast.success(`${title} has been uploaded successfully!`);
      
      if (!isTeacher) {
        resetForm();
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : "Failed to upload file. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleGenerateQuestions = async () => {
    if (!file && !uploadedFileUrl) {
      toast.error("Please upload a file first");
      return;
    }
    
    setIsGeneratingQuestions(true);
    setGenerateError(null);
    
    try {
      // Extract text content from the file for AI
      const fileContent = `${title} ${description}`;
      
      // Pass the file URL to the AI service to potentially access the file content
      const questions = await aiService.generateQuestions(fileContent, {
        numQuestions: 5,
        types: ['multiple-choice'],
        fileUrl: uploadedFileUrl || undefined
      });
      
      if (!questions || questions.length === 0) {
        throw new Error("No questions were generated. Please try again.");
      }
      
      setGeneratedQuestions(questions);
      toast.success("Questions generated successfully!");
    } catch (error) {
      console.error('Question generation error:', error);
      setGenerateError(error instanceof Error ? error.message : "Failed to generate questions. Please try again.");
      toast.error("Failed to generate questions. Please try again.");
    } finally {
      setIsGeneratingQuestions(false);
    }
  };
  
  const handleSaveQuiz = async () => {
    if (generatedQuestions.length === 0) {
      toast.error("Please generate questions first");
      return;
    }
    
    if (!uploadedFileId) {
      toast.error("Material information missing. Please re-upload the file.");
      return;
    }
    
    setIsSavingQuiz(true);
    
    try {
      let quizTitle = `Quiz for ${title}`;
      try {
        const fileContent = `${title} ${description}`;
        quizTitle = await aiService.getQuizTitle(fileContent);
      } catch (error) {
        console.error('Error getting quiz title:', error);
      }
      
      const quizId = uuidv4();
      const { error: quizError } = await supabase
        .from('quizzes')
        .insert({
          id: quizId,
          teacher_id: user?.id,
          material_id: uploadedFileId,
          title: quizTitle,
          description: `Generated quiz for ${title}`,
          duration_minutes: 30,
          is_active: true
        });
      
      if (quizError) {
        throw new Error(`Failed to save quiz: ${quizError.message}`);
      }
      
      const questionsToInsert = generatedQuestions.map(q => ({
        id: uuidv4(),
        quiz_id: quizId,
        question_text: q.question,
        question_type: q.type,
        points: 1
      }));
      
      const { error: questionsError } = await supabase
        .from('questions')
        .insert(questionsToInsert);
      
      if (questionsError) {
        throw new Error(`Failed to save questions: ${questionsError.message}`);
      }
      
      const optionsToInsert = [];
      
      for (const question of generatedQuestions) {
        if (question.type === 'multiple-choice' && question.options) {
          const questionId = questionsToInsert.find(q => q.question_text === question.question)?.id;
          
          if (questionId) {
            question.options.forEach((option, index) => {
              optionsToInsert.push({
                id: uuidv4(),
                question_id: questionId,
                option_text: option,
                is_correct: index === Number(question.correctAnswer)
              });
            });
          }
        }
      }
      
      if (optionsToInsert.length > 0) {
        const { error: optionsError } = await supabase
          .from('question_options')
          .insert(optionsToInsert);
        
        if (optionsError) {
          throw new Error(`Failed to save options: ${optionsError.message}`);
        }
      }
      
      toast.success("Quiz saved successfully!");
      resetForm();
    } catch (error) {
      console.error('Quiz save error:', error);
      toast.error(error instanceof Error ? error.message : "Failed to save quiz. Please try again.");
    } finally {
      setIsSavingQuiz(false);
    }
  };
  
  const resetForm = () => {
    setFile(null);
    setTitle("");
    setDescription("");
    setGeneratedQuestions([]);
    setUploadedFileUrl(null);
    setUploadedFileId(null);
    setGenerateError(null);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{isTeacher ? "Upload Educational Material" : "Upload Study Material"}</h1>
      <p className="text-muted-foreground">
        {isTeacher 
          ? "Upload PDFs or PPTs for your students and generate quiz questions automatically" 
          : "Upload your study materials and let AI help you learn with summaries and practice questions"}
      </p>
      
      <Tabs defaultValue="upload" className="w-full">
        <TabsList>
          <TabsTrigger value="upload">Upload Material</TabsTrigger>
          {isTeacher && <TabsTrigger value="questions">Generate Questions</TabsTrigger>}
        </TabsList>
        
        <TabsContent value="upload">
          <Card className="quiz-card">
            <form onSubmit={handleUpload}>
              <CardHeader>
                <CardTitle>Upload Document</CardTitle>
                <CardDescription>
                  Upload PDFs or PowerPoint presentations to share with {isTeacher ? "your students" : "study"}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="file">File</Label>
                  <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center bg-muted/50">
                    <FileUp className="h-8 w-8 mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-2">
                      Drag and drop your file here, or click to browse
                    </p>
                    <p className="text-xs text-muted-foreground mb-4">
                      Supports PDF, PPT, PPTX (Max 20MB)
                    </p>
                    <Input 
                      id="file" 
                      type="file" 
                      className="max-w-xs"
                      onChange={handleFileChange}
                      accept=".pdf,.ppt,.pptx"
                      disabled={isUploading}
                    />
                  </div>
                </div>
                
                {(file || uploadedFileUrl) && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Enter a title for this material"
                        required
                        disabled={isUploading}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="description">Description (Optional)</Label>
                      <Input
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Add a brief description"
                        disabled={isUploading}
                      />
                    </div>
                  </>
                )}
              </CardContent>
              
              <CardFooter className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  disabled={!file || isUploading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!file || isUploading || !!uploadedFileUrl}
                  className="bg-quiz-purple hover:bg-quiz-purple-dark"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : uploadedFileUrl ? (
                    <>
                      <FileUp className="mr-2 h-4 w-4" />
                      Uploaded
                    </>
                  ) : (
                    <>
                      <FileUp className="mr-2 h-4 w-4" />
                      Upload Material
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
        
        {isTeacher && (
          <TabsContent value="questions">
            <Card className="quiz-card">
              <CardHeader>
                <CardTitle>Generate Quiz Questions</CardTitle>
                <CardDescription>
                  AI will analyze your material and generate questions automatically
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {!file && !uploadedFileUrl && (
                  <div className="text-center p-6 border rounded-lg bg-muted/30">
                    <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      Please upload a document first to generate questions
                    </p>
                  </div>
                )}
                
                {(file || uploadedFileUrl) && (
                  <>
                    <div className="flex items-center justify-between border p-4 rounded-lg">
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 mr-2" />
                        <div>
                          <p className="font-medium">{file ? file.name : title}</p>
                          <p className="text-xs text-muted-foreground">
                            {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Uploaded'}
                          </p>
                        </div>
                      </div>
                      
                      <Button 
                        onClick={handleGenerateQuestions}
                        disabled={isGeneratingQuestions}
                        className="bg-quiz-blue hover:bg-quiz-blue-dark"
                      >
                        {isGeneratingQuestions ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <FileQuestion className="mr-2 h-4 w-4" />
                            Generate Questions
                          </>
                        )}
                      </Button>
                    </div>
                    
                    {generateError && (
                      <Alert variant="destructive" className="mt-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          {generateError}
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    {generatedQuestions.length > 0 && (
                      <div className="space-y-4 mt-4">
                        <h3 className="text-lg font-medium">Generated Questions</h3>
                        
                        {generatedQuestions.map((question, index) => (
                          <div key={question.id} className="border p-4 rounded-lg">
                            <div className="flex justify-between mb-2">
                              <span className="text-sm font-medium">Question {index + 1}</span>
                              <span className="text-xs bg-muted px-2 py-0.5 rounded capitalize">
                                {question.type}
                              </span>
                            </div>
                            <p className="mb-2">{question.question}</p>
                            
                            {question.type === 'multiple-choice' && question.options && (
                              <div className="grid gap-2 pl-4">
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
                          </div>
                        ))}
                        
                        <div className="flex justify-end space-x-2 mt-4">
                          <Button variant="outline" onClick={() => setGeneratedQuestions([])}>
                            Clear Questions
                          </Button>
                          <Button 
                            className="bg-quiz-accent hover:bg-quiz-accent-dark"
                            onClick={handleSaveQuiz}
                            disabled={isSavingQuiz}
                          >
                            {isSavingQuiz ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <Save className="mr-2 h-4 w-4" />
                                Save to Quiz Bank
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default Upload;
