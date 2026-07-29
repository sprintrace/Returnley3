import type { PurchaseAnalysis, UserProfile } from '../types';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Speech from 'expo-speech';
import { CATEGORIES } from '../lib/categories';
import { recognizeText } from 'expo-mlkit-ocr';

export type AiTone = 'encouraging' | 'stern' | 'ruthless';

// Static local financial tips
const FINANCIAL_TIPS: Record<string, string[]> = {
  Shopping: [
    "Wait 24 hours before completing non-essential purchases to curb impulsive habits.",
    "Unsubscribe from retail newsletters to reduce the temptation of flash sales.",
    "Ask yourself: 'Will this item add value to my life in 3 months?'"
  ],
  "Dining Out": [
    "Try meal prepping on Sundays to avoid expensive last-minute takeout orders.",
    "Set a strict monthly dining-out allowance and stick to it.",
    "Making coffee at home can save you over $100 a month."
  ],
  Groceries: [
    "Never go grocery shopping hungry, and always write a list beforehand.",
    "Buy store brands instead of name brands to cut your grocery bill by 20%.",
    "Buy bulk items for non-perishables to save in the long run."
  ],
  Entertainment: [
    "Look for free local events or community gatherings instead of paid ticketing.",
    "Audit your active streaming subscriptions and cancel any you haven't used this month.",
    "Invite friends over for a board game night instead of going to a bar."
  ],
  default: [
    "Pay yourself first: put 10% of every paycheck into savings before spending.",
    "Track every penny you spend for a week to discover hidden budget leaks.",
    "Build a 3-6 month emergency fund before spending on luxury items."
  ]
};

// Heuristic categories that are generally considered "necessary"
const NECESSARY_CATEGORIES = ['Groceries', 'Bills', 'Rent', 'Utilities', 'Medical', 'Insurance', 'Gas'];

/**
 * Local implementation of purchase analysis using a rules engine.
 */
