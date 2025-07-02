# 🤖 AI-Powered Workflow Automation with Rete.js

[![GitHub license](https://img.shields.io/github/license/Zwin-ux/rete-demo)](https://github.com/Zwin-ux/rete-demo/blob/master/LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/Zwin-ux/rete-demo)](https://github.com/Zwin-ux/rete-demo/stargazers)
[![GitHub issues](https://img.shields.io/github/issues/Zwin-ux/rete-demo)](https://github.com/Zwin-ux/rete-demo/issues)
[![GitHub last commit](https://img.shields.io/github/last-commit/Zwin-ux/rete-demo)](https://github.com/Zwin-ux/rete-demo/commits/master)

A powerful visual workflow automation platform built with Rete.js, enabling you to create complex AI-powered workflows with an intuitive node-based interface. This project combines the flexibility of Rete.js with modern AI capabilities to create a robust automation system.

## 🎯 Key Features

### 🧩 Rich Node Ecosystem
- **Data Collection**: Reddit Scraper, Web Scraper (coming soon)
- **AI Processing**: LLM Agent, Text Summarizer, Keyword Filter
- **Storage & Memory**: Persistent storage with Memory Read/Write nodes
- **Notifications**: Discord Webhook integration
- **Debugging**: Console Log node with real-time output

### 🚀 Advanced Capabilities
- 🔄 **State Management**: Persistent memory system with localStorage
- 🛠 **Debugging Tools**: Real-time node inspection and logging
- ⚡ **Flow Control**: Conditional execution and error handling
- 🔌 **Extensible**: Easily add custom nodes
- 🎨 **Responsive UI**: Works on desktop and tablet devices

### 🏗 Built With
- [Rete.js](https://rete.js.org/) - Framework for visual programming
- [React](https://reactjs.org/) - UI rendering
- [TypeScript](https://www.typescriptlang.org/) - Type checking
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Vite](https://vitejs.dev/) - Build tool and development server

## 🏗️ Project Structure

```text
rete-demo/
├── src/
│   ├── components/         # React components
│   │   ├── NodeDebugPanel.tsx  # Node inspection panel
│   │   └── NodeDebugView.tsx   # Node debug visualization
│   ├── contexts/           # React contexts
│   │   └── NodeDebugContext.tsx  # Debug state management
│   ├── core/               # Core functionality
│   │   ├── BaseNode.ts     # Base node implementation
│   │   ├── FlowRunner.ts   # Workflow execution engine
│   │   └── memory.ts       # Persistent memory system
│   ├── nodes/              # Node implementations
│   │   ├── ConsoleLogNode.ts
│   │   ├── DiscordWebhookNode.ts
│   │   ├── KeywordFilterNode.ts
│   │   ├── LLMAgentNode.ts
│   │   ├── MemoryReadNode.ts
│   │   ├── MemoryWriteNode.ts
│   │   ├── RedditScraperNode.ts
│   │   ├── StartNode.ts
│   │   └── SummarizerNode.ts
│   ├── types/              # TypeScript type definitions
│   │   └── node.types.ts
│   ├── utils/              # Utility functions
│   │   ├── nodeStyles.ts   # Node styling utilities
│   │   └── workflowUtils.ts # Workflow import/export
│   └── workflows/          # Example workflows
│       └── reddit-ai-summarizer.json
├── public/                 # Static assets
├── .github/workflows/      # CI/CD configuration
└── package.json            # Project configuration
```

## 🚀 Quick Start Guide

### Prerequisites

- Node.js (v18 or later)
- npm (v9 or later) or yarn
- OpenAI API key (for LLM features)
- Discord Webhook URL (for notifications)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Zwin-ux/rete-demo.git
   cd rete-demo
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the project root:
   ```env
   VITE_OPENAI_API_KEY=your_openai_api_key
   VITE_DISCORD_WEBHOOK_URL=your_discord_webhook_url
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser to [http://localhost:5173](http://localhost:5173)

### Available Scripts

- `npm run dev` - Start development server with HMR
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run type-check` - Check TypeScript types

## 📚 Node Reference

### Core Nodes

#### 🔌 Start Node
- **Description**: Triggers the workflow execution
- **Outputs**: `trigger` (event)
- **Usage**: Place at the beginning of your workflow

#### 📰 Reddit Scraper
- **Description**: Fetches posts from a subreddit
- **Inputs**: `trigger` (event)
- **Outputs**: `posts` (array), `count` (number)
- **Configuration**: Subreddit name, post limit, time range

#### 🧠 LLM Agent
- **Description**: Processes text using OpenAI's API
- **Inputs**: `input` (string), `systemPrompt` (optional)
- **Outputs**: `output` (string), `usage` (object)
- **Configuration**: Model selection, temperature, max tokens

#### 🔍 Keyword Filter
- **Description**: Filters content based on keywords
- **Inputs**: `input` (any)
- **Outputs**: `output` (filtered input), `matches` (number)
- **Configuration**: Keywords, case sensitivity

#### 📝 Summarizer
- **Description**: Generates concise summaries
- **Inputs**: `text` (string), `compareWith` (optional)
- **Outputs**: `summary` (string), `length` (number)
- **Configuration**: Summary length, format, focus points

#### 💾 Memory Nodes
- **Read**: Retrieves stored values
- **Write**: Stores values with optional TTL
- **Usage**: Persist data between workflow runs

#### 💬 Discord Webhook
- **Description**: Sends messages to Discord
- **Inputs**: `message` (string), `title` (optional)
- **Configuration**: Webhook URL, username, avatar

## 🎬 Example Workflow: AI News Digest

1. **Start** → Triggers the workflow
2. **Reddit Scraper** → Fetches AI-related posts
3. **Keyword Filter** → Filters for relevant content
4. **Summarizer** → Creates concise summaries
5. **LLM Agent** → Adds analysis and insights
6. **Discord Webhook** → Sends results to Discord
7. **Memory Write** → Stores results for next run

## 🌐 Live Demo

Check out the live demo: [https://zwin-ux.github.io/rete-demo/](https://zwin-ux.github.io/rete-demo/)

## 🛠️ Development

### Creating a New Node

1. Extend the `BaseNode` class
2. Implement required methods:
   - `getInputs()`: Define input ports
   - `getOutputs()`: Define output ports
   - `getControls()`: Define node controls
   - `executeNode()`: Implement node logic

2. Register the node in the editor

### Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm test -- --watch
```

## 🤝 Contributing

Contributions are welcome! Please read our [contributing guidelines](CONTRIBUTING.md) to get started.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Rete.js](https://rete.js.org/) for the amazing visual programming framework
- [OpenAI](https://openai.com/) for the powerful language models
- The open-source community for endless inspiration

## 🚀 Deployment

This project is set up with GitHub Pages for automatic deployment. The `gh-pages` branch contains the built version of the app.

### Manual Deployment

1. Build the project:

   ```bash
   npm run build
   ```

2. Deploy to GitHub Pages:

   ```bash
   npm run deploy
   ```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [RETE.js](https://rete.js.org/) for the amazing visual programming framework
- [Vite](https://vitejs.dev/) for the fast build tooling
- [GitHub Pages](https://pages.github.com/) for hosting the demo

MIT
