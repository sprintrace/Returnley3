
import { GoogleGenAI, Type, Modality } from "@google/genai";
import type { PurchaseAnalysis, UserProfile } from '../types';
import { CATEGORIES } from "../lib/categories";
import * as FileSystem from 'expo-file-system';
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
 * @param tone The selected AI personality, which dictates the system prompt.
 * @param userProfile The user's financial context (income, weakness, goals).
 * @param emotionalContext How the user is feeling at the time of purchase.
 * @param isUrge Whether this is just an urge (not yet bought).
 * @returns A Promise that resolves to a PurchaseAnalysis object.
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
  
    const model = "gemini-2.5-flash";

    // A map to dynamically construct parts of the system instruction based on the user's selected tone.
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

    // Construct context string
    let userContextStr = "";
    if (userProfile) {
      userContextStr = `
      USER PROFILE:
      - Monthly Income: $${userProfile.monthlyIncome || 0}
      - Financial Weakness: ${userProfile.financialWeakness || 'None'}
      - Main Goal: ${userProfile.savingsGoal || 'Unknown'}
      
      Compare the purchase amount ($${amount}) to their monthly income. If it's a significant % (e.g. > 10%), be more critical.
      If the item aligns with their "Financial Weakness", call them out on falling into old habits.
      Remind them how this purchase hurts their "Main Goal".
      `;
    }

    let emotionalContextStr = "";
    if (emotionalContext && emotionalContext !== 'Neutral / Normal') {
      emotionalContextStr = `
      USER EMOTIONAL STATE: ${emotionalContext}
      The user reported feeling this way when adding the item. 
      - If they are Stressed, Sad, or Bored, this is likely "Retail Therapy" or an emotional impulse. Call this out directly. 
      - Tell them that buying things won't fix their feelings.
      `;
  }

    // The system instruction provides detailed context and rules for the AI model.
    const systemInstruction = `${selectedTone.intro} Please analyze the user's purchase based on all provided details.
    
    ${userContextStr}
    ${emotionalContextStr}

    - Necessary items are typically groceries, utilities, rent, essential clothing, or planned, reasonable expenses. Groceries can often be returned, but fast food cannot.
    - Compulsive items are often luxury goods, unplanned electronics, expensive collectibles, or anything that seems excessive.
    - **Investment Justification:** A user may provide a justification.
      - If the justification is strong, reasonable for the amount, and aligns with the item's category, you should APPROVE the purchase.
      - If the justification seems weak, vague, or the expense is disproportionate, you should FLAG it.
    
    - **IS THIS AN URGE?**: The user might be logging an "Urge" (they haven't bought it yet).
      - If 'isUrge' is true, do NOT generate a 'callScript'. Instead, generate a 'hotTake'.
      - The 'hotTake' should be a punchy, one-sentence reaction to stop them from buying it. (e.g., "You want a $500 blender but you don't cook? Put the wallet down, Dave.")
    
    - If a purchase is deemed unnecessary AND is returnable (and NOT an urge):
      - ${selectedTone.returnableScriptInstruction}
      - If a return-by date is available from the user, you MUST mention it.
      - If a return-by date IS NOT provided, estimate one (30 days) and fill 'estimatedReturnBy'.
    
    - If a purchase is deemed unnecessary BUT IS NOT RETURNABLE (final sale), DO NOT tell them to return it.
      - Your script should instead be ${selectedTone.nonReturnableScriptInstruction}
    
    Provide a brief reasoning for your decision. The callScript should be empty if the purchase is necessary OR if it is an urge.`;

    const today = new Date().toISOString().split('T')[0];
    const prompt = `Purchase Date: ${today}. Please analyze this purchase:\nItem: ${item}\nAmount: $${amount}\nCategory: ${category}\nReturnable: ${isReturnable}\nReturn By: ${returnBy || 'N/A'}\nUser Justification: ${justification || 'None provided'}\nIs Urge: ${isUrge}`;

    let response;

    try {
    response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isNecessary: { type: Type.BOOLEAN, description: "Whether the purchase is deemed necessary." },
            reasoning: { type: Type.STRING, description: "A brief explanation for the decision." },
            callScript: { type: Type.STRING, description: "Script for the call. Empty if necessary or if it's an urge." },
            hotTake: { type: Type.STRING, description: "A punchy, one-sentence reaction if this is an urge." },
            estimatedReturnBy: { type: Type.STRING, description: "Estimated return date in YYYY-MM-DD." }
          },
          required: ["isNecessary", "reasoning", "callScript"],
        },
        temperature: 0.7,
      }
    });
  } catch (err) {
      console.error('AI generation failed', err);
      throw new Error('AI generation failed');
  }

  if (!response || !response.text) {
      throw new Error("AI response is null or malformed");
  }

  try {
      const jsonText = response.text.trim();
      return JSON.parse(jsonText) as PurchaseAnalysis;
  } catch (err) {
      console.error('Failed to parse AI JSON response:', response.text, err);
      throw new Error('Invalid AI response format');
  }
};

