# 📧 Email Productivity Agent

AI-powered email management with customizable prompts, auto-categorization, and draft generation using Google Gemini 2.5 Flash, Supabase, and PostgreSQL.

**Live:** https://email-agent-oceanai.vercel.app

## 🚀 Quick Start

```bash
# Backend
cd backend
npm install
echo "GEMINI_API_KEY=your_key" > .env
echo "DATABASE_URL=your_url" >> .env
node seeds/initializePrompts.js
npm start

# Frontend
cd frontend
npm install
npm run dev
# Visit http://localhost:5173
```

Load mock inbox:
```bash
curl -X POST http://localhost:5000/api/inbox/load
```

## 📋 Project Structure

```
backend/
  ├── routes/        # API endpoints
  ├── utils/         # Gemini & Supabase clients
  ├── seeds/         # Default prompts
  └── db.js          # Supabase setup

frontend/
  ├── components/    # PromptManager, InboxView, EmailAgentChat, DraftManager
  └── App.jsx
```

## 📖 Usage

**Tab 1: Prompt Manager** - Edit AI prompts for categorization & replies

**Tab 2: Inbox** - Load 16 mock emails, auto-categorize (30-60s)

**Tab 3: Agent Chat** - Summarize, extract tasks, or draft replies

**Tab 4: Draft Manager** - Generate or create drafts (never sent)

## 🗄️ Database (Supabase PostgreSQL)

- **emails**: sender, subject, body, category, timestamp
- **prompts**: type, content (categorization, actionItems, autoReply)
- **drafts**: email_id, subject, body

## 🔧 Configuration

```
PORT=5000
GEMINI_API_KEY=your_gemini_key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_anon_key
```

Get credentials from Supabase dashboard → Settings → API

## 🔧 Troubleshooting

| Issue | Fix |
|-------|-----|
| No prompts | Run `node seeds/initializePrompts.js` |
| Supabase error | Verify `SUPABASE_URL` & `SUPABASE_KEY` |
| Frontend won't connect | Check backend at `http://localhost:5000` |

Reset DB: Drop tables in Supabase dashboard, then reinitialize prompts

## ✨ Features

✅ AI email categorization • ✅ Action item extraction • ✅ Draft generation • ✅ Custom prompts • ✅ Cloud PostgreSQL • ✅ Safe (no emails sent)

## 🔌 Key Endpoints

- `POST /api/inbox/load` - Load mock emails
- `POST /api/agent/categorize-all` - AI categorization
- `POST /api/agent/extract-tasks/:id` - Extract tasks
- `POST /api/agent/draft-reply/:id` - Generate reply
- `POST /api/agent/query/:id` - Custom question
- `POST/PUT/DELETE /api/drafts` - Manage drafts

## 📈 Performance

- Categorization: 3-5s/email
- Task extraction: 2-3s
- Chat queries: 1-2s
- DB queries: <100ms

## 🔧 Tech Stack

React 18 • Vite • Tailwind • Node.js • Express • Supabase PostgreSQL • Google Gemini API • Vercel
