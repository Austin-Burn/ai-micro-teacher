// Sample learning content for MVP testing
// This would be replaced by AI-generated content in production

const sampleContent = [
    // Code/Programming content (high granularity required)
    {
        topic: 'JavaScript',
        content: 'In JavaScript, `let` and `const` are block-scoped, while `var` is function-scoped. This means `let` and `const` are only accessible within the block they are declared.',
        type: 'info',
        granularity: 'high',
        actions: [
            { action: 'learn_more', title: 'Learn More' },
            { action: 'quiz', title: 'Test Knowledge' }
        ]
    },
    {
        topic: 'JavaScript',
        content: 'What is the difference between `==` and `===` in JavaScript?',
        type: 'quiz',
        granularity: 'high',
        actions: [
            { action: 'answer', title: '== (loose equality)' },
            { action: 'answer', title: '=== (strict equality)' },
            { action: 'answer', title: 'No difference' }
        ],
        correctAnswer: 1
    },
    {
        topic: 'JavaScript',
        content: 'The `===` operator checks both value and type, while `==` only checks value after type coercion.',
        type: 'explanation',
        granularity: 'high'
    },

    // Cooking content (flexible granularity)
    {
        topic: 'Cooking',
        content: 'Preheating your pan with a thin layer of oil (the pan\'s "lubricant") prevents ingredients from sticking better than adding food to a cold pan.',
        type: 'tip',
        granularity: 'high',
        actions: [
            { action: 'learn_more', title: 'More Tips' },
            { action: 'skip', title: 'Got It' }
        ]
    },
    {
        topic: 'Cooking',
        content: 'Salt enhances the natural flavors of ingredients.',
        type: 'tip',
        granularity: 'low',
        actions: [
            { action: 'learn_more', title: 'Learn More' },
            { action: 'skip', title: 'Got It' }
        ]
    },

    // History content (flexible granularity)
    {
        topic: 'History',
        content: 'World War II lasted from 1939 to 1945.',
        type: 'info',
        granularity: 'low',
        actions: [
            { action: 'learn_more', title: 'Learn More' },
            { action: 'skip', title: 'Got It' }
        ]
    },
    {
        topic: 'History',
        content: 'The Battle of Stalingrad (1942-1943) was a turning point in WWII, where Soviet forces encircled and defeated the German 6th Army.',
        type: 'info',
        granularity: 'high',
        actions: [
            { action: 'learn_more', title: 'Learn More' },
            { action: 'quiz', title: 'Test Knowledge' }
        ]
    },

    // Philosophy content (flexible granularity)
    {
        topic: 'Philosophy',
        content: 'Ethics is the branch of philosophy that deals with moral principles.',
        type: 'info',
        granularity: 'low',
        actions: [
            { action: 'learn_more', title: 'Learn More' },
            { action: 'skip', title: 'Got It' }
        ]
    },
    {
        topic: 'Philosophy',
        content: 'Kant\'s categorical imperative states: "Act only according to that maxim whereby you can at the same time will that it should become a universal law."',
        type: 'info',
        granularity: 'high',
        actions: [
            { action: 'learn_more', title: 'Learn More' },
            { action: 'quiz', title: 'Test Understanding' }
        ]
    }
];

// Notification templates for different types
const notificationTemplates = {
    info: {
        title: 'MicroLearn',
        body: '{content}',
        icon: '/icons/icon-192.png',
        actions: [
            { action: 'learn_more', title: 'Learn More' },
            { action: 'got_it', title: 'Got It' },
            { action: 'too_easy', title: 'Too Easy' }
        ]
    },
    quiz: {
        title: 'MicroLearn Quiz',
        body: '{content}',
        icon: '/icons/icon-192.png',
        requireInteraction: true,
        actions: [
            { action: 'answer', title: 'Option A' },
            { action: 'answer', title: 'Option B' },
            { action: 'answer', title: 'Option C' },
            { action: 'too_easy', title: 'Too Easy' }
        ]
    },
    tip: {
        title: 'MicroLearn Tip',
        body: '{content}',
        icon: '/icons/icon-192.png',
        actions: [
            { action: 'learn_more', title: 'More Tips' },
            { action: 'got_it', title: 'Got It' },
            { action: 'too_easy', title: 'Too Easy' }
        ]
    },
    text_input: {
        title: 'MicroLearn Challenge',
        body: '{content}',
        icon: '/icons/icon-192.png',
        requireInteraction: true,
        actions: [
            { action: 'submit', title: 'Submit Answer' },
            { action: 'too_easy', title: 'Too Easy' }
        ]
    }
};

// Function to get content based on user interests and granularity
function getPersonalizedContent(userInterests, granularity = 'auto') {
    const filteredContent = sampleContent.filter(item => {
        // Filter by user interests
        const hasInterest = userInterests.some(interest => 
            item.topic.toLowerCase().includes(interest.toLowerCase()) ||
            interest.toLowerCase().includes(item.topic.toLowerCase())
        );
        
        // Filter by granularity preference
        const matchesGranularity = granularity === 'auto' || 
                                 item.granularity === granularity ||
                                 (granularity === 'high' && item.granularity === 'high');
        
        return hasInterest && matchesGranularity;
    });
    
    // Return random content from filtered results
    return filteredContent[Math.floor(Math.random() * filteredContent.length)];
}

// Function to create notification payload
function createNotificationPayload(content, userPreferences = {}) {
    const template = notificationTemplates[content.type] || notificationTemplates.info;
    
    return {
        title: template.title,
        body: template.body.replace('{content}', content.content),
        icon: template.icon,
        data: {
            url: '/',
            type: content.type,
            lessonId: content.id || Date.now(),
            topic: content.topic,
            granularity: content.granularity,
            difficulty: content.difficulty || 1
        },
        actions: template.actions || [],
        requireInteraction: template.requireInteraction || false
    };
}

// Function to analyze text input for difficulty assessment
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

// Function to get escalated content when something is "too easy"
function getEscalatedContent(topic, concept, currentDifficulty = 1) {
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

// Function to handle "too easy" feedback
function handleTooEasyFeedback(topic, concept, currentDifficulty, userKnowledge = {}) {
    // Update user knowledge to reflect they know this concept well
    const updatedKnowledge = {
        ...userKnowledge,
        [topic]: {
            ...userKnowledge[topic],
            [concept]: {
                proficiency_level: 2, // Mark as mastered
                confidence_score: 0.9,
                last_practiced: new Date().toISOString()
            }
        }
    };
    
    // Get escalated content
    const escalatedContent = getEscalatedContent(topic, concept, currentDifficulty);
    
    if (escalatedContent) {
        return {
            shouldEscalate: true,
            escalatedContent: escalatedContent,
            updatedKnowledge: updatedKnowledge,
            message: `Great! Let's try something more challenging in ${topic}.`
        };
    } else {
        // No escalated content available, suggest different topic
        return {
            shouldEscalate: false,
            updatedKnowledge: updatedKnowledge,
            message: `You've mastered ${concept} in ${topic}! Let's explore a different area.`
        };
    }
}

module.exports = {
    sampleContent,
    notificationTemplates,
    getPersonalizedContent,
    createNotificationPayload,
    analyzeTextInput,
    getEscalatedContent,
    handleTooEasyFeedback
};
