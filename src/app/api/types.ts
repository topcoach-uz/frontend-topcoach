export interface AiAssessmentQuestion {
    id: string;
    question: string;
    category: string;
  }
  
  export interface AiAssessmentSession {
    id: string;
    user_id: string;
    is_completed: boolean;
    result: AiAssessmentResult | null;
  }
  
  export interface SubmitAssessmentDto {
    answers: {
      questionId: string;
      answer: number;
    }[];
  }
  
  export interface AiAssessmentResult {
    matches: {
      major: string;
      matchPercentage: number;
      category: string;
      summary: string;
      personalityFit: string[];
      careerPathways: string[];
      reasoning: string[];
      topUniversities: {
        name: string;
        country: string;
        qsRank: number;
        website: string;
      }[];
    }[];
  } 