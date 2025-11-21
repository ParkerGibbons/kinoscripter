
import { GoogleGenAI } from "@google/genai";
import { Script, Resource, ScriptNode } from "../types";
import { ICONS } from "../constants";

// NOTE: This expects process.env.API_KEY to be set in the build environment.
// In a real app, this would be handled via a secure backend proxy or a client-side key input if strictly client-side.
// For this demo, we assume the environment variable or handle the missing key gracefully.

const DEFAULT_COLORS: Record<string, string> = {
    character: '#A02F6F', // Flexoki Magenta
    location: '#BC5215',  // Flexoki Orange
    object: '#205EA6',    // Flexoki Blue
    media: '#5E409D',     // Flexoki Purple
    web: '#24837B',       // Flexoki Cyan
    note: '#6F6E69'       // Flexoki Base 600 (Subtext)
};

const getIconForType = (type: string): string => {
    switch(type) {
        case 'character': return ICONS.user;
        case 'location': return ICONS.map || ICONS.book;
        case 'object': return ICONS.box || ICONS.zap;
        case 'media': return ICONS.film || ICONS.disc;
        case 'web': return ICONS.globe || ICONS.book;
        default: return ICONS.book;
    }
};

// Enriches a raw JSON script from Gemini with styling and HTML chips
const enrichScript = (script: Script): Script => {
    const validTypes = ['character', 'location', 'object', 'media', 'web', 'note'];

    // 1. Hydrate Resources with Colors and Icons if missing
    const resourceMap = new Map<string, Resource>();
    const enrichedResources = script.resources.map(r => {
        // Sanitize Type: Fallback for hallucinations or varied casing
        let type = r.type ? r.type.toLowerCase() as any : 'object';
        
        if (!validTypes.includes(type)) {
            // Heuristic mapping for common AI mistakes
            if (type === 'prop' || type === 'item') type = 'object';
            else if (type === 'place' || type === 'setting') type = 'location';
            else if (type === 'person' || type === 'role') type = 'character';
            else if (type === 'link' || type === 'url') type = 'web';
            else type = 'note'; // Default safe fallback
        }

        const enriched = {
            ...r,
            type,
            color: r.color || DEFAULT_COLORS[type] || '#878580',
            icon: r.icon || getIconForType(type)
        };
        resourceMap.set(r.id, enriched);
        return enriched;
    });

    // 2. Process Content to hydrate simple <span> tags into full Resource Chips
    const processNode = (node: ScriptNode): ScriptNode => {
        if (node.content) {
            // Regex to find <span data-id="res-id">Label</span> and convert to full chip HTML
            const replaceChip = (html: string) => {
                return html.replace(
                    /<span\s+data-id=["']([^"']+)["'][^>]*>(.*?)<\/span>/gi, 
                    (match, id, label) => {
                        const res = resourceMap.get(id);
                        if (!res) return match; // Return original if not found (or maybe strip tag?)
                        
                        const colorStyle = `style="--chip-color: ${res.color}"`;
                        // Using the updated CSS structure
                        return `<span class="resource-chip" data-id="${id}" data-type="${res.type}" ${colorStyle} contenteditable="false"><span class="resource-icon">${res.icon}</span>${label}</span>`;
                    }
                );
            };

            return {
                ...node,
                content: {
                    audio: replaceChip(node.content.audio || ''),
                    visual: replaceChip(node.content.visual || '')
                }
            };
        }
        
        if (node.children) {
            return {
                ...node,
                children: node.children.map(processNode)
            };
        }
        return node;
    };

    return {
        ...script,
        resources: enrichedResources,
        content: script.content.map(processNode)
    };
};

export const generateImage = async (prompt: string): Promise<string | null> => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) return null;

    try {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [{ text: prompt }]
            }
        });

        if (response.candidates?.[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData && part.inlineData.data) {
                    return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                }
            }
        }
        return null;
    } catch (error) {
        console.error("Gemini image generation failed:", error);
        return null;
    }
};

export const generateResourceProfile = async (
    label: string,
    type: string,
    currentContext: string,
    userInstructions?: string
): Promise<string | null> => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) return null;

    try {
        const ai = new GoogleGenAI({ apiKey });
        
        const prompt = `
            You are a creative writing assistant helping a screenwriter build a bible for their story.
            Task: Generate a concise but evocative profile for a story element.
            
            Element Name: ${label}
            Element Type: ${type}
            Current Notes: ${currentContext}
            
            User Direction: ${userInstructions || 'Expand on the core concept creatively.'}

            Output Format: HTML (semantic, simple tags like <p>, <ul>, <strong>). 
            Do NOT include markdown code blocks.
            
            Requirements:
            - If it's a Character: Suggest motivation, flaw, and a physical quirk.
            - If it's a Location: Suggest atmosphere, sensory details (smell, sound), and hidden history.
            - If it's an Object: Suggest visual details, origin, and symbolic meaning.
            - Tone: Cinematic, professional, noir/drama/sci-fi leaning unless context suggests otherwise.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        return response.text;
    } catch (error) {
        console.error("Gemini profile generation failed:", error);
        return null;
    }
};

export const generateBeatContent = async (
  context: string, 
  style: string,
  userInstructions?: string
): Promise<{ audio: string; visual: string } | null> => {
  
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    console.warn("Gemini API Key not found. AI features disabled.");
    return null;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = `
      You are a professional screenwriter assistant.
      Context: ${context}
      Style: ${style}
      Specific Instructions: ${userInstructions || 'Optimize this beat for clarity and impact.'}
      
      Generate a single beat for an AV script.
      Return ONLY a valid JSON object with this structure:
      {
        "audio": "The dialogue or sound effects",
        "visual": "The visual description or camera direction"
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const text = response.text;
    if (!text) return null;
    
    return JSON.parse(text);

  } catch (error) {
    console.error("Gemini generation failed:", error);
    return null;
  }
};

