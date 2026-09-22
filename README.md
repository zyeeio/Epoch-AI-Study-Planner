# 🎓 Study Planner & Academic AI Assistant

A full-stack, responsive academic productivity platform designed for students and researchers. Features dynamic timetable generation, task & routine tracking, audio focus timers, and Gemini 2.5 Flash-powered academic research and lecture note summarization.

---

## ✨ Features

- **Academic Tasks & Study Routines**: Categorized task management with Exam, Assignment, Lecture, and Project tags, priorities, due dates, and daily habit streaks.
- **Flexible Timetable Engine**: Weekly timetable planner with dynamic block shifting, custom lecture inputs, and collision-free study schedule auto-generation.
- **Lecture Notes AI**: Transform raw class notes, lecture transcripts, or syllabi into structured study guides, flashcards, key formulas, and exam prep points.
- **Academic Research Assistant**: Grounded academic queries, literature reviews, concept explanations, and citation formatting.
- **Focus Timer**: Configurable Pomodoro / deep work timer with ambient audio tones (White Noise, Binaural Alpha waves, Rainfall, Lo-Fi Pink Noise) synthesized directly in-browser.
- **Cloud Synchronization & Security**: Real-time Firebase Firestore database persistence with per-user authentication and granular security rules.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide React, Framer Motion
- **Backend**: Node.js, Express, Vite middleware
- **AI Engine**: Google Gen AI SDK (`@google/genai`) with Gemini 2.5 Flash
- **Database & Auth**: Firebase Firestore & Firebase Authentication

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm or bun

### 1. Clone the repository
\`\`\`bash
git clone https://github.com/zyeeio/Epoch-AI-study-planner.git
cd Epoch-AI-study-planner
\`\`\`

### 2. Install dependencies
\`\`\`bash
npm install
\`\`\`

### 3. Environment Variables
Create a `.env` file in the root directory:
\`\`\`env
GEMINI_API_KEY=your_google_gemini_api_key_here
\`\`\`

### 4. Run Development Server
\`\`\`bash
npm run dev
\`\`\`
Open [http://localhost:3000](http://localhost:3000) in your browser.
