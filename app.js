// MicroLearn PWA - Main Application Logic

class MicroLearnApp {
    constructor() {
        this.userInterests = [];
        this.notificationFrequency = 3;
        this.learningGranularity = 'auto';
        this.streakCount = 0;
        this.todayCount = 0;
        this.recentLessons = [];
        this.userId = localStorage.getItem('microlearn_userId') || null;
        this.regInterests = []; // For registration form
        
        // Clear any cached hardcoded data
        this.clearCachedData();
        
        this.init();
    }

    clearCachedData() {
        // Clear any hardcoded data that might be cached
        const cachedData = localStorage.getItem('microlearn_user_data');
        if (cachedData) {
            try {
                const data = JSON.parse(cachedData);
                // Remove any hardcoded interests that shouldn't be there
                if (data.interests && Array.isArray(data.interests)) {
                    const hardcodedTopics = ['JavaScript', 'Cooking', 'Variables', 'Functions', 'Knife Skills'];
                    data.interests = data.interests.filter(interest => 
                        !hardcodedTopics.includes(interest)
                    );
                    localStorage.setItem('microlearn_user_data', JSON.stringify(data));
                }
            } catch (e) {
                console.log('No cached data to clear');
            }
        }
        
        // Clear hardcoded knowledge profile data
        const knowledgeData = localStorage.getItem('microlearn_knowledge');
        if (knowledgeData) {
            try {
                const knowledge = JSON.parse(knowledgeData);
                // Check if it contains hardcoded topics
                const hasHardcodedData = knowledge.some(item => 
                    ['JavaScript', 'Cooking', 'Variables', 'Functions', 'Knife Skills'].includes(item.topic) ||
                    ['Variables', 'Functions', 'Knife Skills'].includes(item.concept)
                );
                if (hasHardcodedData) {
                    localStorage.removeItem('microlearn_knowledge');
                    console.log('Removed hardcoded knowledge profile data');
                }
            } catch (e) {
                console.log('No knowledge data to clear');
            }
        }
    }

    // Manual cache clearing function (can be called from browser console)
    clearAllCache() {
        localStorage.removeItem('microlearn_userId');
        localStorage.removeItem('microlearn_userName');
        localStorage.removeItem('microlearn_userEmail');
        localStorage.removeItem('microlearn_user_data');
        localStorage.removeItem('microlearn_knowledge');
        console.log('All cache cleared! Please refresh the page.');
    }

    async init() {
        this.setupEventListeners();
        await this.loadUserData();
        await this.checkNotificationPermission();
        this.checkRegistrationStatus();
        this.handleURLParameters();
        this.updateUI();
    }
    
