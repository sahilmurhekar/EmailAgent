# 📧 Email Productivity Agent

AI-powered email management with customizable prompts, auto-categorization, and draft generation using Google Gemini 2.5 Flash.

## 🚀 Quick Start

### Prerequisites
- Node.js v16+
- Google Gemini API Key ([get here](https://aistudio.google.com/app/apikey))

### Setup

```bash
# Backend
cd backend
npm install
echo "GEMINI_API_KEY=your_key_here" > .env
node seeds/initializePrompts.js
npm start

# Frontend (new terminal)
cd frontend
npm install
npm run dev

# Visit http://localhost:5173
```

### Load Mock Inbox
```bash
curl -X POST http://localhost:5000/api/inbox/load
```

## 📋 Project Structure

```
backend/
  ├── routes/        # API endpoints (emails, prompts, drafts, agent, inbox)
  ├── utils/         # Gemini API wrapper, DB helpers
  ├── seeds/         # Default prompts loader
  ├── db.js          # SQLite setup
  └── server.js      # Express server

frontend/
  ├── components/
  │   ├── PromptManager.jsx     # Edit AI prompts
  │   ├── InboxView.jsx         # Load & categorize emails
  │   ├── EmailAgentChat.jsx    # Ask questions about emails
  │   └── DraftManager.jsx      # Create & save drafts
  └── App.jsx
```

## 📖 Usage

### Tab 1: Prompt Manager
- Edit prompts for categorization, action items, replies
- Click Save to apply changes

### Tab 2: Inbox
- **Load Mock Inbox** → loads 16 sample emails
- **Categorize All** → AI categorizes (30-60s)
- Click email to view full content

### Tab 3: Agent Chat
- Select email → click **Summarize**, **Extract Tasks**, or **Draft Reply**
- Or ask custom questions

### Tab 4: Draft Manager
- **Generate AI Draft** → auto-create reply
- **Create Blank** → start from scratch
- Save, edit, or delete drafts (never sent)

## 🔌 Key Endpoints

```
POST /api/inbox/load                 # Load mock inbox
POST /api/agent/categorize-all       # Categorize all emails
POST /api/agent/extract-tasks/:id    # Extract action items
POST /api/agent/draft-reply/:id      # Generate reply
POST /api/agent/query/:id            # Custom question
POST /api/drafts                     # Save draft
PUT /api/drafts/:id                  # Update draft
DELETE /api/drafts/:id               # Delete draft
POST /api/prompts                    # Save prompt
```

## 🗄️ Database

**emails:** sender, subject, body, category, timestamp
**prompts:** type, content (categorization, actionItems, autoReply)
**drafts:** emailId, subject, body, createdAt

## 🛠️ Configuration

### Environment (.env)
```
PORT=5000
GEMINI_API_KEY=your_api_key
```

### Custom Prompts
Edit `backend/seeds/initializePrompts.js`, then run:
```bash
node seeds/initializePrompts.js
```

### Add Emails
Edit `backend/data/mock-inbox.json`, reload inbox in UI

## 🔧 Troubleshooting

| Issue | Solution |
|-------|----------|
| "No prompts available" | Run `node seeds/initializePrompts.js` |
| "Categorization prompt not found" | Initialize prompts (see above) |
| Gemini API errors | Verify `GEMINI_API_KEY` in `.env` |
| Frontend won't connect | Check backend running on `http://localhost:5000` |

Reset database:
```bash
rm backend/email_agent.db
npm start  # Recreates tables
node seeds/initializePrompts.js
```

## 📊 Mock Inbox

16 emails across:
- Important (2-3): Meeting requests, urgent tasks
- To-Do (2-3): Task assignments, code reviews
- Newsletter (3-4): TechCrunch, podcasts
- Spam (1-2): Promotional offers

## ✨ Features

✅ Load & manage email inboxes
✅ Auto-categorize with AI
✅ Extract action items & deadlines
✅ Chat Q&A about emails
✅ Generate reply drafts
✅ Customizable prompts
✅ Draft saving (never sends emails)

## 🛡️ Safety

- ✅ No emails ever sent (drafts only)
- ✅ Local storage (SQLite)
- ✅ Error handling throughout
- ✅ Prompt customization anytime

## 📈 Performance

- Categorization: ~3-5s per email
- Task extraction: ~2-3s
- Chat queries: ~1-2s
- Draft generation: ~3-5s

## 🔧 Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS
- **Backend:** Node.js, Express, SQLite3
- **AI:** Google Gemini 2.5 Flash API

