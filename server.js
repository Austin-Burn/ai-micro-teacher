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

// Initialize AI Client
const aiClient = new AIClient();

// User login endpoint
app.post('/api/login', (req, res) => {
    const { email, name } = req.body;
    
    // Validate required fields
    if (!email || !name) {
        return res.status(400).json({ 
            success: false, 
            error: 'Email and name are required' 
        });
    }
    
    // Check if user exists
    db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
        if (err) {
            console.error('Login error:', err);
            return res.status(500).json({ 
                success: false, 
                error: 'Database error' 
            });
        }
        
        if (user) {
            // User exists, return user data
            res.json({ 
                success: true, 
                userId: user.id,
                isNewUser: false,
                message: 'Login successful' 
            });
        } else {
            // User doesn't exist, return error
            res.status(404).json({ 
                success: false, 
                error: 'User not found. Please register first.' 
            });
        }
    });
});

// User registration endpoint
app.post('/api/register-new', (req, res) => {
    const { email, name } = req.body;
    
    // Validate required fields
    if (!email || !name) {
        return res.status(400).json({ 
            success: false, 
            error: 'Email and name are required' 
        });
    }
    
    // Check if user already exists
    db.get('SELECT * FROM users WHERE email = ?', [email], (err, existingUser) => {
        if (err) {
            console.error('Registration error:', err);
            return res.status(500).json({ 
                success: false, 
                error: 'Database error' 
            });
        }
        
        if (existingUser) {
            return res.status(409).json({ 
                success: false, 
                error: 'User already exists. Please login instead.' 
            });
        }
        
        // Create new user
        const stmt = db.prepare(`
            INSERT INTO users (email, name, subscription) 
            VALUES (?, ?, 'free')
        `);
        
        stmt.run(email, name, function(err) {
            if (err) {
                console.error('Registration error:', err);
                return res.status(500).json({ 
                    success: false, 
                    error: 'Failed to create user account' 
                });
            }
            
            const userId = this.lastID;
            
            res.json({ 
                success: true, 
                userId: userId,
                message: 'User registered successfully' 
            });
        });
        
        stmt.finalize();
    });
});

// User registration endpoint (for completing setup)
app.post('/api/register', (req, res) => {
    const { userId, interests, frequency, granularity } = req.body;
    
    // Validate required fields
    if (!userId || !interests || !Array.isArray(interests) || interests.length === 0) {
        return res.status(400).json({ 
            success: false, 
            error: 'User ID and interests are required' 
        });
    }
    
    // Update existing user with interests
    const stmt = db.prepare(`
        UPDATE users 
        SET interests = ?, frequency = ?, granularity = ? 
        WHERE id = ?
    `);
    
    stmt.run(
        JSON.stringify(interests),
        frequency || 3,
        granularity || 'auto',
        userId,
        function(err) {
            if (err) {
                console.error('Registration error:', err);
                return res.status(500).json({ 
                    success: false, 
                    error: 'Failed to update user account' 
                });
            }
            
            res.json({ 
                success: true, 
                userId: userId,
                message: 'User setup completed successfully' 
            });
        }
    );
    
    stmt.finalize();
});

// User data endpoint for admin panel
app.get('/api/user/:userId', (req, res) => {
    const { userId } = req.params;
    
    // Get user data from database
    db.get('SELECT * FROM users WHERE id = ?', [userId], (err, user) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ success: false, error: 'Database error' });
        }
        
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        
        // Parse interests from JSON string
        let interests = [];
        try {
            interests = user.interests ? JSON.parse(user.interests) : [];
        } catch (e) {
            console.error('Error parsing interests:', e);
        }
        
        // Get knowledge profile for this user
        db.all('SELECT * FROM knowledge_profile WHERE user_id = ?', [userId], (err, knowledgeRows) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ success: false, error: 'Database error' });
            }
            
            // Format knowledge profile
            const knowledgeProfile = {};
            knowledgeRows.forEach(row => {
                if (!knowledgeProfile[row.topic]) {
                    knowledgeProfile[row.topic] = {};
                }
                knowledgeProfile[row.topic][row.concept] = {
                    proficiency: row.proficiency_level,
                    confidence: row.confidence_score,
                    lastPracticed: row.last_practiced
                };
            });
            
            // Get learning history
            db.all(`
                SELECT p.*, c.topic, c.content, c.type 
                FROM progress p 
                JOIN content c ON p.content_id = c.id 
                WHERE p.user_id = ? 
                ORDER BY p.timestamp DESC 
                LIMIT 10
            `, [userId], (err, historyRows) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ success: false, error: 'Database error' });
                }
                
                const userData = {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    interests: interests,
                    knowledgeProfile: knowledgeProfile,
                    learningHistory: historyRows,
                    preferences: {
                        difficulty: 50, // Default for now
                        granularity: user.granularity || 'auto'
                    },
                    createdAt: user.created_at
                };
                
                res.json({ success: true, user: userData });
            });
        });
    });
});

