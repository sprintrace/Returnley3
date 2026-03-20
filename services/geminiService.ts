
import { GoogleGenAI, Type, Modality } from "@google/genai";
import type { PurchaseAnalysis, UserProfile } from '../types';
import { CATEGORIES } from "../lib/categories";
import { Buffer } from 'buffer'; // Expo polyfills Buffer
import * as ImageManipulator from 'expo-image-manipulator';
import Constants from 'expo-constants';

// --- Configuration ---

const GEMINI_API_KEY = Constants.expoConfig?.extra?.geminiApiKey || process.env.GEMINI_API_KEY;
const SUPABASE_URL = "https://jvwtwyoreticwsuytaya.supabase.co/functions/v1/gemini-proxy";
const SUPABASE_ANON_KEY = ((Constants.expoConfig?.extra?.supabaseAnonKey && Constants.expoConfig?.extra?.supabaseAnonKey !== "@SUPABASE_ANON_KEY") 
    ? Constants.expoConfig?.extra?.supabaseAnonKey 
    : process.env.SUPABASE_ANON_KEY)?.replace(/["']/g, "")?.trim(); // Remove any quotes and trim

// Use local SDK if in dev and key is present (checking both process.env and Constants)
const useProxy = !__DEV__ || !GEMINI_API_KEY;

let ai: GoogleGenAI | null = null;
if (!useProxy && GEMINI_API_KEY) {
    ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
}

type AiTone = 'encouraging' | 'stern' | 'ruthless';

// --- Proxy Helper ---

const callGeminiProxy = async (action: string, payload: any) => {
    if (!SUPABASE_ANON_KEY || SUPABASE_ANON_KEY === "@SUPABASE_ANON_KEY") {
        console.error("PROXY ERROR: SUPABASE_ANON_KEY is missing or placeholder.");
        throw new Error("Missing Supabase Configuration");
    }

    // DEBUG: Check format (Safe logging)
    const keyPrefix = SUPABASE_ANON_KEY.substring(0, 3);
    const keySuffix = SUPABASE_ANON_KEY.substring(SUPABASE_ANON_KEY.length - 3);
    console.log(`[PROXY DEBUG] Action: ${action}, Len: ${SUPABASE_ANON_KEY.length}, Format: ${keyPrefix}...${keySuffix}`);

    try {
        const response = await fetch(SUPABASE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({ action, payload })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Proxy HTTP ${response.status}:`, errorText);
            throw new Error(`Proxy error: ${response.status}`);
        }

        return await response.json();
    } catch (e: any) {
        console.error("Fetch/Proxy Exception:", e.message);
        throw e;
    }
};

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

    if (!useProxy && ai) {
        // --- Local Path (SDK - Uses camelCase) ---
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
                        estimatedReturnBy: { type: Type.STRING },
                        isActuallyReturnable: { type: Type.BOOLEAN }
                    },
                    required: ["isNecessary", "reasoning", "callScript", "isActuallyReturnable"],
                },
                temperature: 0.7,
            }
        });

        if (!response.text) throw new Error("AI response malformed");
        let jsonText = response.text.trim();
        if (jsonText.startsWith('```json')) jsonText = jsonText.substring(7, jsonText.length - 3).trim();
        return JSON.parse(jsonText) as PurchaseAnalysis;

    } else {
        // --- Build Path (REST Proxy - Uses snake_case) ---
        const payload = {
            contents: [{ parts: [{ text: prompt }] }],
            system_instruction: { parts: [{ text: systemInstruction }] },
            generation_config: {
                response_mime_type: "application/json",
                response_schema: {
                    type: "OBJECT",
                    properties: {
                        isNecessary: { type: "BOOLEAN" },
                        reasoning: { type: "STRING" },
                        callScript: { type: "STRING" },
                        hotTake: { type: "STRING" },
                        estimatedReturnBy: { type: "STRING" },
                        isActuallyReturnable: { type: "BOOLEAN" }
                    },
                    required: ["isNecessary", "reasoning", "callScript", "isActuallyReturnable"],
                },
                temperature: 0.7,
            }
        };

        const response = await callGeminiProxy('analyzePurchase', payload);
        const candidate = response.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!candidate) throw new Error("AI response malformed");
        let jsonText = candidate.trim();
        if (jsonText.startsWith('```json')) jsonText = jsonText.substring(7, jsonText.length - 3).trim();
        return JSON.parse(jsonText) as PurchaseAnalysis;
    }
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

    let nagScript = "Return this now.";

    if (!useProxy && ai) {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: { systemInstruction, temperature: 0.8 }
        });
        nagScript = response.text || nagScript;
    } else {
        const payload = {
            contents: [{ parts: [{ text: prompt }] }],
            system_instruction: { parts: [{ text: systemInstruction }] },
            generation_config: { 
                temperature: 0.8 
            }
        };
        const response = await callGeminiProxy('analyzePurchase', payload);
        nagScript = response.candidates?.[0]?.content?.parts?.[0]?.text || nagScript;
    }

    const audioUrl = await generateCallAudio(nagScript);
    return { nagScript, audioUrl };
};

