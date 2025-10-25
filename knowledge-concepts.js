// Knowledge concepts for different topics
// This defines what concepts exist and their relationships

const knowledgeConcepts = {
    'JavaScript': [
        {
            name: 'Variables',
            description: 'Understanding variable declaration and assignment',
            difficulty: 1,
            prerequisites: [],
            granularity: 'high'
        },
        {
            name: 'Functions',
            description: 'Creating and calling functions',
            difficulty: 2,
            prerequisites: ['Variables'],
            granularity: 'high'
        },
        {
            name: 'Loops',
            description: 'for loops, while loops, and iteration',
            difficulty: 2,
            prerequisites: ['Variables'],
            granularity: 'high'
        },
        {
            name: 'Arrays',
            description: 'Working with arrays and array methods',
            difficulty: 2,
            prerequisites: ['Variables'],
            granularity: 'high'
        },
        {
            name: 'Objects',
            description: 'Creating and manipulating objects',
            difficulty: 3,
            prerequisites: ['Variables', 'Functions'],
            granularity: 'high'
        },
        {
            name: 'Async/Await',
            description: 'Asynchronous programming with async/await',
            difficulty: 4,
            prerequisites: ['Functions', 'Objects'],
            granularity: 'high'
        },
        {
            name: 'Closures',
            description: 'Understanding closure scope and behavior',
            difficulty: 4,
            prerequisites: ['Functions', 'Objects'],
            granularity: 'high'
        }
    ],
    
    'Python': [
        {
            name: 'Variables',
            description: 'Variable assignment and data types',
            difficulty: 1,
            prerequisites: [],
            granularity: 'high'
        },
        {
            name: 'Functions',
            description: 'Defining and calling functions',
            difficulty: 2,
            prerequisites: ['Variables'],
            granularity: 'high'
        },
        {
            name: 'Lists',
            description: 'Working with Python lists',
            difficulty: 2,
            prerequisites: ['Variables'],
            granularity: 'high'
        },
        {
            name: 'Dictionaries',
            description: 'Key-value pairs and dictionary operations',
            difficulty: 3,
            prerequisites: ['Variables', 'Functions'],
            granularity: 'high'
        },
        {
            name: 'List Comprehensions',
            description: 'Efficient list creation and manipulation',
            difficulty: 3,
            prerequisites: ['Lists', 'Functions'],
            granularity: 'high'
        },
        {
            name: 'Generators',
            description: 'Creating and using generators',
            difficulty: 4,
            prerequisites: ['Functions', 'List Comprehensions'],
            granularity: 'high'
        }
    ],
    
    'Cooking': [
        {
            name: 'Knife Skills',
            description: 'Basic knife techniques and safety',
            difficulty: 1,
            prerequisites: [],
            granularity: 'flexible'
        },
        {
            name: 'Heat Control',
            description: 'Understanding different heat levels and cooking methods',
            difficulty: 2,
            prerequisites: [],
            granularity: 'flexible'
        },
        {
            name: 'Seasoning',
            description: 'Salt, pepper, and basic seasoning techniques',
            difficulty: 1,
            prerequisites: [],
            granularity: 'flexible'
        },
        {
            name: 'Sauce Making',
            description: 'Creating basic sauces and gravies',
            difficulty: 3,
            prerequisites: ['Heat Control', 'Seasoning'],
            granularity: 'flexible'
        },
        {
            name: 'Baking Techniques',
            description: 'Understanding baking science and techniques',
            difficulty: 4,
            prerequisites: ['Heat Control', 'Seasoning'],
            granularity: 'flexible'
        }
    ],
    
    'History': [
        {
            name: 'Ancient Civilizations',
            description: 'Early human civilizations and their contributions',
            difficulty: 1,
            prerequisites: [],
            granularity: 'flexible'
        },
        {
            name: 'World Wars',
            description: 'Major events and impacts of World Wars I and II',
            difficulty: 2,
            prerequisites: [],
            granularity: 'flexible'
        },
        {
            name: 'Renaissance',
            description: 'Cultural and intellectual rebirth in Europe',
            difficulty: 3,
            prerequisites: ['Ancient Civilizations'],
            granularity: 'flexible'
        },
        {
            name: 'Industrial Revolution',
            description: 'Technological and social changes in the 18th-19th centuries',
            difficulty: 3,
            prerequisites: ['Renaissance'],
            granularity: 'flexible'
        }
    ],
    
    'Philosophy': [
        {
            name: 'Ethics',
            description: 'Moral philosophy and ethical theories',
            difficulty: 2,
            prerequisites: [],
            granularity: 'flexible'
        },
        {
            name: 'Logic',
            description: 'Logical reasoning and argumentation',
            difficulty: 3,
            prerequisites: [],
            granularity: 'flexible'
        },
        {
            name: 'Metaphysics',
            description: 'Nature of reality and existence',
            difficulty: 4,
            prerequisites: ['Logic'],
            granularity: 'flexible'
        },
        {
            name: 'Epistemology',
            description: 'Theory of knowledge and how we know things',
            difficulty: 4,
            prerequisites: ['Logic', 'Metaphysics'],
            granularity: 'flexible'
        }
    ]
};

// Function to get concepts for a topic
function getConceptsForTopic(topic) {
    return knowledgeConcepts[topic] || [];
}

// Function to get all available topics
function getAllTopics() {
    return Object.keys(knowledgeConcepts);
}

// Function to get concepts by difficulty level
function getConceptsByDifficulty(topic, maxDifficulty = 3) {
    const concepts = getConceptsForTopic(topic);
    return concepts.filter(concept => concept.difficulty <= maxDifficulty);
}

// Function to get concepts user doesn't know
function getUnknownConcepts(topic, knownConcepts = []) {
    const allConcepts = getConceptsForTopic(topic);
    return allConcepts.filter(concept => !knownConcepts.includes(concept.name));
}

// Function to get prerequisites for a concept
function getPrerequisites(topic, conceptName) {
    const concepts = getConceptsForTopic(topic);
    const concept = concepts.find(c => c.name === conceptName);
    return concept ? concept.prerequisites : [];
}

// Function to check if user is ready for a concept
function isReadyForConcept(topic, conceptName, userKnowledge = []) {
    const prerequisites = getPrerequisites(topic, conceptName);
    return prerequisites.every(prereq => userKnowledge.includes(prereq));
}

// Function to get next concepts to learn
function getNextConcepts(topic, userKnowledge = []) {
    const allConcepts = getConceptsForTopic(topic);
    return allConcepts.filter(concept => 
        isReadyForConcept(topic, concept.name, userKnowledge) &&
        !userKnowledge.includes(concept.name)
    );
}

module.exports = {
    knowledgeConcepts,
    getConceptsForTopic,
    getAllTopics,
    getConceptsByDifficulty,
    getUnknownConcepts,
    getPrerequisites,
    isReadyForConcept,
    getNextConcepts
};
