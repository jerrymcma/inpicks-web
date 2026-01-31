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

export const geminiClient = {
  async analyzeMatchup(sport: string, homeTeam: string, awayTeam: string): Promise<string> {
    if (!model) return 'AI Analysis unavailable (Missing API Key)';

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

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      let text = response.text();

      // Clean up conversational prefix
      if (text.startsWith('Okay') || text.startsWith('Sure')) {
        const index = text.indexOf('AI Analysis');
        if (index !== -1) {
          text = text.substring(index);
        }
      }
      return text;
    } catch (e: any) {
      console.error('Error generating prediction:', e);
      return `Error generating prediction: ${e.message}`;
    }
  }
};
