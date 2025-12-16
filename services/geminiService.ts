import { GoogleGenAI, Type } from "@google/genai";
import { Property, MaintenanceLog, MaintenancePrediction } from "../types";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

// Lazy initialize the client to avoid errors at startup if API key is missing
let ai: GoogleGenAI | null = null;

const getClient = () => {
  if (!apiKey) {
    throw new Error("Gemini API Key is not configured. Please set VITE_GEMINI_API_KEY.");
  }
  if (!ai) {
    ai = new GoogleGenAI({ apiKey: apiKey });
  }
  return ai;
};

export const generateMaintenancePlan = async (
  property: Property,
  logs: MaintenanceLog[],
  language: 'en' | 'fi' = 'en'
): Promise<MaintenancePrediction[]> => {
  const client = getClient();
  const modelId = "gemini-2.5-flash"; // Good for reasoning and structured JSON
  
  // Filter logs for this property to give context
  const propertyLogs = logs.filter(l => l.propertyId === property.id);

  const langInstruction = language === 'fi' 
    ? "IMPORTANT: Provide the 'task' and 'reason' in Finnish language." 
    : "Provide the 'task' and 'reason' in English language.";

  const prompt = `
    You are an expert property manager and home inspector AI.
    Analyze the following property details and its maintenance history to predict the next 5 most critical future maintenance tasks.
    ${langInstruction}
    
    Property Details:
    - Type: ${property.type}
    - Year Built: ${property.yearBuilt}
    - Size: ${property.area} m²
    - Floors: ${property.floors}
    - Heating System: ${property.heatingType}
    - Location Context: Assumed temperate climate unless specified otherwise in address: ${property.address}

    Maintenance History (Past Logs):
    ${propertyLogs.length === 0 ? "No maintenance history recorded." : propertyLogs.map(l => `- ${l.date}: ${l.title} (${l.category})`).join('\n')}

    Based on the age, type, heating system, and history, identify gaps in maintenance (e.g., if the heating system is Oil and old, suggest servicing).
    Return a list of 5 specific tasks.
  `;

  try {
    const response = await client.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              task: { type: Type.STRING, description: "The title of the maintenance task" },
              reason: { type: Type.STRING, description: "Why this is recommended based on property age, heating type or history" },
              estimatedDate: { type: Type.STRING, description: "Suggested timeframe (e.g., 'Fall 2024' or 'Immediately')" },
              estimatedCost: { type: Type.STRING, description: "Estimated cost range (e.g., '$200 - $500')" },
              priority: { type: Type.STRING, enum: ["High", "Medium", "Low"] }
            },
            required: ["task", "reason", "estimatedDate", "estimatedCost", "priority"]
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as MaintenancePrediction[];
    }
    return [];
  } catch (error) {
    console.error("Error generating maintenance plan:", error);
    throw error;
  }
};