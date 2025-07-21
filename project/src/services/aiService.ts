
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from 'uuid';

export interface QuizQuestion {
  question: string;
  options?: string[];
  answer?: string;
  type: 'multiple-choice' | 'short-answer' | 'essay';
}

export interface Question {
  id: string;
  type: 'multiple-choice' | 'short-answer' | 'essay';
  question: string;
  options?: string[];
  correctAnswer?: string | number;
  difficulty?: 'easy' | 'medium' | 'hard';
  points?: number;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  timeLimit?: number; // In minutes
  createdBy: string;
  createdAt: Date;
}

export interface Summary {
  title: string;
  mainPoints: string[];
  detailedSummary: string;
}

class AIService {
  async generateQuestions(content: string, options: {
    numQuestions?: number; 
    types?: ('multiple-choice' | 'short-answer' | 'essay')[];
    fileUrl?: string;
  } = {}): Promise<Question[]> {
    try {
      // Add the file URL to the request if available
      const requestBody = {
        content,
        options: {
          ...options,
          fileUrl: options.fileUrl
        }
      };
      
      // Call our Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('generate-quiz', {
        body: requestBody
      });
      
      if (error) {
        console.error('Error calling generate-quiz function:', error);
        throw new Error(error.message || 'Failed to generate questions');
      }
      
      if (!data || !data.questions) {
        throw new Error('Invalid response format from generate-quiz function');
      }

      // Transform the response to match our Question interface
      const questions: Question[] = data.questions.map((q: QuizQuestion) => ({
        id: uuidv4(),
        type: q.type || 'multiple-choice',
        question: q.question,
        options: q.options,
        correctAnswer: q.options?.indexOf(q.answer) ?? 0,
        difficulty: 'medium',
        points: 2
      }));
      
