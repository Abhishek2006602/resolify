# Resolify — Deployment Guide

## 1. Push to GitHub

```bash
cd C:\Users\ABHISHEK\Desktop\Resolify
git init
git add .
git commit -m "Initial commit"
```

Go to github.com → New repository → name it `resolify` → copy the remote URL, then:

```bash
git remote add origin https://github.com/YOUR_USERNAME/resolify.git
git branch -M main
git push -u origin main
```

---

## 2. Deploy Backend to Render.com

1. Go to **render.com** → New → Web Service
2. Connect your GitHub account and select the `resolify` repo
3. Set **Root Directory** to: `resolify/backend`
4. Render will detect `render.yaml` automatically — confirm these settings:
   - **Runtime:** Python
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT`
   - **Region:** Singapore
   - **Plan:** Free

### Environment Variables to add on Render

Go to your service → **Environment** tab and add:

| Key | Value |
|-----|-------|
| `SUPABASE_URL` | your Supabase project URL |
| `SUPABASE_KEY` | your Supabase anon key |
| `ANTHROPIC_API_KEY` | your Anthropic API key |
| `OPENAI_API_KEY` | your OpenAI API key |
| `ALLOWED_ORIGINS` | `https://your-app.vercel.app,http://localhost:5173` (update after Vercel deploy) |
| `APP_ENV` | `production` |

5. Click **Deploy** — wait ~2 minutes for first build
6. Copy your service URL: `https://resolify-backend.onrender.com`

---

## 3. Deploy Frontend to Vercel

1. Go to **vercel.com** → New Project → Import from GitHub → select `resolify`
2. Set **Root Directory** to: `resolify/frontend`
3. Vercel auto-detects Vite — confirm:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

### Environment Variables to add on Vercel

Go to your project → **Settings** → **Environment Variables** and add:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://resolify-backend.onrender.com` (your Render URL) |

4. Click **Deploy** — takes ~1 minute
5. Copy your Vercel URL: `https://resolify.vercel.app`

---

## 4. Post-Deployment

### Update ALLOWED_ORIGINS on Render
Once you have your Vercel URL, go back to Render → Environment and update:
```
ALLOWED_ORIGINS=https://resolify.vercel.app,http://localhost:5173
```
Then trigger a manual redeploy on Render.

### Update Supabase RLS for clients table
Run this in Supabase SQL Editor if you haven't already:
```sql
CREATE POLICY "anon read clients"
ON public.clients
FOR SELECT TO anon
USING (true);
```

### Configure Intercom Webhook (when ready)
In Intercom Developer Hub → Webhooks:
- URL: `https://resolify-backend.onrender.com/api/webhook/intercom/live`
- Subscribe to: `conversation.user.created`, `conversation.user.replied`
- Copy the webhook secret → add to your clients row: `intercom_webhook_secret = 'your-secret'`

---

## 5. Verify Deployment

Test the backend health check:
```bash
curl https://resolify-backend.onrender.com/health
```
Expected: `{"status":"ok","timestamp":"..."}`

Test a ticket:
```bash
curl -X POST https://resolify-backend.onrender.com/api/webhook/intercom \
  -H "Content-Type: application/json" \
  -d '{"ticket_id":"prod_test_001","customer_email":"test@example.com","message":"How do I reset my password?","customer_name":"Test"}'
```
