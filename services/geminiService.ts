import { GoogleGenAI, Type } from "@google/genai";
import type { FloorPlan } from '../types';

const doorAndWindowSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            wallIndex: {
                type: Type.INTEGER,
                description: "The index of the wall in the polygon's point array this item belongs to. A wall is the line segment between polygon[i] and polygon[i+1]."
            },
            position: {
                type: Type.NUMBER,
                description: "A value from 0 to 1 representing the center position of the item along the wall."
            },
            width: {
                type: Type.NUMBER,
                description: "The width of the item in the specified units."
            },
            type: {
                type: Type.STRING,
                enum: ['standard', 'bay'],
                description: "Type of the door, e.g., 'standard' for regular doors or 'bay' for large industrial bay doors."
            }
        },
        required: ['wallIndex', 'position', 'width']
    }
};

const pointSchema = {
    type: Type.OBJECT,
    properties: {
        x: { type: Type.NUMBER, description: "The x-coordinate of the vertex." },
        y: { type: Type.NUMBER, description: "The y-coordinate of the vertex." }
    },
    required: ['x', 'y']
};

const pathSchema = {
    type: Type.OBJECT,
    properties: {
        name: {
            type: Type.STRING,
            description: "Name of the path, e.g., 'Emergency Exit Route' or 'Main Walkway'."
        },
        points: {
            type: Type.ARRAY,
            description: "An array of {x, y} points defining the vertices of the path's line in order.",
            items: pointSchema
        },
        color: {
            type: Type.STRING,
            description: "An optional hex color code for the path, e.g., '#FF0000' for red."
        }
    },
    required: ['name', 'points']
};

const structureSchema = {
    type: Type.OBJECT,
    properties: {
        name: {
            type: Type.STRING,
            description: "Name of the structure, e.g., 'Main Hoist' or 'Stairwell to 2nd Floor'."
        },
        type: {
            type: Type.STRING,
            enum: ['hoist', 'lift', 'large_equipment', 'skylight', 'stairs', 'other'],
            description: "The type of industrial or architectural structure."
        },
        polygon: {
            type: Type.ARRAY,
            description: "An array of {x, y} points defining the footprint of the structure.",
            items: pointSchema
        }
    },
    required: ['name', 'type', 'polygon']
};


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
            items: pointSchema
          },
           doors: {
            ...doorAndWindowSchema,
            description: "List of doors in this room. Specify the type for bay doors."
          },
          windows: {
            ...doorAndWindowSchema,
            description: "List of windows in this room."
          }
        },
        required: ['name', 'polygon']
      }
    },
    paths: {
      type: Type.ARRAY,
      description: "List of navigational paths or routes, like emergency exits.",
      items: pathSchema
    },
    structures: {
      type: Type.ARRAY,
      description: "List of fixed industrial or architectural structures like hoists, lifts, large unmovable equipment, skylights, and stairs.",
      items: structureSchema
    }
  },
  required: ['units', 'rooms']
};


export const generateFloorPlanFromTranscript = async (transcript: string): Promise<FloorPlan | null> => {
  // FIX: Removed API key check as per coding guidelines.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const systemInstruction = `You are an expert architect's assistant specializing in industrial spaces. Your task is to interpret a user's spoken description of a space and convert it into a structured JSON floor plan. The user has provided a transcript from a live audio/video session. Analyze the text to identify rooms, their shapes, relative positions, dimensions, and the locations of doors and windows. Crucially, you must also identify and map key industrial and architectural structures. Pay close attention to mentions of:
- **Bay Doors**: Identify these and mark them with the 'bay' type.
- **Stairs**: Map out their footprint as a polygon.
- **Skylights**: Map their location and shape as a polygon.
- **Hoists and Lifts**: Pinpoint their location and footprint.
- **Large, unmovable equipment**: Note any machinery or large objects described as fixed and map their footprint.
Define the floor plan starting from a {x: 0, y: 0} origin. All rooms, paths, and structures should be connected logically based on the description. The final output must be a single, valid JSON object that strictly adheres to the provided schema. Do not output any text or markdown formatting outside of the JSON object.`;

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