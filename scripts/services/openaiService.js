#!/usr/bin/env node

const OpenAI = require("openai");
const fs = require("fs");
const path = require("path");

/**
 * OpenAI Service for generating generative art concepts
 */
class OpenAIService {
  constructor(apiKey) {
    if (!apiKey) {
      throw new Error("OpenAI API key is required");
    }
    this.client = new OpenAI({ apiKey });
    this.logDir = path.join(__dirname, "..", "..", "logs");
    this.ensureLogDir();
  }

  ensureLogDir() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  logResponse(concept, fullResponse) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      concept,
      fullResponse: {
        model: fullResponse.model,
        usage: fullResponse.usage,
        finishReason: fullResponse.choices[0].finish_reason,
        promptTokens: fullResponse.usage.prompt_tokens,
        completionTokens: fullResponse.usage.completion_tokens,
        totalTokens: fullResponse.usage.total_tokens,
      },
    };

    const logFile = path.join(this.logDir, `llm-${timestamp.split("T")[0]}.jsonl`);
    fs.appendFileSync(logFile, JSON.stringify(logEntry) + "\n", "utf8");
    
    console.log(`📝 Logged LLM response to: ${logFile}`);
  }

  /**
   * Generate a generative art concept using OpenAI
   * @returns {Promise<Object>} Art concept with shapes, colors, movement, density, mood, title, description
   */
  async generateArtConcept({ avoid = [], seed = null } = {}) {
    const systemPrompt = `You are a generative art expert specializing in P5.js creative coding. Generate unique, visually interesting concepts for abstract generative artworks.`;

    const avoidText =
      Array.isArray(avoid) && avoid.length
        ? `Avoid repeating concepts similar to any of these signatures (template|colors|movement|density|mood|title):\n- ${avoid.join(
            "\n- "
          )}`
        : "";

    const seedText = seed != null ? `Creative seed: ${seed}` : "";

    const userPrompt = `Generate a unique generative art concept for a P5.js sketch. ${avoidText}\n${seedText}\n\nReturn ONLY valid JSON with this exact structure:
{
  "template": "gridPattern",
  "shapes": ["circle", "rect", "line", "triangle", "ellipse"],
  "colors": ["#hexcolor1", "#hexcolor2", "#hexcolor3", "#hexcolor4"],
  "movement": "description of animation pattern (e.g., 'slow orbital drift', 'pulsing expansion', 'flowing waves')",
  "density": 20-100,
  "mood": "1-2 word mood description",
  "title": "poetic title for the artwork (3-6 words)",
  "description": "brief artistic description (15-25 words)",
  "hashtags": ["2-3 concept-specific hashtags (e.g., #Abstract, #Minimalist, #Organic, #Geometric, #Flowing)"]
}

Guidelines:
- Choose template that fits the concept
- Use 3-5 harmonious colors
- Movement should be evocative and specific
- Density should match the template type
- Title should be evocative but not overly abstract
- Make each concept unique and visually distinct
- Hashtags should be single words describing visual style or mood (no spaces, camelCase if needed)`;

    try {
      const response = await this.client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.95,
        presence_penalty: 0.8,
        response_format: { type: "json_object" },
      });

      const content = response.choices[0].message.content;
      const concept = JSON.parse(content);

      // Validate the concept
      this.validateConcept(concept);

      // Log the full response for debugging
      this.logResponse(concept, response);

      console.log("Generated art concept:", concept.title);
      return concept;
    } catch (error) {
      console.error("Error generating art concept:", error.message);
      throw error;
    }
  }

  /**
   * Validate that the concept has all required fields
   * @param {Object} concept - The generated concept
   */
  validateConcept(concept) {
    const required = [
      "template",
      "shapes",
      "colors",
      "movement",
      "density",
      "mood",
      "title",
      "description",
      "hashtags",
    ];

    for (const field of required) {
      if (!concept[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    if (!Array.isArray(concept.shapes) || concept.shapes.length === 0) {
      throw new Error("Shapes must be a non-empty array");
    }

    if (!Array.isArray(concept.colors) || concept.colors.length < 3) {
      throw new Error("Colors must be an array with at least 3 colors");
    }

    if (typeof concept.density !== "number" || concept.density < 1) {
      throw new Error("Density must be a positive number");
    }

    if (!Array.isArray(concept.hashtags) || concept.hashtags.length === 0) {
      throw new Error("Hashtags must be a non-empty array");
    }

    const validTemplates = [
      "gridPattern", // Only allow gridPattern for now
      // "particleSystem",
      // "orbitalMotion",
      // "flowField",
      // "noiseWaves",
      // "geometricGrid",
      // "ballots",
    ];
    if (!validTemplates.includes(concept.template)) {
      throw new Error(`Invalid template: ${concept.template}`);
    }
  }
}

module.exports = OpenAIService;
