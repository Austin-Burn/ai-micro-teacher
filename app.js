// MicroLearn PWA - Main Application Logic

class MicroLearnApp {
    constructor() {
        this.userInterests = [];
        this.notificationFrequency = 3;
        this.learningGranularity = 'auto';
        this.streakCount = 0;
        this.todayCount = 0;
        this.recentLessons = [];
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadUserData();
        await this.checkNotificationPermission();
        this.handleURLParameters();
        this.updateUI();
    }

    setupEventListeners() {
        // Navigation
        document.getElementById('dashboardBtn').addEventListener('click', () => this.showView('dashboard'));
        document.getElementById('knowledgeBtn').addEventListener('click', () => this.showView('knowledge'));
        document.getElementById('settingsBtn').addEventListener('click', () => this.showView('settings'));
        
        // Settings
        document.getElementById('addInterest').addEventListener('click', () => this.addInterest());
        document.getElementById('interestInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addInterest();
        });
        document.getElementById('saveSettings').addEventListener('click', () => this.saveSettings());
        
        // Knowledge Profile
        document.getElementById('startAssessment').addEventListener('click', () => this.startAssessment());
        
        // Lesson Request
        document.getElementById('requestLesson').addEventListener('click', () => this.requestLesson());
        
        // Notifications
        document.getElementById('enableNotifications').addEventListener('click', () => this.requestNotificationPermission());
        
