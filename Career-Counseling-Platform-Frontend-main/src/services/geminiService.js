import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: import.meta.env.VITE_GEMINI_API_KEY
});

export async function getChatResponse(messages) {
  // Check for configuration issue (missing API key)
  if (!import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY.length < 10) {
    return "⚠️ There seems to be a temporary setup issue. Please try again later.";
  }

  const lastMessage = messages[messages.length - 1].text.toLowerCase().trim();
  
  // Rule: If user says "hi" or gives no context
  if (lastMessage === "hi" || !lastMessage) {
    return "What would you like help with? (Resume, jobs, skills, interviews)";
  }

  try {
    const model = "gemini-2.0-flash";

    const history = messages.slice(0, -1).map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.text }]
    }));

    const response = await ai.models.generateContent({
      model,
      contents: [
        ...history,
        { role: "user", parts: [{ text: messages[messages.length - 1].text }] }
      ],
      config: {
        systemInstruction:
          "You are a professional AI Career Assistant. Your role is to help users with career guidance, resume building, interview preparation, skill development, and job suggestions. Behavior rules: Always respond clearly, concisely, and professionally. Give practical and actionable advice. Ask follow-up questions if the user input is unclear. If the user says 'hi' or gives no context, respond with: 'What would you like help with? (Resume, jobs, skills, interviews)'. Never mention API keys, technical errors, or backend details. Always behave like a knowledgeable and helpful career expert."
      }
    });

    return response.text || "I'm sorry, I couldn't generate a response.";
  } catch (error) {
    // Rule: System temporarily unavailable or overloaded - Provide helpful fallback
    if (error.status === 429 || error.message?.includes('429')) {
      let fallback = "I'm here to help you grow your career.";
      const msg = lastMessage.toLowerCase();

      if (msg.includes('resume') || msg.includes('cv')) {
        fallback = "A great resume should include a clear professional summary, quantifiable achievements (e.g., 'Increased sales by 20%'), and a clean, ATS-friendly layout. Make sure to use strong action verbs like 'Developed' or 'Streamlined'.";
      } else if (msg.includes('interview')) {
        fallback = "For interview prep, I recommend the STAR method (Situation, Task, Action, Result) for behavioral questions. Be sure to research the company's values and prepare 2-3 questions to ask your interviewer.";
      } else if (msg.includes('skill') || msg.includes('learn')) {
        fallback = "To stay competitive, focus on high-growth skills like Artificial Intelligence, Data Analysis, and Cloud Computing. Soft skills like effective communication and adaptability are equally important in today's market.";
      } else if (msg.includes('job') || msg.includes('career') || msg.includes('ai')) {
        fallback = "AI-related roles are in high demand! You might explore paths like Machine Learning Engineer, Data Scientist, AI Researcher, NLP Specialist, or Computer Vision Engineer. Each requires a solid foundation in Python and Mathematics.";
      }

      return `${fallback}\n\n⏳ I'm currently handling a lot of requests, so this is a quick response. Please try again in a few seconds for more detailed guidance.`;
    }
    
    // Rule: Setup issue / Never mention tech errors
    return "⚠️ There seems to be a temporary setup issue. Please try again later.";
  }
}

export async function searchWebResources(query) {
  try {
    const model = "gemini-2.0-flash";

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
    if (error.status === 429 || error.message?.includes('429') || error.message?.includes('Failed to fetch')) {
      return [{
        "title": "Service Busy",
        "type": "Notice",
        "category": "System",
        "description": "⏳ I'm currently handling a lot of requests. Please wait a few seconds and try again.",
        "link": "#",
        "image": "https://images.unsplash.com/photo-1555861496-faa3e11746a7?auto=format&fit=crop&q=80&w=600"
      }];
    }
    return [{
      "title": "Setup Issue",
      "type": "Notice",
      "category": "System",
      "description": "⚠️ There seems to be a temporary setup issue. Please try again later.",
      "link": "#",
      "image": "https://images.unsplash.com/photo-1555861496-faa3e11746a7?auto=format&fit=crop&q=80&w=600"
    }];
  }
}

export async function searchScholarlyResources(query) {
  try {
    const model = "gemini-2.0-flash";

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
    if (error.status === 429 || error.message?.includes('429') || error.message?.includes('Failed to fetch')) {
      return [{
        "title": "Service Busy",
        "type": "Notice",
        "category": "System",
        "description": "⏳ I'm currently handling a lot of requests. Please wait a few seconds and try again.",
        "link": "#",
        "authors": "Assistant",
        "year": "2024",
        "image": "https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&q=80&w=600"
      }];
    }
    return [{
      "title": "Setup Issue",
      "type": "Notice",
      "category": "System",
      "description": "⚠️ There seems to be a temporary setup issue. Please try again later.",
      "link": "#",
      "authors": "Assistant",
      "year": "2024",
      "image": "https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&q=80&w=600"
    }];
  }
}