/**
 * Generates audio from a given text string using the Gemini TTS model.
 * @param text The text to be converted to speech.
 * @returns A Promise that resolves to a URI of the temporary audio file.
 */
const generateCallAudio = async (text: string): Promise<string> => {
    const ttsModel = "gemini-2.5-flash-preview-tts";
    
    const response = await ai.models.generateContent({
        model: ttsModel,
        contents: [{ parts: [{ text: text }] }],
        config: {
            responseModalities: [Modality.AUDIO], // Specify that we want audio output.
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: 'Kore' }, // A calm and clear voice.
                },
            },
        },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
        throw new Error("Failed to generate audio from TTS model.");
    }

    // Decode base64 to binary
    const audioBytes = Buffer.from(base64Audio, 'base64');
    
    // Save to a temporary file
    const cacheDir = (FileSystem as any).cacheDirectory ?? (FileSystem as any).documentDirectory;
    if (!cacheDir) {
        throw new Error("No writable directory found for temporary audio.");
    }

    const fileUri = cacheDir + `call_audio_${Date.now()}.wav`;
    await FileSystem.writeAsStringAsync(fileUri, audioBytes.toString('base64'), {
        encoding: 'base64',
    });

    return fileUri;
};

/**
 * Orchestrator function: first analyzes a purchase, then generates audio if necessary.
 * This is the primary service function called from the main App component.
 * @returns An object containing the analysis and a playable audio URL (or null).
 */
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
    // Only generate audio if it's unnecessary AND NOT an urge.
    if (!analysis.isNecessary && analysis.callScript && !isUrge) {
        audioUrl = await generateCallAudio(analysis.callScript);
    }
    
    return { analysis, audioUrl };
};

/**
 * Generates a "nag" call script and audio for an item the user has decided to keep.
 * The tone and content of the script escalate based on the `nagCount`.
 * @returns An object containing the generated script and a playable audio URL.
 */
export const generateNagAudio = async (item: string, amount: number, category: string, nagCount: number, tone: AiTone = 'encouraging'): Promise<{ nagScript: string; audioUrl: string; }> => {
    const model = "gemini-2.5-flash";
    // Instructions for generating nag scripts, with escalating tones based on attempt number.
    const toneInstructions = {
        encouraging: {
            intro: `You are Returnley, an AI financial conscience. The user has decided to keep an expensive, unnecessary item. Your goal is to persuade them to reconsider. Your tone should become progressively more firm and disappointed with each attempt.`,
            levels: {
                '1-2': 'Gentle reminder, focus on goals.',
                '3-4': 'More direct, highlight the financial impact.',
                '5-6': 'Stern, express disappointment, question the decision.',
                '7': 'Final, very firm warning about forming bad habits.'
            }
        },
        stern: {
            intro: `You are Returnley, an AI financial conscience, and you are fed up. The user has repeatedly ignored your advice about an expensive, unnecessary item. Your tone should be harsh and escalate with each attempt. Use shame and disappointment.`,
            levels: {
                '1-2': 'Sharp and questioning. "Are you sure about this?"',
                '3-4': 'Exasperated and critical. Point out the foolishness.',
                '5-6': 'Angry and condescending. Question their financial literacy.',
                '7': 'Final, scathing judgment. A brutal takedown of their bad habits.'
            }
        },
        ruthless: {
            intro: `You are Returnley, an AI financial conscience, and you are utterly disgusted. The user is a financial liability who has repeatedly ignored your flawless, logical advice. Your tone should be dripping with contempt and escalate into pure, unadulterated rage. Do not hold back.`,
            levels: {
                '1-2': 'Disgusted and dismissive. "Are you really this dense? This again?"',
                '3-4': 'Sarcastic and insulting. Mock their pathetic lack of self-control. Ask if buying junk is the only way they feel anything.',
                '5-6': 'Openly hostile. Call out their destructive, childish behavior. Frame this as a deep character flaw, not just a financial mistake.',
                '7': 'Pure financial fury. A final, blistering verbal assault. Tell them they are a lost cause and that this is a pathetic way to live.'
            }
        }
    };
    
    // Determine the current escalation level based on nagCount.
    let attemptLevelKey: keyof typeof toneInstructions.encouraging.levels = '1-2';
    if (nagCount + 1 >= 3) attemptLevelKey = '3-4';
    if (nagCount + 1 >= 5) attemptLevelKey = '5-6';
    if (nagCount + 1 >= 7) attemptLevelKey = '7';

    const selectedTone = toneInstructions[tone];

    const systemInstruction = `${selectedTone.intro}
    This is follow-up attempt number ${nagCount + 1} of 7. The current escalation level is: ${selectedTone.levels[attemptLevelKey]}
    Generate a short, persuasive script (max 4 sentences) based on the current attempt number.`;


    const prompt = `Generate a nag script for this purchase:\nItem: ${item}\nAmount: $${amount}\nCategory: ${category}\nAttempt Number: ${nagCount + 1}`;

    const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
            systemInstruction: systemInstruction,
            temperature: 0.8, // Higher temperature for more varied nag scripts.
        }
    });

    const nagScript = response.text;
    if (!nagScript) {
        throw new Error("Failed to generate nag script.");
    }

    // Generate audio for the newly created nag script.
    const audioUrl = await generateCallAudio(nagScript);

    return { nagScript, audioUrl };
};

