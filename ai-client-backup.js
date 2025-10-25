// AI Client for LM Studio Integration
const axios = require('axios');
const { TopicDecisionEngine } = require('./topic-hierarchy');

class AIClient {
    constructor() {
        this.baseURL = 'http://127.0.0.1:1234/v1/chat/completions';
        this.conversationMemory = new Map(); // Simple memory for MVP
        this.topicEngine = new TopicDecisionEngine(); // Hierarchical topic system
        this.maxMemorySize = 20; // Maximum conversation exchanges per user
    }

    // Memory cache control methods
    clearUserMemory(userId) {
        this.conversationMemory.delete(userId);
        console.log(`Cleared memory for user ${userId}`);
    }

    clearAllMemory() {
        this.conversationMemory.clear();
        console.log('Cleared all user memory');
    }

    getUserMemorySize(userId) {
        const memory = this.conversationMemory.get(userId) || [];
        return memory.length;
    }

    getMemoryStats() {
        const stats = {
            totalUsers: this.conversationMemory.size,
            totalExchanges: 0,
            userStats: []
        };

        for (const [userId, memory] of this.conversationMemory) {
            const userStats = {
                userId: userId,
                exchanges: memory.length,
                lastExchange: memory[memory.length - 1]?.timestamp || 'unknown'
            };
            stats.userStats.push(userStats);
            stats.totalExchanges += memory.length;
        }

        return stats;
    }

    trimUserMemory(userId, maxSize = null) {
        const memory = this.conversationMemory.get(userId) || [];
        const limit = maxSize || this.maxMemorySize;
        
        if (memory.length > limit) {
            const trimmed = memory.slice(-limit);
            this.conversationMemory.set(userId, trimmed);
            console.log(`Trimmed memory for user ${userId} from ${memory.length} to ${trimmed.length} exchanges`);
        }
    }

    async generateResponse(prompt, userId, context = {}) {
        try {
            // Get conversation history for this user
            const conversationHistory = this.conversationMemory.get(userId) || [];
            
            // Build messages array
            const messages = [
                {
                    role: "system",
                    content: `You are a personalized micro-learning AI assistant. You help users learn through bite-sized, interactive content. 
                    
                    User Context:
                    - Interests: ${context.interests ? context.interests.join(', ') : 'Not specified'}
                    - Learning Level: ${context.difficulty || 'Beginner'}
                    - Current Topic: ${context.topic || 'General'}
                    
                    Guidelines:
                    - Keep responses concise and educational
                    - Ask engaging questions
                    - Provide actionable insights
                    - Adapt to user's knowledge level`
                },
                ...conversationHistory,
                {
                    role: "user",
                    content: prompt
                }
            ];

            const response = await axios.post(this.baseURL, {
                model: "local-model", // LM Studio uses local model
                messages: messages,
                temperature: 0.7,
                // No token limit - let AI generate full responses
                stream: false
            });

            const aiResponse = response.data.choices[0].message.content;
            
            // Smart response cleaning - only remove <think> tags when appropriate
            let cleanedResponse = aiResponse;
            
            // Check if this is a structured response (JSON) or conversational
            const isStructuredResponse = prompt.includes('Format as JSON') || 
                                       prompt.includes('as JSON') || 
                                       prompt.includes('JSON with:');
            
            const isAIQuestion = prompt.toLowerCase().includes('ai') || 
                                prompt.toLowerCase().includes('think') ||
                                prompt.toLowerCase().includes('reasoning');
            
            // Only clean <think> tags for structured responses, not conversational ones
            if (isStructuredResponse && !isAIQuestion) {
                // Remove <think> tags and content for structured responses
                cleanedResponse = cleanedResponse.replace(/<think>[\s\S]*?<\/think>/g, '');
                
                // Try to extract JSON from the response if it's wrapped in code blocks
                const jsonMatch = cleanedResponse.match(/```json\s*([\s\S]*?)\s*```/);
                if (jsonMatch) {
                    cleanedResponse = jsonMatch[1];
                }
            }
            // For conversational responses, preserve <think> tags if user is asking about AI
            
            // Store in conversation memory
            conversationHistory.push(
                { role: "user", content: prompt },
                { role: "assistant", content: cleanedResponse }
            );
            
            // Keep only last 10 exchanges to prevent memory bloat
            if (conversationHistory.length > 20) {
                conversationHistory.splice(0, conversationHistory.length - 20);
            }
            
            this.conversationMemory.set(userId, conversationHistory);
            
            return cleanedResponse;
            
        } catch (error) {
            console.error('AI Service Error:', error.message);
            return "I'm having trouble connecting to the AI service. Please try again later.";
        }
    }

