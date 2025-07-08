import { NodeEditor, ClassicPreset } from 'rete';
import { AreaPlugin } from 'rete-area-plugin';
import { Schemes } from '../editor';
import { StartNode } from '../nodes/StartNode';
import { RedditScraperNode } from '../nodes/RedditScraperNode';
import { KeywordFilterNode } from '../nodes/KeywordFilterNode';
import { SummarizerNode } from '../nodes/SummarizerNode';
import { LLMAgentNode } from '../nodes/LLMAgentNode';
import { ConsoleLogNode } from '../nodes/ConsoleLogNode';

/**
 * AI Agent Demo Workflow
 * 
 * This workflow demonstrates a multi-agent AI orchestration:
 * 1. Scrapes Reddit for AI-related posts
 * 2. Filters posts based on keywords
 * 3. Summarizes the content
 * 4. Uses an LLM agent to generate insights
 */
export async function createAIAgentDemoWorkflow(
  editor: NodeEditor<Schemes>,
  area: AreaPlugin<Schemes, any>
) {
  // Create nodes
  const startNode = new StartNode(editor, area);
  await editor.addNode(startNode);
  await area.translate(startNode.id, { x: 200, y: 200 });

  const redditNode = new RedditScraperNode(editor, area);
  await editor.addNode(redditNode);
  await area.translate(redditNode.id, { x: 500, y: 200 });

  const filterNode = new KeywordFilterNode(editor, area);
  await editor.addNode(filterNode);
  await area.translate(filterNode.id, { x: 800, y: 200 });

  const summarizerNode = new SummarizerNode(editor, area);
  await editor.addNode(summarizerNode);
  await area.translate(summarizerNode.id, { x: 500, y: 400 });

  const llmAgentNode = new LLMAgentNode(editor, area);
  await editor.addNode(llmAgentNode);
  await area.translate(llmAgentNode.id, { x: 800, y: 400 });

  const consoleNode = new ConsoleLogNode(editor, area);
  await editor.addNode(consoleNode);
  await area.translate(consoleNode.id, { x: 1100, y: 300 });

  // Configure nodes
  // Reddit Scraper - set to fetch AI posts
  if (redditNode.data) {
    (redditNode.data as any).subreddit = 'artificial';
    (redditNode.data as any).limit = 5;
    (redditNode.data as any).time = 'week';
  }

  // Keyword Filter - set to filter for specific AI topics
  if (filterNode.data) {
    (filterNode.data as any).keywords = ['agent', 'multi-agent', 'LLM', 'GPT', 'autonomous'];
    (filterNode.data as any).matchType = 'any';
    (filterNode.data as any).caseSensitive = false;
  }

  // Summarizer - set to create concise bullet points
  if (summarizerNode.data) {
    (summarizerNode.data as any).summaryLength = 'short';
    (summarizerNode.data as any).format = 'bullet';
    (summarizerNode.data as any).language = 'english';
    (summarizerNode.data as any).focusPoints = 'AI agent capabilities, multi-agent systems, practical applications';
  }

  // LLM Agent - set system prompt for insights
  llmAgentNode.data.systemPrompt = 'You are an AI research analyst. Analyze the provided summaries of Reddit posts about AI agents and provide 3 key insights about current trends in multi-agent AI systems.';
  llmAgentNode.data.model = 'gpt-3.5-turbo';
  llmAgentNode.data.temperature = 0.7;
  llmAgentNode.data.maxTokens = 500;
  llmAgentNode.data.messages = [];

  // Connect nodes
  await editor.addConnection(
    new ClassicPreset.Connection(startNode, 'trigger', redditNode, 'input')
  );

  await editor.addConnection(
    new ClassicPreset.Connection(redditNode, 'posts', filterNode, 'input')
  );

  await editor.addConnection(
    new ClassicPreset.Connection(filterNode, 'filtered', summarizerNode, 'text')
  );

  await editor.addConnection(
    new ClassicPreset.Connection(summarizerNode, 'summary', llmAgentNode, 'input')
  );

  await editor.addConnection(
    new ClassicPreset.Connection(llmAgentNode, 'output', consoleNode, 'input')
  );

  return {
    nodes: [startNode, redditNode, filterNode, summarizerNode, llmAgentNode, consoleNode],
    connections: editor.getConnections()
  };
}