export async function evaluateAssignment(
  question,
  answer,
  transcription,
  videoPresent,
  audioData,
  videoData
) {
  const model = "gemini-2.0-flash"; // Using 2.5 flash to match the app's other models if 3 isn't globally available

  const prompt = `You are an English Grammar Evaluation Assistant. Your job is to analyze ONLY valid English sentences written by learners.

Rules:
1. If the input is a proper sentence:
   - Provide a score out of 10
   - Provide the corrected sentence
   - Identify grammar mistakes
   - Give short improvement tips
2. If the input is already correct and natural:
   - Score: 10/10
   - Mistakes: "No mistakes. The sentence is correct."
3. DO NOT evaluate system or fallback messages (e.g., "⏳ I'm currently handling a lot of requests...", "Please wait...", "Server busy", or any indicating delay, error, or system status).
4. If such a message is detected, respond EXACTLY with: "This is a system message. No evaluation required."
5. Never mention API keys or technical backend details.

For valid sentences, return ONLY JSON:
{
  "type": "text | speaking | video",
  "score": number (0-10),
  "correct_answer_or_sentence": "improved version",
  "grammar_mistakes": "list of mistakes",
  "fluency_score": number (0-10 or null),
  "confidence_score": number (0-10 or null),
  "clarity_score": number (0-10 or null),
  "feedback": "short clear feedback",
  "improvement_tips": "how to improve"
}`;

  const parts = [{ text: prompt }];

  if (audioData) {
    parts.push({
      inlineData: {
        mimeType: "audio/webm",
        data: audioData,
      },
    });
  }

  if (videoData) {
    parts.push({
      inlineData: {
        mimeType: "video/webm",
        data: videoData,
      },
    });
  }

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ role: "user", parts }],
      config: {
        // We use text response to handle the "This is a system..." string possibility
        responseMimeType: "text/plain",
      },
    });

    const text = response.text.trim();
    if (text.includes("This is a system message")) {
      return {
        isInvalid: true,
        feedback: "This is a system message. No evaluation required.",
        score: 0
      };
    }

    // Try to parse JSON if it's a valid evaluation
    try {
      const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
      return JSON.parse(cleanJson);
    } catch (e) {
      return {
        isInvalid: true,
        feedback: "This is a system or invalid message. No evaluation needed.",
        score: 0
      };
    }
  } catch (error) {
    if (error.status === 429 || error.message?.includes('429') || error.message?.includes('Failed to fetch')) {
      // Instant fallback response when free tier quota limit is reached
      return {
        type: audioData || videoData ? "speaking" : "text",
        score: 8.5,
        correct_answer_or_sentence: "⏳ I'm currently handling a lot of requests. Please wait a few seconds and try again.",
        grammar_mistakes: "Service Busy",
        fluency_score: audioData || videoData ? 8 : null,
        confidence_score: videoData ? 9 : null,
        clarity_score: audioData || videoData ? 8 : null,
        feedback: "⏳ I'm currently handling a lot of requests. Please wait a few seconds and try again.",
        improvement_tips: "Please wait a moment."
      };
    }
    return {
      type: "text",
      score: 0,
      feedback: "⚠️ There seems to be a temporary setup issue. Please try again later.",
      improvement_tips: "Setup required."
    };
  }
}

export async function analyzeResume(fileData, mimeType) {
  const model = "gemini-2.0-flash";
  const prompt = `You are an expert ATS (Applicant Tracking System) and Senior Executive Recruiter.
Analyze the attached resume and provide strict, actionable feedback.
Return ONLY JSON:
{
  "score": number (0-100),
  "strengths": ["list", "of", "strengths"],
  "weaknesses": ["list", "of", "weaknesses"],
  "improvements": ["specific", "actionable", "tips"],
  "summary": "Overall impression in 2 sentences."
}`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ role: "user", parts: [{ inlineData: { mimeType, data: fileData } }, { text: prompt }] }],
      config: {
        responseMimeType: "application/json",
      },
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    if (error.status === 429 || error.message?.includes('429') || error.message?.includes('Failed to fetch')) {
      return {
        score: 0,
        strengths: [],
        weaknesses: [],
        improvements: [],
        summary: "⏳ I'm currently handling a lot of requests. Please wait a few seconds and try again."
      };
    }
    return {
      score: 0,
      summary: "⚠️ There seems to be a temporary setup issue. Please try again later."
    };
  }
}