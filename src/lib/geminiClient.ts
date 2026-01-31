import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

let genAI: GoogleGenerativeAI | null = null;
let model: any = null;

if (API_KEY) {
  genAI = new GoogleGenerativeAI(API_KEY);
  model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-001' });
} else {
  console.error('VITE_GEMINI_API_KEY is missing');
}

const cleanAnalysis = (text: string): string => {
  if (text.startsWith('Okay') || text.startsWith('Sure')) {
    const index = text.indexOf('AI Analysis');
    if (index !== -1) {
      return text.substring(index);
    }
  }
  return text;
};

const runPrompt = async (prompt: string) => {
  if (!model) return 'AI Analysis unavailable (Missing API Key)';

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = await response.text();
    return cleanAnalysis(text);
  } catch (e: any) {
    console.error('Error generating prediction:', e);
    return `Error generating prediction: ${e.message}`;
  }
};

export const geminiClient = {
  async analyzeMatchup(sport: string, homeTeam: string, awayTeam: string): Promise<string> {
    const prompt = `
      You are a professional sports analyst with an 80% win rate.
      Analyze this ${sport} matchup: ${awayTeam} (Away) vs ${homeTeam} (Home).
      
      Provide a structured prediction in this exact format:
      AI Analysis of the ${awayTeam} vs ${homeTeam}...
      
      Winner: [Team Name]
      Confidence: [Number]%
      Key Factor: [One short sentence explaining the decisive factor]
      
      Base your analysis on team stats, recent performance, and injuries if known.
      Do not include conversational fillers like "Okay, I'll provide my analysis". Start directly with the header.
    `;

    return runPrompt(prompt);
  },

  async analyzeSpread(
    sport: string,
    homeTeam: string,
    awayTeam: string,
    spreadLine?: string
  ): Promise<string> {
    const prompt = `
      You are a professional sports analyst with an 80% win rate.
      Provide a breakdown of this ${sport} spread between ${awayTeam} (Away) and ${homeTeam} (Home).
      
      Spread Line: ${spreadLine ?? 'N/A'}
      
      Write an AI Analysis in this exact format:
      AI Analysis of the Spread (${awayTeam} vs ${homeTeam})...
      
      Pick: [Team Name]
      Confidence: [Number]%
      Key Factor: [One short sentence explaining the decisive factor]
      
      Focus on edges that matter for the spread, like injuries, pace, or matchup advantages.
      Start the response with the header shown above and avoid conversational preambles.
    `;

    return runPrompt(prompt);
  },

  async analyzeOverUnder(
    sport: string,
    homeTeam: string,
    awayTeam: string,
    overUnderLine?: string
  ): Promise<string> {
    const prompt = `
      You are a professional sports analyst with an 80% win rate.
      Analyze this ${sport} total between ${awayTeam} (Away) and ${homeTeam} (Home).
      
      Over/Under Line: ${overUnderLine ?? 'N/A'}
      
      Provide a structured response in this exact format:
      AI Analysis of the Total (${awayTeam} vs ${homeTeam})...
      
      Pick: [Over/Under]
      Confidence: [Number]%
      Key Factor: [One short sentence explaining the decisive factor]
      
      Use tempo, recent scoring trends, and defensive matchups to support the total call.
      Start directly with the header shown above and avoid filler words.
    `;

    return runPrompt(prompt);
  }
};
