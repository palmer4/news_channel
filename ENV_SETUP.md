# Environment Variables & Git Setup Guide

## 🔒 Security Best Practices

### Never Commit `.env` Files
The `.env` file contains sensitive credentials and should **NEVER** be committed to Git:
- API Keys
- JWT Secrets
- Database passwords
- Database URIs

### How `.gitignore` Works
The `.gitignore` file in this project already excludes `.env` files:
```
.env
.env.local
.env.*.local
backend/.env
```

This means Git will ignore all `.env` files and won't track them.

---

## 📋 Setup Instructions

### 1. First Time Setup
```bash
# Navigate to backend directory
cd backend

# Copy the example file to create actual .env
cp .env.example .env

# Edit .env with your actual credentials
# Uncomment and fill in the values:
# - NEWSAPI_KEY: Get from https://newsapi.org (free tier available)
# - JWT_SECRET: Generate a secure random string
```

### 2. Frontend Setup (if needed)
```bash
# Navigate to root directory
cd ..

# Copy example file
cp .env.example .env

# Fill in your actual values
```

### 3. Verify `.gitignore` is Working
```bash
# Check that .env files are ignored
git status

# Should NOT show any .env files as untracked
```

---

## 🚀 Getting Your API Keys

### NewsAPI
1. Visit https://newsapi.org
2. Sign up for a free account
3. Get your API key from the dashboard
4. Add to backend/.env: `NEWSAPI_KEY=your_key_here`

### JWT Secret
Generate a secure random string:
```bash
# Option 1: Python
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Option 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Option 3: Use any online UUID generator
```

---

## 📝 File Structure

```
news_channel/
├── .gitignore           ← Tells Git to ignore .env files
├── .env.example         ← Template for root-level env vars
├── backend/
│   ├── .env             ← IGNORED by Git (don't commit)
│   ├── .env.example     ← Template for backend env vars
│   ├── app.py
│   └── requirements.txt
├── index.html
├── login.html
├── main.js
└── style.css
```

---

## ✅ Checklist Before Committing

- [ ] `.env` files are created from `.env.example`
- [ ] All sensitive values are filled in `.env`
- [ ] `.gitignore` exists and includes `.env` patterns
- [ ] Running `git status` shows NO `.env` files
- [ ] `.env.example` files are committed (without sensitive data)
- [ ] Backend is working with credentials in `.env`
- [ ] Frontend can reach backend

---

## 🔄 Common Workflows

### If You Accidentally Committed `.env`
```bash
# Remove from Git history
git rm --cached backend/.env
git rm --cached .env

# Commit the removal
git commit -m "Remove .env files"

# Verify it's gone
git status
```

### Sharing Credentials Safely
**DO NOT** send `.env` files via email or commit to repos. Instead:
1. Share `.env.example` (template only)
2. Send credentials through secure channels (1Password, LastPass, etc.)
3. Team members create their own `.env` from `.env.example`

---

## 🛑 What NOT to Do

❌ Commit `.env` with real credentials  
❌ Push API keys to GitHub  
❌ Share `.env` files in Slack/Email  
❌ Remove `.env` from `.gitignore`  

## ✅ What TO Do

✅ Commit `.env.example` with placeholder values  
✅ Keep real `.env` locally only  
✅ Use `.gitignore` to exclude `.env`  
✅ Regenerate JWT secrets regularly  
✅ Rotate API keys periodically  

---

## 🔗 Useful Resources

- [Git .gitignore Documentation](https://git-scm.com/docs/gitignore)
- [Twelve-Factor App - Config](https://12factor.net/config)
- [OWASP - Secrets Management](https://owasp.org/www-project-web-security-testing-guide/)
- [NewsAPI Documentation](https://newsapi.org/docs)
