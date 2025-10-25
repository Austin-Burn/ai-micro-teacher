// Topic Hierarchy System for AI Decision Making
// Allows AI to make nuanced decisions about what to teach based on user knowledge

const topicHierarchy = {
    'Code': {
        'JavaScript': {
            'Variables': {
                'Basic': ['let', 'var', 'const declarations'],
                'Intermediate': ['hoisting', 'temporal dead zone', 'scope'],
                'Advanced': ['closure', 'prototype chain', 'memory management']
            },
            'Functions': {
                'Basic': ['function declarations', 'parameters', 'return'],
                'Intermediate': ['arrow functions', 'callbacks', 'scope'],
                'Advanced': ['closures', 'currying', 'functional programming']
            },
            'Loops': {
                'Basic': ['for loops', 'while loops', 'basic iteration'],
                'Intermediate': ['for...of', 'for...in', 'array methods'],
                'Advanced': ['iterators', 'generators', 'async iteration']
            }
        },
        'Python': {
            'Variables': {
                'Basic': ['assignment', 'data types', 'naming'],
                'Intermediate': ['scope', 'global', 'nonlocal'],
                'Advanced': ['memory management', 'garbage collection']
            },
            'Functions': {
                'Basic': ['def', 'parameters', 'return'],
                'Intermediate': ['lambda', 'decorators', 'scope'],
                'Advanced': ['closures', 'generators', 'metaclasses']
            },
            'Loops': {
                'Basic': ['for loops', 'while loops', 'range()'],
                'Intermediate': ['list comprehensions', 'enumerate', 'zip'],
                'Advanced': ['generators', 'itertools', 'async iteration']
            }
        }
    },
    'Cooking': {
        'Knife Skills': {
            'Basic': ['grip', 'basic cuts', 'safety'],
            'Intermediate': ['julienne', 'brunoise', 'chiffonade'],
            'Advanced': ['butchering', 'specialty cuts', 'knife maintenance']
        },
        'Heat Control': {
            'Basic': ['temperature levels', 'pan selection', 'timing'],
            'Intermediate': ['searing', 'braising', 'roasting'],
            'Advanced': ['sous vide', 'molecular gastronomy', 'precision cooking']
        }
    }
};

// AI Decision Engine for Topic Selection
class TopicDecisionEngine {
    constructor() {
        this.hierarchy = topicHierarchy;
    }

    // Get what the AI should teach based on user's knowledge profile
    getRecommendedContent(userProfile, topic, concept) {
        const userKnowledge = userProfile.knowledgeProfile || {};
        const topicKnowledge = userKnowledge[topic] || {};
        const conceptKnowledge = topicKnowledge[concept] || { proficiency: 0, confidence: 0 };
        
        // Determine difficulty level based on proficiency
        let difficultyLevel = 'Basic';
        if (conceptKnowledge.proficiency >= 2) {
            difficultyLevel = 'Advanced';
        } else if (conceptKnowledge.proficiency >= 1) {
            difficultyLevel = 'Intermediate';
        }
        
        // Get the appropriate content for this level
        const topicPath = this.getTopicPath(topic, concept);
        const content = this.getContentForLevel(topicPath, difficultyLevel);
        
        return {
            topic: topic,
            concept: concept,
            difficultyLevel: difficultyLevel,
            content: content,
            reasoning: this.generateReasoning(userProfile, topic, concept, difficultyLevel)
        };
    }

    // Get the path to a specific topic in the hierarchy
    getTopicPath(topic, concept) {
        for (const category in this.hierarchy) {
            if (this.hierarchy[category][topic]) {
                if (this.hierarchy[category][topic][concept]) {
                    return {
                        category: category,
                        topic: topic,
                        concept: concept,
                        path: this.hierarchy[category][topic][concept]
                    };
                }
            }
        }
        return null;
    }

    // Get content for a specific difficulty level
    getContentForLevel(topicPath, difficultyLevel) {
        if (!topicPath || !topicPath.path[difficultyLevel]) {
            return ['General learning content'];
        }
        return topicPath.path[difficultyLevel];
    }

    // Generate reasoning for why this content was chosen
    generateReasoning(userProfile, topic, concept, difficultyLevel) {
        const userKnowledge = userProfile.knowledgeProfile || {};
        const topicKnowledge = userKnowledge[topic] || {};
        const conceptKnowledge = topicKnowledge[concept] || { proficiency: 0, confidence: 0 };
        
        if (difficultyLevel === 'Basic') {
            return `Starting with basics since you're new to ${concept} in ${topic}`;
        } else if (difficultyLevel === 'Intermediate') {
            return `Building on your existing knowledge of ${concept} in ${topic}`;
        } else {
            return `Advanced content since you've mastered the basics of ${concept} in ${topic}`;
        }
    }

    // Check if user should learn a concept in a new language
    shouldLearnInNewLanguage(userProfile, concept, newLanguage) {
        const userKnowledge = userProfile.knowledgeProfile || {};
        
        // Check if user knows this concept in other languages
        for (const topic in userKnowledge) {
            if (userKnowledge[topic][concept] && userKnowledge[topic][concept].proficiency >= 1) {
                // User knows this concept in another language
                return {
                    shouldLearn: true,
                    approach: 'syntactic', // Focus on syntax differences
                    reasoning: `You know ${concept} in other languages, so we'll focus on ${newLanguage} syntax`
                };
            }
        }
        
        return {
            shouldLearn: true,
            approach: 'conceptual', // Teach the concept itself
            reasoning: `Learning ${concept} for the first time`
        };
    }

    // Get next learning recommendations based on hierarchy
    getNextLearningPath(userProfile) {
        const userKnowledge = userProfile.knowledgeProfile || {};
        const recommendations = [];
        
        // Analyze what user knows and suggest next steps
        for (const topic in userKnowledge) {
            const topicKnowledge = userKnowledge[topic];
            for (const concept in topicKnowledge) {
                const conceptData = topicKnowledge[concept];
                if (conceptData.proficiency >= 1) {
                    // User knows this concept, suggest related concepts
                    const relatedConcepts = this.getRelatedConcepts(topic, concept);
                    recommendations.push(...relatedConcepts);
                }
            }
        }
        
        return recommendations;
    }

    // Get related concepts in the hierarchy
    getRelatedConcepts(topic, concept) {
        const topicPath = this.getTopicPath(topic, concept);
        if (!topicPath) return [];
        
        const related = [];
        const conceptLevel = topicPath.path;
        
        // Suggest concepts at the same level
        for (const level in conceptLevel) {
            if (level !== concept) {
                related.push({
                    topic: topic,
                    concept: level,
                    reason: `Related to ${concept} in ${topic}`
                });
            }
        }
        
        return related;
    }
}

module.exports = { topicHierarchy, TopicDecisionEngine };
