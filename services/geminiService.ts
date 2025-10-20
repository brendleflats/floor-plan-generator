
import { GoogleGenAI, Type } from "@google/genai";
import type { FloorPlan } from '../types';

const floorPlanSchema = {
  type: Type.OBJECT,
  properties: {
    units: {
      type: Type.STRING,
      enum: ['feet', 'meters'],
      description: "The unit of measurement for all dimensions."
    },
    rooms: {
      type: Type.ARRAY,
      description: "List of all rooms in the floor plan.",
      items: {
        type: Type.OBJECT,
        properties: {
          name: {
            type: Type.STRING,
            description: "Name of the room, e.g., 'Living Room' or 'Bedroom 1'."
          },
          polygon: {
            type: Type.ARRAY,
            description: "An array of {x, y} points defining the vertices of the room's shape in order.",
            items: {
              type: Type.OBJECT,
              properties: {
                x: {
                  type: Type.NUMBER,
                  description: "The x-coordinate of the vertex."
                },
                y: {
                  type: Type.NUMBER,
                  description: "The y-coordinate of the vertex."
                }
              },
              required: ['x', 'y']
            }
          }
        },
        required: ['name', 'polygon']
      }
    }
  },
  required: ['units', 'rooms']
};


export const generateFloorPlanFromTranscript = async (transcript: string): Promise<FloorPlan | null> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const systemInstruction = `You are an expert architect's assistant. Your task is to interpret a user's spoken description of a space and convert it into a structured JSON floor plan. The user has provided a transcript from a live audio/video session. Analyze the text to identify rooms, their shapes, relative positions, and dimensions. Define the floor plan starting from a {x: 0, y: 0} origin. All rooms should be connected logically. The final output must be a single, valid JSON object that strictly adheres to the provided schema. Do not output any text or markdown formatting outside of the JSON object.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: `Please create a floor plan based on this transcript: "${transcript}"`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: floorPlanSchema
      }
    });

    const jsonString = response.text.trim();
    const parsedJson = JSON.parse(jsonString);
    
    // Basic validation to ensure it looks like our floor plan structure
    if (parsedJson && parsedJson.units && Array.isArray(parsedJson.rooms)) {
      return parsedJson as FloorPlan;
    } else {
      console.error("Generated JSON does not match FloorPlan schema:", parsedJson);
      return null;
    }

  } catch (error) {
    console.error("Error generating floor plan with Gemini:", error);
    throw error;
  }
};
