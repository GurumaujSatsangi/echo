# echo - Social Content Analyzer

**echo** is an Engagement & Content Enhancement Optimizer. It analyzes uploaded documents and images (like marketing posters or drafts) and provides actionable insights, a quality score, grammar/clarity fixes, and platform-optimized rewrites to maximize engagement on social media.

---

## 🏗️ Architecture / Block Diagram

![Echo Block Diagram](echo_block_diagram.jpg)

The application follows a simple client-server architecture:

1. **Frontend (User Interface):** A responsive HTML/CSS/JS interface where users can upload PDFs or Images. It handles drag-and-drop uploads, maintains a history of past analyses, and visually displays the AI feedback, scores, and rewrites.
2. **Backend (Node.js & Express):** The central server that processes API requests. It handles file uploads, routes tasks, and orchestrates calls to external services.
3. **Document Parser:** Extracts raw text from uploaded files.
   - Parses PDFs using `pdf-parse`.
   - Uses **OpenAI Vision** (`gpt-4o-mini`) to perform high-accuracy Optical Character Recognition (OCR) on graphical images and posters.
4. **OpenAI API Integration:** The core intelligence layer. It uses large language models to:
   - **Classify:** Determine content category, tone, and generate summaries.
   - **Score & Edit:** Evaluate text on Grammar, Clarity, Engagement, and Tone Fit. Suggests specific structural edits and predicts a revised score.
   - **Rewrite:** Generate platform-specific posts for Twitter (X), LinkedIn, and Instagram.
   - **Suggest:** Provide optimal posting times, hashtags, and background audio moods.

---

## 🚀 Features

- **Multi-Format Extraction:** Supports both PDF documents and Images (PNG, JPG).
- **Revision Tracking:** Compare a revised document against your previous draft to see direct improvements in your quality score.
- **Detailed Quality Scoring:** Get granular scores (out of 100) for Grammar, Clarity, Engagement Potential, and Tone Fit.
- **Smart Suggestions:** Highlights exactly what text to change and explains *why*.
- **Platform Optimization:** Auto-generates tailored posts for Twitter, LinkedIn, and Instagram with relevant hashtags and best posting times.

---

## 🛠️ Tech Stack

- **Frontend:** Vanilla JavaScript, HTML5, Custom CSS Variables (Dark Theme)
- **Backend:** Node.js, Express.js
- **Services:** OpenAI API (GPT-4o-mini for text & vision), `pdf-parse`

## ⚙️ Running Locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env` file in the `backend/` directory and add your OpenAI API key:
   ```env
   OPENAI_API_KEY=your_api_key_here
   ```
3. Start the server:
   ```bash
   npm start
   ```
   *(Alternatively, use `nodemon index.js` for development.)*
4. Open your browser and navigate to `http://localhost:5000` (or whichever port is configured).
