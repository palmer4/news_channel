from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import sqlite3
import jwt
import bcrypt
import requests
from datetime import datetime, timedelta
from functools import wraps
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
# Allow CORS from frontend (localhost and 127.0.0.1 variants)
CORS(app, origins=[
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5500',
    'http://127.0.0.1:5500'
])

# Configuration
PORT = int(os.getenv('PORT', 5000))
NEWSAPI_KEY = os.getenv('NEWSAPI_KEY')
JWT_SECRET = os.getenv('JWT_SECRET', 'your-secret-key')
NEWSAPI_BASE = 'https://newsapi.org/v2'

# Cache dictionary (simple in-memory cache)
cache = {}

# Database setup
DATABASE = 'news_channel.db'

def init_db():
    """Initialize database tables and create default admin user"""
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    
    # Users table
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Favorites table
    c.execute('''
        CREATE TABLE IF NOT EXISTS favorites (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            article_url TEXT NOT NULL,
            article_title TEXT,
            article_image TEXT,
            saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, article_url),
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    ''')
    
    # Check if admin user exists, if not create default admin
    c.execute('SELECT * FROM users WHERE username = ?', ('admin',))
    admin_exists = c.fetchone()
    
    if not admin_exists:
        # Create default admin user
        admin_password = bcrypt.hashpw('admin123'.encode('utf-8'), bcrypt.gensalt())
        c.execute('INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
                  ('admin', 'admin@worldradio.com', admin_password))
        print("✅ Default admin user created (username: admin, password: admin123)")
    
    conn.commit()
    conn.close()

# Initialize database
init_db()

# ===== AUTHENTICATION MIDDLEWARE =====

def token_required(f):
    """Decorator to verify JWT token"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get('Authorization')
        
        if auth_header:
            try:
                token = auth_header.split(' ')[1]
            except IndexError:
                return jsonify({'error': 'Invalid token format'}), 401
        
        if not token:
            return jsonify({'error': 'No token provided'}), 401
        
        try:
            data = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
            request.user_id = data['userId']
            request.username = data['username']
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token expired'}), 403
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 403
        
        return f(*args, **kwargs)
    
    return decorated

# ===== AUTH ROUTES =====

@app.route('/api/auth/register', methods=['POST'])
def register():
    """Register new user"""
    data = request.get_json()
    
    if not data or not all(k in data for k in ['username', 'email', 'password']):
        return jsonify({'error': 'Missing fields'}), 400
    
    username = data['username']
    email = data['email']
    password = data['password']
    
    # Hash password
    password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    
    try:
        conn = sqlite3.connect(DATABASE)
        c = conn.cursor()
        c.execute('INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
                  (username, email, password_hash))
        conn.commit()
        user_id = c.lastrowid
        conn.close()
        
        # Create token
        token = jwt.encode({
            'userId': user_id,
            'username': username,
            'exp': datetime.utcnow() + timedelta(days=7)
        }, JWT_SECRET, algorithm='HS256')
        
        return jsonify({
            'success': True,
            'token': token,
            'user': {'id': user_id, 'username': username, 'email': email}
        }), 201
        
    except sqlite3.IntegrityError:
        return jsonify({'error': 'User already exists'}), 400

@app.route('/api/auth/login', methods=['POST'])
def login():
    """Login user"""
    data = request.get_json()
    
    if not data or not all(k in data for k in ['email', 'password']):
        return jsonify({'error': 'Missing email or password'}), 400
    
    email = data['email']
    password = data['password']
    
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute('SELECT * FROM users WHERE email = ?', (email,))
    user = c.fetchone()
    conn.close()
    
    if not user or not bcrypt.checkpw(password.encode('utf-8'), user[3]):
        return jsonify({'error': 'Invalid credentials'}), 401
    
    # Create token
    token = jwt.encode({
        'userId': user[0],
        'username': user[1],
        'exp': datetime.utcnow() + timedelta(days=7)
    }, JWT_SECRET, algorithm='HS256')
    
    return jsonify({
        'success': True,
        'token': token,
        'user': {'id': user[0], 'username': user[1], 'email': user[2]}
    })

# ===== NEWS ROUTES =====

@app.route('/api/news', methods=['GET'])
def get_news():
    """Get news articles"""
    category = request.args.get('category', 'general')
    search = request.args.get('search', '')
    page = request.args.get('page', '1')
    
    # Create cache key
    cache_key = f"news_{category}_{search}_{page}"
    
    # Check cache
    if cache_key in cache:
        cached_data = cache[cache_key]
        if cached_data['expires'] > datetime.now():
            print(f"Serving from cache: {cache_key}")
            return jsonify(cached_data['data'])
    
    try:
        if search:
            url = f"{NEWSAPI_BASE}/everything?q={search}&sortBy=publishedAt&page={page}&pageSize=12&apiKey={NEWSAPI_KEY}"
        else:
            url = f"{NEWSAPI_BASE}/top-headlines?category={category}&page={page}&pageSize=12&apiKey={NEWSAPI_KEY}"
        
        response = requests.get(url, timeout=10)
        data = response.json()
        
        if data.get('status') == 'error':
            return jsonify({'error': data.get('message')}), 400
        
        # Cache the results (10 minutes)
        cache[cache_key] = {
            'data': data,
            'expires': datetime.now() + timedelta(minutes=10)
        }
        
        return jsonify(data)
        
    except requests.exceptions.RequestException as e:
        return jsonify({'error': f'Failed to fetch news: {str(e)}'}), 500

# ===== FAVORITES ROUTES =====

@app.route('/api/favorites', methods=['GET'])
@token_required
def get_favorites():
    """Get user's favorite articles"""
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute('SELECT * FROM favorites WHERE user_id = ? ORDER BY saved_at DESC',
              (request.user_id,))
    favorites = c.fetchall()
    conn.close()
    
    return jsonify([{
        'id': fav[0],
        'article_url': fav[2],
        'article_title': fav[3],
        'article_image': fav[4],
        'saved_at': fav[5]
    } for fav in favorites])

