// Simple Node.js server for MicroLearn PWA
const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const AIClient = require('./ai-client');
const AIRoutes = require('./ai-routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('.'));

// Note: Push notifications removed - using pull-based architecture

// Initialize AI Client and Routes
const aiClient = new AIClient();
const aiRoutes = new AIRoutes(app, aiClient);

// Database setup
const db = new sqlite3.Database('microlearn.db');

// Initialize database tables
db.serialize(() => {
    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        subscription TEXT,
        interests TEXT,
        frequency INTEGER DEFAULT 3,
        granularity TEXT DEFAULT 'auto',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    
    // Learning content table
    db.run(`CREATE TABLE IF NOT EXISTS content (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        topic TEXT,
        content TEXT,
        type TEXT,
        granularity TEXT,
        difficulty_level INTEGER DEFAULT 1,
        prerequisites TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    
    // User progress table
    db.run(`CREATE TABLE IF NOT EXISTS progress (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        content_id INTEGER,
        completed BOOLEAN DEFAULT FALSE,
        score INTEGER,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(content_id) REFERENCES content(id)
    )`);
    
    // Knowledge profile table - tracks what user knows
    db.run(`CREATE TABLE IF NOT EXISTS knowledge_profile (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        topic TEXT,
        concept TEXT,
        proficiency_level INTEGER DEFAULT 0,
        last_practiced DATETIME,
        confidence_score REAL DEFAULT 0.0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )`);
    
    // Knowledge concepts table - defines learning concepts
    db.run(`CREATE TABLE IF NOT EXISTS knowledge_concepts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        topic TEXT,
        concept TEXT,
        description TEXT,
        difficulty_level INTEGER DEFAULT 1,
        prerequisites TEXT,
        granularity_required TEXT DEFAULT 'high'
    )`);
});

// Routes

// Subscribe to notifications
app.post('/api/subscribe', (req, res) => {
    const { subscription, interests, frequency, granularity } = req.body;
    
    db.run(
        'INSERT OR REPLACE INTO users (subscription, interests, frequency, granularity) VALUES (?, ?, ?, ?)',
        [JSON.stringify(subscription), JSON.stringify(interests), frequency, granularity],
        function(err) {
            if (err) {
                console.error('Database error:', err);
                res.status(500).json({ error: 'Failed to save subscription' });
            } else {
                console.log('User subscribed:', this.lastID);
                res.json({ success: true, userId: this.lastID });
            }
        }
    );
});

// Send notification
app.post('/api/notify', async (req, res) => {
    const { userId, content } = req.body;
    
    try {
        // Get user subscription
        db.get('SELECT subscription FROM users WHERE id = ?', [userId], async (err, user) => {
            if (err || !user) {
                res.status(404).json({ error: 'User not found' });
                return;
            }
            
            const subscription = JSON.parse(user.subscription);
            
            // Create notification payload
            const payload = JSON.stringify({
                title: 'MicroLearn',
                body: content.text,
                icon: '/icons/icon-192.png',
                badge: '/icons/icon-192.png',
                data: {
                    url: '/',
                    type: content.type,
                    lessonId: content.id,
                    topic: content.topic
                },
                actions: content.actions || [],
                requireInteraction: content.requireInteraction || false
            });
            
            // Send notification
            await webpush.sendNotification(subscription, payload);
            res.json({ success: true });
        });
    } catch (error) {
        console.error('Notification error:', error);
        res.status(500).json({ error: 'Failed to send notification' });
    }
});

// Get learning content
app.get('/api/content/:topic', (req, res) => {
    const { topic } = req.params;
    const { granularity = 'auto' } = req.query;
    
    db.all(
        'SELECT * FROM content WHERE topic = ? AND (granularity = ? OR granularity = "auto")',
        [topic, granularity],
        (err, rows) => {
            if (err) {
                console.error('Database error:', err);
                res.status(500).json({ error: 'Failed to fetch content' });
            } else {
                res.json(rows);
            }
        }
    );
});

// Save learning progress
app.post('/api/progress', (req, res) => {
    const { userId, contentId, completed, score } = req.body;
    
    db.run(
        'INSERT INTO progress (user_id, content_id, completed, score) VALUES (?, ?, ?, ?)',
        [userId, contentId, completed, score],
        function(err) {
            if (err) {
                console.error('Database error:', err);
                res.status(500).json({ error: 'Failed to save progress' });
            } else {
                res.json({ success: true, progressId: this.lastID });
            }
        }
    );
});

// Get user progress
app.get('/api/progress/:userId', (req, res) => {
    const { userId } = req.params;
    
    db.all(
        `SELECT p.*, c.topic, c.content 
         FROM progress p 
         JOIN content c ON p.content_id = c.id 
         WHERE p.user_id = ? 
         ORDER BY p.timestamp DESC`,
        [userId],
        (err, rows) => {
            if (err) {
                console.error('Database error:', err);
                res.status(500).json({ error: 'Failed to fetch progress' });
            } else {
                res.json(rows);
            }
        }
    );
});

// Schedule notifications (simple implementation)
app.post('/api/schedule', (req, res) => {
    const { userId, frequency } = req.body;
    
    // For MVP, we'll just log the scheduling
    // In production, you'd use a proper job queue like Bull or Agenda
    console.log(`Scheduling ${frequency} notifications per day for user ${userId}`);
    
    // Simulate scheduling by storing in database
    db.run(
        'UPDATE users SET frequency = ? WHERE id = ?',
        [frequency, userId],
        (err) => {
            if (err) {
                console.error('Database error:', err);
                res.status(500).json({ error: 'Failed to update schedule' });
            } else {
                res.json({ success: true });
            }
        }
    );
});

// Knowledge Profile Management

// Get user's knowledge profile
app.get('/api/knowledge/:userId', (req, res) => {
    const { userId } = req.params;
    
    db.all(
        `SELECT kp.*, kc.description, kc.difficulty_level, kc.prerequisites 
         FROM knowledge_profile kp
         LEFT JOIN knowledge_concepts kc ON kp.topic = kc.topic AND kp.concept = kc.concept
         WHERE kp.user_id = ?
         ORDER BY kp.topic, kp.proficiency_level DESC`,
        [userId],
        (err, rows) => {
            if (err) {
                console.error('Database error:', err);
                res.status(500).json({ error: 'Failed to fetch knowledge profile' });
            } else {
                res.json(rows);
            }
        }
    );
});

// Update knowledge profile (when user learns something)
app.post('/api/knowledge/update', (req, res) => {
    const { userId, topic, concept, proficiencyLevel, confidenceScore } = req.body;
    
    db.run(
        `INSERT OR REPLACE INTO knowledge_profile 
         (user_id, topic, concept, proficiency_level, confidence_score, last_practiced)
         VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [userId, topic, concept, proficiencyLevel, confidenceScore],
        function(err) {
            if (err) {
                console.error('Database error:', err);
                res.status(500).json({ error: 'Failed to update knowledge profile' });
            } else {
                res.json({ success: true, knowledgeId: this.lastID });
            }
        }
    );
});