export const generateScript = async (
  params: {
    prompt: string;
    format: string;
    referenceContent?: string;
    referenceUrl?: string;
  }
): Promise<Script | null> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("Gemini API Key not found.");
    return null;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const systemPrompt = `
      You are an expert filmmaker and screenwriter AI. 
      Your task is to generate a complete, professional AV script (Audio/Visual) based on the user's request.
      
      The output must be a valid JSON object strictly adhering to the 'Script' interface defined below.
      
      Interface Types:
      type NodeType = 'act' | 'scene' | 'beat';
      interface ScriptNode {
        id: string; // Unique IDs (e.g., 'act-1', 'scene-1', 'beat-1')
        type: NodeType;
        title?: string; // Required for Acts and Scenes (e.g., "Act I", "INT. HOUSE")
        description?: string; // Context for Scenes
        content?: { audio: string; visual: string; }; // Only for beats. Use HTML tags for formatting if needed.
        children?: ScriptNode[];
        duration?: number; // Estimated seconds
      }
      interface Resource {
        id: string; // e.g., 'res-1'
        type: 'character' | 'location' | 'object' | 'media';
        value: string; // Short value or URL
        label: string; // Display name
        color: string; // Hex code (optional, will be auto-assigned if empty)
        description: string; // Wiki-style description
      }
      interface Script {
        id: string;
        metadata: { title: string; author: string; description: string; created: string; modified: string; };
        resources: Resource[];
        content: ScriptNode[]; // Top level must be Acts
        history: any[]; // Empty array
      }

      RULES:
      1. Create detailed, creative content.
      2. Create at least 1 Act, multiple Scenes per Act, multiple Beats per Scene.
      3. Identify key characters/locations and add them to the 'resources' array with simple types: 'character', 'location', 'object'.
      4. **CRITICAL RESOURCE TAGGING**: 
         When you reference a Resource (like a character name or location) inside the 'visual' or 'audio' fields of a beat, you MUST wrap it in a <span> tag with a data-id attribute matching the resource's ID.
         CORRECT: "Visual": "<span data-id='res-1'>John</span> enters the room."
         INCORRECT: "Visual": "John enters the room."
      5. Estimate durations realistically.
      6. The 'metadata.description' should be a Logline.
      7. Return ONLY the JSON string. Do not use markdown formatting like \`\`\`json ... \`\`\` unless absolutely necessary, but ensure valid JSON.
    `;

    const userPrompt = `
      Project Format: ${params.format}
      User Idea/Prompt: ${params.prompt}
      ${params.referenceUrl ? `Reference URL to analyze and adapt: ${params.referenceUrl}` : ''}
      ${params.referenceContent ? `Reference Document Content: \n${params.referenceContent.substring(0, 20000)}... (truncated)` : ''}
      
      Generate the full JSON Script object now. Ensure all resources are properly defined in the resources array and referenced in the content using <span data-id='...'> tags.
    `;

    // Strictly check if URL is provided and valid string
    const isUsingSearch = typeof params.referenceUrl === 'string' && params.referenceUrl.trim().length > 0;
    
    const generationConfig: any = {
        temperature: 0.7,
    };

    if (isUsingSearch) {
        // Search Grounding enabled: Cannot use responseMimeType: 'application/json' with tools
        generationConfig.tools = [{ googleSearch: {} }];
    } else {
        // Standard generation: Use JSON mode
        generationConfig.responseMimeType = 'application/json';
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', 
      contents: [
        { role: 'user', parts: [{ text: systemPrompt + "\n\n" + userPrompt }] }
      ],
      config: generationConfig
    });

    let text = response.text;
    if (!text) return null;
    
    // Robust JSON extraction
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        text = text.substring(firstBrace, lastBrace + 1);
    } else {
        text = text.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    let parsed: Script;
    try {
        parsed = JSON.parse(text) as Script;
    } catch (e) {
        console.error("Failed to parse Gemini response as JSON", text);
        return null;
    }
    
    if (!parsed.content || !Array.isArray(parsed.content)) return null;

    return enrichScript(parsed);

  } catch (error) {
    console.error("Gemini script generation failed:", error);
    return null;
  }
}
