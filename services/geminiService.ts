
import { GoogleGenAI, Type } from "@google/genai";
import { AIRecommendation } from '../types';

export interface AIPickItem {
  id: string;
  name: string;
  description: string;
  reason: string;
  category: string;
  vibe: string;
}

export class GeminiService {
  /**
   * Cleans base64 string and extracts the MIME type if present.
   */
  private static parseImageData(data: string): { base64: string, mimeType: string } {
    const mimeMatch = data.match(/^data:([^;]+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
    const base64 = data.includes(',') ? data.split(',')[1] : data;
    return { base64, mimeType };
  }

  private static getApiKey(): string {
    let key = '';
    if (typeof process !== 'undefined' && process.env) {
      key = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
    }
    if (!key && typeof import.meta !== 'undefined' && (import.meta as any).env) {
      key = ((import.meta as any).env as any).VITE_GEMINI_API_KEY || ((import.meta as any).env as any).VITE_API_KEY || '';
    }
    if (!key) {
      throw new Error("Gemini API key is missing. Please connect your API key.");
    }
    return key;
  }

  static async performVirtualTryOn(bodyImageBase64: string, clothingImageBase64: string): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: this.getApiKey() });
    
    // Fallback chain: 3.1 Flash Image is highly capable and often available on free tier
    const models = ['gemini-3.1-flash-image-preview', 'gemini-2.5-flash-image'];
    
    let lastError = null;
    for (const model of models) {
      try {
        return await this.executeTryOnRequest(ai, model, bodyImageBase64, clothingImageBase64);
      } catch (error: any) {
        lastError = error;
        console.warn(`Try-on failed with ${model}, trying next...`, error);
      }
    }
    throw lastError || new Error("All try-on models failed.");
  }

  private static async executeTryOnRequest(ai: any, model: string, bodyBase64: string, clothingBase64: string): Promise<string> {
    const bodyData = this.parseImageData(bodyBase64);
    const clothingData = this.parseImageData(clothingBase64);

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            text: "Task: Virtual Try-On. Fit the clothing item from the second image onto the person in the first image. Maintain the person's pose, background, and features while realistically rendering the clothing with natural folds and lighting.",
          },
          {
            inlineData: {
              data: bodyData.base64,
              mimeType: bodyData.mimeType,
            },
          },
          {
            inlineData: {
              data: clothingData.base64,
              mimeType: clothingData.mimeType,
            },
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
          // Only use imageSize for 3.1 models
          ...(model.includes('3.1') ? { imageSize: "1K" } : {})
        }
      }
    });

    let resultImageUrl = '';
    const candidates = response.candidates;
    if (candidates && candidates.length > 0 && candidates[0].content?.parts) {
      for (const part of candidates[0].content.parts) {
        if (part.inlineData) {
          resultImageUrl = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }
    }

    if (!resultImageUrl) {
      const errorText = response.text || "No image generated";
      throw new Error(`Neural engine (${model}) error: ${errorText}`);
    }

    return resultImageUrl;
  }

  static async getStyleRecommendations(resultImageBase64: string): Promise<AIRecommendation> {
    try {
      const ai = new GoogleGenAI({ apiKey: this.getApiKey() });
      const imageData = this.parseImageData(resultImageBase64);
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            {
              text: "Analyze this fashion look. Provide style recommendations in JSON format including complementary colors, fit tips, similar styles, and occasion advice.",
            },
            {
              inlineData: {
                data: imageData.base64,
                mimeType: imageData.mimeType,
              },
            },
          ],
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              colorSuggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
              fitTips: { type: Type.ARRAY, items: { type: Type.STRING } },
              similarStyles: { type: Type.ARRAY, items: { type: Type.STRING } },
              occasionTips: { type: Type.STRING },
            },
            required: ["colorSuggestions", "fitTips", "similarStyles", "occasionTips"]
          },
        },
      });

      const jsonStr = response.text || '{}';
      return JSON.parse(jsonStr.trim()) as AIRecommendation;
    } catch (error: any) {
      console.error("Style recommendation failed:", error);
      throw new Error(`Failed to call Gemini API: ${error.message || 'Unknown error'}`);
    }
  }

  static async analyzeClothingFor3D(clothingImageBase64: string): Promise<{ primaryColor: string, materialType: string, clothingType: string }> {
    try {
      const ai = new GoogleGenAI({ apiKey: this.getApiKey() });
      const imageData = this.parseImageData(clothingImageBase64);
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            {
              text: "Analyze this clothing item and provide its primary hex color, material texture type (e.g., silk, cotton, leather, denim), and general clothing category (top, bottom, dress, outerwear). Respond in JSON format.",
            },
            {
              inlineData: {
                data: imageData.base64,
                mimeType: imageData.mimeType,
              },
            },
          ],
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              primaryColor: { type: Type.STRING },
              materialType: { type: Type.STRING },
              clothingType: { type: Type.STRING },
            },
            required: ["primaryColor", "materialType", "clothingType"]
          },
        },
      });

      const jsonStr = response.text || '{"primaryColor": "#B76E79", "materialType": "silk", "clothingType": "dress"}';
      return JSON.parse(jsonStr.trim());
    } catch (error: any) {
      console.error("Clothing analysis failed:", error);
      throw new Error(`Failed to call Gemini API: ${error.message || 'Unknown error'}`);
    }
  }

  static async generateAIPicks(): Promise<AIPickItem[]> {
    try {
      const ai = new GoogleGenAI({ apiKey: this.getApiKey() });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: "Generate 4 luxury fashion pick items based on current high-fashion indices and trending aesthetics. Respond in JSON format.",
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                name: { type: Type.STRING },
                description: { type: Type.STRING },
                reason: { type: Type.STRING },
                category: { type: Type.STRING },
                vibe: { type: Type.STRING }
              },
              required: ["id", "name", "description", "reason", "category", "vibe"]
            }
          }
        }
      });

      const resultText = response.text || '[]';
      return JSON.parse(resultText.trim());
    } catch (error: any) {
      console.error("AI Picks generation failed:", error);
      throw new Error(`Failed to call Gemini API: ${error.message || 'Unknown error'}`);
    }
  }
}
