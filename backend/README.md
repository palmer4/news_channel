# News Channel Backend

Complete backend for the news channel with authentication, caching, and favorites management.

## Setup

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment
Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

Add your values:
```
PORT=5000
NEWSAPI_KEY=your_actual_api_key_here
JWT_SECRET=your_long_random_secret_key_here
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### 3. Run Server
```bash
# Development with auto-reload
npm run dev

# Production
npm start
```

Server runs on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login

### News (Public)
- `GET /api/news?category=general&page=1` - Get news by category
- `GET /api/news?search=programming&page=1` - Search news

### Favorites (Protected)
- `GET /api/favorites` - Get saved articles
- `POST /api/favorites` - Save article
- `DELETE /api/favorites/:id` - Remove from favorites

## Features

✅ **Secure API Key** - Hidden from frontend  
✅ **Article Caching** - 10-minute cache to reduce API calls  
✅ **User Authentication** - JWT tokens  
✅ **Favorites** - Save articles per user  
✅ **CORS Enabled** - Frontend integration ready  

## Deployment

### Heroku (Free tier)
```bash
heroku create your-app-name
git push heroku main
```

### Railway
```bash
railway link
railway deploy
```

### Render
- Connect GitHub repo
- Set environment variables
- Deploy

## Database

SQLite database (`news_channel.db`) stores:
- User accounts
- Passwords (bcrypt hashed)
- Favorite articles
