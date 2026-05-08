# Resolify

AI-powered customer support agent that plugs into Intercom via webhook, enriches tickets with customer context, and either auto-resolves or escalates them to humans.

---

## Project Structure

```
resolify/
├── backend/
│   ├── main.py              # FastAPI app entry point
│   ├── config.py            # Environment variable loading
│   ├── database.py          # Supabase client
│   ├── routers/
│   │   └── webhooks.py      # Intercom webhook endpoint
│   ├── models/
│   │   └── schemas.py       # Pydantic models
│   ├── requirements.txt
│   └── .env.example
└── supabase_migration.sql   # Database schema
```

---

## Setup

### 1. Clone and enter the project

```bash
git clone <your-repo-url>
cd resolify
```

### 2. Create a virtual environment

```bash
python -m venv venv
source venv/bin/activate        # macOS/Linux
venv\Scripts\activate           # Windows
```

### 3. Install dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 4. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and fill in your real values:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-supabase-anon-or-service-role-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key
APP_ENV=development
```

### 5. Run the Supabase migration

In the Supabase dashboard → SQL Editor, paste and run the contents of `supabase_migration.sql`:

```sql
CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_name TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Run Locally

```bash
cd backend
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`.

- Health check: `http://localhost:8000/health`
- API docs: `http://localhost:8000/docs`

---

## Test the Webhook

With the server running, send a test ticket:

```bash
curl -X POST http://localhost:8000/api/webhook/intercom \
  -H "Content-Type: application/json" \
  -d '{
    "ticket_id": "TICKET-001",
    "customer_email": "user@example.com",
    "customer_name": "Jane Doe",
    "message": "I cannot log in to my account. The page just spins and never loads."
  }'
```

Expected response:

```json
{
  "ticket_id": "TICKET-001",
  "status": "received",
  "db_id": "<uuid>"
}
```

---

## Deploy to Render.com

### Step 1 — Push your code to GitHub

```bash
git init
git add .
git commit -m "Initial Resolify backend"
git remote add origin https://github.com/<your-username>/resolify.git
git push -u origin main
```

### Step 2 — Create a new Web Service on Render

1. Go to [render.com](https://render.com) and sign in.
2. Click **New → Web Service**.
3. Connect your GitHub repo.
4. Configure the service:
   - **Name**: `resolify-backend`
   - **Root Directory**: `resolify/backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`

### Step 3 — Add environment variables

In the Render dashboard for your service, go to **Environment** and add:

| Key | Value |
|-----|-------|
| `SUPABASE_URL` | `https://your-project-id.supabase.co` |
| `SUPABASE_KEY` | `your-supabase-key` |
| `ANTHROPIC_API_KEY` | `sk-ant-...` |
| `APP_ENV` | `production` |

### Step 4 — Deploy

Click **Deploy**. Render will build and launch your service. Your webhook URL will be:

```
https://resolify-backend.onrender.com/api/webhook/intercom
```

Use this URL in the Intercom webhook settings.
