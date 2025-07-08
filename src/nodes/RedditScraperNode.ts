import { ClassicPreset, NodeEditor } from 'rete';
import { AreaPlugin } from 'rete-area-plugin';
import { BaseNode, NodeScheme } from '../core/BaseNode';
import { NodeContext } from '../types/node.types';
import { isMockMode } from '../utils/mockLLM';

// Define a type for the Reddit API response
type RedditApiResponse = {
  data: {
    children: Array<{
      data: {
        title: string;
        url: string;
        score: number;
        permalink: string;
        author: string;
        created_utc: number;
        selftext?: string;
      };
    }>;
  };
};

interface RedditScraperNodeData {
  subreddit: string;
  limit: number;
  time: 'hour' | 'day' | 'week' | 'month' | 'year' | 'all';
}

export interface RedditPost {
  title: string;
  url: string;
  score: number;
  permalink: string;
  author: string;
  created_utc: number;
  selftext?: string;
}

const socket = new ClassicPreset.Socket('socket');

export class RedditScraperNode extends BaseNode<RedditScraperNodeData> {
  constructor(editor: NodeEditor<NodeScheme>, area: AreaPlugin<NodeScheme, any>) {
    super(editor, area, 'reddit-scraper', 'Reddit Scraper', {
      subreddit: 'ai',
      limit: 10,
      time: 'day',
    });

    this.addInput('exec', new ClassicPreset.Input(socket, 'Exec'));

    this.addOutput('posts', new ClassicPreset.Output(socket, 'Posts'));
    this.addOutput('count', new ClassicPreset.Output(socket, 'Count'));

    this.addControl('subreddit', new ClassicPreset.InputControl('text', {
      initial: this.data.subreddit,
      change: (value) => {
        this.data.subreddit = value;
        this.update();
      }
    }));

    this.addControl('limit', new ClassicPreset.InputControl('number', {
      initial: this.data.limit,
      change: (value) => {
        this.data.limit = Math.min(100, Math.max(1, Number(value) || 10));
        this.update();
      }
    }));

    // Note: A real 'select' control would be custom. This is a placeholder.
    this.addControl('time', new ClassicPreset.InputControl('text', {
      initial: this.data.time,
      change: (value) => {
        this.data.time = value as RedditScraperNodeData['time'];
        this.update();
      }
    }));
  }

  private async fetchRedditPosts(subreddit: string, limit: number, time: string): Promise<{ posts: RedditPost[], count: number }> {
    // Mock implementation for now
    if (isMockMode()) {
      this.warn('Using mock Reddit data - running in demo mode');
      return {
        posts: Array.from({ length: limit }, (_, i) => ({
          title: `Mock Post ${i + 1} from r/${subreddit}`,
          url: `#mock-post-${i + 1}`,
          score: Math.floor(Math.random() * 1000),
          author: `user${Math.floor(Math.random() * 1000)}`,
          permalink: `#mock-post-${i + 1}`,
          created_utc: Math.floor(Date.now() / 1000) - Math.floor(Math.random() * 86400),
          selftext: 'This is a mock post.'
        })),
        count: limit
      };
    }

    // Real implementation
    const response = await fetch(`https://www.reddit.com/r/${subreddit}/top.json?limit=${limit}&t=${time}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    const data = await response.json() as RedditApiResponse;
    const posts: RedditPost[] = data.data.children.map(({ data: post }) => ({
      title: post.title,
      url: `https://reddit.com${post.permalink}`,
      score: post.score,
      permalink: post.permalink,
      author: post.author,
      created_utc: post.created_utc,
      selftext: post.selftext,
    }));
    return { posts, count: posts.length };
  }

  async executeNode(
    inputs: {},
    context: NodeContext
  ): Promise<{ posts: RedditPost[], count: number }> {
    try {
    const { subreddit, limit, time } = this.data;
    this.info(`Fetching ${limit} posts from r/${subreddit} (${time} time range)`);

    const { posts, count } = await this.fetchRedditPosts(subreddit, limit, time);

    this.info(`Successfully fetched ${posts.length} posts`);

    return {
      posts,
      count
    };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.error(`Error: ${errorMessage}`);
      throw error;
    }
  }
}
