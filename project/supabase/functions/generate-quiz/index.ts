
// Follow this setup guide to integrate the Deno SDK into your project:
// https://deno.land/manual/getting_started/setup_your_environment
import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GenerateQuizOptions {
  numQuestions?: number;
  types?: string[];
  fileUrl?: string;
  titleOnly?: boolean;
}

interface RequestBody {
  content: string;
  options?: GenerateQuizOptions;
}

interface Question {
  question: string;
  options?: string[];
  answer?: string;
  type: 'multiple-choice' | 'short-answer' | 'essay';
}

const extractContentFromFileUrl = async (fileUrl: string): Promise<string> => {
  try {
    // For now, this is a mock implementation
    // In a real implementation, we would use something like PDF.js or another
    // document parser to extract text content from the file
    
    // Fetch the file content - this is a simplified example
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }
    
    // For non-PDF files or simple implementation, we're just returning a placeholder
    // In a real implementation, we would parse based on file type
    return "Document content extracted successfully.";
  } catch (error) {
    console.error("Error extracting content:", error);
    return ""; // Return empty string on error
  }
}

const generateQuestionsFromContent = (content: string, options: GenerateQuizOptions): Question[] => {
  const numQuestions = options?.numQuestions || 5;
  const questionTypes = options?.types || ["multiple-choice"];
  
  // This is a mock implementation
  // In a real implementation, we would use an AI model like OpenAI to generate questions
  
  const questions: Question[] = [];
  
  for (let i = 0; i < numQuestions; i++) {
    // Generate different types of questions based on the content
    const type = questionTypes[i % questionTypes.length] as 'multiple-choice' | 'short-answer' | 'essay';
    
    if (type === 'multiple-choice') {
      const options = [
        `Answer option 1 for question ${i + 1}`,
        `Answer option 2 for question ${i + 1}`,
        `Answer option 3 for question ${i + 1}`,
        `Answer option 4 for question ${i + 1}`,
      ];
      
      questions.push({
        question: `Question ${i + 1} about ${content.substring(0, 50)}...?`,
        options,
        answer: options[0], // First option is always correct in this mock
        type
      });
    } else {
      questions.push({
        question: `${type} question ${i + 1} about ${content.substring(0, 50)}...?`,
        type
      });
    }
  }
  
  return questions;
}

const generateQuizTitle = (content: string): string => {
  // This is a mock implementation
  // In a real implementation, we would use an AI model to generate a relevant title
  
  // Extract meaningful words from the content
  const words = content.split(' ').slice(0, 5).join(' ');
  
  return `Quiz on ${words}...`;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  
  try {
    const requestBody: RequestBody = await req.json();
    const content = requestBody.content || "";
    const options = requestBody.options || {};
    
    // Extract file content if URL is provided
    let combinedContent = content;
    if (options.fileUrl) {
      const fileContent = await extractContentFromFileUrl(options.fileUrl);
      combinedContent = `${content} ${fileContent}`.trim();
    }
    
    // If only title is requested, return just the title
    if (options.titleOnly) {
      const title = generateQuizTitle(combinedContent);
      return new Response(
        JSON.stringify({ title }),
        {
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }
    
    // Generate questions from the content
    const questions = generateQuestionsFromContent(combinedContent, options);
    const title = generateQuizTitle(combinedContent);
    
    // Return the questions
    return new Response(
      JSON.stringify({ 
        questions,
        title
      }),
      {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
    
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
