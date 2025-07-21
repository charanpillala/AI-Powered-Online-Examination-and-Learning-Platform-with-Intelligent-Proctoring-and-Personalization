
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import LoginForm from "./LoginForm";
import SignupForm from "./SignupForm";
import ForgotPasswordForm from "./ForgotPasswordForm";
import { BookOpen, Brain, FileText, CheckCircle } from "lucide-react";

const AuthPage = () => {
  const [authState, setAuthState] = useState<'login' | 'signup' | 'forgotPassword'>('login');
  
  const toggleForm = () => {
    setAuthState(authState === 'login' ? 'signup' : 'login');
  };

  const showForgotPassword = () => {
    setAuthState('forgotPassword');
  };

  const backToLogin = () => {
    setAuthState('login');
  };
  
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left side - hero section */}
      <div className="bg-gradient-to-br from-quiz-purple to-quiz-blue p-8 md:p-12 lg:p-16 text-white flex flex-col justify-center md:w-1/2">
        <div className="max-w-xl mx-auto">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            QuizGenie AI 
            <span className="block mt-2 text-quiz-accent">Your Smart Learning Partner</span>
          </h1>
          
          <p className="text-lg md:text-xl mb-8 opacity-90">
            Revolutionizing education with AI-powered quiz generation, 
            personalized learning, and seamless content management.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="flex items-start space-x-3">
              <BookOpen className="h-6 w-6 shrink-0" />
              <p>Upload materials and generate AI quizzes instantly</p>
            </div>
            <div className="flex items-start space-x-3">
              <Brain className="h-6 w-6 shrink-0" />
              <p>Smart learning paths adapt to your progress</p>
            </div>
            <div className="flex items-start space-x-3">
              <FileText className="h-6 w-6 shrink-0" />
              <p>Summarize complex content in seconds</p>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-6 w-6 shrink-0" />
              <p>Track progress with detailed analytics</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right side - auth form */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">
              {authState === 'login' && "Welcome Back"}
              {authState === 'signup' && "Create Your Account"}
              {authState === 'forgotPassword' && "Reset Your Password"}
            </CardTitle>
            <CardDescription>
              {authState === 'login' && "Sign in to continue with QuizGenie AI"}
              {authState === 'signup' && "Join thousands of teachers and students"}
              {authState === 'forgotPassword' && "Enter your email to receive reset instructions"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {authState === 'login' && (
              <LoginForm onToggleForm={toggleForm} onForgotPassword={showForgotPassword} />
            )}
            {authState === 'signup' && (
              <SignupForm onToggleForm={toggleForm} />
            )}
            {authState === 'forgotPassword' && (
              <ForgotPasswordForm onBack={backToLogin} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthPage;
