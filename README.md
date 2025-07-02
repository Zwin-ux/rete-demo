# RETE.js Workflow Editor

[![GitHub license](https://img.shields.io/github/license/Zwin-ux/rete-demo)](https://github.com/Zwin-ux/rete-demo/blob/master/LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/Zwin-ux/rete-demo)](https://github.com/Zwin-ux/rete-demo/stargazers)
[![GitHub issues](https://img.shields.io/github/issues/Zwin-ux/rete-demo)](https://github.com/Zwin-ux/rete-demo/issues)
[![GitHub last commit](https://img.shields.io/github/last-commit/Zwin-ux/rete-demo)](https://github.com/Zwin-ux/rete-demo/commits/master)

A visual workflow editor built with RETE.js, inspired by n8n. This project allows you to create and manage workflows using a node-based interface.

## 🎯 Features

- 🖱️ Drag-and-drop node interface
- 🧩 Various node types (Trigger, HTTP Request, Condition, Log)
- 🔗 Visual connection between nodes
- 📱 Responsive design
- 🛠️ Extensible architecture
- 🚀 Built with React and TypeScript

## 🏗️ Project Structure

```text
rete-demo/
├── src/                    # Source code
│   ├── editor.ts           # Main editor configuration and node definitions
│   └── main.ts             # Entry point and initialization
├── public/                 # Static assets
│   ├── index.html          # Main HTML file
│   └── styles.css          # Styling for the editor
├── .github/workflows/      # GitHub Actions workflows
│   └── deploy.yml          # Deployment configuration
├── dist/                   # Compiled output (created after build)
├── package.json            # Project dependencies and scripts
└── tsconfig.json           # TypeScript configuration
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or later)
- npm (v7 or later) or yarn

### Local Development

1. Clone the repository:

   ```bash
   git clone https://github.com/Zwin-ux/rete-demo.git
   cd rete-demo
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open your browser to [http://localhost:3000](http://localhost:3000)

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run test` - Run tests (coming soon)

## 🌐 Live Demo

Check out the live demo: [https://zwin-ux.github.io/rete-demo/](https://zwin-ux.github.io/rete-demo/)

## 🛠️ Dependencies

- [RETE.js](https://rete.js.org/) - Framework for visual programming
- [React](https://reactjs.org/) - UI rendering
- [TypeScript](https://www.typescriptlang.org/) - Type checking and better development experience
- [Vite](https://vitejs.dev/) - Build tool and development server

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
