import { NodeEditor } from 'rete';
import { BaseNode } from '../core/BaseNode';
import { NodeInput, NodeOutput, NodeControl } from '../types/node.types';

interface RedditPost {
  title: string;
  url: string;
  score: number;
  permalink: string;
  author: string;
  created_utc: number;
}

export class RedditScraperNode extends BaseNode {
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
    };
  }

  getInputs(): NodeInput[] {
    return [];
  }

  getOutputs(): NodeOutput[] {
    return [
      { name: 'posts', type: 'RedditPost[]', description: 'Array of Reddit posts' },
      { name: 'count', type: 'number', description: 'Number of posts fetched' },
    ];
  }

  getControls(): NodeControl[] {
    return [
      {
        type: 'text',
        key: 'subreddit',
        label: 'Subreddit',
        placeholder: 'Enter subreddit name',
        value: this.data.subreddit || 'ai',
        onChange: (value: string) => {
          this.data.subreddit = value;
          this.update();
        },
      },
      {
        type: 'number',
        key: 'limit',
        label: 'Post Limit',
        min: 1,
        max: 100,
        value: this.data.limit || RedditScraperNode.DEFAULT_LIMIT,
        onChange: (value: number) => {
          this.data.limit = Math.min(100, Math.max(1, value));
          this.update();
        },
      },
      {
        type: 'select',
        key: 'time',
        label: 'Time Range',
        options: [
          { value: 'hour', label: 'Past Hour' },
          { value: 'day', label: 'Past 24 Hours' },
          { value: 'week', label: 'Past Week' },
          { value: 'month', label: 'Past Month' },
          { value: 'year', label: 'Past Year' },
          { value: 'all', label: 'All Time' },
        ],
        value: this.data.time || RedditScraperNode.DEFAULT_TIME,
        onChange: (value: string) => {
          this.data.time = value;
          this.update();
        },
      },
    ];
  }

  private async fetchRedditPosts(
    subreddit: string,
    limit: number = 10,
    time: string = 'day'
  ): Promise<RedditPost[]> {
    const url = `https://www.reddit.com/r/${subreddit}/top.json?limit=${limit}&t=${time}`;
    
    this.log(`Fetching top ${limit} posts from r/${subreddit} (time: ${time})`);
    
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Rete.js Reddit Scraper Node/1.0',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.data || !Array.isArray(data.data.children)) {
        throw new Error('Invalid response format from Reddit API');
      }

      return data.data.children.map((post: any) => ({
        title: post.data.title,
        url: `https://reddit.com${post.data.permalink}`,
        score: post.data.score,
        permalink: `https://reddit.com${post.data.permalink}`,
        author: post.data.author,
        created_utc: post.data.created_utc,
      }));
    } catch (error) {
      this.log(`Error fetching Reddit posts: ${error.message}`);
      throw error;
    }
  }

  protected async executeNode(): Promise<Record<string, any>> {
    const subreddit = (this.data.subreddit || 'ai').trim().replace(/^r\//, '');
    const limit = Math.min(100, Math.max(1, parseInt(this.data.limit) || RedditScraperNode.DEFAULT_LIMIT));
    const time = this.data.time || RedditScraperNode.DEFAULT_TIME;

    this.log(`Starting to fetch ${limit} posts from r/${subreddit}...`);
    
    const posts = await this.fetchRedditPosts(subreddit, limit, time);
    
    this.log(`Successfully fetched ${posts.length} posts from r/${subreddit}`);
    
    return {
      posts,
      count: posts.length,
    };
  }

  async onCreated() {
    super.onCreated();
    this.log('Reddit Scraper Node created');
  }

  async onDestroy() {
    this.log('Reddit Scraper Node destroyed');
    super.onDestroy();
  }
}
