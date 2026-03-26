import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: import.meta.env.VITE_GEMINI_API_KEY
});

export async function getChatResponse(messages) {
  try {
    const model = "gemini-2.5-flash";

    const history = messages.slice(0, -1).map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.text }]
    }));

    const lastMessage = messages[messages.length - 1].text;

    const response = await ai.models.generateContent({
      model,
      contents: [
        ...history,
        { role: "user", parts: [{ text: lastMessage }] }
      ],
      config: {
        systemInstruction:
          "You are a professional career advisor. Provide helpful, actionable advice on career paths, resumes, interviews, and professional development. Keep responses concise and formatted in Markdown."
      }
    });

    return response.text || "I'm sorry, I couldn't generate a response.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
}

export async function searchWebResources(query) {
  try {
    const model = "gemini-2.5-flash";

    const response = await ai.models.generateContent({
      model,
      contents: `Find the latest and most relevant career resources, courses, or templates for: ${query}.

Return ONLY a JSON array like this:

[
{
"title": "Resource Title",
"type": "Course | Guide | Template",
"category": "Category Name",
"description": "Brief description",
"link": "URL",
"image": "Relevant Unsplash image URL"
}
]`,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const cleanText = response.text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    return JSON.parse(cleanText);
  } catch (error) {
    console.error("Gemini Search Error:", error);
    throw error;
  }
}

export async function searchScholarlyResources(query) {
  try {
    const model = "gemini-2.5-flash";

    const response = await ai.models.generateContent({
      model,
      contents: `Find academic papers, scholarly articles, white papers, or official professional documentation for: ${query}.
Focus on sources like Google Scholar, ResearchGate, arXiv, or official organizations.

Return ONLY JSON array like:

[
{
"title": "Document Title",
"type": "Paper | Article | White Paper | Documentation",
"category": "Field",
"description": "Brief summary",
"link": "URL",
"authors": "Author names",
"year": "Year",
"image": "Relevant Unsplash image"
}
]`,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const cleanText = response.text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    return JSON.parse(cleanText);
  } catch (error) {
    console.error("Gemini Scholarly Search Error:", error);
    throw error;
  }
}