export const analyzePurchase = async (
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

  // Rule-based necessity check
  const isCategoryNecessary = NECESSARY_CATEGORIES.includes(category);
  // Groceries or bills under $200 are usually necessary. Large unexpected expenses are marked suspicious.
  const isNecessary = isCategoryNecessary && amount < 200;

  const goal = userProfile?.savingsGoal || "saving money";
  const weakness = userProfile?.financialWeakness || "";
  const isWeaknessTriggered = weakness && category.toLowerCase().includes(weakness.toLowerCase());

  let hotTake = "";
  let reasoning = "";
  let callScript = "";

  // 1. Generate responses based on tone and amount
  if (tone === 'encouraging') {
    if (isNecessary) {
      hotTake = `Good planning! ${item} is a sound purchase.`;
      reasoning = `This is a necessary purchase under ${category}. It keeps your basic needs met without breaking your budget.`;
    } else {
      if (amount > 100) {
        hotTake = `Whoa, $${amount} is a lot for ${item}. Let's think this over.`;
        reasoning = `Spending $${amount} on ${item} is a major setback for your goal of '${goal}'. Consider returning it to keep your momentum going.`;
      } else {
        hotTake = `Do you really need this ${item} right now?`;
        reasoning = `While $${amount} is relatively small, these minor purchases add up quickly. If it's not essential, returning it is a win for your savings.`;
      }
      if (isWeaknessTriggered) {
        reasoning += ` Remember, ${weakness} is your known financial weakness. Stay strong!`;
      }
      callScript = `Hey there, this is Returnley. I saw you purchased ${item} for $${amount}. I know it's tempting to keep it, but remember your savings goal: '${goal}'. Let's be smart and return it.`;
    }
  } else if (tone === 'stern') {
    if (isNecessary) {
      hotTake = `Necessary expense recorded. Move along.`;
      reasoning = `Verified necessary under ${category}. Make sure to keep your non-essential spending strictly at zero.`;
    } else {
      if (amount > 100) {
        hotTake = `Stop. $${amount} on ${item} is a clear financial mistake.`;
        reasoning = `You just spent $${amount} on ${item}. This directly compromises your goal to '${goal}'. Do the right thing and return it before the return window closes.`;
      } else {
        hotTake = `Impulse purchase detected: ${item} ($${amount}).`;
        reasoning = `You spent $${amount} on ${item}. It is an unnecessary splurge in the ${category} category. Return it to regain control of your budget.`;
      }
      if (isWeaknessTriggered) {
        reasoning += ` You flagged ${weakness} as your weakness, yet you went ahead and bought this anyway. Fix it.`;
      }
      callScript = `This is Returnley. You spent $${amount} on ${item}. This is unnecessary and conflicts with your goal to '${goal}'. Do not try to justify it. You need to return this item immediately.`;
    }
  } else { // ruthless
    if (isNecessary) {
      hotTake = `Fine. It's a necessary expense. Don't get excited.`;
      reasoning = `It's groceries or bills, so I'll let it slide. But don't use this as an excuse to go blow your cash on other garbage.`;
    } else {
      if (amount > 100) {
        hotTake = `Deeply disappointed. $${amount} wasted on ${item}.`;
        reasoning = `What were you thinking spending $${amount} on ${item}?! Your goal was '${goal}' and you threw it away for this. You have zero self-control. Return it now.`;
      } else {
        hotTake = `Another piece of clutter. $${amount} down the drain.`;
        reasoning = `You wasted $${amount} on ${item}. You're literally throwing cash away on ${category}. Keep this up and you'll never reach your goal.`;
      }
      if (isWeaknessTriggered) {
        reasoning += ` You admitted ${weakness} is your kryptonite, and you still fell for it. Embarrassing.`;
      }
      callScript = `Listen to me. This is Returnley. Your purchase of ${item} for $${amount} is an absolute joke. You claim your goal is '${goal}', but your actions prove otherwise. Stop making excuses, swallow your pride, and return this immediately.`;
    }
  }

  // If it's final sale / not returnable
  if (!isReturnable && !isNecessary) {
    reasoning += " Note: This is a final sale item. Treat this as a harsh lesson in mindful spending.";
    callScript = "This was a final sale purchase, so you can't return it. Let this sink in: that money is gone. Think twice next time.";
  }

  // If it's an urge
  if (isUrge) {
    callScript = "";
  }

  // Calculate return date (defaults to 14 days from now if not specified)
  const returnDate = returnBy || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  return {
    isNecessary,
    reasoning,
    callScript,
    hotTake,
    estimatedReturnBy: returnDate,
    isActuallyReturnable: isReturnable
  };
};

/**
 * Analyzes an Urge purchase when its 24-hour cooldown ends.
 * Generates a rule-engine verdict, reasoning, call script, and notification body.
 */
