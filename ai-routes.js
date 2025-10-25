// AI Routes - Centralized AI endpoint handling
const AIClient = require('./ai-client');

class AIRoutes {
    constructor(app, aiClient) {
        this.app = app;
        this.aiClient = aiClient;
        this.setupRoutes();
    }

    setupRoutes() {
        // Test AI connection
        this.app.get('/api/ai/test', async (req, res) => {
            try {
                const response = await this.aiClient.generateResponse("Hello, are you working?", 'test');
                res.json({ success: true, response: response });
            } catch (error) {
                res.status(500).json({ error: 'AI service not available', details: error.message });
            }
        });

        // Generate AI learning content (DEPRECATED - use /api/lesson/request instead)
        this.app.post('/api/ai/generate-content', async (req, res) => {
            const { userId, topic, concept, difficultyPercentage } = req.body;
            
            try {
                const content = await this.aiClient.generateLearningContent(userId, topic, concept, difficultyPercentage);
                res.json({ success: true, content: content });
            } catch (error) {
                console.error('AI Content Generation Error:', error);
                res.status(500).json({ error: 'Failed to generate AI content' });
            }
        });

        // Analyze user response with AI
        this.app.post('/api/ai/analyze-response', async (req, res) => {
            const { userId, userResponse, topic, concept, correctAnswer } = req.body;
            
            try {
                const analysis = await this.aiClient.analyzeUserResponse(userResponse, topic, concept, correctAnswer);
                res.json({ success: true, analysis: analysis });
            } catch (error) {
                console.error('AI Analysis Error:', error);
                res.status(500).json({ error: 'Failed to analyze user response' });
            }
        });

        // Chat with AI assistant
        this.app.post('/api/ai/chat', async (req, res) => {
            const { userId, message, context } = req.body;
            
            try {
                const response = await this.aiClient.generateResponse(message, userId, context);
                res.json({ success: true, response: response });
            } catch (error) {
                console.error('AI Chat Error:', error);
                res.status(500).json({ error: 'Failed to get AI response' });
            }
        });

        // Generate escalated content for "too easy" feedback
        this.app.post('/api/ai/escalate-content', async (req, res) => {
            const { userId, topic, concept, currentDifficultyPercentage } = req.body;
            
            try {
                // Get updated user data (including the knowledge update that just happened)
                const userData = await this.getUserData(userId);
                
                // Generate escalated content with updated user profile
                const content = await this.aiClient.generateEscalatedContent(userId, topic, concept, currentDifficultyPercentage);
                res.json({ success: true, content: content });
            } catch (error) {
                console.error('AI Escalation Error:', error);
                res.status(500).json({ error: 'Failed to generate escalated content' });
            }
        });

        // Quick quiz validation (no AI call needed)
        this.app.post('/api/ai/validate-quiz', async (req, res) => {
            const { userAnswer, correctAnswerIndex, correctAnswerText } = req.body;
            
            try {
                // Simple validation without AI call
                const isCorrect = userAnswer === correctAnswerIndex;
                const feedback = isCorrect ? 
                    `Correct! ${correctAnswerText}` : 
                    `Not quite. The correct answer is: ${correctAnswerText}`;
                
                res.json({ 
                    success: true, 
                    isCorrect: isCorrect,
                    feedback: feedback,
                    correctAnswer: correctAnswerText
                });
            } catch (error) {
                console.error('Quiz Validation Error:', error);
                res.status(500).json({ error: 'Failed to validate quiz answer' });
            }
        });

        // Generate personalized recommendations
        this.app.post('/api/ai/recommendations', async (req, res) => {
            const { userId, interests, knowledgeProfile } = req.body;
            
            try {
                const recommendations = await this.aiClient.generatePersonalizedRecommendations(userId, interests, knowledgeProfile);
                res.json({ success: true, recommendations: recommendations });
            } catch (error) {
                console.error('AI Recommendations Error:', error);
                res.status(500).json({ error: 'Failed to generate recommendations' });
            }
        });

        // Memory cache control endpoints
        this.app.get('/api/ai/memory/stats', async (req, res) => {
            try {
                const stats = this.aiClient.getMemoryStats();
                res.json({ success: true, stats: stats });
            } catch (error) {
                console.error('Memory Stats Error:', error);
                res.status(500).json({ error: 'Failed to get memory stats' });
            }
        });

        this.app.delete('/api/ai/memory/user/:userId', async (req, res) => {
            try {
                const { userId } = req.params;
                this.aiClient.clearUserMemory(userId);
                res.json({ success: true, message: `Cleared memory for user ${userId}` });
            } catch (error) {
                console.error('Clear User Memory Error:', error);
                res.status(500).json({ error: 'Failed to clear user memory' });
            }
        });

        this.app.delete('/api/ai/memory/all', async (req, res) => {
            try {
                this.aiClient.clearAllMemory();
                res.json({ success: true, message: 'Cleared all user memory' });
            } catch (error) {
                console.error('Clear All Memory Error:', error);
                res.status(500).json({ error: 'Failed to clear all memory' });
            }
        });

        // Simple lesson request - server figures out what to teach
        this.app.post('/api/lesson/request', async (req, res) => {
            const { userId } = req.body;
            
            try {
                // Get user's knowledge profile and interests from database
                const userData = await this.getUserData(userId);
                
                // Let AI figure out what to teach based on user profile
                const lesson = await this.aiClient.generatePersonalizedLesson(userId, userData);
                
                res.json({ success: true, lesson: lesson });
            } catch (error) {
                console.error('Lesson Request Error:', error);
                res.status(500).json({ error: 'Failed to generate lesson' });
            }
        });
    }

    // Helper method to get user data from database
    async getUserData(userId) {
        // This would query the database for user's knowledge profile, interests, etc.
        // For MVP, return mock data
        return {
            interests: ['JavaScript', 'Cooking'],
            knowledgeProfile: {
                'JavaScript': {
                    'Variables': { proficiency: 2, confidence: 0.8 },
                    'Functions': { proficiency: 1, confidence: 0.6 }
                },
                'Cooking': {
                    'Knife Skills': { proficiency: 1, confidence: 0.7 }
                }
            },
            learningHistory: [],
            preferences: {
                difficulty: 50,
                granularity: 'auto'
            }
        };
    }
}

module.exports = AIRoutes;