    async generateLearningContent(userId, topic, concept, difficultyPercentage = 50) {
        const prompt = `Generate a micro-learning content for:
        Topic: ${topic}
        Concept: ${concept}
        Difficulty: ${difficultyPercentage}% (0% = beginner, 100% = expert)
        
        Format as JSON with:
        - content: The learning content (1-2 sentences)
        - type: "info", "quiz", or "tip"
        - difficulty: ${difficultyPercentage} (percentage 0-100)
        - if quiz: include options array, correctAnswer index, AND correctAnswer text
        - correctAnswer: The actual correct answer text (for immediate feedback)`;
        
        const response = await this.generateResponse(prompt, userId, { topic, difficulty: difficultyPercentage });
        
        try {
            // Try to parse as JSON, fallback to plain text
            return JSON.parse(response);
        } catch {
            return {
                content: response,
                type: "info",
                difficulty: difficultyPercentage
            };
        }
    }

    async analyzeUserResponse(userResponse, topic, concept, correctAnswer = null) {
        const prompt = `Analyze this user's learning response:
        
        Topic: ${topic}
        Concept: ${concept}
        User Response: "${userResponse}"
        ${correctAnswer ? `Correct Answer: "${correctAnswer}"` : ''}
        
        Provide analysis as JSON:
        - isCorrect: boolean
        - difficultyLevel: percentage (0-100) based on response sophistication
        - confidence: 0.0-1.0
        - feedback: encouraging message
        - suggestions: array of next learning topics
        - adjustedDifficulty: suggested difficulty percentage for next content`;
        
        const response = await this.generateResponse(prompt, 'system');
        
        try {
            return JSON.parse(response);
        } catch {
            return {
                isCorrect: true,
                difficultyLevel: 50,
                confidence: 0.7,
                feedback: "Good response! Keep learning!",
                suggestions: [],
                adjustedDifficulty: 60
            };
        }
    }

    async generateEscalatedContent(userId, topic, concept, currentDifficultyPercentage) {
        const escalatedDifficulty = Math.min(currentDifficultyPercentage + 25, 100); // Increase by 25% up to 100%
        
        // Use hierarchical system to determine escalated content
        const topicPath = this.topicEngine.getTopicPath(topic, concept);
        const escalatedContent = this.topicEngine.getContentForLevel(topicPath, 'Advanced');
        
        const prompt = `The user found the previous content too easy and has mastered the basic concept. Generate more challenging content for:
        
        Topic: ${topic}
        Concept: ${concept} (user has mastered the basics)
        Current Difficulty: ${currentDifficultyPercentage}%
        New Difficulty: ${escalatedDifficulty}%
        
        Hierarchical Content: ${JSON.stringify(escalatedContent)}
        
        IMPORTANT: The user has already mastered the basic concept, so create content that:
        - Goes beyond the fundamentals
        - Introduces advanced techniques or edge cases
        - Uses more sophisticated language and concepts
        - Requires deeper understanding and application
        - Challenges the user at a higher level
        - Respects the difficulty percentage: ${escalatedDifficulty}% means ${this.getDifficultyDescription(escalatedDifficulty)}
        
        Format as JSON with:
        - content: Advanced learning content
        - type: "info", "quiz", or "tip"
        - topic: ${topic}
        - concept: Advanced concept name
        - difficulty: ${escalatedDifficulty} (percentage 0-100)
        - if quiz: include options array, correctAnswer index, AND correctAnswer text
        - correctAnswer: The actual correct answer text (for immediate feedback)
        - reasoning: Why this advanced content was chosen`;
        
        const response = await this.generateResponse(prompt, userId, { 
            topic, 
            difficulty: escalatedDifficulty,
            context: 'escalated' // Indicate this is escalated content
        });
        
        try {
            return JSON.parse(response);
        } catch {
            return {
                content: response,
                type: "info",
                topic: topic,
                concept: `Advanced ${concept}`,
                difficulty: escalatedDifficulty,
                reasoning: "Escalated content for advanced learners"
            };
        }
    }

