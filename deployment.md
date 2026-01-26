# Deployment Guide for Aloe System

Since your app is built with **Vite + React** and uses **Supabase** for the backend, deployment is very simpler. You only need to host the "Frontend" (the website).

Recommended Hosting: **Vercel** (Best for Vite/React) or **Netlify**. Both are free for small projects.

---

## Option 1: Deploy with Vercel (Recommended)

### Prerequisites
1.  A GitHub, GitLab, or Bitbucket account.
2.  Push your code to a repository.

### Steps
1.  Go to [Vercel.com](https://vercel.com) and Sign Up/Log In.
2.  Click **"Add New..."** -> **"Project"**.
3.  Import your Git Repository (`Aloe-di-Elisabetta`).
4.  **Configure Project**:
    -   **Framework Preset**: Vite (should be auto-detected).
    -   **Root Directory**: `./` (default).
5.  **Environment Variables** (CRITICAL):
    Expand the "Environment Variables" section and add the exact values from your `.env` file:
    -   `VITE_SUPABASE_URL`: `https://gmhyucystwoxiinyptwx.supabase.co`
    -   `VITE_SUPABASE_ANON_KEY`: `sb_publishable_2gExbZoCjh1NBCAJO0ZPWA_Ek2M86xG...` (copy the full key from your local file)
6.  Click **Deploy**.

---

## Option 2: Deploy with Netlify (Drag & Drop)

If you don't want to use Git, you can manually build and upload.

1.  **Build Locally**:
    Open your terminal in the project folder and run:
    ```bash
    npm run build
    ```
    This creates a `dist` folder.

2.  **Upload**:
    -   Go to [Netlify.com](https://www.netlify.com) and Sign Up/Log In.
    -   Drag and drop the `dist` folder into the "Sites" area.

3.  **App Configuration**:
    -   After upload, go to **Site Settings** -> **Environment variables**.
    -   Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` with your values.
    -   **Redirects Rule** (Important for React Router):
        -   Create a file named `_redirects` inside your `public/` folder (or verify if you need to add it to build output).
        -   Content: `/*  /index.html  200`
        -   *Note: Using Git deployment (like Vercel option) handles this better automatically usually, but on Netlify manual drop you often need this file.*

---

## 3. Post-Deployment Check

1.  Open your new website URL (e.g., `aloe-system.vercel.app`).
2.  Try to Log In.
    -   *If it fails*, check that you added the Environment Variables correctly in the Vercel/Netlify dashboard.
3.  **Supabase Auth Settings**:
    -   Go to Supabase Dashboard -> Authentication -> URL Configuration.
    -   Add your new **Vercel/Netlify URL** to the **Site URL** and **Redirect URLs** list.
    -   *Required for password resets or email links to work properly.*
