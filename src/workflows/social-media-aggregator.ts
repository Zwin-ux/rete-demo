import { ClassicPreset, NodeEditor } from 'rete';
import { AreaPlugin } from 'rete-area-plugin';
import { RedditScraperNode } from '../nodes/RedditScraperNode';
import { LinkedInScraperNode } from '../nodes/LinkedInScraperNode';
import { KeywordFilterNode } from '../nodes/KeywordFilterNode';
import { DiscordWebhookNode } from '../nodes/DiscordWebhookNode';
import { StartNode } from '../nodes/StartNode';
import { NodeScheme } from '../core/BaseNode';

/**
 * Creates a workflow that:
 * 1. Scrapes Reddit and LinkedIn for content
 * 2. Filters the content based on keywords
 * 3. Sends the filtered content to Discord
 */
export async function createSocialMediaAggregator(
  editor: NodeEditor<NodeScheme>,
  area: AreaPlugin<NodeScheme, any>
) {
  // Create nodes
  const startNode = new StartNode(editor, area);
  const redditScraper = new RedditScraperNode(editor, area);
  const linkedInScraper = new LinkedInScraperNode(editor, area);
  const keywordFilter = new KeywordFilterNode(editor, area);
  const discordWebhook = new DiscordWebhookNode(editor, area);

  // Add nodes to editor
  editor.addNode(startNode);
  editor.addNode(redditScraper);
  editor.addNode(linkedInScraper);
  editor.addNode(keywordFilter);
  editor.addNode(discordWebhook);

  // Position nodes in the editor
  (startNode as any).position = [50, 200];
  (redditScraper as any).position = [300, 100];
  (linkedInScraper as any).position = [300, 300];
  (keywordFilter as any).position = [600, 200];
  (discordWebhook as any).position = [900, 200];

  // Configure nodes
  // Reddit Scraper configuration
  (redditScraper as any).controls.subreddit.value = 'technology';
  (redditScraper as any).controls.limit.value = 5;
  (redditScraper as any).controls.time.value = 'day';

  // LinkedIn Scraper configuration
  (linkedInScraper as any).controls.keywords.value = 'artificial intelligence';
  (linkedInScraper as any).controls.limit.value = 5;
  (linkedInScraper as any).controls.timeRange.value = 'week';
  (linkedInScraper as any).controls.contentType.value = 'posts';

  // Keyword Filter configuration
  (keywordFilter as any).controls.keywords.value = 'AI, machine learning, data';
  (keywordFilter as any).controls.matchType.value = 'any';

  // Discord Webhook configuration
  // Note: Users will need to provide their own webhook URL
  (discordWebhook as any).controls.username.value = 'Social Media Bot';
  (discordWebhook as any).controls.useEmbed.value = 'true';
  (discordWebhook as any).controls.embedColor.value = '#5865F2';

  // Create connections
  // Start -> Reddit Scraper
  editor.addConnection(new ClassicPreset.Connection(
    startNode as any, 'exec', redditScraper as any, 'exec'
  ));

  // Start -> LinkedIn Scraper
  editor.addConnection(new ClassicPreset.Connection(
    startNode as any, 'exec', linkedInScraper as any, 'exec'
  ));

  // Reddit Scraper -> Keyword Filter
  editor.addConnection(new ClassicPreset.Connection(
    redditScraper as any, 'posts', keywordFilter as any, 'input'
  ));

  // LinkedIn Scraper -> Keyword Filter
  editor.addConnection(new ClassicPreset.Connection(
    linkedInScraper as any, 'posts', keywordFilter as any, 'input'
  ));

  // Keyword Filter -> Discord Webhook
  editor.addConnection(new ClassicPreset.Connection(
    keywordFilter as any, 'filtered', discordWebhook as any, 'message'
  ));

  return {
    startNode,
    redditScraper,
    linkedInScraper,
    keywordFilter,
    discordWebhook
  };
}
