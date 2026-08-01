import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const generateContent = async (contents: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
    });

    return response?.text ?? response;
  } catch (error) {
    console.error('Error generating content:', error);
    throw error;
  }
};

export default generateContent;
