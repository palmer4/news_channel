# Pre-GitHub Publishing Checklist

## 🔴 CRITICAL - Do NOT Commit These Files!

### `.env` Files (Already in .gitignore)
✅ `.env` - IGNORED by Git (good!)  
✅ `backend/.env` - IGNORED by Git (good!)  

**Your .env files contain:**
- `NEWSAPI_KEY` - Real API key (exposed!)
- `JWT_SECRET` - Private secret (exposed!)

---

## ⚠️ WHAT TO CHANGE BEFORE PUBLISHING

### 1. **Default Admin Credentials** ⚠️ CHANGE THIS
Currently in `backend/app.py` (lines 72-75):
```python
admin_password = bcrypt.hashpw('admin123'.encode('utf-8'), bcrypt.gensalt())
c.execute('INSERT INTO users VALUES (NULL, ?, ?, ?, ?)', 
          ('admin', 'admin@worldradio.com', admin_password))
```

**⚠️ SECURITY ISSUE:** Default credentials are hardcoded!

**BEFORE PUBLISHING:**
- Change `admin123` to a strong, random password
- Change `admin@worldradio.com` to your email
- Or remove the default admin creation and require manual setup

**SOLUTION OPTIONS:**

**Option 1: Generate Random Default Credentials**
```python
import secrets
import string

# Generate random password
default_password = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(16))
admin_password = bcrypt.hashpw(default_password.encode('utf-8'), bcrypt.gensalt())

c.execute('INSERT INTO users VALUES (NULL, ?, ?, ?, ?)', 
          ('admin', 'your-email@example.com', admin_password))
print(f"✅ Admin created - Save this password: {default_password}")
```

**Option 2: Require Environment Variables**
```python
ADMIN_EMAIL = os.getenv('ADMIN_EMAIL', 'admin@example.com')
ADMIN_PASSWORD = os.getenv('ADMIN_PASSWORD', None)

if not ADMIN_PASSWORD:
    print("⚠️ WARNING: Set ADMIN_PASSWORD env variable!")
    ADMIN_PASSWORD = secrets.token_urlsafe(16)

admin_password = bcrypt.hashpw(ADMIN_PASSWORD.encode('utf-8'), bcrypt.gensalt())
```

**Option 3: Remove Hardcoded Admin (Recommended for Public Repos)**
```python
# Don't create default admin at all
# Require admin to register through the UI or manual database setup
```

---

## ✅ Files Safe to Commit

✅ `index.html` - No credentials  
✅ `login.html` - No credentials  
✅ `admin.html` - No credentials  
✅ `main.js` - No credentials  
✅ `style.css` - No credentials  
✅ `backend/app.py` - Code only (after removing default creds)  
✅ `backend/requirements.txt` - Dependencies only  
✅ `.env.example` - Template without real values  
✅ `backend/.env.example` - Template without real values  
✅ `.gitignore` - Ignore rules  
✅ `README.md` - Documentation  
✅ All `.md` files  

---

## 🚀 Pre-Publish Checklist

### Step 1: Verify .gitignore
```bash
cd /path/to/news_channel
git status

# Should NOT show:
# - backend/.env
# - .env
# - node_modules/
# - __pycache__/
```

### Step 2: Update Default Admin (Choose one option above)

### Step 3: Verify No Secrets in Code
```bash
# Search for hardcoded secrets
grep -r "api_key" .
grep -r "secret" . --include="*.py" --include="*.js"
grep -r "password" . --include="*.py" --include="*.js"

# Should only find these safe ones:
# - os.getenv('NEWSAPI_KEY')  ✅ (loads from .env)
# - os.getenv('JWT_SECRET')   ✅ (loads from .env)
# - 'admin123'                ⚠️ (REMOVE THIS!)
```

### Step 4: Test with Example Files
```bash
# Copy examples
cp backend/.env.example backend/.env
cp .env.example .env

# Edit with test credentials
# Run app to verify it works
python backend/app.py
```

### Step 5: Final Verification
- [ ] `.env` files in `.gitignore` ✓
- [ ] No real API keys in code ✓
- [ ] No JWT secrets in code ✓
- [ ] Default admin password removed or randomized ✓
- [ ] `.env.example` files included ✓
- [ ] `ENV_SETUP.md` included ✓
- [ ] README updated with setup instructions ✓

### Step 6: Commit & Push
```bash
git add .
git commit -m "Prepare for GitHub publishing - remove hardcoded credentials"
git push origin main
```

---

## 📋 What Users Will See on GitHub

✅ **Public (will show):**
- Code structure
- Features
- Setup instructions
- `.env.example` templates

❌ **Hidden (won't show):**
- Your actual API keys
- Your JWT secrets
- Your admin password
- `.env` files

---

## 🔑 Current Credentials Status

| Item | Current Status | Action Needed |
|------|---|---|
| `NEWSAPI_KEY` | In `.env` (hidden) | ✅ Safe - in .gitignore |
| `JWT_SECRET` | In `.env` (hidden) | ✅ Safe - in .gitignore |
| `Admin email` | `admin@worldradio.com` in code | ⚠️ Consider changing |
| `Admin password` | `admin123` in code | 🔴 **MUST CHANGE** |

---

## 🛡️ Final Recommendations

1. **Remove or Randomize Default Admin** - This is the main security issue
2. **Add Admin Setup Documentation** - Explain how to create admin accounts
3. **Regenerate JWT Secret** - After publishing, create a new one for production
4. **Set Newsletter API Rotation Policy** - Plan to regenerate API keys periodically
5. **Add Security.md** - Document security practices for contributors

---

## Example Secure Setup for Production

### `.env.example` (can be public)
```dotenv
PORT=5000
NEWSAPI_KEY=your_newsapi_key_here
JWT_SECRET=your_jwt_secret_here
ADMIN_EMAIL=your_admin_email@example.com
ADMIN_PASSWORD=your_strong_admin_password_here
```

### `backend/app.py` (secure code)
```python
# Load from environment variables
ADMIN_EMAIL = os.getenv('ADMIN_EMAIL', 'admin@example.com')
ADMIN_PASSWORD = os.getenv('ADMIN_PASSWORD')

if ADMIN_PASSWORD:
    admin_password = bcrypt.hashpw(ADMIN_PASSWORD.encode('utf-8'), bcrypt.gensalt())
    c.execute('INSERT INTO users VALUES (NULL, ?, ?, ?, ?)', 
              ('admin', ADMIN_EMAIL, admin_password))
else:
    print("⚠️ No ADMIN_PASSWORD set. Skip creating default admin.")
```

---

## 🎯 Summary

**YES, you need to change credentials before publishing!**

**Most Important:**
1. 🔴 Change admin password from `admin123` to something random
2. ✅ Verify `.env` files are in `.gitignore` (already done)
3. ✅ Verify no hardcoded API keys (already hidden in `.env`)
4. ✅ Include `.env.example` as template

After these changes, your repo will be safe to publish publicly!
