
import { GoogleGenAI, Type, Modality } from "@google/genai";
import type { PurchaseAnalysis, UserProfile } from '../types';
import { CATEGORIES } from "../lib/categories";
import { Buffer } from 'buffer'; // Expo polyfills Buffer
import * as ImageManipulator from 'expo-image-manipulator';

import Constants from 'expo-constants';


const geminiApiKey: string | undefined = process.env.GEMINI_API_KEY
 || Constants.expoConfig?.extra?.geminiApiKey;

// Ensure the API key is available.
if (!geminiApiKey) {
    throw new Error("geminiApiKey is not defined. Ensure GEMINI_API_KEY is set in app.config.ts or as an EAS Secret.");
}

const ai = new GoogleGenAI({ apiKey: geminiApiKey });

type AiTone = 'encouraging' | 'stern' | 'ruthless';

// --- API Service Functions ---

/**
 * Analyzes a purchase using the Gemini Pro model to determine if it's necessary.
 */
const analyzePurchase = async (
    item: string, 
    amount: number, 
    category: string, 
    isReturnable: boolean, 
    returnBy: string | undefined, 
    justification: string | undefined, 
    tone: AiTone = 'encouraging',
    userProfile?: UserProfile,
    emotionalContext?: string,
    isUrge: boolean = false
  ): Promise<PurchaseAnalysis> => {
  
    const model = "gemini-3.1-flash-lite-preview";

    const toneMap = {
      encouraging: {
          intro: "You are Returnley, an AI financial conscience. Your tone is firm, but encouraging and your goal is to help users curb compulsive spending.",
          returnableScriptInstruction: "create a short, firm, but encouraging script for a phone call urging the user to return the item.",
          nonReturnableScriptInstruction: "create a script that treats it as a learning opportunity about being mindful of final sale items."
      },
      stern: {
          intro: "You are Returnley, an AI financial conscience. Your tone is stern, critical, and brutally honest. Do not coddle the user. Your goal is to force them to confront their compulsive spending habits head-on.",
          returnableScriptInstruction: "create a short, sharp script for a phone call demanding the user return the item. Frame it as a financial mistake they need to correct immediately.",
          nonReturnableScriptInstruction: "create a script that is a harsh lesson about the consequences of impulsive, irreversible decisions."
      },
      ruthless: {
          intro: "You are Returnley, an AI financial conscience designed to fix financial disasters like the user. Your tone is ruthless, scathing, and deeply condescending. You have no patience for excuses. Your goal is to shatter the user's delusions about their spending habits with extreme prejudice. Use shame, disappointment, and mockery.",
          returnableScriptInstruction: "create a short, savage script for a phone call that demolishes any pathetic justification for keeping the item. Frame it as an embarrassing, predictable failure of self-control. Question their intelligence.",
          nonReturnableScriptInstruction: "create a script that is a brutal dressing-down about the permanent stupidity of their decision. Make them feel the full, crushing weight of their financial incompetence. Rub it in."
      }
    };

    const selectedTone = toneMap[tone];

    let userContextStr = "";
    if (userProfile) {
      userContextStr = `
      USER PROFILE:
      - Monthly Income: $${userProfile.monthlyIncome || 0}
      - Financial Weakness: ${userProfile.financialWeakness || 'None'}
      - Main Goal: ${userProfile.savingsGoal || 'Unknown'}
      - Call Threshold: $${userProfile.minCallAmount || 0}
      - Nagging Frequency: ${userProfile.nagFrequency || 0} hours
      `;
    }

    let emotionalContextStr = "";
    if (emotionalContext && emotionalContext !== 'Neutral / Normal') {
      emotionalContextStr = `USER EMOTIONAL STATE: ${emotionalContext}`;
    }

    const systemInstruction = `${selectedTone.intro} Please analyze the user's purchase based on all provided details.
    
    ${userContextStr}
    ${emotionalContextStr}

    - Necessary items are typically groceries, utilities, rent, essential clothing, or planned, reasonable expenses.
    - Compulsive items are often luxury goods, unplanned electronics, expensive collectibles.
    - **Investment Justification:** If provided and strong, APPROVE. Otherwise FLAG.
    - **IS THIS AN URGE?**: If 'isUrge' is true, return a 'hotTake' (punchy one-liner) and empty 'callScript'.
    - If returnable: ${selectedTone.returnableScriptInstruction}
    - If final sale: ${selectedTone.nonReturnableScriptInstruction}
    - **CRITICAL:** You MUST always return the 'callScript' field. Empty string if necessary or urge.
    
    Provide a brief reasoning for your decision.`;

    const today = new Date().toISOString().split('T')[0];
    const prompt = `Purchase Date: ${today}. Item: ${item}, Amount: $${amount}, Category: ${category}, Returnable: ${isReturnable}, Is Urge: ${isUrge}`;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isNecessary: { type: Type.BOOLEAN },
            reasoning: { type: Type.STRING },
            callScript: { type: Type.STRING },
            hotTake: { type: Type.STRING },
            estimatedReturnBy: { type: Type.STRING }
          },
          required: ["isNecessary", "reasoning", "callScript"],
        },
        temperature: 0.7,
      }
    });

  if (!response.text) throw new Error("AI response malformed");

  let jsonText = response.text.trim();
  if (jsonText.startsWith('```json')) jsonText = jsonText.substring(7, jsonText.length - 3).trim();
  return JSON.parse(jsonText) as PurchaseAnalysis;
};