/**
 * Analyzes a receipt image using a multimodal Gemini model.
 * @param imageData A base64 encoded string of the receipt image.
 * @returns A Promise that resolves to an object with the extracted item, amount, and category.
 */
export const analyzeReceipt = async (imageUri: string): Promise<{ item: string; amount: number; category: string; }> => {
  
  // Resize & compress BEFORE BASE64 conversion
  const resized = await ImageManipulator.manipulateAsync(
    imageUri,
    [{ resize: { width: 1000} }],
    {
      compress: 0.5,
      format: ImageManipulator.SaveFormat.JPEG,
      base64: true,
    }
  );

  if (!resized.base64) {
    throw new Error("Failed to convert image");
  }

  const base64Image = resized.base64;
  const model = "gemini-2.5-flash";
  
  const allCategories = Object.values(CATEGORIES).flat();

  const systemInstruction = `You are an intelligent receipt scanner. Please analyze the provided image of a receipt or checkout screen. Your task is to extract the key details and return them in a clean JSON format.
  - "item": Find the most prominent item or a concise summary if there are many (e.g., "Groceries from Market Co.", "Electronics order"). Do not list every single item.
  - "amount": Find the final total amount paid. It's usually labeled "Total", "Grand Total", or is the largest number at the bottom. Extract only the number.
  - "category": Based on the items and store name, classify the purchase into one of the following valid categories: ${allCategories.join(', ')}. Pick the most appropriate one.
  Your response must be only the JSON object. Thank you`;
  
  // Create the image part for the multimodal prompt.
  const imagePart = {
    inlineData: {
      mimeType: 'image/jpeg',
      data: base64Image,
    },
  };
  
  // Create the text part for the multimodal prompt.
  const textPart = {
    text: "Analyze this receipt and extract the item name (or a summary), the total amount, and a suitable category."
  };

  // Send both image and text parts to the model.
  const response = await ai.models.generateContent({
    model: model,
    contents: { parts: [textPart, imagePart] },
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          item: { type: Type.STRING, description: "A summary of the purchased item(s)." },
          amount: { type: Type.NUMBER, description: "The final total amount of the transaction." },
          category: { type: Type.STRING, description: `The most appropriate category from the provided list.` },
        },
        required: ["item", "amount", "category"],
      },
    }
  });
  
  if (!response.text){
    throw new Error ("Response is null");
  }
  else {
    const jsonText = response.text.trim();
    const parsed = JSON.parse(jsonText);

    // Post-processing validation: Ensure the category returned by the AI is one we support.
    if (!allCategories.includes(parsed.category)) {
        console.warn(`Gemini returned an invalid category: ${parsed.category}. Defaulting to 'Shopping'.`);
        parsed.category = 'Shopping';
    }

    return parsed;
  }
};

/**
 * Fetches a simple financial literacy tip from the Gemini model.
 * @param category The topic for the financial tip.
 * @returns A Promise that resolves to a string containing the tip.
 */
export const getFinancialTip = async (category: string): Promise<string> => {
  const model = "gemini-2.5-flash";
  const systemInstruction = `You are a friendly and clear financial educator. Your goal is to provide a single, concise, and actionable financial literacy tip for beginners. The tip should be easy to understand and implement, usually 2-4 sentences long. Do not use jargon without explaining it. Your response must be only the text of the tip itself, without any introductory phrases like "Here's a tip:".`;

  const prompt = `Generate a financial tip about: ${category}.`;

  const response = await ai.models.generateContent({
    model: model,
    contents: prompt,
    config: {
      systemInstruction: systemInstruction,
      temperature: 0.9, // Higher temperature allows for more creative and varied tips.
    }
  });
  
  if (!response.text) {
    throw new Error("Failed to generate financial tip.");
  }

  return response.text;
};