// Get recommended content based on knowledge gaps
app.get('/api/recommendations/:userId', (req, res) => {
    const { userId } = req.params;
    const { topic } = req.query;
    
    // Get user's current knowledge level for the topic
    db.all(
        `SELECT concept, proficiency_level FROM knowledge_profile 
         WHERE user_id = ? AND topic = ?`,
        [userId, topic],
        (err, userKnowledge) => {
            if (err) {
                console.error('Database error:', err);
                res.status(500).json({ error: 'Failed to fetch user knowledge' });
                return;
            }
            
            // Get concepts the user doesn't know or needs to practice
            const knownConcepts = userKnowledge.map(k => k.concept);
            const placeholders = knownConcepts.map(() => '?').join(',');
            
            let query = `
                SELECT * FROM knowledge_concepts 
                WHERE topic = ? AND difficulty_level <= ?
            `;
            let params = [topic, 3]; // Max difficulty level
            
            if (knownConcepts.length > 0) {
                query += ` AND concept NOT IN (${placeholders})`;
                params = params.concat(knownConcepts);
            }
            
            query += ` ORDER BY difficulty_level ASC, concept ASC`;
            
            db.all(query, params, (err, concepts) => {
                if (err) {
                    console.error('Database error:', err);
                    res.status(500).json({ error: 'Failed to fetch recommendations' });
                } else {
                    res.json(concepts);
                }
            });
        }
    );
});