@app.route('/api/favorites', methods=['POST'])
@token_required
def add_favorite():
    """Save article to favorites"""
    data = request.get_json()
    
    if not data or 'article_url' not in data:
        return jsonify({'error': 'Missing article_url'}), 400
    
    try:
        conn = sqlite3.connect(DATABASE)
        c = conn.cursor()
        c.execute('''INSERT INTO favorites (user_id, article_url, article_title, article_image)
                     VALUES (?, ?, ?, ?)''',
                  (request.user_id, data['article_url'], data.get('article_title'),
                   data.get('article_image')))
        conn.commit()
        fav_id = c.lastrowid
        conn.close()
        
        return jsonify({'success': True, 'id': fav_id}), 201
        
    except sqlite3.IntegrityError:
        return jsonify({'error': 'Already favorited'}), 400

@app.route('/api/favorites/<int:fav_id>', methods=['DELETE'])
@token_required
def delete_favorite(fav_id):
    """Remove article from favorites"""
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute('DELETE FROM favorites WHERE id = ? AND user_id = ?',
              (fav_id, request.user_id))
    conn.commit()
    conn.close()
    
    return jsonify({'success': True})

# ===== HEALTH CHECK =====

@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'Backend running ✅',
        'newsapi_key': '✓ Configured' if NEWSAPI_KEY else '✗ Missing'
    })

# ===== ERROR HANDLERS =====

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def server_error(error):
    return jsonify({'error': 'Internal server error'}), 500

# ===== RUN SERVER =====

if __name__ == '__main__':
    print(f"🚀 Backend server running on http://localhost:{PORT}")
    print(f"📰 News API Key: {'✓ Configured' if NEWSAPI_KEY else '✗ Missing'}")
    app.run(debug=True, port=PORT, host='0.0.0.0')
