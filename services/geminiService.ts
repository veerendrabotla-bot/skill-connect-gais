
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeIssueImage = async (base64Image: string, category: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image.split(',')[1] || base64Image
            }
          },
          {
            text: `Analyze this image of a ${category} issue. Provide a technical diagnosis, the likely sub-service needed, and an urgency score. Output strictly as JSON with the following structure: {"diagnosis": "...", "suggestedService": "...", "urgency": "LOW/MEDIUM/HIGH/CRITICAL", "confidence": 0.0}`
          }
        ]
      }
    });
    const text = response.text || '{}';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return JSON.parse(jsonMatch ? jsonMatch[0] : text);
  } catch (error) {
    console.error("Gemini Vision Error:", error);
    return null;
  }
};

/**
 * Phase 13.1: Voice Triage Engine
 * Processes recorded audio to extract technical diagnosis and job requirements.
 */
export const diagnoseAudioIssue = async (base64Audio: string, category: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "audio/webm",
              data: base64Audio
            }
          },
          {
            text: `This is a voice recording of a customer describing a ${category} issue. Listen carefully. Transcribe their concern and provide a technical diagnosis, urgency level, and suggested service type. Output strictly as JSON: {"transcription": "...", "diagnosis": "...", "suggestedService": "...", "urgency": "LOW/MEDIUM/HIGH", "toolsNeeded": ["..."]}`
          }
        ]
      },
      config: {
        responseMimeType: "application/json"
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Gemini Audio Triage Error:", error);
    return null;
  }
};

export const diagnoseServiceIssue = async (issue: string, category: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `User issue: "${issue}" in category "${category}". Provide a concise technical diagnosis, estimated tools needed, and a potential urgency level (Low/Medium/High). Keep it brief and professional.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            diagnosis: { type: Type.STRING },
            tools: { type: Type.ARRAY, items: { type: Type.STRING } },
            urgency: { type: Type.STRING },
            suggestedAction: { type: Type.STRING }
          },
          required: ["diagnosis", "tools", "urgency", "suggestedAction"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Gemini Error:", error);
    return null;
  }
};

export const verifyWorkerDocument = async (docText: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Analyze this worker application text: "${docText}". Check for red flags, skill alignment, and consistency. Return a confidence score (0-100) and brief analysis.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            confidenceScore: { type: Type.NUMBER },
            analysis: { type: Type.STRING },
            flags: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["confidenceScore", "analysis"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Gemini Verification Error:", error);
    return null;
  }
};