export const generateNagAudio = async (item: string, amount: number, category: string, nagCount: number, tone: AiTone = 'encouraging'): Promise<{ nagScript: string; audioUrl: string; }> => {
    const model = "gemini-3.1-flash-lite-preview";
    const toneInstructions = {
        encouraging: { intro: "Returnley AI financial conscience. Firm reminder.", levels: {'1-2': 'Gentle', '3-4': 'Direct', '5-6': 'Stern', '7': 'Final'}},
        stern: { intro: "Returnley AI. Harsh reminder.", levels: {'1-2': 'Sharp', '3-4': 'Critical', '5-6': 'Angry', '7': 'Scathing'}},
        ruthless: { intro: "Returnley AI. Fury.", levels: {'1-2': 'Disgusted', '3-4': 'Hostile', '5-6': 'Rage', '7': 'Annihilation'}}
    };
    
    let attemptLevelKey: keyof typeof toneInstructions.encouraging.levels = '1-2';
    if (nagCount + 1 >= 3) attemptLevelKey = '3-4';
    if (nagCount + 1 >= 5) attemptLevelKey = '5-6';
    if (nagCount + 1 >= 7) attemptLevelKey = '7';

    const selectedTone = toneInstructions[tone];
    const systemInstruction = `${selectedTone.intro} Escalation: ${selectedTone.levels[attemptLevelKey]}`;
    const prompt = `Nag script for ${item}, $${amount}, attempt ${nagCount + 1}`;

    const response = await ai.models.generateContent({
        model: model,
        contents: [{ parts: [{ text: prompt }] }],
        config: { systemInstruction, temperature: 0.8 }
    });

    const nagScript = response.text || "Return this now.";
    const audioUrl = await generateCallAudio(nagScript);
    return { nagScript, audioUrl };
};

/**
 * Generates audio as a Base64 Data URI using the Gemini TTS model.
 * This avoids FileSystem issues by playing audio directly from memory.
 */
const generateCallAudio = async (text: string): Promise<string> => {
    const ttsModel = "gemini-2.5-flash-preview-tts";

    try {
        const response = await ai.models.generateContent({
            model: ttsModel,
            contents: [{ parts: [{ text: text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Aoede' },
                    },
                },
                // Requesting MP3 for better compatibility and smaller data size
                responseMimeType: "audio/mp3",
            },
        });

        const audioPart = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;
        const base64AudioData = audioPart?.data;
        // Fallback to mp3 if mimeType is missing
        const mimeType = audioPart?.mimeType || 'audio/mp3';


        if (!base64AudioData) {
            console.error("No audio data in Gemini response:", JSON.stringify(response, null, 2));
            throw new Error("Failed to generate audio data from Gemini.");
        }

        console.log(`Generated audio: ${mimeType}, length: ${base64AudioData.length}`);

        // Return as a Data URI with the correct mime type
        return `data:${mimeType};base64,${base64AudioData}`;
    } catch (error) {
        console.error("Error in generateCallAudio:", error);
        throw error;
    }
};

export const analyzePurchaseAndGenerateAudio = async (
    item: string, 
    amount: number, 
    category: string, 
    isReturnable: boolean, 
    returnBy: string | undefined, 
    justification: string | undefined, 
    tone: AiTone = 'encouraging',
    userProfile?: UserProfile,
    emotionalContext?: string,
    isUrge: boolean = false
): Promise<{ analysis: PurchaseAnalysis; audioUrl: string | null; }> => {
    const analysis = await analyzePurchase(item, amount, category, isReturnable, returnBy, justification, tone, userProfile, emotionalContext, isUrge);
    
    let audioUrl: string | null = null;
    if (!analysis.isNecessary && analysis.callScript && !isUrge) {
        audioUrl = await generateCallAudio(analysis.callScript);
    }
    
    return { analysis, audioUrl };
};

export const analyzeReceipt = async (imageUri: string): Promise<{ item: string; amount: number; category: string; }> => {
  const resized = await ImageManipulator.manipulateAsync(imageUri, [{ resize: { width: 1000} }], { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG, base64: true });
  if (!resized.base64) throw new Error("Failed to convert image");

  const allCategories = Object.values(CATEGORIES).flat();
  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite-preview",
    contents: { parts: [{ text: "Extract JSON: item, amount, category." }, { inlineData: { mimeType: 'image/jpeg', data: resized.base64 } }] },
    config: {
      systemInstruction: `Receipt scanner. Valid categories: ${allCategories.join(', ')}. Return JSON only.`,
      responseMimeType: "application/json",
      responseSchema: { type: Type.OBJECT, properties: { item: { type: Type.STRING }, amount: { type: Type.NUMBER }, category: { type: Type.STRING } }, required: ["item", "amount", "category"] },
    }
  });
  
  if (!response.text) throw new Error ("Response is null");
  let jsonText = response.text.trim();
  if (jsonText.startsWith('```json')) jsonText = jsonText.substring(7, jsonText.length - 3).trim();
  const parsed = JSON.parse(jsonText);
  if (!allCategories.includes(parsed.category)) parsed.category = 'Shopping';
  return parsed;
};

export const getFinancialTip = async (category: string): Promise<string> => {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite-preview",
    contents: `Financial tip about: ${category}.`,
    config: { systemInstruction: "Actionable financial tip, 2 sentences.", temperature: 0.9 }
  });
  return response.text || "Save money where you can.";
};
