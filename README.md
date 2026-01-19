# 🎯 WORLD RADIO - News Channel

A modern, full-featured news aggregation platform with user authentication, admin dashboard, and article management.

## 📋 Quick Start

### **Backend Setup (Python)**
```bash
cd backend
pip install -r requirements.txt
python app.py
```

Backend runs on: `http://localhost:5000`

### **Frontend Setup**
Simply open `index.html` in your browser, or serve it with:
```bash
# Using Python
python -m http.server 3000

# Using Node.js
npx http-server -p 3000
```

Frontend runs on: `http://localhost:3000`

## 🔐 Default Admin Credentials

| Field | Value |
|-------|-------|
| **Username** | `admin` |
| **Email** | `admin@worldradio.com` |
| **Password** | `admin123` |

> ⚠️ **Important**: Change these credentials in production!

## 🚀 Features

### **News Section**
- 📰 Browse news by categories (General, Business, Tech, Sports, Health, Programming)
- 🔍 Search news articles
- ❤️ Save favorite articles (requires login)
- 📱 Fully responsive design
- ⚡ 10-minute caching for better performance

### **User Accounts**
- 👤 Register new accounts
- 🔑 Secure login with JWT tokens
- 🔒 Password hashing with bcrypt
- 💾 SQLite database storage

### **Admin Dashboard**
- 📊 **Dashboard** - System stats & health check
- 👥 **Users** - User management
- ❤️ **Favorites** - View all saved articles
- 📋 **Activity Log** - Track user actions
- 📈 **Analytics** - Usage statistics
- 📄 **Content** - Category management
- 🔧 **Tools** - Export data, backup, diagnostics
- ⚙️ **Settings** - System configuration

## 📁 Project Structure

```
news_channel/
├── index.html           # Main news page
├── login.html           # Login/Register page
├── admin.html           # Admin dashboard
├── main.js              # Frontend logic
├── style.css            # Styling
│
└── backend/
    ├── app.py           # Flask server
    ├── requirements.txt # Python dependencies
    ├── .env             # Configuration (create from .env.example)
    └── news_channel.db  # SQLite database
```

## 🔌 API Endpoints

### **Authentication**
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### **News (Public)**
- `GET /api/news?category=general` - Get news by category
- `GET /api/news?search=programming` - Search news

### **Favorites (Protected - requires JWT token)**
- `GET /api/favorites` - Get user's saved articles
- `POST /api/favorites` - Save article
- `DELETE /api/favorites/:id` - Remove from favorites

### **Health Check**
- `GET /api/health` - Backend status

## ⚙️ Configuration

Edit `backend/.env`:
```
PORT=5000
NEWSAPI_KEY=your_actual_key_here
JWT_SECRET=your_secret_key_here
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

Get your free NewsAPI key: https://newsapi.org

## 🎨 Features

✅ Real-time news from NewsAPI  
✅ User authentication & authorization  
✅ Secure password hashing (bcrypt)  
✅ JWT token-based sessions  
✅ Article caching (10 minutes)  
✅ Admin dashboard with analytics  
✅ Database backup & export  
✅ CORS enabled for frontend communication  
✅ Responsive mobile design  
✅ Error handling & logging  

## 🧪 Testing

### **Test Login**
1. Go to `http://localhost:3000/login.html`
2. Use credentials:
   - Email: `admin@worldradio.com`
   - Password: `admin123`
3. You'll see "Admin" button appear
4. Click to access dashboard

### **Test API Health**
```bash
curl http://localhost:5000/api/health
```

Should return:
```json
{
  "status": "Backend running ✅",
  "newsapi_key": "✓ Configured"
}
```

## 📦 Deployment

### **Heroku**
```bash
heroku create your-app-name
git push heroku main
```

### **Railway**
```bash
railway link
railway deploy
```

### **Render**
- Connect GitHub repo
- Set environment variables in dashboard
- Deploy automatically on push

## 🛠️ Troubleshooting

### **CORS Error**
Make sure backend is running on port 5000

### **Backend won't start**
```bash
pip install -r requirements.txt
python app.py
```

### **Port already in use**
Change PORT in `.env` to 5001

### **No articles loading**
Check NewsAPI key in `.env` is valid

## 🔒 Security Notes

- ✅ API keys hidden on backend
- ✅ Passwords hashed with bcrypt
- ✅ JWT tokens for session management
- ✅ CORS configured for allowed origins
- ⚠️ Change default admin password in production
- ⚠️ Use strong JWT_SECRET in production
- ⚠️ Enable HTTPS in production

## 📝 License

Open source - Feel free to use and modify

## 👨‍💻 Development

Built with:
- Frontend: HTML5, CSS3, Vanilla JavaScript
- Backend: Python, Flask
- Database: SQLite
- API: NewsAPI.org

---

**Made with ❤️ for news enthusiasts**