export const analyzeUrgeCooldown = async (
  item: string,
  amount: number,
  category: string,
  userProfile?: UserProfile,
  tone: AiTone = 'encouraging'
): Promise<{
  isRecommendedToBuy: boolean;
  verdictText: string;
  notificationBody: string;
  callScript: string;
  hotTake: string;
}> => {
  const isCategoryNecessary = NECESSARY_CATEGORIES.includes(category);
  const goal = userProfile?.savingsGoal || "saving money";
  const weakness = userProfile?.financialWeakness || "";
  const minCall = userProfile?.minCallAmount ?? 20;
  const isWeaknessTriggered = weakness && category.toLowerCase().includes(weakness.toLowerCase());

  // Rule: If non-necessary and price > minCall amount, recommendation is to SKIP.
  const isRecommendedToBuy = isCategoryNecessary || (amount < minCall && !isWeaknessTriggered);

  let notificationBody = "";
  let callScript = "";
  let verdictText = "";
  let hotTake = "";

  if (isRecommendedToBuy) {
    verdictText = `Returnley Verdict: BUY APPROVED. ${item} ($${amount}) fits into your budget as a reasonable purchase.`;
    notificationBody = `Verdict: BUY APPROVED! $${amount.toFixed(2)} for ${item} is reasonable. Tap to confirm purchase or call Returnley.`;
    hotTake = `Cooldown over! You can buy ${item} without guilt.`;
    
    if (tone === 'encouraging') {
      callScript = `Your 24-hour cooldown for ${item} is complete. Good news: based on your budget, this purchase is safe to make! If you still want it, go right ahead!`;
    } else if (tone === 'stern') {
      callScript = `The 24-hour cooldown for ${item} has elapsed. It passes our financial threshold. If you need it, proceed carefully.`;
    } else {
      callScript = `Cooldown ended for ${item}. Surprisingly, it's not a complete waste of cash. Buy it if you must.`;
    }
  } else {
    verdictText = `Returnley Verdict: SKIP IT! $${amount.toFixed(2)} for ${item} is an impulse purchase that hinders your '${goal}' goal.`;
    notificationBody = `Verdict: SKIP IT! $${amount.toFixed(2)} for ${item} hinders '${goal}'. Tap to answer Returnley's call.`;
    hotTake = `24 hours passed! Resist the urge and save your $${amount.toFixed(2)}!`;

    if (tone === 'encouraging') {
      callScript = `Hey! Your 24-hour cooldown for ${item} ($${amount.toFixed(2)}) is up. You've given yourself time to think. My recommendation is to skip this purchase and add $${amount.toFixed(2)} towards your goal of '${goal}'!`;
    } else if (tone === 'stern') {
      callScript = `Your 24-hour cooldown for ${item} is up. Spending $${amount.toFixed(2)} on this non-essential item directly conflicts with your goal to '${goal}'. Resist the urge and save your money.`;
    } else { // ruthless
      callScript = `Listen up! The 24 hours are over for ${item}. Spending $${amount.toFixed(2)} on this is a classic impulse mistake. Don't fall for it. Save the cash toward '${goal}' instead of buying garbage.`;
    }

    if (isWeaknessTriggered) {
      callScript += ` Remember, ${weakness} is your financial weakness. Stay disciplined!`;
    }
  }

  return {
    isRecommendedToBuy,
    verdictText,
    notificationBody,
    callScript,
    hotTake,
  };
};

/**
 * Local implementation of nag audio/scripts.
 */
export const generateNagAudio = async (
  item: string,
  amount: number,
  category: string,
  nagCount: number,
  tone: AiTone = 'encouraging'
): Promise<{ nagScript: string; audioUrl: string; }> => {
  
  let nagScript = "";
  
  if (tone === 'encouraging') {
    if (nagCount === 0) {
      nagScript = `Just a friendly check-in: did you return ${item} for $${amount} yet? It's a great step for your savings!`;
    } else if (nagCount < 3) {
      nagScript = `Hey, just checking back on that ${item}. You've still got time to return it and get your $${amount} back.`;
    } else {
      nagScript = `It's not too late. Returning the ${item} is a decision you won't regret. Choose your goals over clutter!`;
    }
  } else if (tone === 'stern') {
    if (nagCount === 0) {
      nagScript = `Reminder: You need to return the ${item} for $${amount}. Don't procrastinate on your finances.`;
    } else if (nagCount < 3) {
      nagScript = `This is your second warning. That $${amount} is still sitting in ${item} instead of your savings account. Return it.`;
    } else {
      nagScript = `Stop ignoring this. You committed to a goal. Returning the ${item} is how you keep it. Go return it today.`;
    }
  } else { // ruthless
    if (nagCount === 0) {
      nagScript = `Why is ${item} still in your house? Go return it and get your $${amount} back. Stop being lazy.`;
    } else if (nagCount < 3) {
      nagScript = `Are you seriously keeping the ${item}? That's $${amount} you literally burned. Go return it right now.`;
    } else {
      nagScript = `You have ignored me multiple times. Your financial discipline is non-existent. Return that ${item} immediately or accept defeat.`;
    }
  }

  // Return a non-empty audioUrl placeholder so the modal triggers correctly in App.tsx
  return { nagScript, audioUrl: "local-speech" };
};

