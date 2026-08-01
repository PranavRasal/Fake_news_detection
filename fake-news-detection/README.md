# Fake News Detector

A Next.js website that lets users enter a news title and check whether it appears to be credible by comparing it with live MediaStack news coverage.

## Features

- Enter any headline to analyze
- Send the title to a server-side API route
- Use the MediaStack API to fetch related coverage
- Show a verdict, confidence score, and supporting articles

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Make sure the MediaStack API key is available in the environment file `.env.local`:
   ```bash
   MEDIASTACK_API_KEY=your_key_here
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open http://localhost:3000
