const { GoogleGenAI } = require("@google/genai");
require('dotenv').config();

const genAI = new GoogleGenAI(process.env.GEMINI_API_KEY);

async function listModels() {
  try {
    const result = await genAI.getGenerativeModel({ model: "gemini-1.5-flash" }).listModels();
    console.log("Available Models:");
    result.models.forEach((model) => {
      console.log(`- Name: ${model.name}`);
      console.log(`  Methods: ${model.supportedGenerationMethods.join(", ")}`);
      console.log(`  Description: ${model.description}`);
      console.log("---");
    });
  } catch (error) {
    // If the above method fails (SDK versions vary), try the alternative approach
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
        const data = await response.json();
        if (data.models) {
            data.models.forEach(model => {
                console.log(`- ${model.name} (${model.supportedGenerationMethods.join(', ')})`);
            });
        } else {
            console.log("Could not fetch models:", JSON.stringify(data, null, 2));
        }
    } catch (fetchError) {
        console.error("Error listing models:", error);
    }
  }
}

listModels();
