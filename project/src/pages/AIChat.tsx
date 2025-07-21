
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent, CardFooter, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/components/auth/AuthContext";
import { SendHorizonal, Bot, User, Loader2 } from "lucide-react";
import aiService from "@/services/aiService";

interface Message {
  id: string;
  content: string;
  sender: "user" | "bot";
  timestamp: Date;
  loading?: boolean;
}

const AIChat = () => {
  const { user } = useAuth();
  const isTeacher = user?.role === "teacher";
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  
  // Pre-load welcome message
  useEffect(() => {
    const welcomeMessage = {
      id: "welcome",
      content: `Hello ${user?.name}! I'm your AI learning assistant. ${
        isTeacher 
          ? "I can help you create educational content, design quizzes, or answer questions about teaching methods." 
          : "I can help you understand difficult concepts, explain topics from your materials, or quiz you on your knowledge."
      } How can I assist you today?`,
      sender: "bot" as const,
      timestamp: new Date(),
    };
    
    setMessages([welcomeMessage]);
  }, [user, isTeacher]);
  
  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim()) return;
    
    // Create user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: input,
      sender: "user",
      timestamp: new Date(),
    };
    
    // Create bot loading message
    const loadingMessage: Message = {
      id: `bot-${Date.now()}`,
      content: "...",
      sender: "bot",
      timestamp: new Date(),
      loading: true,
    };
    
    setMessages(prev => [...prev, userMessage, loadingMessage]);
    setInput("");
    setIsTyping(true);
    
    try {
      // Simulate AI thinking time
      const response = await aiService.chatWithAI(input);
      
      // Replace loading message with actual response
      setMessages(prev => 
        prev.map(msg => 
          msg.id === loadingMessage.id 
            ? { ...msg, content: response, loading: false } 
            : msg
        )
      );
    } catch (error) {
      // Handle error
      setMessages(prev => 
        prev.map(msg => 
          msg.id === loadingMessage.id 
            ? { ...msg, content: "Sorry, I couldn't process your request. Please try again.", loading: false } 
            : msg
        )
      );
    } finally {
      setIsTyping(false);
    }
  };
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">AI Study Assistant</h1>
        <p className="text-muted-foreground">
          Ask questions and get instant help with your learning
        </p>
      </div>
      
      <Card className="quiz-card h-[70vh] flex flex-col">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center">
            <Bot className="h-5 w-5 mr-2 text-quiz-purple" />
            QuizGenie AI Assistant
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div 
                key={message.id}
                className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div 
                  className={`flex max-w-[80%] ${
                    message.sender === "user" 
                      ? "flex-row-reverse" 
                      : "flex-row"
                  }`}
                >
                  <div 
                    className={`flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full ${
                      message.sender === "user" 
                        ? "bg-quiz-blue ml-2" 
                        : "bg-quiz-purple mr-2"
                    } text-white`}
                  >
                    {message.sender === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>
                  
                  <div 
                    className={`rounded-lg p-3 text-sm ${
                      message.sender === "user" 
                        ? "bg-quiz-blue text-white" 
                        : "bg-muted"
                    }`}
                  >
                    {message.loading ? (
                      <div className="flex items-center space-x-2">
                        <div className="h-2 w-2 animate-pulse rounded-full bg-current"></div>
                        <div className="h-2 w-2 animate-pulse rounded-full bg-current animation-delay-150"></div>
                        <div className="h-2 w-2 animate-pulse rounded-full bg-current animation-delay-300"></div>
                      </div>
                    ) : (
                      <div>
                        <p>{message.content}</p>
                        <span className="block mt-1 text-xs opacity-70 text-right">
                          {formatTime(message.timestamp)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </CardContent>
        
        <CardFooter className="border-t p-4">
          <form onSubmit={handleSendMessage} className="flex w-full items-center space-x-2">
            <Input
              type="text"
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1"
              disabled={isTyping}
            />
            <Button 
              type="submit" 
              size="icon"
              disabled={!input.trim() || isTyping}
              className="bg-quiz-purple hover:bg-quiz-purple-dark"
            >
              {isTyping ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <SendHorizonal className="h-4 w-4" />
              )}
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AIChat;