/**
 * Local wrapper for analyzing purchase and signaling the local voice call.
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
  
  // Return "local-speech" as the audioUrl so the IncomingCall modal renders
  let audioUrl: string | null = null;
  if (!analysis.isNecessary && analysis.callScript && !isUrge) {
    audioUrl = "local-speech";
  }
  
  return { analysis, audioUrl };
};

/**
 * Analyze receipt using on-device ML Kit OCR and a rule-based regex parser.
 * This does NOT make any AI/LLM API calls.
 */
export const analyzeReceipt = async (imageUri: string): Promise<{ item: string; amount: number; category: string; }> => {
  try {
    console.log("Analyzing receipt offline with on-device ML Kit OCR...");
    // Resize and compress the image first to optimize OCR processing speed
    const manipulated = await ImageManipulator.manipulateAsync(
      imageUri,
      [{ resize: { width: 1000 } }],
      { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG }
    );

    // Call ML Kit OCR scan
    const ocrResult = await recognizeText(manipulated.uri);
    if (!ocrResult || !ocrResult.text) {
      console.warn("OCR scanned no text, returning defaults.");
      return {
        item: "Scanned Receipt Item",
        amount: 0,
        category: "Shopping"
      };
    }

    // Extract text lines directly from the combined text string
    const fullText = ocrResult.text;
    const lines = fullText.split('\n').map((l: string) => l.trim()).filter(Boolean);

    console.log("OCR raw text snippet:", fullText.substring(0, 300));

    // 1. Amount Extraction (Regex & rule-based)
    let amount = 0;
    const priceRegex = /(?:\$)?\s*(\d+\.\d{2})\b/g;
    let match;
    const prices: { value: number; line: string }[] = [];

    for (const line of lines) {
      priceRegex.lastIndex = 0;
      while ((match = priceRegex.exec(line)) !== null) {
        const val = parseFloat(match[1]);
        if (!isNaN(val)) {
          prices.push({ value: val, line });
        }
      }
    }

    const totalKeywords = ['total', 'amount due', 'due', 'charge', 'paid', 'sum', 'grand total', 'net'];
    const excludeKeywords = ['subtotal', 'sub total', 'tax', 'hst', 'gst', 'vat', 'change', 'cash', 'tender', 'visa', 'mastercard', 'card', 'amex', 'savings', 'discount'];

    let bestTotalCandidate = -1;
    for (const priceObj of prices) {
      const lowerLine = priceObj.line.toLowerCase();
      const hasTotalWord = totalKeywords.some(kw => lowerLine.includes(kw));
      const hasExcludeWord = excludeKeywords.some(kw => lowerLine.includes(kw));
      
      if (hasTotalWord && !hasExcludeWord) {
        if (priceObj.value > bestTotalCandidate) {
          bestTotalCandidate = priceObj.value;
        }
      }
    }

    if (bestTotalCandidate > 0) {
      amount = bestTotalCandidate;
    } else {
      // Fallback: pick the largest price value that isn't too high (e.g. skip invoice numbers)
      const reasonablePrices = prices.filter(p => p.value < 10000);
      if (reasonablePrices.length > 0) {
        amount = Math.max(...reasonablePrices.map(p => p.value));
      }
    }

    // 2. Merchant / Item Extraction
    let item = "Scanned Receipt Item";
    const dateRegex = /\d{1,4}[-/.]\d{1,4}[-/.]\d{1,4}/;
    const phoneRegex = /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
    const urlRegex = /(www\.|http:|https:|\.com)/i;
    const addressRegex = /\b(street|st|ave|road|rd|blvd|lane|ln|drive|dr|way|hwy|highway|suite|ste)\b/i;

    const merchantCandidates = lines.slice(0, 5).filter((line: string) => {
      const clean = line.trim();
      if (clean.length < 3) return false;
      if (dateRegex.test(clean)) return false;
      if (phoneRegex.test(clean)) return false;
      if (urlRegex.test(clean)) return false;
      if (addressRegex.test(clean)) return false;
      if (/^[0-9\s#\-()*+$:.]+$/.test(clean)) return false;
      return true;
    });

    if (merchantCandidates.length > 0) {
      item = merchantCandidates[0];
    }

    // 3. Category Mapping (Rule-based keywords match)
    const CATEGORY_KEYWORDS: Record<string, string[]> = {
      'Groceries': ['grocery', 'groceries', 'supermarket', 'whole foods', 'kroger', 'safeway', 'trader joe', 'food', 'market', 'produce', 'bakery', 'aldi', 'publix'],
      'Fast Food': ['mcdonald', 'burger', 'starbucks', 'coffee', 'cafe', 'pizza', 'taco', 'subway', 'dunkin', 'wendy', 'kfc', 'coke', 'drink', 'combo', 'espresso', 'donut'],
      'Dining & Entertainment': ['restaurant', 'bar', 'grill', 'pub', 'bistro', 'tavern', 'cinema', 'theater', 'show', 'concert', 'ticket', 'museum', 'bowling', 'karaoke'],
      'Transportation': ['chevron', 'shell', 'exxon', 'mobil', 'gas', 'fuel', 'uber', 'lyft', 'taxi', 'transit', 'train', 'parking', 'station', 'metro'],
      'Utilities': ['electric', 'water', 'power', 'internet', 'cable', 'wifi', 'telecom', 'phone', 'utility', 'utilities'],
      'Shopping': ['target', 'walmart', 'amazon', 'store', 'mall', 'clothing', 'shoes', 'apparel', 'boutique', 'department', 'best buy', 'home depot', 'lowes', 'nordstrom', 'macy', 'ikea', 'retail'],
      'Health & Wellness': ['pharmacy', 'cvs', 'walgreens', 'health', 'medical', 'doctor', 'dentist', 'gym', 'fitness', 'pill', 'prescription', 'clinic', 'care'],
      'Subscriptions': ['netflix', 'spotify', 'hulu', 'prime', 'apple', 'google', 'membership', 'subscription', 'monthly', 'renew', 'patreon'],
      'Travel': ['hotel', 'motel', 'airbnb', 'flight', 'airline', 'resort', 'booking', 'stay', 'rentacar', 'lodging', 'cruise'],
      'Personal Care': ['salon', 'barber', 'hair', 'spa', 'nails', 'makeup', 'cosmetics', 'grooming', 'beauty'],
    };

    let category = 'Shopping';
    let maxScore = 0;
    const lowerText = fullText.toLowerCase();

    for (const [catName, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      let score = 0;
      for (const word of keywords) {
        if (lowerText.includes(word)) {
          score++;
        }
      }
      if (score > maxScore) {
        maxScore = score;
        category = catName;
      }
    }

    return { item, amount, category };
  } catch (e: any) {
    console.error("Offline receipt analysis failed:", e.message || e);
    return {
      item: "Fallback: Scanned Item",
      amount: 19.99,
      category: "Shopping"
    };
  }
};

/**
 * Local financial tips selection.
 */
export const getFinancialTip = async (category: string): Promise<string> => {
  const tips = FINANCIAL_TIPS[category] || FINANCIAL_TIPS.default;
  return tips[Math.floor(Math.random() * tips.length)];
};

/**
 * Local speech TTS functions using expo-speech.
 */
export const speak = (text: string, tone: AiTone, onDone?: () => void) => {
  // Stop any active speech first
  Speech.stop();

  // Fine-tune rate and pitch based on the tone
  const pitch = tone === 'ruthless' ? 0.82 : tone === 'stern' ? 0.92 : 1.0;
  const rate = tone === 'ruthless' ? 0.85 : tone === 'stern' ? 0.95 : 1.0;

  Speech.speak(text, {
    pitch,
    rate,
    onDone: onDone,
    onStopped: onDone,
    onError: (e: any) => {
      console.error("Local speech error:", e);
      if (onDone) onDone();
    }
  });
};

export const speakText = speak; // Alias in case other files use it

export const stopSpeaking = () => {
  Speech.stop();
};