    async generatePersonalizedRecommendations(userId, userInterests, knowledgeProfile) {
        const prompt = `Based on the user's interests and knowledge profile, generate personalized learning recommendations:
        
        Interests: ${userInterests.join(', ')}
        Knowledge Profile: ${JSON.stringify(knowledgeProfile)}
        
        Generate 3-5 personalized learning suggestions as JSON array:
        - topic: Learning topic
        - concept: Specific concept to learn
        - difficulty: 1-5 scale
        - reason: Why this is recommended for this user`;
        
        const response = await this.generateResponse(prompt, userId, { interests: userInterests });
        
        try {
            return JSON.parse(response);
        } catch {
            return [];
        }
    }

    async generatePersonalizedLesson(userId, userData) {
        const { interests, knowledgeProfile, preferences } = userData;
        
        // Use hierarchical system to determine what to teach
        const recommendedContent = this.topicEngine.getRecommendedContent(userData, interests[0], 'Variables');
        
        // Check if user should learn concept in new language
        const languageDecision = this.topicEngine.shouldLearnInNewLanguage(userData, 'Variables', 'JavaScript');
        
        const prompt = `Generate a personalized micro-learning lesson based on the user's profile:
        
        User Interests: ${interests.join(', ')}
        Knowledge Profile: ${JSON.stringify(knowledgeProfile)}
        Preferences: ${JSON.stringify(preferences)}
        
        Recommended Content: ${JSON.stringify(recommendedContent)}
        Language Decision: ${JSON.stringify(languageDecision)}
        
        IMPORTANT: Use the hierarchical topic system to determine content:
        - If user knows concept in other languages: Focus on SYNTAX differences
        - If user is new to concept: Focus on CONCEPTUAL understanding
        - Respect difficulty percentages: ${preferences.difficulty}% means ${this.getDifficultyDescription(preferences.difficulty)}
        
        Generate a lesson that:
        - Builds on their existing knowledge appropriately
        - Uses the correct approach (syntactic vs conceptual)
        - Matches their difficulty level exactly
        - Is engaging and bite-sized
        
        Format as JSON with:
        - content: The lesson content (1-2 sentences)
        - type: "info", "quiz", or "tip"
        - topic: The subject area
        - concept: The specific concept being taught
        - difficulty: ${preferences.difficulty} (percentage 0-100)
        - if quiz: include options array, correctAnswer index, AND correctAnswer text
        - correctAnswer: The actual correct answer text (for immediate feedback)
        - reasoning: Why this lesson was chosen for this user`;
        
        const response = await this.generateResponse(prompt, userId, { 
            interests, 
            difficulty: preferences.difficulty 
        });
        
        try {
            return JSON.parse(response);
        } catch {
            return {
                content: response,
                type: "info",
                topic: interests[0] || "General",
                concept: "Learning",
                difficulty: preferences.difficulty || 50,
                reasoning: "AI-generated lesson"
            };
        }
    }

    getDifficultyDescription(percentage) {
        if (percentage <= 25) return 'beginner level';
        if (percentage <= 50) return 'intermediate level';
        if (percentage <= 75) return 'advanced level';
        return 'expert level';
    }

    // Determine if user should learn concept or syntax based on their knowledge
    determineLearningApproach(userProfile, topic, concept) {
        const userKnowledge = userProfile.knowledgeProfile || {};
        
        // Check if user knows this concept in other languages
        for (const knownTopic in userKnowledge) {
            if (userKnowledge[knownTopic][concept] && userKnowledge[knownTopic][concept].proficiency >= 1) {
                return {
                    approach: 'syntactic',
                    reasoning: `You know ${concept} in ${knownTopic}, so we'll focus on ${topic} syntax differences`,
                    focus: 'syntax differences, language-specific features'
                };
            }
        }
        
        return {
            approach: 'conceptual',
            reasoning: `Learning ${concept} for the first time`,
            focus: 'understanding the concept, how it works, why it is useful'
        };
    }
}

module.exports = AIClient;
