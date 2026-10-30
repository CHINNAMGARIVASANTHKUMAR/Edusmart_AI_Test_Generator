# EduSmart AI Test Generator & Evaluator

Upload study material (`.pdf`, `.pptx`, `.docx`, `.txt`, or URLs) or paste notes to dynamically generate a 10, 25, 50, or 100 question Fill-in-the-Blank assessment (Easy to Hard). Includes case-insensitive keyword & semantic grading, weak-topic analytics, and a personalized study plan.

## Features
- **Multi-Format Ingestion:** Drag-and-drop support for documents, slides, text files, and URLs.
- **Dynamic Question Engine:** Generates up to 100 fill-in-the-blank questions randomized from Easy to Hard.
- **Smart Semantic Grading:** Case-insensitive evaluation checking both exact commands/keywords and conceptual meaning.
- **Topic Analytics & Study Plan:** Identifies weak areas and provides actionable next steps.

## Local Setup in VS Code

1. **Install Node.js** (v18 or newer) from https://nodejs.org
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Configure your Gemini API Key (Optional):**
   Create a `.env` file in the root directory (or copy `.env.example`):
   ```env
   VITE_GEMINI_API_KEY=your_api_key_here
   ```
   *(Alternatively, you can enter your API key directly inside the app via the **API Key Setup** button in the top bar. If no key is provided, the built-in offline question engine and smart answer checker run automatically).*
4. **Start the development server:**
   ```bash
   npm run dev
   ```
   Open http://localhost:5173 in your browser.

## Building for Production
```bash
npm run build
```
