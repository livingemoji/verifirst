# VerifyFirst Scam Shield

## Project info

**URL**: [Your Project URL Here]

## How can I edit this code?

You can work locally using your own IDE. The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Supabase (Edge Functions, Storage, Database)

## How can I deploy this project?

1. **Push Database Migrations**
   ```bash
   supabase db push
   ```
2. **Deploy Edge Functions**
   ```bash
   supabase functions deploy batch-analyze
   supabase functions deploy analyze-scam
   supabase functions deploy submit-scam-report
   supabase functions deploy trending-scams
   supabase functions deploy vote
   ```
3. **Deploy Frontend**
   - Push your code to your main branch and trigger a deployment (Vercel, Netlify, etc.)
   - Ensure your environment variables (Supabase URL, anon key, etc.) are set in your deployment environment.

## Custom Domain

To connect a custom domain, follow your deployment platform's instructions for domain management.

## API & Usage

See [docs/API_USAGE.md](docs/API_USAGE.md) for full API documentation, batch processing, and best practices.
