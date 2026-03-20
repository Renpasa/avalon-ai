# 🗡️ Avalon AI: The Council of Deception

**Avalon AI** is a strategic social deduction game (based on The Resistance: Avalon) where you play alongside **LLM-powered AI agents**. Test your intuition against advanced AI that can propose teams, vote with strategic intent, and even attempt to assassinate Merlin.

![Medieval Aesthetic](https://raw.githubusercontent.com/Renpasa/avalon-ai/master/public/assets/epic_bg.png)

## 🌟 Key Features

- **Advanced AI Agents**: Powered by **Google Gemini**, every AI player has its own personality, reasoning logic, and strategic goals.
- **Unified Dashboard**: A clean, single-screen "Council View" that integrates the Round Table, Chat, Action Panels, and Game Log—no scrolling required.
- **Medieval Aesthetic**: Custom-crafted UI featuring parchment textures, iron borders, and Cinzel typography for an immersive dark fantasy experience.
- **Real-time Logic**: A robust game engine that manages complex state transitions (Proposing -> Voting -> Mission -> Lake -> Assassination).
- **Client-Side Security**: API Key is handled exclusively via `sessionStorage` and never persisted to disk or sent to a third-party server besides Google.

## 🛠️ Tech Stack

- **Core**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS (Custom Medieval Theme)
- **AI Engine**: Google Generative AI SDK (`@google/generative-ai`)
- **Icons**: Lucide React

## 🚀 Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/Renpasa/avalon-ai.git
cd avalon-ai
```

### 2. Install dependencies
```bash
npm install
```

### 3. Run the development server
```bash
npm run dev
```

### 4. Setup API Key
Once the app is running, enter your **Google Gemini API Key** in the setup screen. 
> [!TIP]
> You can also enable **Mock Mode** to test the game flow without consuming your API quota!

## 📜 How to Play

1. **Setup**: Choose the number of players (5-10) and enter your name.
2. **The Goal**: 
   - **Good Team**: Pass 3 missions and protect Merlin.
   - **Evil Team**: Fail 3 missions or successfully assassinate Merlin at the game's end.
3. **The Council**: Use the **Chat** to influence other players and look for patterns in the **Game Log**.

---

*Made with 🗡️ and 🤖 by Renpasa.*