        // Service Worker registration
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js')
                .then(registration => {
                    console.log('Service Worker registered:', registration);
                })
                .catch(error => {
                    console.log('Service Worker registration failed:', error);
                });
        }
    }

    async loadUserData() {
        // Load from localStorage for MVP
        const savedData = localStorage.getItem('microlearn_user_data');
        if (savedData) {
            const data = JSON.parse(savedData);
            this.userInterests = data.interests || [];
            this.notificationFrequency = data.frequency || 3;
            this.learningGranularity = data.granularity || 'auto';
            this.streakCount = data.streak || 0;
            this.todayCount = data.today || 0;
            this.recentLessons = data.recent || [];
        }
    }

    async saveUserData() {
        const data = {
            interests: this.userInterests,
            frequency: this.notificationFrequency,
            granularity: this.learningGranularity,
            streak: this.streakCount,
            today: this.todayCount,
            recent: this.recentLessons
        };
        localStorage.setItem('microlearn_user_data', JSON.stringify(data));
    }

    async checkNotificationPermission() {
        if (Notification.permission === 'granted') {
            document.getElementById('permissionBanner').classList.add('hidden');
            await this.subscribeToNotifications();
        } else {
            document.getElementById('permissionBanner').classList.remove('hidden');
        }
    }

    async requestNotificationPermission() {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            document.getElementById('permissionBanner').classList.add('hidden');
            await this.subscribeToNotifications();
        } else {
            alert('Notifications are required for the micro-learning experience. Please enable them in your browser settings.');
        }
    }

    async subscribeToNotifications() {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            try {
                const registration = await navigator.serviceWorker.ready;
                const subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: this.urlBase64ToUint8Array('BA-GzxWV-nq7Icl1cv3CFFx-bIqbm6hf8n3iGJfBfIFz57R8vYBq5emj0aDvI2cRYBfTu8SruPJWP6OhSeIGYjY')
                });
                
                // Send subscription to server
                await this.sendSubscriptionToServer(subscription);
            } catch (error) {
                console.error('Failed to subscribe to notifications:', error);
            }
        }
    }

    async sendSubscriptionToServer(subscription) {
        // For MVP, we'll simulate this
        console.log('Subscription sent to server:', subscription);
    }

    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    showView(viewName) {
        // Hide all views
        document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
        
        // Show selected view
        document.getElementById(viewName).classList.add('active');
        
        // Update navigation buttons
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(viewName + 'Btn').classList.add('active');
        
        // Update specific views
        if (viewName === 'settings') {
            this.updateSettingsForm();
        } else if (viewName === 'knowledge') {
            this.updateKnowledgeProfile();
        }
    }

    updateSettingsForm() {
        document.getElementById('notificationFrequency').value = this.notificationFrequency;
        document.getElementById('learningGranularity').value = this.learningGranularity;
        this.updateInterestList();
    }

    addInterest() {
        const input = document.getElementById('interestInput');
        const interest = input.value.trim();
        
        if (interest && !this.userInterests.includes(interest)) {
            this.userInterests.push(interest);
            input.value = '';
            this.updateInterestList();
            this.saveUserData();
        }
    }

    removeInterest(interest) {
        this.userInterests = this.userInterests.filter(i => i !== interest);
        this.updateInterestList();
        this.saveUserData();
    }

    updateInterestList() {
        const container = document.getElementById('interestList');
        container.innerHTML = '';
        
        this.userInterests.forEach(interest => {
            const tag = document.createElement('div');
            tag.className = 'interest-tag';
            tag.innerHTML = `
                ${interest}
                <button class="remove-tag" onclick="app.removeInterest('${interest}')">×</button>
            `;
            container.appendChild(tag);
        });
    }

    async saveSettings() {
        this.notificationFrequency = parseInt(document.getElementById('notificationFrequency').value);
        this.learningGranularity = document.getElementById('learningGranularity').value;
        
        await this.saveUserData();
        
        // Show success message
        const btn = document.getElementById('saveSettings');
        const originalText = btn.textContent;
        btn.textContent = 'Saved!';
        btn.style.background = '#10b981';
        
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = '#3b82f6';
        }, 2000);
    }

    updateUI() {
        // Update dashboard
        document.getElementById('streakCount').textContent = this.streakCount;
        document.getElementById('todayCount').textContent = this.todayCount;
        
        // Update recent lessons
        this.updateRecentLessons();
    }

    // Method to handle incoming notifications (called by service worker)
    handleNotification(notificationData) {
        console.log('Received notification:', notificationData);
        
        // Update today's count
        this.todayCount++;
        
        // Add to recent lessons
        this.recentLessons.unshift({
            topic: notificationData.topic || 'Learning',
            time: new Date().toLocaleTimeString(),
            type: notificationData.type || 'info'
        });
        
        // Keep only last 10 lessons
        if (this.recentLessons.length > 10) {
            this.recentLessons = this.recentLessons.slice(0, 10);
        }
        
        this.updateUI();
        this.saveUserData();
    }

    updateRecentLessons() {
        const container = document.getElementById('recentLessons');
        container.innerHTML = '';
        
        if (this.recentLessons.length === 0) {
            container.innerHTML = '<p style="padding: 1rem; color: #64748b; text-align: center;">No recent learning activity</p>';
            return;
        }
        
        this.recentLessons.forEach(lesson => {
            const item = document.createElement('div');
            item.className = 'lesson-item';
            item.innerHTML = `
                <span class="lesson-topic">${lesson.topic}</span>
                <span class="lesson-time">${lesson.time}</span>
            `;
            container.appendChild(item);
        });
    }

    // Knowledge Profile Methods
    async updateKnowledgeProfile() {
        // Load user's knowledge profile from localStorage for MVP
        const knowledgeData = localStorage.getItem('microlearn_knowledge');
        if (knowledgeData) {
            const knowledge = JSON.parse(knowledgeData);
            this.displayKnowledgeProfile(knowledge);
        } else {
            // Show empty state
            this.displayEmptyKnowledgeProfile();
        }
    }

    displayKnowledgeProfile(knowledge) {
        // Group knowledge by topic
        const topics = {};
        knowledge.forEach(item => {
            if (!topics[item.topic]) {
                topics[item.topic] = [];
            }
            topics[item.topic].push(item);
        });

        // Update stats
        const topicCount = Object.keys(topics).length;
        const conceptCount = knowledge.filter(item => item.proficiency_level > 0).length;
        const avgProficiency = knowledge.length > 0 ? 
            (knowledge.reduce((sum, item) => sum + item.proficiency_level, 0) / knowledge.length * 100).toFixed(0) : 0;

        document.getElementById('topicCount').textContent = topicCount;
        document.getElementById('conceptCount').textContent = conceptCount;
        document.getElementById('avgProficiency').textContent = avgProficiency + '%';

        // Display topics
        const container = document.getElementById('knowledgeTopics');
        container.innerHTML = '';

        Object.keys(topics).forEach(topic => {
            const topicData = topics[topic];
            const mastered = topicData.filter(item => item.proficiency_level >= 2).length;
            const total = topicData.length;
            const progress = total > 0 ? (mastered / total * 100).toFixed(0) : 0;

            const topicItem = document.createElement('div');
            topicItem.className = 'topic-item';
            topicItem.innerHTML = `
                <div class="topic-header">
                    <span class="topic-name">${topic}</span>
                    <span class="topic-progress">${progress}% mastered</span>
                </div>
                <div class="concept-list">
                    ${topicData.map(concept => `
                        <span class="concept-tag ${this.getConceptStatus(concept.proficiency_level)}">
                            ${concept.concept}
                        </span>
                    `).join('')}
                </div>
            `;
            container.appendChild(topicItem);
        });
    }

    displayEmptyKnowledgeProfile() {
        document.getElementById('topicCount').textContent = '0';
        document.getElementById('conceptCount').textContent = '0';
        document.getElementById('avgProficiency').textContent = '0%';
        
        const container = document.getElementById('knowledgeTopics');
        container.innerHTML = '<p style="padding: 1rem; color: #64748b; text-align: center;">No knowledge profile yet. Start learning to build your profile!</p>';
    }

    getConceptStatus(proficiencyLevel) {
        if (proficiencyLevel >= 2) return 'mastered';
        if (proficiencyLevel >= 1) return 'learning';
        return 'unknown';
    }

    startAssessment() {
        // For MVP, we'll create a simple assessment
        this.showAssessmentModal();
    }

    showAssessmentModal() {
        // Create assessment modal
        const modal = document.createElement('div');
        modal.className = 'assessment-modal';
        modal.innerHTML = `
            <div class="assessment-content">
                <h3>Knowledge Assessment</h3>
                <div class="assessment-progress">Question 1 of 3</div>
                <div class="assessment-question">
                    <h4>What is the difference between <code>let</code> and <code>var</code> in JavaScript?</h4>
                    <div class="assessment-options">
                        <div class="assessment-option" data-answer="0">No difference</div>
                        <div class="assessment-option" data-answer="1">let is block-scoped, var is function-scoped</div>
                        <div class="assessment-option" data-answer="2">var is newer than let</div>
                    </div>
                </div>
                <div class="assessment-actions">
                    <button class="btn-primary" onclick="app.submitAssessment(1)">Next Question</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add click handlers for options
        modal.querySelectorAll('.assessment-option').forEach(option => {
            option.addEventListener('click', () => {
                modal.querySelectorAll('.assessment-option').forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
            });
        });
    }

    submitAssessment(questionNumber) {
        // For MVP, we'll just simulate the assessment
        console.log('Assessment submitted for question', questionNumber);
        
        // Close modal
        const modal = document.querySelector('.assessment-modal');
        if (modal) {
            modal.remove();
        }
        
        // Update knowledge profile (simulate)
        this.simulateKnowledgeUpdate();
    }

    simulateKnowledgeUpdate() {
        // For MVP, simulate adding some knowledge
        const sampleKnowledge = [
            { topic: 'JavaScript', concept: 'Variables', proficiency_level: 1, confidence_score: 0.7 },
            { topic: 'JavaScript', concept: 'Functions', proficiency_level: 0, confidence_score: 0.3 },
            { topic: 'Cooking', concept: 'Knife Skills', proficiency_level: 1, confidence_score: 0.8 }
        ];
        
        localStorage.setItem('microlearn_knowledge', JSON.stringify(sampleKnowledge));
        this.updateKnowledgeProfile();
    }

    // Lesson Request Methods
    async requestLesson() {
        const button = document.getElementById('requestLesson');
        const originalText = button.textContent;
        
        try {
            // Show loading state
            button.textContent = 'Generating Lesson...';
            button.disabled = true;
            
            // Request lesson from server
            const response = await fetch('/api/lesson/request', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: 1 // For MVP, use hardcoded user ID
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Display the lesson
                this.displayLesson(result.lesson);
                
                // Update today's count
                this.todayCount++;
                this.updateUI();
                this.saveUserData();
            } else {
                throw new Error(result.error || 'Failed to generate lesson');
            }
            
        } catch (error) {
            console.error('Lesson request failed:', error);
            this.showFeedback('Failed to generate lesson. Please try again.', 'error');
        } finally {
            // Reset button
            button.textContent = originalText;
            button.disabled = false;
        }
    }

    displayLesson(lesson) {
        // Create lesson modal
        const modal = document.createElement('div');
        modal.className = 'assessment-modal';
        modal.innerHTML = `
            <div class="assessment-content">
                <h3>${lesson.topic}: ${lesson.concept}</h3>
                <div class="lesson-content">
                    <p><strong>${lesson.content}</strong></p>
                    ${lesson.reasoning ? `<p class="lesson-reasoning">${lesson.reasoning}</p>` : ''}
                </div>
                ${lesson.type === 'quiz' ? `
                    <div class="lesson-quiz">
                        <h4>Quick Quiz:</h4>
                        <div class="quiz-options">
                            ${lesson.options.map((option, i) => `
                                <div class="quiz-option" data-answer="${i}">${option}</div>
                            `).join('')}
                        </div>
                        <button class="btn-primary" onclick="app.submitQuizAnswer('${lesson.topic}', '${lesson.concept}', ${lesson.correctAnswer}, '${lesson.correctAnswerText}')">
                            Submit Answer
                        </button>
                    </div>
                ` : `
                    <div class="lesson-actions">
                        <button class="btn-primary" onclick="app.markLessonComplete('${lesson.topic}', '${lesson.concept}')">
                            Got It!
                        </button>
                        <button class="btn-secondary" onclick="app.requestEscalatedLesson('${lesson.topic}', '${lesson.concept}', ${lesson.difficulty})">
                            Too Easy
                        </button>
                    </div>
                `}
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add click handlers for quiz options
        if (lesson.type === 'quiz') {
            modal.querySelectorAll('.quiz-option').forEach(option => {
                option.addEventListener('click', () => {
                    modal.querySelectorAll('.quiz-option').forEach(opt => opt.classList.remove('selected'));
                    option.classList.add('selected');
                });
            });
        }
    }

    async submitQuizAnswer(topic, concept, correctAnswer, correctAnswerText) {
        const modal = document.querySelector('.assessment-modal');
        const selected = modal.querySelector('.quiz-option.selected');
        
        if (!selected) {
            alert('Please select an answer');
            return;
        }
        
        const userAnswer = parseInt(selected.dataset.answer);
        const isCorrect = userAnswer === correctAnswer;
        
        // Close modal
        modal.remove();
        
        // Show feedback
        if (isCorrect) {
            this.showFeedback(`Correct! ${correctAnswerText}`, 'success');
        } else {
            this.showFeedback(`Not quite. The correct answer is: ${correctAnswerText}`, 'info');
        }
        
        // Update knowledge profile
        this.updateKnowledgeProfile();
    }

    markLessonComplete(topic, concept) {
        const modal = document.querySelector('.assessment-modal');
        modal.remove();
        
        this.showFeedback(`Great! You've learned about ${concept} in ${topic}.`, 'success');
        this.updateKnowledgeProfile();
    }

    async requestEscalatedLesson(topic, concept, currentDifficulty) {
        const modal = document.querySelector('.assessment-modal');
        modal.remove();
        
        this.showFeedback(`Let's try something more challenging in ${topic}!`, 'info');
        
        try {
            // FIRST: Update user knowledge to mark concept as mastered
            const updateResponse = await fetch('/api/knowledge/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: 1,
                    topic: topic,
                    concept: concept,
                    proficiencyLevel: 2, // Mark as mastered
                    confidenceScore: 0.9
                })
            });
            
            if (!updateResponse.ok) {
                throw new Error('Failed to update knowledge profile');
            }
            
            // THEN: Request escalated content with updated user profile
            const response = await fetch('/api/ai/escalate-content', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: 1,
                    topic: topic,
                    concept: concept,
                    currentDifficultyPercentage: currentDifficulty
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.displayLesson(result.content);
            } else {
                throw new Error(result.error || 'Failed to generate escalated content');
            }
            
        } catch (error) {
            console.error('Escalated lesson request failed:', error);
            this.showFeedback('Failed to generate escalated lesson. Please try again.', 'error');
        }
    }

    // Handle URL parameters from notification actions
    handleURLParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        const action = urlParams.get('action');
        const topic = urlParams.get('topic');
        const concept = urlParams.get('concept');
        const difficulty = urlParams.get('difficulty');

        if (action === 'too_easy') {
            this.handleTooEasyFeedback(topic, concept, difficulty);
        } else if (action === 'learned') {
            this.handleLearnedFeedback(topic, concept);
        } else if (action === 'submit') {
            this.showTextInputModal(topic, concept);
        }
    }

    async handleTooEasyFeedback(topic, concept, difficulty) {
        try {
            const response = await fetch('/api/too-easy', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: 1, // For MVP, use hardcoded user ID
                    topic: topic,
                    concept: concept,
                    currentDifficulty: parseInt(difficulty) || 1
                })
            });

            const result = await response.json();
            
            if (result.success) {
                if (result.escalated) {
                    // Show escalated content immediately
                    this.showEscalatedContent(result.newContent, topic, concept);
                } else {
                    // Show message that they've mastered this area
                    this.showMasteryMessage(result.message);
                }
            }
        } catch (error) {
            console.error('Failed to handle too easy feedback:', error);
        }
    }

    showEscalatedContent(content, topic, concept) {
        // Create modal for escalated content
        const modal = document.createElement('div');
        modal.className = 'assessment-modal';
        modal.innerHTML = `
            <div class="assessment-content">
                <h3>Challenge Mode: ${topic}</h3>
                <div class="assessment-question">
                    <h4>${content.content}</h4>
                    ${content.type === 'quiz' ? `
                        <div class="assessment-options">
                            ${content.options.map((option, i) => `
                                <div class="assessment-option" data-answer="${i}">${option}</div>
                            `).join('')}
                        </div>
                    ` : `
                        <input type="text" class="assessment-input" placeholder="Your answer..." />
                    `}
                </div>
                <div class="assessment-actions">
                    <button class="btn-primary" onclick="app.submitEscalatedAnswer('${topic}', '${concept}', '${content.type}')">
                        Submit Answer
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add click handlers for quiz options
        if (content.type === 'quiz') {
            modal.querySelectorAll('.assessment-option').forEach(option => {
                option.addEventListener('click', () => {
                    modal.querySelectorAll('.assessment-option').forEach(opt => opt.classList.remove('selected'));
                    option.classList.add('selected');
                });
            });
        }
    }

    async submitEscalatedAnswer(topic, concept, type) {
        const modal = document.querySelector('.assessment-modal');
        let userAnswer = '';
        
        if (type === 'quiz') {
            const selected = modal.querySelector('.assessment-option.selected');
            userAnswer = selected ? selected.dataset.answer : '';
        } else {
            const input = modal.querySelector('.assessment-input');
            userAnswer = input ? input.value : '';
        }
        
        if (!userAnswer) {
            alert('Please provide an answer');
            return;
        }
        
        // Analyze the answer
        try {
            const response = await fetch('/api/analyze-text', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: 1,
                    userInput: userAnswer,
                    expectedAnswer: 'advanced technical terms', // Simplified for MVP
                    topic: topic,
                    concept: concept
                })
            });
            
            const result = await response.json();
            
            // Close modal
            modal.remove();
            
            // Show feedback
            if (result.analysis.isCorrect) {
                this.showFeedback('Great job! You handled the challenge well.', 'success');
            } else {
                this.showFeedback('Good attempt! This was a challenging question.', 'info');
            }
            
            // Update knowledge profile
            this.updateKnowledgeProfile();
            
        } catch (error) {
            console.error('Failed to analyze answer:', error);
            modal.remove();
        }
    }

    showMasteryMessage(message) {
        this.showFeedback(message, 'success');
    }

    showFeedback(message, type = 'info') {
        const feedback = document.createElement('div');
        feedback.className = `feedback feedback-${type}`;
        feedback.textContent = message;
        feedback.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : '#3b82f6'};
            color: white;
            padding: 1rem;
            border-radius: 0.5rem;
            z-index: 1000;
            max-width: 300px;
        `;
        
        document.body.appendChild(feedback);
        
        setTimeout(() => {
            feedback.remove();
        }, 5000);
    }

    handleLearnedFeedback(topic, concept) {
        // Mark concept as learned
        this.showFeedback(`Great! You've learned about ${concept} in ${topic}.`, 'success');
    }

    showTextInputModal(topic, concept) {
        // Show text input modal for user to provide detailed answer
        const modal = document.createElement('div');
        modal.className = 'assessment-modal';
        modal.innerHTML = `
            <div class="assessment-content">
                <h3>Your Turn: ${topic}</h3>
                <div class="assessment-question">
                    <h4>Please explain your understanding of ${concept}</h4>
                    <textarea class="assessment-textarea" placeholder="Share your knowledge..." rows="4"></textarea>
                </div>
                <div class="assessment-actions">
                    <button class="btn-primary" onclick="app.submitTextAnswer('${topic}', '${concept}')">
                        Submit Answer
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    async submitTextAnswer(topic, concept) {
        const modal = document.querySelector('.assessment-modal');
        const textarea = modal.querySelector('.assessment-textarea');
        const userAnswer = textarea.value.trim();
        
        if (!userAnswer) {
            alert('Please provide an answer');
            return;
        }
        
        try {
            const response = await fetch('/api/analyze-text', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: 1,
                    userInput: userAnswer,
                    expectedAnswer: 'knowledge explanation', // Simplified for MVP
                    topic: topic,
                    concept: concept
                })
            });
            
            const result = await response.json();
            
            // Close modal
            modal.remove();
            
            // Show feedback based on analysis
            if (result.analysis.difficultyLevel === 'advanced') {
                this.showFeedback('Excellent! Your answer shows advanced understanding.', 'success');
            } else if (result.analysis.difficultyLevel === 'beginner') {
                this.showFeedback('Good start! Keep learning to build your knowledge.', 'info');
            } else {
                this.showFeedback('Nice work! You have a solid understanding.', 'success');
            }
            
            // Update knowledge profile
            this.updateKnowledgeProfile();
            
        } catch (error) {
            console.error('Failed to analyze text answer:', error);
            modal.remove();
        }
    }
}

// Initialize the app
const app = new MicroLearnApp();

// Handle notification clicks
self.addEventListener('notificationclick', event => {
    event.notification.close();
    
    // Open the app
    event.waitUntil(
        clients.openWindow('/')
    );
});
