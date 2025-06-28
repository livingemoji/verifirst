# 🚀 Deployment Guide for VerifyFirst Scam Shield

## Prerequisites

1. **Supabase Account** - Create a new project at [supabase.com](https://supabase.com)
2. **Supabase CLI** - Install with `npm install -g supabase`
3. **Node.js 18+** - For building the frontend
4. **Git** - For version control

## Step 1: Environment Setup

Create a `.env` file in your project root:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# Optional: For production builds
NODE_ENV=production
```

**Get these values from:**
- Go to your Supabase project dashboard
- Settings → API → Project URL and anon/public key

## Step 2: Database Setup

1. **Login to Supabase CLI:**
```bash
supabase login
```

2. **Link your project:**
```bash
supabase link --project-ref your-project-id
```

3. **Run database migrations:**
```bash
supabase db push
```

## Step 3: Deploy Edge Functions

Deploy all your Edge Functions:

```bash
# Deploy all functions
supabase functions deploy

# Or deploy individually:
supabase functions deploy analyze-scam
supabase functions deploy batch-analyze
supabase functions deploy submit-scam-report
supabase functions deploy trending-scams
supabase functions deploy vote
```

## Step 4: Build and Deploy Frontend

### Option A: Deploy to Vercel (Recommended)

1. **Install Vercel CLI:**
```bash
npm install -g vercel
```

2. **Deploy:**
```bash
vercel --prod
```

3. **Set environment variables in Vercel dashboard**

### Option B: Deploy to Netlify

1. **Build the project:**
```bash
npm run build
```

2. **Deploy the `dist` folder to Netlify**

### Option C: Deploy to GitHub Pages

1. **Add to package.json:**
```json
{
  "scripts": {
    "deploy": "npm run build && gh-pages -d dist"
  }
}
```

2. **Install gh-pages:**
```bash
npm install --save-dev gh-pages
```

3. **Deploy:**
```bash
npm run deploy
```

## Step 5: Configure CORS (If needed)

If you encounter CORS issues, update your Supabase project settings:

1. Go to Supabase Dashboard → Settings → API
2. Add your frontend domain to "Additional Allowed Origins"

## Step 6: Test Deployment

1. **Test the main features:**
   - Scam analysis
   - File uploads
   - User authentication
   - Batch processing

2. **Check Edge Functions:**
   - Verify all functions are deployed
   - Test API endpoints

## Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | ✅ |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key | ✅ |
| `NODE_ENV` | Environment (production/development) | ❌ |

## Troubleshooting

### Common Issues:

1. **"Missing environment variables"**
   - Ensure `.env` file exists and has correct values
   - For production, set env vars in your hosting platform

2. **CORS errors**
   - Add your domain to Supabase CORS settings
   - Check Edge Function CORS headers

3. **Database connection errors**
   - Verify Supabase URL and keys
   - Ensure migrations are applied

4. **Edge Functions not working**
   - Check function deployment status
   - Verify function URLs in your code

## Performance Monitoring

After deployment, monitor:
- Database performance
- Edge Function response times
- Rate limiting effectiveness
- Cache hit rates

## Security Checklist

- [ ] Environment variables are set
- [ ] CORS is properly configured
- [ ] Rate limiting is active
- [ ] Database RLS policies are enabled
- [ ] API keys are secure

## Next Steps

1. Set up monitoring and analytics
2. Configure custom domain
3. Set up SSL certificates
4. Implement backup strategies
5. Add performance monitoring 