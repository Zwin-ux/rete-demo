import type { NodeEditor } from 'rete';
import { BaseNode, BaseNodeData } from '../core/BaseNode';
import { NodeInput, NodeOutput, NodeControl, NodeContext } from '../types/node.types';
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

interface RedditScraperNodeData extends BaseNodeData {
  subreddit: string;
  limit: number;
  time: 'hour' | 'day' | 'week' | 'month' | 'year' | 'all';
  [key: string]: unknown;
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

export class RedditScraperNode extends BaseNode<RedditScraperNodeData> {
  private static readonly DEFAULT_LIMIT = 10;
  private static readonly DEFAULT_TIME = 'day'; // hour, day, week, month, year, all

  constructor(editor: NodeEditor) {
    super(editor, 'reddit-scraper', 'Reddit Scraper');
    
    // Initialize node data
    this.data = {
      ...this.data,
      subreddit: 'ai',
      limit: RedditScraperNode.DEFAULT_LIMIT,
      time: RedditScraperNode.DEFAULT_TIME,
    } as RedditScraperNodeData;
  }

  getInputs(): NodeInput[] {
    return [];
  }

  getOutputs(): NodeOutput[] {
    return [
      { name: 'posts', type: 'RedditPost[]' },
      { name: 'count', type: 'number' },
    ];
  }

  getControls(): NodeControl[] {
    return [
      {
        type: 'text',
        key: 'subreddit',
        value: this.data?.subreddit || 'ai',
        setValue: (value: unknown) => {
          if (this.data) {
            this.data.subreddit = String(value);
            this.update();
          }
        },
      } as NodeControl,
      {
        type: 'number',
        key: 'limit',
        value: this.data?.limit || RedditScraperNode.DEFAULT_LIMIT,
        setValue: (value: unknown) => {
          if (this.data) {
            this.data.limit = Math.min(100, Math.max(1, Number(value) || 10));
            this.update();
          }
        },
      } as NodeControl,
      {
        type: 'select',
        key: 'time',
        value: this.data?.time || RedditScraperNode.DEFAULT_TIME,
        setValue: (value: any) => {
          if (this.data) {
            this.data.time = String(value);
          }
        },
      } as NodeControl,
    ];
  }

  private async fetchRedditPosts(subreddit: string, limit: number, time: string): Promise<{ posts: any[], count: number }> {
    // Mock implementation for now
    return {
      posts: Array.from({ length: limit }, (_, i) => ({
        title: `Mock Post ${i + 1} from r/${subreddit}`,
        url: `#mock-post-${i + 1}`,
        score: Math.floor(Math.random() * 1000),
        author: `user${Math.floor(Math.random() * 1000)}`,
        permalink: `#mock-post-${i + 1}`,
        created_utc: Math.floor(Date.now() / 1000) - Math.floor(Math.random() * 86400),
      })),
      count: limit
    };
  }

  async executeNode(inputs: Record<string, unknown>, context: NodeContext): Promise<{ success: boolean; output?: Record<string, unknown>; error?: string }> {
    try {
      const { subreddit, limit, time } = this.data;

      this.log(`Fetching ${limit} posts from r/${subreddit} (${time} time range)`);
      
      // Use mock data in demo mode
      if (isMockMode()) {
        this.log('⚠️ Using mock Reddit data - running in demo mode');
        const { posts, count } = await this.fetchRedditPosts(subreddit, limit, time);
        return { success: true, output: { posts, count } };
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

      this.log(`Successfully fetched ${posts.length} posts`);
      
      return { 
        success: true, 
        output: { 
          posts, 
          count: posts.length 
        } 
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.log(`Error: ${errorMessage}`);
      throw error;
    }
  }

  onCreated() {
    this.log('Reddit Scraper node created');
  }

  onDestroy() {
    super.onDestroy();
    this.log('Reddit Scraper node destroyed');
  }
}