      return questions;
    } catch (error) {
      console.error('Error in generateQuestions:', error);
      
      // Fall back to mock questions if there's an error
      console.warn('Using fallback mock questions due to error');
      return this.generateMockQuestions(content, options);
    }
  }
  
  private generateMockQuestions(content: string, options: {
    numQuestions?: number; 
    types?: ('multiple-choice' | 'short-answer' | 'essay')[];
  } = {}): Question[] {
    // Simulate API delay
    const numQuestions = options.numQuestions || 5;
    const types = options.types || ['multiple-choice', 'short-answer', 'essay'];
    
    // Generate mock questions based on the content
    const questions: Question[] = [];
    
    for (let i = 0; i < numQuestions; i++) {
      const type = types[Math.floor(Math.random() * types.length)] as 'multiple-choice' | 'short-answer' | 'essay';
      
      const question: Question = {
        id: `question-${i + 1}`,
        type,
        question: this.generateMockQuestion(content, type, i),
        options: type === 'multiple-choice' ? this.generateMockOptions() : undefined,
        correctAnswer: type === 'multiple-choice' ? Math.floor(Math.random() * 4) : undefined,
        difficulty: ['easy', 'medium', 'hard'][Math.floor(Math.random() * 3)] as 'easy' | 'medium' | 'hard',
        points: [1, 2, 3][Math.floor(Math.random() * 3)]
      };
      
      questions.push(question);
    }
    
    return questions;
  }
  
  async summarizeContent(content: string): Promise<Summary> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Generate a mock summary based on the content
    const contentPreview = content.substring(0, 50).trim();
    const title = `Summary of ${contentPreview}...`;
    
    // Create mock main points
    const mainPoints = [
      "Key concept 1 from the uploaded document",
      "Important definition mentioned in the content",
      "Critical theory explained in section 2",
      "Statistical findings from the research",
      "Conclusion points from the final paragraph"
    ];
    
    // Create a mock detailed summary
    const detailedSummary = `This document covers important concepts related to ${contentPreview}... 
    The main argument focuses on several key areas including theoretical frameworks, 
    practical applications, and future implications. The author presents evidence from 
    multiple sources to support their claims and provides a comprehensive analysis of 
    the subject matter. Various examples are used to illustrate complex ideas and make 
    them more accessible to readers. The conclusion synthesizes these points and offers 
    suggestions for further research and practical implementation.`;
    
    return {
      title,
      mainPoints,
      detailedSummary
    };
  }
  
  async chatWithAI(message: string): Promise<string> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Generate mock responses based on different message intents
    if (message.toLowerCase().includes('explain') || message.toLowerCase().includes('what is')) {
      return `I'd be happy to explain! ${this.generateExplanationResponse(message)}`;
    } else if (message.toLowerCase().includes('help') || message.toLowerCase().includes('how to')) {
      return `Here's how you can do that: ${this.generateHelpResponse(message)}`;
    } else if (message.toLowerCase().includes('difference') || message.toLowerCase().includes('compare')) {
      return `Let me compare those for you: ${this.generateComparisonResponse(message)}`;
    } else {
      return `That's an interesting question about ${message.substring(0, 20)}... 
      Based on the educational materials I've analyzed, I can tell you that this topic 
      involves several important concepts. Would you like me to explain specific aspects 
      of this topic in more detail?`;
    }
  }
  
  private generateMockQuestion(content: string, type: string, index: number): string {
    const topics = [
      "the main concept",
      "the key theory",
      "the primary research method",
      "the historical development",
      "the practical application",
      "the critical analysis",
      "the statistical significance",
      "the case study",
      "the experimental design",
      "the ethical considerations"
    ];
    
    const topic = topics[index % topics.length];
    
    switch (type) {
      case 'multiple-choice':
        return `What is ${topic} discussed in the document?`;
      case 'short-answer':
        return `Briefly explain ${topic} as presented in the material.`;
      case 'essay':
        return `Analyze and discuss ${topic} in detail, providing examples from the content.`;
      default:
        return `Describe ${topic} from the uploaded content.`;
    }
  }
  
  private generateMockOptions(): string[] {
    const optionSets = [
      ["Theory A", "Theory B", "Theory C", "Theory D"],
      ["Historical perspective", "Modern interpretation", "Critical analysis", "Practical application"],
      ["Quantitative approach", "Qualitative methodology", "Mixed methods", "Experimental design"],
      ["Primary source", "Secondary analysis", "Literature review", "Meta-analysis"],
      ["Economic factors", "Social implications", "Political context", "Cultural significance"]
    ];
    
    return optionSets[Math.floor(Math.random() * optionSets.length)];
  }
  
  private generateExplanationResponse(message: string): string {
    return `This concept refers to a fundamental principle in the field. 
    It was first developed in the early studies and has since evolved to encompass 
    various aspects of the subject matter. The core idea involves understanding how 
    different elements interact and influence outcomes in specific contexts. 
    Many researchers have contributed to developing this concept further, adding 
    nuance and practical applications across different scenarios.`;
  }
  
  private generateHelpResponse(message: string): string {
    return `First, identify the main components involved in the process. 
    Then, analyze how these components interact with each other based on 
    established principles. Apply the relevant formulas or frameworks to 
    solve the specific problem. Make sure to validate your approach by 
    checking if the outcome aligns with expected results. If you encounter 
    difficulties, try breaking down the problem into smaller, manageable parts 
    and solve them step by step.`;
  }
  
  private generateComparisonResponse(message: string): string {
    return `The first concept focuses on theoretical frameworks and abstract principles, 
    while the second emphasizes practical applications and real-world implementations. 
    They differ in their historical development - one emerged from classical studies 
    while the other resulted from modern research methodologies. Their applications 
    also vary across different fields, with distinct strengths and limitations in 
    various contexts. However, they share some common foundations and can be 
    complementary when used together in comprehensive approaches.`;
  }
  
  async getQuizTitle(content: string): Promise<string> {
    try {
      const { data, error } = await supabase.functions.invoke('generate-quiz', {
        body: { content, options: { titleOnly: true } }
      });
      
      if (error || !data || !data.title) {
        throw new Error('Failed to generate quiz title');
      }
      
      return data.title;
    } catch (error) {
      console.error('Error generating quiz title:', error);
      // Extract a title from the content
      const contentPreview = content.substring(0, 30).trim();
      return `Quiz on ${contentPreview}...`;
    }
  }
}

const aiService = new AIService();
export default aiService;