// Update user data
app.put('/api/user/:userId', (req, res) => {
    const userId = req.params.userId;
    const { interests, frequency, granularity } = req.body;

    if (!userId) {
        return res.status(400).json({ success: false, error: 'User ID is required' });
    }

    // Build update query dynamically based on provided fields
    const updates = [];
    const values = [];

    if (interests !== undefined) {
        updates.push('interests = ?');
        values.push(JSON.stringify(interests));
    }
    if (frequency !== undefined) {
        updates.push('frequency = ?');
        values.push(frequency);
    }
    if (granularity !== undefined) {
        updates.push('granularity = ?');
        values.push(granularity);
    }

    if (updates.length === 0) {
        return res.status(400).json({ success: false, error: 'No fields to update' });
    }

    values.push(userId);

    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
    
    db.run(query, values, function(err) {
        if (err) {
            console.error('Error updating user:', err);
            return res.status(500).json({ success: false, error: 'Failed to update user' });
        }

        if (this.changes === 0) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        res.json({ success: true, message: 'User updated successfully' });
    });
});

// Database setup
const db = new sqlite3.Database('microlearn.db');

// Initialize database tables
db.serialize(() => {
    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE,
        name TEXT,
        subscription TEXT,
        interests TEXT,
        frequency INTEGER DEFAULT 3,
        granularity TEXT DEFAULT 'auto',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    
    // Add email column if it doesn't exist (for existing databases)
    db.run(`ALTER TABLE users ADD COLUMN email TEXT`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
            console.error('Error adding email column:', err);
        }
    });
    
    // Add name column if it doesn't exist (for existing databases)
    db.run(`ALTER TABLE users ADD COLUMN name TEXT`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
            console.error('Error adding name column:', err);
        }
    });
    
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
    
    console.log('Database tables initialized');
    
    // Initialize AI Routes after database is ready
    const aiRoutes = new AIRoutes(app, aiClient, db);
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
app.post('/api/too-easy', async (req, res) => {
    const { userId, topic, concept, currentDifficulty } = req.body;
    
    // Update user knowledge to mark concept as mastered
    db.run(
        `INSERT OR REPLACE INTO knowledge_profile 
         (user_id, topic, concept, proficiency_level, confidence_score, last_practiced)
         VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [userId, topic, concept, 2, 0.9], // Mark as mastered with high confidence
        async function(err) {
            if (err) {
                console.error('Database error:', err);
                res.status(500).json({ error: 'Failed to update knowledge profile' });
                return;
            }
            
            // Generate escalated content using AI
            const aiClient = require('./ai-client');
            const ai = new aiClient();
            
            try {
                const escalatedContent = await ai.generateEscalatedContent(
                    topic, 
                    concept, 
                    currentDifficulty + 1, // Increase difficulty
                    userId
                );
                
                res.json({ 
                    success: true, 
                    escalated: true,
                    message: `Great! Let's try something more challenging in ${topic}.`,
                    newContent: escalatedContent
                });
            } catch (error) {
                console.error('Failed to generate escalated content:', error);
                res.json({ 
                    success: true, 
                    escalated: false,
                    message: `Great! You're doing well with ${topic}. We'll adjust the difficulty for future lessons.`
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

// Hardcoded content removed - now using AI-generated content

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

// Admin User Management Routes
app.get('/api/admin/users', (req, res) => {
    db.all('SELECT id, email, name, created_at FROM users ORDER BY created_at DESC', (err, users) => {
        if (err) {
            console.error('Error fetching users:', err);
            return res.status(500).json({ 
                success: false, 
                error: 'Database error' 
            });
        }
        
        res.json({ 
            success: true, 
            users: users 
        });
    });
});

app.delete('/api/admin/users/:userId', (req, res) => {
    const { userId } = req.params;
    
    if (!userId || isNaN(userId)) {
        return res.status(400).json({ 
            success: false, 
            error: 'Invalid user ID' 
        });
    }
    
    // Start transaction to delete all user data
    db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        // Delete knowledge profile entries
        db.run('DELETE FROM knowledge_profile WHERE user_id = ?', [userId], function(err) {
            if (err) {
                console.error('Error deleting knowledge profile:', err);
                db.run('ROLLBACK');
                return res.status(500).json({ 
                    success: false, 
                    error: 'Failed to delete knowledge profile' 
                });
            }
            const deletedKnowledge = this.changes;
            
            // Delete progress entries
            db.run('DELETE FROM progress WHERE user_id = ?', [userId], function(err) {
                if (err) {
                    console.error('Error deleting progress:', err);
                    db.run('ROLLBACK');
                    return res.status(500).json({ 
                        success: false, 
                        error: 'Failed to delete progress' 
                    });
                }
                const deletedProgress = this.changes;
                
                // Delete user
                db.run('DELETE FROM users WHERE id = ?', [userId], function(err) {
                    if (err) {
                        console.error('Error deleting user:', err);
                        db.run('ROLLBACK');
                        return res.status(500).json({ 
                            success: false, 
                            error: 'Failed to delete user' 
                        });
                    }
                    
                    // Clear AI memory for this user
                    const AIClient = require('./ai-client');
                    const aiClient = new AIClient();
                    aiClient.clearUserMemory(userId);
                    
                    // Commit transaction
                    db.run('COMMIT', (err) => {
                        if (err) {
                            console.error('Error committing transaction:', err);
                            return res.status(500).json({ 
                                success: false, 
                                error: 'Failed to commit deletion' 
                            });
                        }
                        
                        res.json({ 
                            success: true, 
                            message: `Successfully deleted user ${userId}`,
                            deletedKnowledge: deletedKnowledge,
                            deletedProgress: deletedProgress
                        });
                    });
                });
            });
        });
    });
});

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