// Knowledge assessment - test what user knows
app.post('/api/assessment', (req, res) => {
    const { userId, topic, concept, userAnswer, correctAnswer } = req.body;
    
    const isCorrect = userAnswer === correctAnswer;
    const confidenceScore = isCorrect ? 0.8 : 0.2; // Adjust based on correctness
    const proficiencyLevel = isCorrect ? 1 : 0;
    
    db.run(
        `INSERT OR REPLACE INTO knowledge_profile 
         (user_id, topic, concept, proficiency_level, confidence_score, last_practiced)
         VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [userId, topic, concept, proficiencyLevel, confidenceScore],
        function(err) {
            if (err) {
                console.error('Database error:', err);
                res.status(500).json({ error: 'Failed to update assessment' });
            } else {
                res.json({ 
                    success: true, 
                    correct: isCorrect,
                    knowledgeId: this.lastID 
                });
            }
        }
    );
});

// Initialize knowledge concepts for a topic
app.post('/api/knowledge/init', (req, res) => {
    const { topic, concepts } = req.body;
    
    // Insert multiple concepts
    const stmt = db.prepare(`
        INSERT OR IGNORE INTO knowledge_concepts 
        (topic, concept, description, difficulty_level, prerequisites, granularity_required)
        VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    concepts.forEach(concept => {
        stmt.run([
            topic,
            concept.name,
            concept.description,
            concept.difficulty || 1,
            concept.prerequisites ? JSON.stringify(concept.prerequisites) : null,
            concept.granularity || 'high'
        ]);
    });
    
    stmt.finalize((err) => {
        if (err) {
            console.error('Database error:', err);
            res.status(500).json({ error: 'Failed to initialize concepts' });
        } else {
            res.json({ success: true });
        }
    });
});

// Handle "too easy" feedback and escalate content
app.post('/api/too-easy', (req, res) => {
    const { userId, topic, concept, currentDifficulty } = req.body;
    
    // Update user knowledge to mark concept as mastered
    db.run(
        `INSERT OR REPLACE INTO knowledge_profile 
         (user_id, topic, concept, proficiency_level, confidence_score, last_practiced)
         VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [userId, topic, concept, 2, 0.9], // Mark as mastered with high confidence
        function(err) {
            if (err) {
                console.error('Database error:', err);
                res.status(500).json({ error: 'Failed to update knowledge profile' });
                return;
            }
            
            // Get escalated content
            const escalatedContent = getEscalatedContent(topic, concept, currentDifficulty);
            
            if (escalatedContent) {
                // Send escalated notification immediately
                sendEscalatedNotification(userId, escalatedContent, topic, concept);
                res.json({ 
                    success: true, 
                    escalated: true,
                    message: `Great! Let's try something more challenging in ${topic}.`,
                    newContent: escalatedContent
                });
            } else {
                // No escalated content available, suggest different topic
                res.json({ 
                    success: true, 
                    escalated: false,
                    message: `You've mastered ${concept} in ${topic}! Let's explore a different area.`
                });
            }
        }
    );
});

