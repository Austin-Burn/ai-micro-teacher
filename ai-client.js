// AI Client for LM Studio Integration
const axios = require('axios');
const { AITopicFramework } = require('./ai-topic-framework');

class AIClient {
    constructor() {
        this.baseURL = 'http://127.0.0.1:1234/v1/chat/completions';
        this.conversationMemory = new Map(); // Simple memory for MVP
        this.topicFramework = new AITopicFramework(); // Flexible AI-driven topic system
        this.maxMemorySize = 20; // Maximum conversation exchanges per user
    }

    // AI-powered interest analysis
    async analyzeUserInterests(rawInput, userProfile = {}) {
        const prompt = `You are an AI learning analyst. Analyze this user's learning interests and return ONLY a valid JSON response.

User Input: "${rawInput}"

User Profile Data: ${JSON.stringify(userProfile)}

CRITICAL: You MUST return ONLY valid JSON. No explanations, no markdown, no additional text. Just the JSON object.

Analyze the user's input for:
1. Learning topics and subjects mentioned (including programming languages, frameworks, tools, concepts)
2. Confidence level and enthusiasm indicators  
3. Priority levels (main focus vs side interests)
4. Difficulty hints and skill level indicators

IMPORTANT: Extract ALL topics mentioned, including:
- Programming languages (JavaScript, Python, Rust, etc.)
- Frameworks and tools (React, Vue, Django, etc.)
- Concepts and skills (machine learning, web development, etc.)
- Any other learning areas mentioned

Return this exact JSON structure:
{
  "analysis": {
    "overallTone": "confident|uncertain|enthusiastic|hesitant",
    "confidenceLevel": 50,
    "learningStyle": "structured|exploratory|practical|theoretical",
    "learningProportions": {
      "primaryFocus": "main learning area",
      "secondaryAreas": ["side interest 1", "side interest 2"],
      "learningRatio": "e.g., 70% primary, 30% secondary"
    }
  },
  "categories": [
    {
      "name": "Programming Languages",
      "topics": ["JavaScript", "Python", "Rust"],
      "difficulty": 50,
      "confidence": 50,
      "priority": "primary|secondary|tertiary",
      "proportion": 50,
      "frequency": "daily|weekly|occasionally",
      "reasoning": "Why this difficulty/confidence/priority level"
    },
    {
      "name": "Web Development",
      "topics": ["React", "Vue", "Django"],
      "difficulty": 50,
      "confidence": 50,
      "priority": "primary|secondary|tertiary",
      "proportion": 50,
      "frequency": "daily|weekly|occasionally",
      "reasoning": "Why this difficulty/confidence/priority level"
    }
  ],
  "recommendations": {
    "startingPoint": "suggested first topic",
    "learningPath": "recommended progression",
    "focusAreas": ["area1", "area2"],
    "learningSchedule": {
      "primaryFocus": "focus description",
      "secondaryAreas": "secondary description",
      "balance": "balance description"
    }
  }
}

Remember: Return ONLY the JSON object, nothing else.`;

        const response = await this.generateResponse(prompt, 'system', { 
            interests: rawInput,
            userProfile: userProfile 
        });
        
        try {
            // Try to extract JSON from the response if it's wrapped in text
            let jsonResponse = response.trim();
            
            // Remove any markdown code blocks
            if (jsonResponse.includes('```json')) {
                jsonResponse = jsonResponse.split('```json')[1].split('```')[0].trim();
            } else if (jsonResponse.includes('```')) {
                jsonResponse = jsonResponse.split('```')[1].split('```')[0].trim();
            }
            
            // Try to find JSON object in the response
            const jsonMatch = jsonResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                jsonResponse = jsonMatch[0];
            }
            
            return JSON.parse(jsonResponse);
        } catch (error) {
            console.error('Failed to parse AI interest analysis:', error);
            console.error('AI Response was:', response);
            // Fallback to basic parsing
            return this.fallbackInterestAnalysis(rawInput);
        }
    }
    
    fallbackInterestAnalysis(rawInput) {
        // Improved fallback that still uses AI but with simpler prompt
        console.log('Using fallback analysis for:', rawInput);
        
        // Extract basic interests from input
        const interests = rawInput.split(/[,;.\n\r]+/)
            .map(i => i.trim())
            .filter(i => i.length > 0)
            .slice(0, 5); // Limit to 5 interests max
        
        return {
            analysis: {
                overallTone: "neutral",
                confidenceLevel: 50,
                learningStyle: "exploratory",
                learningProportions: {
                    primaryFocus: interests[0] || "General Learning",
                    secondaryAreas: interests.slice(1),
                    learningRatio: "Equal focus on all areas"
                }
            },
            categories: interests.map((interest, index) => ({
                name: interest,
                topics: [interest],
                difficulty: 50,
                confidence: 50,
                priority: index === 0 ? "primary" : "secondary",
                proportion: Math.max(20, 100 - (index * 20)),
                frequency: index === 0 ? "daily" : "weekly",
                reasoning: "Fallback analysis - AI parsing failed"
            })),
            recommendations: {
                startingPoint: interests[0] || "General Learning",
                learningPath: "Begin with basics",
                focusAreas: interests.slice(0, 3),
                learningSchedule: {
                    primaryFocus: "Focus daily on main interest",
                    secondaryAreas: "Include weekly variety",
                    balance: "Balanced learning approach"
                }
            }
        };
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
                    - Interests: ${Array.isArray(context.interests) ? context.interests.join(', ') : (context.interests || 'Not specified')}
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
            
            // Smart response cleaning - dual parse approach
            let cleanedResponse = aiResponse;
            
            // Check if response starts with <think> or with actual content
            const thinkStart = cleanedResponse.indexOf('<think>');
            const jsonStart = cleanedResponse.indexOf('```json');
            const contentStart = cleanedResponse.indexOf('{');
            
            // If <think> comes first, it's reasoning that should be removed
            if (thinkStart !== -1 && (jsonStart === -1 || thinkStart < jsonStart) && (contentStart === -1 || thinkStart < contentStart)) {
                // Remove <think> tags and content using string replacement
                const thinkEnd = cleanedResponse.indexOf('</think>');
                if (thinkEnd !== -1) {
                    cleanedResponse = cleanedResponse.substring(thinkEnd + 8); // Remove everything up to and including </think>
                }
                
                // Try to extract JSON from the response if it's wrapped in code blocks
                const jsonMatch = cleanedResponse.match(/```json\s*([\s\S]*?)\s*```/);
                if (jsonMatch) {
                    cleanedResponse = jsonMatch[1];
                }
            }
            // If content comes first, preserve <think> tags (user asking about AI reasoning)
            
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

    async generateLearningContent(userId, topic, concept, difficultyPercentage) {
        const prompt = `Generate personalized learning content for:
        
        Topic: ${topic}
        Concept: ${concept}
        Difficulty: ${difficultyPercentage}% (0-100 scale)
        
        Create engaging, bite-sized content that:
        - Matches the difficulty level exactly
        - Is interactive and educational
        - Builds on user's existing knowledge
        
        Format as JSON with:
        - content: The learning content
        - type: "info", "quiz", or "tip"
        - difficulty: ${difficultyPercentage} (percentage 0-100)
        - if quiz: include options array, correctAnswer index, AND correctAnswer text
        - correctAnswer: The actual correct answer text (for immediate feedback)`;
        
        const response = await this.generateResponse(prompt, userId, { 
            topic, 
            difficulty: difficultyPercentage 
        });
        
        try {
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
        
        // Get user profile for AI decision making
        const userProfile = await this.getUserProfile(userId);
        
        // AI determines escalated content based on user profile
        const recommendedContent = await this.topicFramework.getRecommendedContent(userProfile, [topic], topic);
        
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
        
        console.log('AI Lesson Generation - User Data:', {
            userId,
            interests,
            knowledgeProfile,
            preferences
        });
        
        // Check if user has interests
        if (!interests || interests.length === 0) {
            throw new Error('User has no learning interests. Please add interests in settings first.');
        }
        
        // Use hierarchical system to determine what to teach
        const recommendedContent = await this.topicFramework.getRecommendedContent(userData, interests, null);
        
        // Check if user should learn concept in new context
        const contextDecision = await this.topicFramework.shouldLearnInNewContext(userData, recommendedContent.recommendedConcept || 'basics', 'new context');
        
        const prompt = `Generate a personalized micro-learning lesson based on the user's profile:
        
        User Interests: ${Array.isArray(interests) ? interests.join(', ') : (interests || 'Not specified')}
        Knowledge Profile: ${JSON.stringify(knowledgeProfile)}
        Preferences: ${JSON.stringify(preferences)}
        
        AI Recommendation: ${JSON.stringify(recommendedContent)}
        Context Decision: ${JSON.stringify(contextDecision)}
        
        CRITICAL: Focus ONLY on the user's specific interests: ${Array.isArray(interests) ? interests.join(', ') : 'None specified'}
        
        IMPORTANT: Use the hierarchical topic system to determine content:
        - If user knows concept in other languages: Focus on SYNTAX differences
        - If user is new to concept: Focus on CONCEPTUAL understanding
        - Respect difficulty percentages: ${preferences.difficulty}% means ${this.getDifficultyDescription(preferences.difficulty)}
        
        Generate a lesson that:
        - Focuses specifically on ONE of the user's interests: ${Array.isArray(interests) ? interests.join(', ') : 'None specified'}
        - Builds on their existing knowledge appropriately
        - Uses the correct approach (syntactic vs conceptual)
        - Matches their difficulty level exactly
        - Is engaging and bite-sized
        - NEVER generates generic "core skills" content - only content related to their specific interests
        
        CRITICAL: Return ONLY valid JSON. No explanations, no markdown, no additional text.
        
        Format as JSON with:
        - content: The lesson content (1-2 sentences)
        - type: "info", "quiz", or "tip"
        - topic: The subject area
        - concept: The specific concept being taught
        - difficulty: ${preferences.difficulty} (percentage 0-100)
        - if quiz: include complete options array with 4 valid options, correctAnswer index (0-3), AND correctAnswerText
        - correctAnswer: The index number (0-3) of the correct option
        - correctAnswerText: The actual correct answer text
        - reasoning: Why this lesson was chosen for this user
        
        Example quiz format:
        {
          "content": "What is the correct HTML tag for a paragraph?",
          "type": "quiz",
          "topic": "HTML Basics",
          "concept": "HTML Elements",
          "difficulty": 50,
          "options": ["<p>", "<para>", "<paragraph>", "<text>"],
          "correctAnswer": 0,
          "correctAnswerText": "<p>",
          "reasoning": "Basic HTML knowledge for web development"
        }`;
        
        const response = await this.generateResponse(prompt, userId, { 
            interests, 
            difficulty: preferences.difficulty 
        });
        
        try {
            // Clean the response to extract JSON
            let jsonResponse = response.trim();
            
            // Remove any markdown code blocks
            if (jsonResponse.includes('```json')) {
                jsonResponse = jsonResponse.split('```json')[1].split('```')[0].trim();
            } else if (jsonResponse.includes('```')) {
                jsonResponse = jsonResponse.split('```')[1].split('```')[0].trim();
            }
            
            // Find JSON object in the response
            const jsonMatch = jsonResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                jsonResponse = jsonMatch[0];
            }
            
            const parsed = JSON.parse(jsonResponse);
            
            // Validate required fields
            if (!parsed.content || !parsed.type) {
                throw new Error('Invalid lesson format');
            }
            
            return parsed;
        } catch (error) {
            console.error('Failed to parse AI lesson response:', error);
            console.error('Raw response:', response);
            
            return {
                content: "I'm having trouble generating a lesson right now. Please try again.",
                type: "info",
                topic: interests[0] || "General",
                concept: "Learning",
                difficulty: preferences.difficulty || 50,
                reasoning: "Fallback due to parsing error"
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
