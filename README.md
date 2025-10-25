# MicroLearn PWA

A Progressive Web App for personalized AI-assisted micro learning with accountability features.

## Features

### MVP (Current)
- **Push Notifications**: Bite-sized learning content delivered via notifications
- **Interactive Notifications**: Multiple choice buttons and text inputs
- **Interest-Based Learning**: Users select topics they want to learn about
- **Granularity Control**: AI-assessed default with user override options
- **Progress Tracking**: Basic streak and lesson counting
- **Offline Support**: Service worker for offline functionality

### Planned Features
- **AI Integration**: Personalized content generation and recommendations
- **Advanced Analytics**: Detailed learning progress and insights
- **Social Accountability**: Share progress with friends/community
- **Adaptive Learning**: AI adjusts difficulty based on performance

## Architecture

### Frontend (PWA)
- **HTML/CSS/JS**: Vanilla JavaScript for MVP simplicity
- **Service Worker**: Handles push notifications and offline functionality
- **Manifest**: PWA installation and app-like experience

### Backend
- **Node.js + Express**: Simple server for MVP
- **SQLite**: Local database for user data and content
- **Web Push API**: Notification delivery system

### Content System
- **Text-based**: Short, bite-sized learning content
- **Interactive**: Multiple choice quizzes and text inputs
- **Granularity-aware**: Different detail levels based on topic requirements

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- A web browser with PWA support

### Installation

1. **Clone/Download** the project files
2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up VAPID keys** (for push notifications):
   - Generate VAPID keys: `npx web-push generate-vapid-keys`
   - Replace the keys in `server.js` and `app.js`

4. **Start the server**:
   ```bash
   npm start
   ```

5. **Open the app**: Navigate to `http://localhost:3000`

### Development

```bash
# Start with auto-reload
npm run dev
```

## Usage

### For Users
1. **Open the app** in your browser
2. **Enable notifications** when prompted
3. **Add interests** in the settings (e.g., "JavaScript", "Cooking", "History")
4. **Set notification frequency** (default: 3 per day)
5. **Choose granularity** level or let AI assess it
6. **Receive notifications** with learning content
7. **Interact** with quizzes and provide feedback

### For Developers
- **Frontend**: Edit `index.html`, `styles.css`, `app.js`
- **Backend**: Modify `server.js` for API changes
- **Notifications**: Update `sw.js` for notification handling
- **Content**: Add to `sample-content.js` for testing

## Content Types

### Information Notifications
- **Text-only**: Bite-sized facts and tips
- **Actions**: "Learn More", "Got It"

### Quiz Notifications
- **Multiple Choice**: Interactive questions
- **Actions**: Answer options, immediate feedback

### Hybrid Notifications
- **Text + Input**: Information with text response
- **Actions**: Submit answer, skip

## Granularity System

### High Granularity (Required for certain topics)
- **Code**: Specific concepts, syntax, techniques
- **Mathematics**: Formulas, operations, proofs
- **Languages**: Vocabulary, grammar, conjugations

### Flexible Granularity (User/AI choice)
- **Cooking**: General tips or specific techniques
- **History**: Broad events or detailed battles
- **Philosophy**: General concepts or specific theories

## API Endpoints

- `POST /api/subscribe` - Subscribe to notifications
- `POST /api/notify` - Send notification to user
- `GET /api/content/:topic` - Get learning content
- `POST /api/progress` - Save learning progress
- `GET /api/progress/:userId` - Get user progress
- `POST /api/schedule` - Update notification schedule

## Database Schema

### Users Table
- `id` - Primary key
- `subscription` - Push notification subscription
- `interests` - JSON array of user interests
- `frequency` - Notifications per day
- `granularity` - Learning granularity preference

### Content Table
- `id` - Primary key
- `topic` - Content topic
- `content` - Learning content text
- `type` - Content type (info, quiz, tip)
- `granularity` - Required granularity level

### Progress Table
- `id` - Primary key
- `user_id` - Foreign key to users
- `content_id` - Foreign key to content
- `completed` - Boolean completion status
- `score` - Quiz/learning score
- `timestamp` - When completed

## Future Development

### Phase 2: AI Integration
- Content generation based on user interests
- Personalized difficulty adjustment
- Learning path optimization
- Progress analysis and insights

### Phase 3: Advanced Features
- Social accountability features
- Advanced analytics dashboard
- Content creation tools
- Mobile app development

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details
