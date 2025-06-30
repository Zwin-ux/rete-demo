# RETE.js Workflow Editor

A visual workflow editor built with RETE.js, inspired by n8n. This project allows you to create and manage workflows using a node-based interface.

## Features

- Drag-and-drop node interface
- Various node types (Trigger, HTTP Request, Condition, Log)
- Visual connection between nodes
- Responsive design
- Extensible architecture

## Project Structure

- `src/` - Source code
  - `editor.ts` - Main editor configuration and node definitions
  - `main.ts` - Entry point and initialization
- `public/` - Static assets
  - `index.html` - Main HTML file
  - `styles.css` - Styling for the editor
- `dist/` - Compiled output (created after build)

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open your browser to `http://localhost:3000`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Dependencies

- RETE.js - Framework for visual programming
- React - UI rendering
- TypeScript - Type checking and better development experience

## License

MIT
