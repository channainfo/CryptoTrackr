import OpenAI from "openai";
import { LearningModule, UserLearningProgress } from "@shared/schema";

// Create OpenAI client with API key from environment variables
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Service for handling OpenAI API interactions
 */
export class OpenAIService {
  /**
   * Get personalized learning module recommendations based on user's learning history and portfolio
   * @param userId The user ID
   * @param completedModules Modules the user has completed
   * @param inProgressModules Modules the user is currently working on
   * @param userStats User learning statistics
   * @param availableModules All available learning modules
   * @param portfolioData User's portfolio data (tokens, investment style, etc.)
   * @returns Recommended module ID and explanation
   */
  static async getPersonalizedRecommendation(
    userId: string,
    completedModules: LearningModule[],
    inProgressModules: LearningModule[],
    userStats: {
      completedModules: number;
      inProgressModules: number;
      completedPercentage: number;
    },
    availableModules: LearningModule[],
    portfolioData?: {
      tokens?: string[];
      investmentStyle?: string;
      riskLevel?: number;
    }
  ): Promise<{ moduleId: string; explanation: string }> {
    try {
      // Filter out modules the user has already completed
      const completedIds = completedModules.map(m => m.id);
      const inProgressIds = inProgressModules.map(m => m.id);
      
      const uncompletedModules = availableModules.filter(
        m => !completedIds.includes(m.id)
      );
      
      // If all modules are completed, recommend one to revisit
      if (uncompletedModules.length === 0) {
        return this.recommendModuleToRevisit(completedModules, portfolioData);
      }
      
      // If user has in-progress modules, prioritize those first
      if (inProgressModules.length > 0) {
        // Skip AI call for in-progress modules to save API costs
        const inProgressModule = inProgressModules[0];
        return {
          moduleId: inProgressModule.id,
          explanation: `Continue working on "${inProgressModule.title}" that you've already started. Completing what you've begun will help reinforce your understanding.`
        };
      }
      
      // For new modules, use the OpenAI API to get a personalized recommendation
      return await this.getAIRecommendation(
        userId,
        completedModules,
        uncompletedModules,
        userStats,
        portfolioData
      );
    } catch (error) {
      console.error("Error getting personalized recommendation:", error);
      
      // Fallback to a simple algorithm if AI fails
      // Just get the first module sorted by difficulty
      const fallbackModule = availableModules
        .sort((a, b) => a.difficulty - b.difficulty)[0] || availableModules[0];
      
      return {
        moduleId: fallbackModule.id,
        explanation: "This module is a good next step in your learning journey."
      };
    }
  }
  
  /**
   * Use AI to recommend a module to revisit from completed modules
   */
  private static async recommendModuleToRevisit(
    completedModules: LearningModule[],
    portfolioData?: {
      tokens?: string[];
      investmentStyle?: string;
      riskLevel?: number;
    }
  ): Promise<{ moduleId: string; explanation: string }> {
    try {
      const moduleToRevisit = completedModules[Math.floor(Math.random() * completedModules.length)];
      
      // Format portfolio data for the prompt
      const portfolioContext = portfolioData?.tokens?.length
        ? `Their portfolio includes these tokens: ${portfolioData.tokens.join(", ")}.`
        : "";
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are an educational AI assistant specialized in cryptocurrency learning."
          },
          {
            role: "user",
            content: `The user has completed all available learning modules. I need to recommend one module for them to revisit. ${portfolioContext}
            
            Here are the completed modules:
            ${completedModules.map(m => `- ${m.title} (ID: ${m.id}): ${m.description}. Difficulty: ${m.difficulty}. Category: ${m.category}`).join("\n")}
            
            Please select one module ID to recommend revisiting and provide a brief explanation (max 150 characters) why they should revisit this specific module. Format your response as JSON with 'moduleId' and 'explanation' fields.`
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 300,
      });
      
      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error("Empty response from OpenAI");
      }
      
      const parsed = JSON.parse(content);
      return {
        moduleId: parsed.moduleId,
        explanation: parsed.explanation
      };
    } catch (error) {
      console.error("Error recommending module to revisit:", error);
      
      // Simple fallback if AI recommendation fails
      const moduleToRevisit = completedModules[Math.floor(Math.random() * completedModules.length)];
      return {
        moduleId: moduleToRevisit.id,
        explanation: `It's a good time to refresh your knowledge on "${moduleToRevisit.title}".`
      };
    }
  }
  
  /**
   * Use AI to get a personalized module recommendation
   */
  private static async getAIRecommendation(
    userId: string,
    completedModules: LearningModule[],
    availableModules: LearningModule[],
    userStats: {
      completedModules: number;
      inProgressModules: number;
      completedPercentage: number;
    },
    portfolioData?: {
      tokens?: string[];
      investmentStyle?: string;
      riskLevel?: number;
    }
  ): Promise<{ moduleId: string; explanation: string }> {
    // Format the data for the AI prompt
    const completedModulesText = completedModules.length > 0
      ? completedModules.map(m => `- ${m.title} (Difficulty: ${m.difficulty}, Category: ${m.category})`).join("\n")
      : "None";
    
    const availableModulesText = availableModules.map(m => 
      `- Module ID: ${m.id}, Title: ${m.title}, Difficulty: ${m.difficulty}, Category: ${m.category}, Description: ${m.description}`
    ).join("\n");
    
    // Format portfolio data for the prompt
    const portfolioContext = portfolioData?.tokens?.length
      ? `Their portfolio includes these tokens: ${portfolioData.tokens.join(", ")}.`
      : "They haven't added any tokens to their portfolio yet.";
    
    const userStatsText = `User Stats:
    - Completed modules: ${userStats.completedModules}
    - In-progress modules: ${userStats.inProgressModules}
    - Completion percentage: ${userStats.completedPercentage}%`;
    
    const progressLevel = completedModules.length === 0 
      ? "beginner (no modules completed)" 
      : completedModules.length < 3
      ? "early learner (completed a few modules)"
      : "intermediate (completed several modules)";
    
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are an educational AI assistant specialized in cryptocurrency learning. Select the most appropriate module for a user based on their learning history and portfolio."
          },
          {
            role: "user",
            content: `I need a personalized learning module recommendation for a user.

User Profile:
- User ID: ${userId}
- Progress level: ${progressLevel}
- ${portfolioContext}
- ${userStatsText}

Completed Modules:
${completedModulesText}

Available Modules:
${availableModulesText}

Based on the user's progress and portfolio, recommend ONE module from the available modules list. Provide the module ID and a brief, friendly explanation (max 150 characters) of why you're recommending it. Format your response as JSON with 'moduleId' and 'explanation' fields.`
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 300,
      });
      
      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error("Empty response from OpenAI");
      }
      
      const recommendation = JSON.parse(content);
      
      // Verify that the recommended module exists in available modules
      const moduleExists = availableModules.some(m => m.id === recommendation.moduleId);
      if (!moduleExists) {
        throw new Error(`Recommended module ${recommendation.moduleId} does not exist in available modules`);
      }
      
      return {
        moduleId: recommendation.moduleId,
        explanation: recommendation.explanation
      };
    } catch (error) {
      console.error("Error getting AI recommendation:", error);
      
      // Fallback to a simple algorithm if AI fails
      const fallbackModule = availableModules.sort((a, b) => a.difficulty - b.difficulty)[0];
      
      return {
        moduleId: fallbackModule.id,
        explanation: "This module is a good next step based on your learning progress."
      };
    }
  }
}