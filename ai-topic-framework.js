// AI Topic Framework - Flexible system for AI to organize topics dynamically
// No hardcoded topics - AI creates and organizes topics based on user interests

class AITopicFramework {
    constructor() {
        this.topicCache = new Map(); // Cache for AI-generated topic structures
        this.learningLevels = ['Basic', 'Intermediate', 'Advanced', 'Expert'];
        this.contentTypes = ['concept', 'technique', 'theory', 'practice', 'application'];
    }

    // AI-driven topic organization - no hardcoded topics
    async organizeTopicsForUser(userInterests, userProfile = {}) {
        const prompt = `You are a learning topic organizer. Based on the user's interests, create a flexible topic structure.

User Interests: ${Array.isArray(userInterests) ? userInterests.join(', ') : userInterests}
User Profile: ${JSON.stringify(userProfile)}

Create a topic structure that:
1. Organizes the user's interests into logical categories
2. Identifies key concepts within each category
3. Suggests learning progression paths
4. Adapts to any subject matter (not just programming)

Return JSON structure:
{
  "categories": [
    {
      "name": "Category Name",
      "description": "What this category covers",
      "topics": [
        {
          "name": "Topic Name",
          "description": "What this topic covers",
          "concepts": ["concept1", "concept2"],
          "difficulty": "Basic|Intermediate|Advanced|Expert",
          "prerequisites": ["required knowledge"],
          "learningPath": "suggested progression"
        }
      ]
    }
  ],
  "learningPaths": [
    {
      "name": "Path Name",
      "description": "Learning progression",
      "steps": ["step1", "step2", "step3"]
    }
  ]
}

Remember: Return ONLY valid JSON, no explanations.`;

        try {
            const response = await this.generateAIResponse(prompt);
            const structure = JSON.parse(response);
            this.topicCache.set(JSON.stringify(userInterests), structure);
            return structure;
        } catch (error) {
            console.error('Failed to organize topics with AI:', error);
            return this.fallbackTopicStructure(userInterests);
        }
    }

    // Get recommended content based on AI analysis, not hardcoded topics
    async getRecommendedContent(userProfile, userInterests, currentTopic = null) {
        const userKnowledge = userProfile.knowledgeProfile || {};
        
        // Get or create topic structure for this user
        const cacheKey = JSON.stringify(userInterests);
        let topicStructure = this.topicCache.get(cacheKey);
        
        if (!topicStructure) {
            topicStructure = await this.organizeTopicsForUser(userInterests, userProfile);
        }

        // AI determines what to teach next based on user's knowledge
        const prompt = `Based on the user's knowledge profile and interests, recommend the next learning content.

User Knowledge Profile: ${JSON.stringify(userKnowledge)}
User Interests: ${Array.isArray(userInterests) ? userInterests.join(', ') : userInterests}
Current Topic: ${currentTopic || 'Any'}
Available Topics: ${JSON.stringify(topicStructure)}

Analyze the user's knowledge gaps and recommend:
1. What topic/concept to learn next
2. What difficulty level is appropriate
3. Why this recommendation makes sense

Return JSON:
{
  "recommendedTopic": "topic name",
  "recommendedConcept": "concept name", 
  "difficultyLevel": "Basic|Intermediate|Advanced|Expert",
  "reasoning": "why this is the right next step",
  "learningPath": "how this fits into their learning journey"
}`;

        try {
            const response = await this.generateAIResponse(prompt);
            return JSON.parse(response);
        } catch (error) {
            console.error('Failed to get AI recommendation:', error);
            return this.fallbackRecommendation(userInterests, userKnowledge);
        }
    }

    // AI determines if user should learn a concept in a new context/language
    async shouldLearnInNewContext(userProfile, concept, newContext) {
        const prompt = `Should the user learn "${concept}" in the context of "${newContext}"?

User Profile: ${JSON.stringify(userProfile)}
Concept: ${concept}
New Context: ${newContext}

Consider:
1. User's current knowledge level
2. Whether they've mastered the concept in other contexts
3. If learning in this new context would be beneficial
4. If it's too advanced or too basic

Return JSON:
{
  "shouldLearn": true/false,
  "reasoning": "why or why not",
  "difficultyAdjustment": "easier|same|harder",
  "prerequisites": ["what they need to know first"]
}`;

        try {
            const response = await this.generateAIResponse(prompt);
            return JSON.parse(response);
        } catch (error) {
            console.error('Failed to get context decision:', error);
            return {
                shouldLearn: true,
                reasoning: "Fallback decision",
                difficultyAdjustment: "same",
                prerequisites: []
            };
        }
    }

    // Generate AI response (placeholder - should use your AI client)
    async generateAIResponse(prompt) {
        // This should use your existing AI client
        const AIClient = require('./ai-client');
        const aiClient = new AIClient();
        return await aiClient.generateResponse(prompt, 'system');
    }

    // Fallback methods for when AI fails
    fallbackTopicStructure(userInterests) {
        const interests = Array.isArray(userInterests) ? userInterests : [userInterests];
        return {
            categories: [{
                name: "General Learning",
                description: "User's learning interests",
                topics: interests.map(interest => ({
                    name: interest,
                    description: `Learning about ${interest}`,
                    concepts: ["basics", "intermediate", "advanced"],
                    difficulty: "Basic",
                    prerequisites: [],
                    learningPath: "Start with basics and progress"
                }))
            }],
            learningPaths: [{
                name: "General Path",
                description: "Basic learning progression",
                steps: ["Learn fundamentals", "Practice", "Apply knowledge"]
            }]
        };
    }

    fallbackRecommendation(userInterests, userKnowledge) {
        const interests = Array.isArray(userInterests) ? userInterests : [userInterests];
        return {
            recommendedTopic: interests[0] || "General Learning",
            recommendedConcept: "basics",
            difficultyLevel: "Basic",
            reasoning: "Starting with basics",
            learningPath: "Begin with fundamentals"
        };
    }

    // Clear cache when user data changes
    clearCache() {
        this.topicCache.clear();
    }
}

module.exports = { AITopicFramework };