// Analyze text input for difficulty assessment
app.post('/api/analyze-text', (req, res) => {
    const { userInput, expectedAnswer, topic, concept } = req.body;
    
    // Basic text analysis (in production, this would use AI)
    const analysis = analyzeTextInput(userInput, expectedAnswer, topic, concept);
    
    // Update knowledge profile based on analysis
    const proficiencyLevel = analysis.isCorrect ? 1 : 0;
    const confidenceScore = analysis.confidence;
    
    db.run(
        `INSERT OR REPLACE INTO knowledge_profile 
         (user_id, topic, concept, proficiency_level, confidence_score, last_practiced)
         VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [req.body.userId, topic, concept, proficiencyLevel, confidenceScore],
        function(err) {
            if (err) {
                console.error('Database error:', err);
                res.status(500).json({ error: 'Failed to update knowledge profile' });
                return;
            }
            
            res.json({
                success: true,
                analysis: analysis,
                updated: true
            });
        }
    );
});

// Send escalated notification
async function sendEscalatedNotification(userId, escalatedContent, topic, concept) {
    try {
        // Get user subscription
        db.get('SELECT subscription FROM users WHERE id = ?', [userId], async (err, user) => {
            if (err || !user) {
                console.error('User not found for escalated notification');
                return;
            }
            
            const subscription = JSON.parse(user.subscription);
            
            // Create escalated notification payload
            const payload = JSON.stringify({
                title: 'MicroLearn - Challenge Mode',
                body: escalatedContent.content,
                icon: '/icons/icon-192.png',
                badge: '/icons/icon-192.png',
                data: {
                    url: '/',
                    type: escalatedContent.type,
                    topic: topic,
                    concept: concept,
                    difficulty: escalatedContent.difficulty,
                    escalated: true
                },
                actions: escalatedContent.type === 'quiz' ? 
                    escalatedContent.options.map((opt, i) => ({ action: 'answer', title: opt })) :
                    [{ action: 'submit', title: 'Submit Answer' }],
                requireInteraction: true
            });
            
            // Send notification
            await webpush.sendNotification(subscription, payload);
            console.log('Escalated notification sent to user', userId);
        });
    } catch (error) {
        console.error('Failed to send escalated notification:', error);
    }
}

// Helper function to get escalated content (imported from sample-content.js)
function getEscalatedContent(topic, concept, currentDifficulty) {
    const escalatedContent = {
        'JavaScript': {
            'Variables': {
                content: 'Explain the difference between temporal dead zone and hoisting in JavaScript variable declarations.',
                difficulty: 3,
                type: 'text_input',
                expectedAnswer: 'temporal dead zone hoisting let const var'
            },
            'Functions': {
                content: 'What is the difference between function declarations and function expressions in terms of hoisting behavior?',
                difficulty: 3,
                type: 'quiz',
                options: [
                    'No difference',
                    'Function declarations are hoisted, expressions are not',
                    'Function expressions are hoisted, declarations are not'
                ],
                correctAnswer: 1
            }
        },
        'Cooking': {
            'Knife Skills': {
                content: 'Explain the proper technique for chiffonade and why it\'s different from julienne cuts.',
                difficulty: 3,
                type: 'text_input',
                expectedAnswer: 'chiffonade julienne technique difference'
            },
            'Heat Control': {
                content: 'What is the Maillard reaction and how does it differ from caramelization?',
                difficulty: 4,
                type: 'quiz',
                options: [
                    'Same thing',
                    'Maillard involves proteins, caramelization is just sugars',
                    'Caramelization is faster'
                ],
                correctAnswer: 1
            }
        }
    };
    
    return escalatedContent[topic]?.[concept] || null;
}

// Helper function to analyze text input
function analyzeTextInput(userInput, expectedAnswer, topic, concept) {
    const analysis = {
        isCorrect: false,
        confidence: 0,
        difficultyLevel: 'unknown',
        suggestions: []
    };
    
    // Basic text analysis (in production, this would use AI)
    const inputWords = userInput.toLowerCase().split(/\s+/);
    const expectedWords = expectedAnswer.toLowerCase().split(/\s+/);
    
    // Check for key technical terms that indicate higher knowledge
    const technicalTerms = {
        'JavaScript': ['closure', 'prototype', 'async', 'await', 'promise', 'callback', 'hoisting'],
        'Cooking': ['sous vide', 'brunoise', 'julienne', 'mirepoix', 'roux', 'emulsification'],
        'History': ['chronology', 'historiography', 'primary source', 'secondary source', 'bias']
    };
    
    const topicTerms = technicalTerms[topic] || [];
    const hasAdvancedTerms = topicTerms.some(term => 
        inputWords.some(word => word.includes(term))
    );
    
    // Check for basic vs advanced language patterns
    const basicPatterns = ['basic', 'simple', 'easy', 'just', 'only'];
    const advancedPatterns = ['complex', 'sophisticated', 'intricate', 'nuanced', 'advanced'];
    
    const hasBasicLanguage = basicPatterns.some(pattern => 
        inputWords.some(word => word.includes(pattern))
    );
    const hasAdvancedLanguage = advancedPatterns.some(pattern => 
        inputWords.some(word => word.includes(pattern))
    );
    
    // Determine difficulty level based on analysis
    if (hasAdvancedTerms || hasAdvancedLanguage) {
        analysis.difficultyLevel = 'advanced';
        analysis.confidence = 0.8;
    } else if (hasBasicLanguage) {
        analysis.difficultyLevel = 'beginner';
        analysis.confidence = 0.6;
    } else {
        analysis.difficultyLevel = 'intermediate';
        analysis.confidence = 0.7;
    }
    
    // Check correctness (simplified)
    const wordMatch = expectedWords.filter(word => 
        inputWords.some(inputWord => inputWord.includes(word))
    ).length;
    analysis.isCorrect = wordMatch / expectedWords.length > 0.3;
    
    return analysis;
}

// AI routes are now handled by AIRoutes class

// Serve the PWA
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`MicroLearn server running on port ${PORT}`);
    console.log(`Open http://localhost:${PORT} to view the PWA`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down server...');
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err);
        } else {
            console.log('Database connection closed.');
        }
        process.exit(0);
    });
});