/**
 * Helper to encode raw PCM data into a WAV file format.
 */
const encodeWAV = (samples: Int16Array, sampleRate: number): string => {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);
    view.setUint32(0, 0x52494646, false); // "RIFF"
    view.setUint32(4, 36 + samples.length * 2, true);
    view.setUint32(8, 0x57415645, false); // "WAVE"
    view.setUint32(12, 0x666d7420, false); // "fmt "
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    view.setUint32(36, 0x64617461, false); // "data"
    view.setUint32(40, samples.length * 2, true);
    for (let i = 0; i < samples.length; i++) {
        view.setInt16(44 + i * 2, samples[i], true);
    }
    return Buffer.from(buffer).toString('base64');
};

/**
 * Generates audio as a Base64 Data URI using the Gemini TTS model.
 */
const generateCallAudio = async (text: string): Promise<string> => {
    const ttsModel = "gemini-2.5-flash-preview-tts";
    try {
        let audioPart: any;

        if (!useProxy && ai) {
            const response = await ai.models.generateContent({
                model: ttsModel,
                contents: text,
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: {
                            prebuiltVoiceConfig: { voiceName: 'Aoede' },
                        },
                    },
                },
            });
            audioPart = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;
        } else {
            const payload = {
                contents: [{ parts: [{ text: text }] }],
                generation_config: {
                    response_modalities: ["AUDIO"],
                    speech_config: {
                        voice_config: {
                            prebuilt_voice_config: { voice_name: 'Aoede' },
                        },
                    },
                },
            };
            const response = await callGeminiProxy('generateAudio', payload);
            audioPart = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;
        }

        const base64AudioData = audioPart?.data;
        const mimeType = audioPart?.mimeType || '';

        if (!base64AudioData) throw new Error("Failed to generate audio data from Gemini.");

        if (mimeType.includes('L16') || mimeType.includes('pcm')) {
            const rawBuffer = Buffer.from(base64AudioData, 'base64');
            const samples = new Int16Array(rawBuffer.buffer, rawBuffer.byteOffset, rawBuffer.length / 2);
            let sampleRate = 24000;
            const rateMatch = mimeType.match(/rate=(\d+)/);
            if (rateMatch) sampleRate = parseInt(rateMatch[1]);
            const wavBase64 = encodeWAV(samples, sampleRate);
            return `data:audio/wav;base64,${wavBase64}`;
        }

        return `data:${mimeType || 'audio/mp3'};base64,${base64AudioData}`;
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
    const model = "gemini-3.1-flash-lite-preview";
    const systemInstruction = `Receipt scanner. Valid categories: ${allCategories.join(', ')}. Return JSON only.`;

    if (!useProxy && ai) {
        const response = await ai.models.generateContent({
            model: model,
            contents: { parts: [{ text: "Extract JSON: item, amount, category." }, { inlineData: { mimeType: 'image/jpeg', data: resized.base64 } }] },
            config: {
                systemInstruction: systemInstruction,
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
    } else {
        const payload = {
            contents: [{ parts: [{ text: "Extract JSON: item, amount, category." }, { inline_data: { mime_type: 'image/jpeg', data: resized.base64 } }] }],
            system_instruction: { parts: [{ text: systemInstruction }] },
            generation_config: {
                response_mime_type: "application/json",
                response_schema: { type: "OBJECT", properties: { item: { type: "STRING" }, amount: { type: "NUMBER" }, category: { type: "STRING" } }, required: ["item", "amount", "category"] },
            }
        };
        const response = await callGeminiProxy('analyzePurchase', payload);
        const candidate = response.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!candidate) throw new Error ("Response is null");
        let jsonText = candidate.trim();
        if (jsonText.startsWith('```json')) jsonText = jsonText.substring(7, jsonText.length - 3).trim();
        const parsed = JSON.parse(jsonText);
        if (!allCategories.includes(parsed.category)) parsed.category = 'Shopping';
        return parsed;
    }
};

export const getFinancialTip = async (category: string): Promise<string> => {
    const model = "gemini-3.1-flash-lite-preview";
    const systemInstruction = "Actionable financial tip, 2 sentences.";
    const prompt = `Financial tip about: ${category}.`;

    if (!useProxy && ai) {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: { systemInstruction, temperature: 0.9 }
        });
        return response.text || "Save money where you can.";
    } else {
        const payload = {
            contents: [{ parts: [{ text: prompt }] }],
            system_instruction: { parts: [{ text: systemInstruction }] },
            generation_config: { temperature: 0.9 }
        };
        const response = await callGeminiProxy('analyzePurchase', payload);
        return response.candidates?.[0]?.content?.parts?.[0]?.text || "Save money where you can.";
    }
};
