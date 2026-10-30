# 🧠 EduSmart AI — Fill-in-the-Blank Test Generator & Semantic Evaluator

**EduSmart AI** is an interactive, AI-powered educational assessment platform built with **React**, **TypeScript**, **Vite**, **Tailwind CSS**, and the **Google Gemini API**. 

Instead of relying on traditional multiple-choice questions, EduSmart AI reads your uploaded study materials or web links and generates **Fill-in-the-Blank** and **Short-Answer** test papers (from **10 up to 100 questions**). It evaluates student answers **case-insensitively** using keyword and semantic meaning verification, provides a detailed difficulty breakdown (**Easy, Medium, Hard**), identifies **weak topics**, and creates a personalized **Action Plan**.

---

## ✨ Key Features

- 📂 **Multi-Format Study Material Ingestion:**
  - Drag-and-drop support for `.pdf`, `.pptx`, `.ppt`, `.docx`, `.doc`, `.txt`, `.md`, `.csv`, and image files.
  - **Deep URL Analyzer:** Paste documentation, article, or tutorial links to extract study notes automatically.
  - Direct text editor with pre-loaded **Kali Linux & Network Security** study notes for instant testing.
- 🎯 **Dynamic Fill-in-the-Blank Question Engine:**
  - Zero multiple-choice guesswork—tests active recall, command syntax, and conceptual understanding.
  - Configurable test lengths: **10, 25, 50, or 100 questions**.
  - **Easy, Medium, and Hard** difficulty categorization mixed in random order.
  - **Reset & Re-phrase:** Every reset generates fresh question variations and shuffles the order.
- 🧪 **Smart Case-Insensitive & Semantic Grading:**
  - Ignores uppercase/lowercase differences completely.
  - Evaluates answers based on **core keywords, alternative command flags** (e.g., `-aG` vs `-a -G`), and **conceptual meaning** written in the student's own words.
  - Built-in **Offline Fallback Engine** ensures the app works seamlessly even without an active internet connection or API key.
- 📊 **Comprehensive Analytics & Weak-Topic Detection:**
  - Live test timer and progress tracker.
  - Accuracy breakdown across **Easy, Medium, and Hard** tiers.
  - Automatically flags **Weak Topics (< 70% accuracy)** and provides a step-by-step **Study Action Plan**.

---

## 🛠️ Tech Stack

- **Frontend:** React 18, TypeScript, Tailwind CSS
- **Icons:** Lucide React
- **Build Tool:** Vite (`vite-plugin-singlefile` compatible)
- **AI Engine:** Google Gemini API (`gemini-2.5-flash` / `gemini-3-flash-preview`) + Local Deterministic Fallback Engine

---

## 🚀 Getting Started (Local Setup in VS Code)

### 1. Clone the Repository
```bash
git clone https://github.com/CHINNAMGARIVASANTHKUMAR/Edusmart-ai-test-platform.git
cd Edusmart-ai-test-platform
```

### 2. Install Dependencies
Make sure you have [Node.js](https://nodejs.org/) (v18 or higher) installed, then run:
```bash
npm install
```

### 3. Configure Your Gemini API Key (Optional)
This repository is **100% free of hardcoded API keys** to keep your credentials safe.

1. Get a free Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey).
2. Copy `.env.example` to a new file named `.env` in the root directory:
   ```bash
   cp .env.example .env
   ```
3. Add your key inside `.env`:
   ```env
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```
   > **Note:** You can also paste your API key directly inside the web app by clicking the **"API Key Setup"** button in the top navigation bar (saved only in your browser's `localStorage`). If no key is provided, the built-in offline question generator and evaluator run automatically.

### 4. Start the Development Server
```bash
npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

## 📦 Building for Production

To create an optimized production build inside the `dist/` folder:
```bash
npm run build
```

To preview the production build locally:
```bash
npm run preview
```

---

## 🌐 Deploying to Vercel or Netlify

1. Push this repository to your GitHub account.
2. Import the repository into **[Vercel](https://vercel.com)** or **[Netlify](https://netlify.com)**.
3. In your hosting dashboard under **Site Settings → Environment Variables**, add:
   - **Key:** `VITE_GEMINI_API_KEY`
   - **Value:** `your_gemini_api_key_here`
4. Click **Deploy**.

---

## 🔒 Security Best Practices

- Never commit your `.env` file or hardcode your `AIzaSy...` key inside `src/config.ts`.
- The `.gitignore` file in this repository is pre-configured to ignore `.env`, `node_modules/`, and `dist/`.

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
