# 📄 Research Notes

An AI-powered research paper annotation tool. Upload any PDF, highlight text, and get instant AI explanations — all saved as notes right beside your paper.

![Research Notes App](https://img.shields.io/badge/React-18-blue?logo=react) ![Vite](https://img.shields.io/badge/Vite-5-purple?logo=vite) ![License](https://img.shields.io/badge/license-MIT-green)

---

## ✨ Features

- **Split panel view** — PDF on the left, notes on the right, side by side
- **Text highlighting** — select any text on the paper to annotate it
- **AI explanations** — instantly explains highlighted text in plain English
- **Bi-directional navigation** — click a highlight to jump to its note, click a note to jump to that page
- **Multiple AI providers** — Gemini (free, 1500 req/day) or Ollama (local, unlimited)
- **Your own thoughts** — add personal notes below every AI explanation
- **Persistent highlights** — yellow overlays stay on the PDF as visual markers

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) v18 or higher
- npm v9 or higher

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/research-notes-app.git

# Navigate into the project
cd research-notes-app

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🤖 AI Setup

The app supports two AI providers. Configure them via the **⚙️ AI Settings** button in the top bar.

### Option 1: Gemini (Recommended — Free)

1. Get a free API key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey) — no credit card needed
2. Open **AI Settings** in the app
3. Select **Gemini** as the provider
4. Paste your API key and choose a model
5. Click **Save Settings**

**Free tier:** 1500 requests/day with Gemini 2.0 Flash Lite

### Option 2: Ollama (Local — Unlimited & Private)

1. Install Ollama from [ollama.com](https://ollama.com)
2. Start the server:
   ```bash
   ollama serve
   ```
3. Pull a model:
   ```bash
   ollama pull llama3
   ```
4. Open **AI Settings** in the app, select **Ollama**, and save

No API key needed. Runs entirely on your machine.

---

## 🗂️ Project Structure

```
src/
├── components/
│   ├── Layout/
│   │   ├── SplitPanel.jsx       # Two-panel container + notes state
│   │   ├── LeftPanel.jsx        # PDF viewer side
│   │   └── RightPanel.jsx       # Notes side
│   ├── PdfViewer/
│   │   └── PdfViewer.jsx        # PDF rendering + highlight detection
│   └── Settings/
│       └── SettingsPanel.jsx    # AI provider configuration modal
├── pages/
│   ├── Home.jsx                 # Upload screen
│   └── Reader.jsx               # Main reading view
├── services/
│   └── aiService.js             # Gemini + Ollama API calls
└── App.jsx                      # Root component
```

---

## 🛠️ Tech Stack

| Tool | Purpose |
|---|---|
| React 18 | UI framework |
| Vite | Build tool |
| react-pdf | PDF rendering + text layer |
| Tailwind CSS | Styling |
| Gemini API | AI explanations (cloud) |
| Ollama | AI explanations (local) |

---

## 📖 How to Use

1. **Upload** a PDF research paper on the home screen
2. **Read** the paper on the left panel
3. **Select** any text you want to understand
4. Click **✨ Explain + Add Note** in the tooltip
5. The AI explanation appears as a note card on the right
6. **Add your own thoughts** in the text area below each explanation
7. Click any **yellow highlight** on the PDF to jump to its note
8. Click any **note card** to jump back to that page in the PDF

---

## 🗺️ Roadmap

- [x] Week 1 — PDF upload + split panel viewer
- [x] Week 2 — Text selection, highlights, notes panel
- [x] Week 3 — AI explanations via Gemini / Ollama
- [ ] Week 4 — Persist notes (reload paper = notes come back)
- [ ] Week 5 — Export notes as PDF or Word doc
- [ ] Week 6 — Paper library, search notes, multiple papers

---

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first.

---

## 📄 License

MIT — free to use, modify, and distribute.