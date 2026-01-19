// ===========================
// NEWS CHANNEL BACKEND SERVER
// ===========================

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3');
const NodeCache = require('node-cache');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const NEWSAPI_KEY = process.env.NEWSAPI_KEY;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const NEWSAPI_BASE = 'https://newsapi.org/v2';

// Cache with 10 minute expiration
const cache = new NodeCache({ stdTTL: 600 });

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());

// ===== DATABASE SETUP =====
const db = new sqlite3.Database('./news_channel.db', (err) => {
    if (err) console.log('Database error:', err);
    else console.log('Connected to SQLite database');
});

// Create users table
db.run(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

// Create favorites table
db.run(`
    CREATE TABLE IF NOT EXISTS favorites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        article_url TEXT NOT NULL,
        article_title TEXT,
        article_image TEXT,
        saved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, article_url),
        FOREIGN KEY(user_id) REFERENCES users(id)
    )
`);

// ===== AUTHENTICATION MIDDLEWARE =====
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.userId;
        req.username = decoded.username;
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Invalid token' });
    }
};

// ===== AUTH ROUTES =====

// Register
app.post('/api/auth/register', async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ error: 'All fields required' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        db.run(
            'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
            [username, email, hashedPassword],
            function(err) {
                if (err) {
                    return res.status(400).json({ error: 'User already exists' });
                }

                const token = jwt.sign(
                    { userId: this.lastID, username },
                    JWT_SECRET,
                    { expiresIn: '7d' }
                );

                res.json({ 
                    success: true, 
                    token, 
                    user: { id: this.lastID, username, email } 
                });
            }
        );
    } catch (err) {
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Login
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
    }

    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
        if (err || !user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        try {
            const isValid = await bcrypt.compare(password, user.password);
            
            if (!isValid) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            const token = jwt.sign(
                { userId: user.id, username: user.username },
                JWT_SECRET,
                { expiresIn: '7d' }
            );

            res.json({ 
                success: true, 
                token, 
                user: { id: user.id, username: user.username, email: user.email } 
            });
        } catch (err) {
            res.status(500).json({ error: 'Login failed' });
        }
    });
});

// ===== NEWS ROUTES =====

// Get News (with caching)
app.get('/api/news', async (req, res) => {
    const { category, search, page = 1 } = req.query;
    
    // Create cache key
    const cacheKey = `news_${category}_${search}_${page}`;
    
    // Check cache first
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
        console.log('Serving from cache:', cacheKey);
        return res.json(cachedData);
    }

    try {
        let url;
        
        if (search) {
            url = `${NEWSAPI_BASE}/everything?q=${search}&sortBy=publishedAt&page=${page}&pageSize=12&apiKey=${NEWSAPI_KEY}`;
        } else {
            url = `${NEWSAPI_BASE}/top-headlines?category=${category || 'general'}&page=${page}&pageSize=12&apiKey=${NEWSAPI_KEY}`;
        }

        const response = await axios.get(url);
        
        if (response.data.status === 'error') {
            return res.status(400).json({ error: response.data.message });
        }

        // Cache the results
        cache.set(cacheKey, response.data);
        
        res.json(response.data);
    } catch (err) {
        console.error('News fetch error:', err.message);
        res.status(500).json({ error: 'Failed to fetch news' });
    }
});

// ===== FAVORITES ROUTES =====

// Get user favorites
app.get('/api/favorites', verifyToken, (req, res) => {
    db.all(
        'SELECT * FROM favorites WHERE user_id = ? ORDER BY saved_at DESC',
        [req.userId],
        (err, favorites) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to fetch favorites' });
            }
            res.json(favorites);
        }
    );
});

// Add to favorites
app.post('/api/favorites', verifyToken, (req, res) => {
    const { article_url, article_title, article_image } = req.body;

    if (!article_url) {
        return res.status(400).json({ error: 'Article URL required' });
    }

    db.run(
        'INSERT INTO favorites (user_id, article_url, article_title, article_image) VALUES (?, ?, ?, ?)',
        [req.userId, article_url, article_title, article_image],
        function(err) {
            if (err) {
                return res.status(400).json({ error: 'Already favorited' });
            }
            res.json({ success: true, id: this.lastID });
        }
    );
});

// Remove from favorites
app.delete('/api/favorites/:id', verifyToken, (req, res) => {
    db.run(
        'DELETE FROM favorites WHERE id = ? AND user_id = ?',
        [req.params.id, req.userId],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Failed to remove favorite' });
            }
            res.json({ success: true });
        }
    );
});

// ===== HEALTH CHECK =====
app.get('/api/health', (req, res) => {
    res.json({ status: 'Backend running ✅' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Backend server running on http://localhost:${PORT}`);
    console.log(`📰 News API Key: ${NEWSAPI_KEY ? '✓ Configured' : '✗ Missing'}`);
});
