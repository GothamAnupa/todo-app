# Deployment Guide - Railway

This guide will help you deploy the Todo App to Railway.

## Prerequisites

- Railway account (sign up at https://railway.app)
- GitHub account with the repo pushed (already done ✅)

## Step 1: Connect GitHub to Railway

1. Go to https://railway.app
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Authorize Railway with your GitHub account
5. Select the `GothamAnupa/todo-app` repository
6. Railway will auto-detect the Dockerfile

## Step 2: Configure Environment Variables

Railway will prompt you to add environment variables. Add these:

### Backend Environment Variables

```
DATABASE_URL=sqlite:///./todo.db
CORS_ORIGINS=["http://localhost:3000","http://localhost:5173","https://your-frontend-domain.com"]
SECRET_KEY=your-secret-key-here-change-this-in-production
DEBUG=false
```

To generate a secure SECRET_KEY:
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

## Step 3: Set Up the Database

1. Railway will automatically create a persistent volume for `/app/todo.db`
2. The database will be created on first run
3. The default test user will be seeded:
   - Email: `karthikwrk19@gmail.com`
   - Password: `test@123`

## Step 4: Deploy

1. Click **"Deploy"** in Railway
2. Wait for the build to complete (takes 2-5 minutes)
3. Once deployed, Railway will provide a public URL like:
   ```
   https://your-app-name.up.railway.app
   ```

## Step 5: Update Frontend for Production

Once you have the backend URL:

1. Update `frontend/.env.production` with:
   ```
   VITE_API_BASE_URL=https://your-app-name.up.railway.app/api/v1
   ```

2. Push the changes:
   ```bash
   git add .
   git commit -m "Configure production API URL"
   git push origin main
   ```

Railway will auto-redeploy when you push changes.

## Accessing Your App

- **Backend API:** `https://your-app-name.up.railway.app/api/v1`
- **API Docs:** `https://your-app-name.up.railway.app/docs`
- **Health Check:** `https://your-app-name.up.railway.app/api/v1/health`

## Default Login Credentials

```
Email: karthikwrk19@gmail.com
Password: test@123
```

## Troubleshooting

### Build fails
- Check logs in Railway dashboard: **Logs** tab
- Ensure `requirements.txt` and `package.json` exist
- Verify Dockerfile is in the root directory

### Database errors
- Railway creates a `/tmp` volume automatically
- The SQLite database persists in Railway's persistent storage
- You can view database in Logs if needed

### Frontend can't reach backend
- Ensure `VITE_API_BASE_URL` is set correctly in frontend
- Check CORS settings in `backend/config.py`
- Add your domain to `CORS_ORIGINS` in backend environment variables

## Scaling

To scale beyond free tier:
1. Go to Railway dashboard
2. Select your project
3. Adjust resource allocation under **Settings**

## Custom Domain

1. In Railway, go to **Settings** → **Custom Domain**
2. Add your domain (e.g., `todo.yourdomain.com`)
3. Update Railway's DNS records as shown

---

**Questions?** Check Railway docs: https://docs.railway.app