    checkRegistrationStatus() {
        console.log('Checking registration status:', {
            userId: this.userId,
            userInterests: this.userInterests,
            interestsLength: this.userInterests ? this.userInterests.length : 'undefined'
        });
        
        if (this.userId) {
            // Check if user has completed setup (has interests)
            if (this.userInterests && this.userInterests.length > 0) {
                // User is fully set up, show main app
                console.log('User is fully set up, showing main app');
                document.getElementById('login').style.display = 'none';
                document.getElementById('setup').style.display = 'none';
                document.getElementById('dashboard').classList.add('active');
                document.getElementById('registrationSection').style.display = 'none';
                document.getElementById('settingsSection').style.display = 'block';
                document.querySelector('.nav').style.display = 'flex';
            } else {
                // User logged in but needs to complete setup
                console.log('User needs to complete setup, showing setup screen');
                document.getElementById('login').style.display = 'none';
                document.getElementById('setup').style.display = 'block';
                document.getElementById('setup').classList.add('active');
                document.getElementById('dashboard').classList.remove('active');
                document.getElementById('registrationSection').style.display = 'none';
                document.getElementById('settingsSection').style.display = 'none';
                document.querySelector('.nav').style.display = 'none';
            }
        } else {
            // User not logged in, show login
            console.log('User not logged in, showing login');
            document.getElementById('login').style.display = 'block';
            document.getElementById('setup').style.display = 'none';
            document.getElementById('dashboard').classList.remove('active');
            document.getElementById('registrationSection').style.display = 'none';
            document.getElementById('settingsSection').style.display = 'none';
            document.querySelector('.nav').style.display = 'none';
        }
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
        
        // Login
        document.getElementById('loginUser').addEventListener('click', () => this.loginUser());
        document.getElementById('registerUser').addEventListener('click', () => this.registerNewUser());
        document.getElementById('toggleForm').addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleLoginRegister();
        });
        document.getElementById('userEmail').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                if (document.getElementById('loginUser').style.display !== 'none') {
                    this.loginUser();
                } else {
                    this.registerNewUser();
                }
            }
        });
        document.getElementById('userName').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                if (document.getElementById('loginUser').style.display !== 'none') {
                    this.loginUser();
                } else {
                    this.registerNewUser();
                }
            }
        });
        
        // Setup/Onboarding
        document.getElementById('startLearning').addEventListener('click', () => this.startLearning());
        
        // Registration
        document.getElementById('regInterestInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addRegInterest();
        });
        document.getElementById('addRegInterest').addEventListener('click', () => this.addRegInterest());
        document.getElementById('registerUser').addEventListener('click', () => this.registerUser());
        
        // Knowledge Profile
        document.getElementById('startAssessment').addEventListener('click', () => this.startAssessment());
        
        // Lesson Request
        document.getElementById('requestLesson').addEventListener('click', () => this.requestLesson());
        
        // Admin Panel
        document.getElementById('adminBtn').addEventListener('click', () => this.showView('admin'));
        document.getElementById('testAI').addEventListener('click', () => this.testAI());
        document.getElementById('getMemoryStats').addEventListener('click', () => this.getMemoryStats());
        document.getElementById('requestLessonAdmin').addEventListener('click', () => this.requestLessonAdmin());
        document.getElementById('getUserData').addEventListener('click', () => this.getUserData());
        document.getElementById('clearAllMemory').addEventListener('click', () => this.clearAllMemory());
        
        // User Management
        document.getElementById('loadUsers').addEventListener('click', () => this.loadUsers());
        document.getElementById('userSelect').addEventListener('change', () => this.onUserSelect());
        document.getElementById('deleteUserData').addEventListener('click', () => this.deleteUserData());
        
        // User Data Management
        document.getElementById('loadUsersForData').addEventListener('click', () => this.loadUsersForData());
        document.getElementById('userDataSelect').addEventListener('change', () => this.onUserDataSelect());
        document.getElementById('getUserData').addEventListener('click', () => this.getUserData());
        
        // AI Topic Analysis
        document.getElementById('addTopicsAI').addEventListener('click', () => this.openAITopicPanel());
        document.getElementById('closeAIPanel').addEventListener('click', () => this.closeAITopicPanel());
        document.getElementById('analyzeTopics').addEventListener('click', () => this.analyzeTopics());
        document.getElementById('applyAnalysis').addEventListener('click', () => this.applyAnalysis());
        
        // Cache Management
        document.getElementById('clearBrowserCache').addEventListener('click', () => this.clearBrowserCache());
        
        // AI Debug
        document.getElementById('debugAIInput').addEventListener('click', () => this.debugAIInput());
        
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
        if (!this.userId) {
            return;
        }
        
        try {
            // Fetch user data from database
            const response = await fetch(`/api/user/${this.userId}`);
            if (response.ok) {
                const userData = await response.json();
                if (userData.success) {
                    this.userInterests = userData.user.interests || [];
                    this.notificationFrequency = userData.user.frequency || 3;
                    this.learningGranularity = userData.user.granularity || 'auto';
                    this.userName = userData.user.name;
                    this.userEmail = userData.user.email;
                }
            }
        } catch (error) {
            console.error('Failed to load user data from database:', error);
            // Fallback to localStorage if database fails
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

    // Login Methods
    toggleLoginRegister() {
        const isLogin = document.getElementById('loginUser').style.display !== 'none';
        
        if (isLogin) {
            // Switch to register
            document.getElementById('formTitle').textContent = 'Register';
            document.getElementById('loginUser').style.display = 'none';
            document.getElementById('registerUser').style.display = 'block';
            document.getElementById('loginNote').textContent = 'Already have an account? ';
            document.getElementById('toggleForm').textContent = 'Sign in here';
        } else {
            // Switch to login
            document.getElementById('formTitle').textContent = 'Sign In';
            document.getElementById('loginUser').style.display = 'block';
            document.getElementById('registerUser').style.display = 'none';
            document.getElementById('loginNote').textContent = 'Don\'t have an account? ';
            document.getElementById('toggleForm').textContent = 'Register here';
        }
    }
    
    async loginUser() {
        const email = document.getElementById('userEmail').value.trim();
        const name = document.getElementById('userName').value.trim();
        
        if (!email || !name) {
            this.showFeedback('Please enter both email and name!', 'error');
            return;
        }
        
        try {
            // Check if user exists or create new one
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: email,
                    name: name
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Store user ID and check if they need setup
                this.userId = result.userId;
                this.userName = name;
                this.userEmail = email;
                localStorage.setItem('microlearn_userId', this.userId);
                localStorage.setItem('microlearn_userName', name);
                localStorage.setItem('microlearn_userEmail', email);
                
                // Load user data to check if they have interests
                await this.loadUserData();
                
                // Check if user needs setup or can go to main app
                this.checkRegistrationStatus();
                
                if (result.isNewUser) {
                    this.showFeedback(`Welcome ${name}! Let's set up your learning preferences.`, 'success');
                } else {
                    this.showFeedback(`Welcome back ${name}!`, 'success');
                }
            } else {
                throw new Error(result.error || 'Login failed');
            }
            
        } catch (error) {
            console.error('Login failed:', error);
            this.showFeedback('Login failed. Please try again.', 'error');
        }
    }
    
    async registerNewUser() {
        const email = document.getElementById('userEmail').value.trim();
        const name = document.getElementById('userName').value.trim();
        
        if (!email || !name) {
            this.showFeedback('Please enter both email and name!', 'error');
            return;
        }
        
        try {
            // Register new user
            const response = await fetch('/api/register-new', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: email,
                    name: name
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Store user ID and show setup
                this.userId = result.userId;
                this.userName = name;
                this.userEmail = email;
                localStorage.setItem('microlearn_userId', this.userId);
                localStorage.setItem('microlearn_userName', name);
                localStorage.setItem('microlearn_userEmail', email);
                
                // Show setup screen
                this.checkRegistrationStatus();
                
                this.showFeedback(`Welcome ${name}! Let's set up your learning preferences.`, 'success');
            } else {
                throw new Error(result.error || 'Registration failed');
            }
            
        } catch (error) {
            console.error('Registration failed:', error);
            this.showFeedback(error.message || 'Registration failed. Please try again.', 'error');
        }
    }

    // Setup/Onboarding Methods
    async startLearning() {
        const interestsText = document.getElementById('setupInterests').value.trim();
        
        if (!interestsText) {
            this.showFeedback('Please tell us what you want to learn about!', 'error');
            return;
        }
        
        try {
            // Show loading state
            const button = document.getElementById('startLearning');
            const originalText = button.textContent;
            button.textContent = 'Analyzing your interests...';
            button.disabled = true;
            
            // Get user profile data for AI analysis
            const userProfile = {
                userId: this.userId,
                name: this.userName,
                email: this.userEmail,
                existingInterests: this.userInterests || []
            };
            
            // Send to AI for analysis
            const analysisResponse = await fetch('/api/ai/analyze-interests', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    rawInput: interestsText,
                    userProfile: userProfile
                })
            });
            
            const analysisResult = await analysisResponse.json();
            
            if (!analysisResult.success) {
                throw new Error(analysisResult.error || 'AI analysis failed');
            }
            
            const analysis = analysisResult.analysis;
            
            // Extract interests from AI analysis - get both category names and individual topics
            const interests = [];
            analysis.categories.forEach(cat => {
                // Add category name
                interests.push(cat.name);
                // Add individual topics from the category
                if (cat.topics && Array.isArray(cat.topics)) {
                    interests.push(...cat.topics);
                }
            });
            
            // Remove duplicates
            const uniqueInterests = [...new Set(interests)];
            
            if (uniqueInterests.length === 0) {
                throw new Error('No learning interests could be identified');
            }
            
            // Complete the user setup with AI-analyzed interests
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: this.userId,
                    interests: uniqueInterests,
                    frequency: 3, // Default
                    granularity: 'auto' // Default
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Store user ID and show main app
                this.userId = result.userId;
                localStorage.setItem('microlearn_userId', this.userId);
                
                // Update user interests
                this.userInterests = [...uniqueInterests];
                this.saveUserData();
                
                // Show main app
                this.checkRegistrationStatus();
                
                // Store AI analysis results
                this.aiAnalysis = analysis;
                localStorage.setItem('microlearn_aiAnalysis', JSON.stringify(analysis));
                
                // Show personalized feedback based on AI analysis
                const tone = analysis.analysis.overallTone;
                const confidence = analysis.analysis.confidenceLevel;
                const proportions = analysis.analysis.learningProportions;
                const primaryFocus = proportions.primaryFocus;
                const learningRatio = proportions.learningRatio;
                
                let message = `Welcome to MicroLearn! I detected you're ${tone} about learning. `;
                message += `I'll focus ${learningRatio} with ${primaryFocus} as your main area. `;
                message += `Your personalized learning path is ready!`;
                
                this.showFeedback(message, 'success');
            } else {
                throw new Error(result.error || 'Registration failed');
            }
            
        } catch (error) {
            console.error('Setup failed:', error);
            this.showFeedback(`Setup failed: ${error.message}`, 'error');
        } finally {
            // Reset button
            const button = document.getElementById('startLearning');
            button.textContent = 'Start Learning';
            button.disabled = false;
        }
    }
    
    parseInterestsFromText(text) {
        // Simple parsing - split by common separators and clean up
        const separators = /[,;.\n\r]+/;
        return text
            .split(separators)
            .map(interest => interest.trim())
            .filter(interest => interest.length > 0)
            .map(interest => {
                // Capitalize first letter of each word
                return interest.split(' ')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                    .join(' ');
            });
    }

    // Registration Methods
    addRegInterest() {
        const input = document.getElementById('regInterestInput');
        const interest = input.value.trim();
        
        if (interest && !this.regInterests.includes(interest)) {
            this.regInterests.push(interest);
            this.updateRegInterestList();
            input.value = '';
        }
    }
    
    updateRegInterestList() {
        const container = document.getElementById('regInterestList');
        container.innerHTML = this.regInterests.map(interest => 
            `<span class="tag">${interest} <button onclick="app.removeRegInterest('${interest}')">×</button></span>`
        ).join('');
    }
    
    removeRegInterest(interest) {
        this.regInterests = this.regInterests.filter(i => i !== interest);
        this.updateRegInterestList();
    }
    
    async registerUser() {
        const frequency = document.getElementById('regFrequency').value;
        const granularity = document.getElementById('regGranularity').value;
        
        if (this.regInterests.length === 0) {
            this.showFeedback('Please add at least one interest!', 'error');
            return;
        }
        
        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    interests: this.regInterests,
                    frequency: parseInt(frequency),
                    granularity: granularity
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Store user ID and hide registration form
                this.userId = result.userId;
                localStorage.setItem('microlearn_userId', this.userId);
                
                // Hide registration, show settings
                document.getElementById('registrationSection').style.display = 'none';
                document.getElementById('settingsSection').style.display = 'block';
                
                // Update interests in settings
                this.userInterests = [...this.regInterests];
                this.updateInterestList();
                this.saveUserData();
                
                this.showFeedback('Welcome to MicroLearn! Your profile has been created.', 'success');
            } else {
                throw new Error(result.error || 'Registration failed');
            }
            
        } catch (error) {
            console.error('Registration failed:', error);
            this.showFeedback('Registration failed. Please try again.', 'error');
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
        // For MVP, start with empty knowledge profile
        const emptyKnowledge = [];
        
        localStorage.setItem('microlearn_knowledge', JSON.stringify(emptyKnowledge));
        this.updateKnowledgeProfile();
    }

    // Lesson Request Methods
    async requestLesson() {
        if (!this.userId) {
            this.showFeedback('Please register first to start learning!', 'error');
            this.showView('settings');
            return;
        }
        
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
                    userId: this.userId
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
                    userId: this.userId,
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
                    userId: this.userId,
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

    // Admin Panel Methods
    async testAI() {
        const resultBox = document.getElementById('aiTestResult');
        resultBox.textContent = 'Testing AI connection...';
        resultBox.className = 'result-box';
        
        try {
            const response = await fetch('/api/ai/test');
            const result = await response.json();
            
            if (result.success) {
                resultBox.textContent = `✅ AI Connected\nResponse: ${result.response}`;
                resultBox.className = 'result-box success';
            } else {
                resultBox.textContent = `❌ AI Test Failed\nError: ${result.error}`;
                resultBox.className = 'result-box error';
            }
        } catch (error) {
            resultBox.textContent = `❌ Connection Error\n${error.message}`;
            resultBox.className = 'result-box error';
        }
    }

    async getMemoryStats() {
        const resultBox = document.getElementById('memoryStatsResult');
        resultBox.textContent = 'Getting memory statistics...';
        resultBox.className = 'result-box';
        
        try {
            const response = await fetch('/api/ai/memory/stats');
            const result = await response.json();
            
            if (result.success) {
                const stats = result.stats;
                resultBox.textContent = `✅ Memory Stats\nTotal Users: ${stats.totalUsers}\nTotal Exchanges: ${stats.totalExchanges}\n\nUser Details:\n${JSON.stringify(stats.userStats, null, 2)}`;
                resultBox.className = 'result-box success';
            } else {
                resultBox.textContent = `❌ Failed to get memory stats\nError: ${result.error}`;
                resultBox.className = 'result-box error';
            }
        } catch (error) {
            resultBox.textContent = `❌ Connection Error\n${error.message}`;
            resultBox.className = 'result-box error';
        }
    }

    async requestLessonAdmin() {
        const resultBox = document.getElementById('lessonResult');
        resultBox.textContent = 'Generating lesson...';
        resultBox.className = 'result-box';
        
        try {
            const response = await fetch('/api/lesson/request', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: 1
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                resultBox.textContent = `✅ Lesson Generated\n${JSON.stringify(result.lesson, null, 2)}`;
                resultBox.className = 'result-box success';
            } else {
                resultBox.textContent = `❌ Failed to generate lesson\nError: ${result.error}`;
                resultBox.className = 'result-box error';
            }
        } catch (error) {
            resultBox.textContent = `❌ Connection Error\n${error.message}`;
            resultBox.className = 'result-box error';
        }
    }

    async getUserData() {
        const resultBox = document.getElementById('userDataResult');
        resultBox.textContent = 'Getting user data...';
        resultBox.className = 'result-box';
        
        try {
            // This would be a new endpoint to get user data
            const response = await fetch('/api/user/1');
            const result = await response.json();
            
            if (result.success) {
                resultBox.textContent = `✅ User Data\n${JSON.stringify(result.user, null, 2)}`;
                resultBox.className = 'result-box success';
            } else {
                resultBox.textContent = `❌ Failed to get user data\nError: ${result.error}`;
                resultBox.className = 'result-box error';
            }
        } catch (error) {
            resultBox.textContent = `❌ Connection Error\n${error.message}`;
            resultBox.className = 'result-box error';
        }
    }

    async clearAllMemory() {
        const resultBox = document.getElementById('clearMemoryResult');
        resultBox.textContent = 'Clearing all AI memory...';
        resultBox.className = 'result-box';
        
        try {
            const response = await fetch('/api/ai/memory/all', {
                method: 'DELETE'
            });
            
            const result = await response.json();
            
            if (result.success) {
                resultBox.textContent = `✅ Memory Cleared\n${result.message}`;
                resultBox.className = 'result-box success';
            } else {
                resultBox.textContent = `❌ Failed to clear memory\nError: ${result.error}`;
                resultBox.className = 'result-box error';
            }
        } catch (error) {
            resultBox.textContent = `❌ Connection Error\n${error.message}`;
            resultBox.className = 'result-box error';
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
                    userId: this.userId,
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
                    userId: this.userId,
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
                    userId: this.userId,
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

    // User Management Methods
    async loadUsers() {
        const resultBox = document.getElementById('userManagementResult');
        resultBox.textContent = 'Loading users...';
        resultBox.className = 'result-box';
        
        try {
            const response = await fetch('/api/admin/users');
            const result = await response.json();
            
            if (result.success) {
                const userSelect = document.getElementById('userSelect');
                userSelect.innerHTML = '<option value="">Select a user...</option>';
                
                result.users.forEach(user => {
                    const option = document.createElement('option');
                    option.value = user.id;
                    option.textContent = `${user.name} (${user.email}) - ID: ${user.id}`;
                    userSelect.appendChild(option);
                });
                
                resultBox.textContent = `✅ Loaded ${result.users.length} users`;
                resultBox.className = 'result-box success';
            } else {
                resultBox.textContent = `❌ Failed to load users\nError: ${result.error}`;
                resultBox.className = 'result-box error';
            }
        } catch (error) {
            resultBox.textContent = `❌ Connection Error\n${error.message}`;
            resultBox.className = 'result-box error';
        }
    }
    
    onUserSelect() {
        const userSelect = document.getElementById('userSelect');
        const deleteButton = document.getElementById('deleteUserData');
        
        if (userSelect.value) {
            deleteButton.disabled = false;
            deleteButton.textContent = `Delete User ${userSelect.value} Data`;
        } else {
            deleteButton.disabled = true;
            deleteButton.textContent = 'Delete User Data';
        }
    }
    
    async deleteUserData() {
        const userSelect = document.getElementById('userSelect');
        const userId = userSelect.value;
        const resultBox = document.getElementById('userManagementResult');
        
        if (!userId) {
            resultBox.textContent = '❌ Please select a user first';
            resultBox.className = 'result-box error';
            return;
        }
        
        // Confirm deletion
        const confirmMessage = `Are you sure you want to delete ALL data for user ${userId}?\n\nThis will delete:\n- User account\n- Knowledge profile\n- Learning progress\n- AI memory\n\nThis action cannot be undone!`;
        
        if (!confirm(confirmMessage)) {
            resultBox.textContent = '❌ Deletion cancelled';
            resultBox.className = 'result-box error';
            return;
        }
        
        resultBox.textContent = `Deleting all data for user ${userId}...`;
        resultBox.className = 'result-box';
        
        try {
            const response = await fetch(`/api/admin/users/${userId}`, {
                method: 'DELETE'
            });
            
            const result = await response.json();
            
            if (result.success) {
                resultBox.textContent = `✅ Successfully deleted all data for user ${userId}\n\nDeleted:\n- User account\n- Knowledge profile (${result.deletedKnowledge} entries)\n- Learning progress (${result.deletedProgress} entries)\n- AI memory cleared`;
                resultBox.className = 'result-box success';
                
                // Clear localStorage if this is the current user
                if (this.userId == userId) {
                    localStorage.removeItem('microlearn_userId');
                    localStorage.removeItem('microlearn_userName');
                    localStorage.removeItem('microlearn_userEmail');
                    localStorage.removeItem('microlearn_user_data');
                    this.userId = null;
                    this.userName = null;
                    this.userEmail = null;
                    this.userInterests = [];
                    
                    // Redirect to login/setup
                    this.checkRegistrationStatus();
                }
                
                // Also clear any cached user data to ensure fresh state
                this.userInterests = [];
                this.notificationFrequency = 3;
                this.learningGranularity = 'auto';
                
                // Reload users list
                this.loadUsers();
                
                // Reset selection
                userSelect.value = '';
                this.onUserSelect();
            } else {
                resultBox.textContent = `❌ Failed to delete user data\nError: ${result.error}`;
                resultBox.className = 'result-box error';
            }
        } catch (error) {
            resultBox.textContent = `❌ Connection Error\n${error.message}`;
            resultBox.className = 'result-box error';
        }
    }
    
    // User Data Management Methods
    async loadUsersForData() {
        const resultBox = document.getElementById('userDataResult');
        resultBox.textContent = 'Loading users...';
        resultBox.className = 'result-box';
        
        try {
            const response = await fetch('/api/admin/users');
            const result = await response.json();
            
            if (result.success) {
                const userSelect = document.getElementById('userDataSelect');
                userSelect.innerHTML = '<option value="">Select a user...</option>';
                
                result.users.forEach(user => {
                    const option = document.createElement('option');
                    option.value = user.id;
                    option.textContent = `${user.name} (${user.email}) - ID: ${user.id}`;
                    userSelect.appendChild(option);
                });
                
                resultBox.textContent = `✅ Loaded ${result.users.length} users`;
                resultBox.className = 'result-box success';
            } else {
                resultBox.textContent = `❌ Failed to load users\nError: ${result.error}`;
                resultBox.className = 'result-box error';
            }
        } catch (error) {
            resultBox.textContent = `❌ Connection Error\n${error.message}`;
            resultBox.className = 'result-box error';
        }
    }
    
    onUserDataSelect() {
        const userSelect = document.getElementById('userDataSelect');
        const getUserDataButton = document.getElementById('getUserData');
        
        if (userSelect.value) {
            getUserDataButton.disabled = false;
            getUserDataButton.textContent = `View User ${userSelect.value} Data`;
        } else {
            getUserDataButton.disabled = true;
            getUserDataButton.textContent = 'View User Data';
        }
    }
    
    async getUserData() {
        const userSelect = document.getElementById('userDataSelect');
        const userId = userSelect.value;
        const resultBox = document.getElementById('userDataResult');
        
        if (!userId) {
            resultBox.textContent = 'Please select a user first';
            resultBox.className = 'result-box error';
            return;
        }
        
        resultBox.textContent = 'Loading user data...';
        resultBox.className = 'result-box';
        
        try {
            const response = await fetch(`/api/user/${userId}`);
            const result = await response.json();
            
            if (result.success) {
                const user = result.user;
                // Format as JSON for better readability
                const formattedData = {
                    userInfo: {
                        id: user.id,
                        name: user.name || 'Not set',
                        email: user.email || 'Not set',
                        createdAt: user.createdAt || 'Unknown'
                    },
                    interests: user.interests || [],
                    knowledgeProfile: user.knowledgeProfile || {},
                    learningHistory: user.learningHistory || [],
                    preferences: user.preferences || {}
                };
                
                resultBox.textContent = JSON.stringify(formattedData, null, 2);
                resultBox.className = 'result-box success large-text-area';
            } else {
                resultBox.textContent = `❌ Error loading user data\nError: ${result.error}`;
                resultBox.className = 'result-box error';
            }
        } catch (error) {
            resultBox.textContent = `❌ Connection Error\n${error.message}`;
            resultBox.className = 'result-box error';
        }
    }

    // AI Topic Analysis Methods
    openAITopicPanel() {
        // Hide settings view and show AI panel
        document.getElementById('settings').classList.remove('active');
        document.getElementById('aiTopicPanel').classList.add('active');
        document.getElementById('aiTopicPanel').style.display = 'block';
        
        // Clear previous results
        document.getElementById('aiAnalysisResult').style.display = 'none';
        document.getElementById('aiTopicInterests').value = '';
    }

    closeAITopicPanel() {
        // Hide AI panel and show settings view
        document.getElementById('aiTopicPanel').classList.remove('active');
        document.getElementById('aiTopicPanel').style.display = 'none';
        document.getElementById('settings').classList.add('active');
    }

    async analyzeTopics() {
        const interestsText = document.getElementById('aiTopicInterests').value.trim();
        if (!interestsText) {
            alert('Please enter your learning interests');
            return;
        }

        const analyzeButton = document.getElementById('analyzeTopics');
        const resultDiv = document.getElementById('aiAnalysisResult');
        const contentDiv = document.getElementById('aiAnalysisContent');
        const applyButton = document.getElementById('applyAnalysis');

        try {
            analyzeButton.textContent = 'Analyzing...';
            analyzeButton.disabled = true;

            const response = await fetch('/api/ai/analyze-interests', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    interests: interestsText
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.success && result.analysis) {
                // Display the analysis results
                this.displayAnalysisResults(result.analysis, contentDiv);
                resultDiv.style.display = 'block';
                applyButton.style.display = 'block';
                applyButton.onclick = () => this.applyAnalysis(result.analysis);
            } else {
                throw new Error(result.error || 'Failed to analyze interests');
            }

        } catch (error) {
            console.error('Error analyzing topics:', error);
            contentDiv.innerHTML = `<p class="error">❌ Error: ${error.message}</p>`;
            resultDiv.style.display = 'block';
            applyButton.style.display = 'none';
        } finally {
            analyzeButton.textContent = 'Analyze Topics';
            analyzeButton.disabled = false;
        }
    }

    displayAnalysisResults(analysis, contentDiv) {
        let html = '<div class="analysis-categories">';
        
        if (analysis.categories && analysis.categories.length > 0) {
            html += '<h5>📚 Learning Categories:</h5><ul>';
            analysis.categories.forEach(category => {
                html += `<li><strong>${category.name}</strong>`;
                if (category.topics && category.topics.length > 0) {
                    html += ` - Topics: ${category.topics.join(', ')}`;
                }
                html += '</li>';
            });
            html += '</ul>';
        }

        if (analysis.recommendations && analysis.recommendations.length > 0) {
            html += '<h5>💡 Recommendations:</h5><ul>';
            analysis.recommendations.forEach(rec => {
                html += `<li>${rec}</li>`;
            });
            html += '</ul>';
        }

        html += '</div>';
        contentDiv.innerHTML = html;
    }

    async applyAnalysis(analysis) {
        if (!analysis || !analysis.categories) {
            alert('No analysis data to apply');
            return;
        }

        try {
            // Extract all topics from the analysis
            const newTopics = [];
            analysis.categories.forEach(category => {
                newTopics.push(category.name);
                if (category.topics && Array.isArray(category.topics)) {
                    newTopics.push(...category.topics);
                }
            });

            // Remove duplicates
            const uniqueTopics = [...new Set(newTopics)];

            if (uniqueTopics.length === 0) {
                alert('No topics found in the analysis');
                return;
            }

            // Add topics to current interests
            const currentInterests = [...this.userInterests];
            const allInterests = [...new Set([...currentInterests, ...uniqueTopics])];

            // Update user interests
            this.userInterests = allInterests;
            this.updateInterestDisplay();

            // Save to database
            const response = await fetch(`/api/user/${this.userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    interests: allInterests
                })
            });

            if (response.ok) {
                alert(`✅ Added ${uniqueTopics.length} new topics to your interests!`);
                this.closeAITopicPanel();
            } else {
                throw new Error('Failed to save interests');
            }

        } catch (error) {
            console.error('Error applying analysis:', error);
            alert(`❌ Error: ${error.message}`);
        }
    }

    // Admin Cache Management
    clearBrowserCache() {
        const resultBox = document.getElementById('clearCacheResult');
        
        try {
            // Clear localStorage
            localStorage.removeItem('microlearn_userId');
            localStorage.removeItem('microlearn_userName');
            localStorage.removeItem('microlearn_userEmail');
            localStorage.removeItem('microlearn_user_data');
            localStorage.removeItem('microlearn_knowledge');
            
            // Clear sessionStorage
            sessionStorage.clear();
            
            // Reset app state
            this.userId = null;
            this.userName = null;
            this.userEmail = null;
            this.userInterests = [];
            this.regInterests = [];
            
            // Update UI
            this.checkRegistrationStatus();
            this.updateInterestList();
            
            resultBox.textContent = '✅ Cache cleared successfully! Page will refresh in 2 seconds...';
            resultBox.className = 'result-box success';
            
            // Auto-refresh after 2 seconds
            setTimeout(() => {
                window.location.reload();
            }, 2000);
            
        } catch (error) {
            console.error('Error clearing cache:', error);
            resultBox.textContent = `❌ Error clearing cache: ${error.message}`;
            resultBox.className = 'result-box error';
        }
    }

    // AI Debug Methods
    async debugAIInput() {
        const resultBox = document.getElementById('aiInputResult');
        
        if (!this.userId) {
            resultBox.textContent = '❌ No user logged in. Please log in first.';
            resultBox.className = 'result-box error';
            return;
        }
        
        try {
            resultBox.textContent = 'Loading AI input data...';
            resultBox.className = 'result-box';
            
            // Get user data from database
            const response = await fetch(`/api/user/${this.userId}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            if (!result.success) {
                throw new Error(result.error || 'Failed to fetch user data');
            }
            
            const userData = result.user;
            
            // Format the AI input data for display
            const aiInputData = {
                userId: this.userId,
                userData: {
                    id: userData.id,
                    name: userData.name,
                    email: userData.email,
                    interests: userData.interests,
                    knowledgeProfile: userData.knowledgeProfile,
                    learningHistory: userData.learningHistory,
                    preferences: userData.preferences
                },
                aiPrompt: this.generateAIPromptPreview(userData),
                timestamp: new Date().toISOString()
            };
            
            // Display formatted JSON
            resultBox.textContent = JSON.stringify(aiInputData, null, 2);
            resultBox.className = 'result-box success large-text-area';
            
        } catch (error) {
            console.error('Error fetching AI input data:', error);
            resultBox.textContent = `❌ Error: ${error.message}`;
            resultBox.className = 'result-box error large-text-area';
        }
    }

    generateAIPromptPreview(userData) {
        const { interests, knowledgeProfile, preferences } = userData;
        
        return `Generate a personalized micro-learning lesson based on the user's profile:

User Interests: ${Array.isArray(interests) ? interests.join(', ') : (interests || 'Not specified')}
Knowledge Profile: ${JSON.stringify(knowledgeProfile)}
Preferences: ${JSON.stringify(preferences)}

CRITICAL: Focus ONLY on the user's specific interests: ${Array.isArray(interests) ? interests.join(', ') : 'None specified'}

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
- reasoning: Why this lesson was chosen for this user`;
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
