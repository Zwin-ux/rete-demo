import { ClassicPreset, NodeEditor } from 'rete';
import { AreaPlugin } from 'rete-area-plugin';
import { BaseNode, NodeScheme } from '../core/BaseNode';
import { NodeContext } from '../types/node.types';
import { isMockMode } from '../utils/mockLLM';

// Define a type for the Twitter API response
type TwitterApiResponse = {
  data: Array<{
    id: string;
    text: string;
    created_at: string;
    author_id: string;
    public_metrics: {
      retweet_count: number;
      reply_count: number;
      like_count: number;
      quote_count: number;
    };
  }>;
  includes?: {
    users: Array<{
      id: string;
      name: string;
      username: string;
      profile_image_url: string;
    }>;
  };
};

interface TwitterScraperNodeData {
  query: string;
  limit: number;
  resultType: 'recent' | 'popular' | 'mixed';
  includeRetweets: boolean;
}

export interface Tweet {
  id: string;
  text: string;
  createdAt: string;
  authorName: string;
  authorUsername: string;
  authorProfileImage?: string;
  retweetCount: number;
  replyCount: number;
  likeCount: number;
  quoteCount: number;
  url: string;
}

const socket = new ClassicPreset.Socket('socket');

export class TwitterScraperNode extends BaseNode<TwitterScraperNodeData> {
  constructor(editor: NodeEditor<NodeScheme>, area: AreaPlugin<NodeScheme, any>) {
    super(editor, area, 'twitter-scraper', 'Twitter Scraper', {
      query: '',
      limit: 10,
      resultType: 'mixed',
      includeRetweets: false
    });

    this.addInput('exec', new ClassicPreset.Input(socket, 'Exec'));

    this.addOutput('tweets', new ClassicPreset.Output(socket, 'Tweets'));
    this.addOutput('count', new ClassicPreset.Output(socket, 'Count'));

    this.addControl('query', new ClassicPreset.InputControl('text', {
      initial: this.data.query,
      change: (value) => {
        this.data.query = value;
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

    // Result type control
    this.addControl('resultType', new ClassicPreset.InputControl('text', {
      initial: this.data.resultType,
      change: (value) => {
        this.data.resultType = value as TwitterScraperNodeData['resultType'];
        this.update();
      }
    }));

    // Include retweets control
    this.addControl('includeRetweets', new ClassicPreset.InputControl('text', { // Should be checkbox
      initial: this.data.includeRetweets ? 'true' : 'false',
      change: (value) => {
        this.data.includeRetweets = value === 'true';
        this.update();
      }
    }));
  }

  private async fetchTwitterData(query: string, limit: number, resultType: string, includeRetweets: boolean): Promise<{ tweets: Tweet[], count: number }> {
    // Mock implementation for development/demo
    if (isMockMode()) {
      this.warn('Using mock Twitter data - running in demo mode');
      return {
        tweets: Array.from({ length: limit }, (_, i) => ({
          id: `${Math.floor(Math.random() * 1000000000000)}`,
          text: `This is a mock tweet ${i + 1} about ${query || 'something interesting'}. #${query?.split(' ')[0] || 'trending'}`,
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 604800000)).toISOString(),
          authorName: `Twitter User ${Math.floor(Math.random() * 1000)}`,
          authorUsername: `user${Math.floor(Math.random() * 1000)}`,
          authorProfileImage: `https://picsum.photos/50/50?random=${i}`,
          retweetCount: Math.floor(Math.random() * 100),
          replyCount: Math.floor(Math.random() * 50),
          likeCount: Math.floor(Math.random() * 500),
          quoteCount: Math.floor(Math.random() * 20),
          url: `https://twitter.com/user/status/${Math.floor(Math.random() * 1000000000000)}`
        })),
        count: limit
      };
    }

    // Real implementation would use Twitter API v2
    this.warn('Twitter API implementation requires proper API credentials');
    this.info('To use the Twitter API, users need to:');
    this.info('1. Apply for Twitter API access at developer.twitter.com');
    this.info('2. Create a project and app to get API credentials');
    this.info('3. Configure authentication with OAuth 2.0 or Bearer Token');
    
    // This is a placeholder for the actual API implementation
    // In a real implementation, you would:
    // 1. Use the Twitter API client with proper authentication
    // 2. Make API requests to search for tweets based on query
    // 3. Process and format the response data
    
    // For now, return mock data with a warning
    return {
      tweets: Array.from({ length: Math.min(limit, 3) }, (_, i) => ({
        id: `${i + 1}`,
        text: `This is a placeholder for a tweet about ${query || 'something interesting'}.`,
        createdAt: new Date().toISOString(),
        authorName: 'Twitter User',
        authorUsername: 'user',
        retweetCount: 0,
        replyCount: 0,
        likeCount: 0,
        quoteCount: 0,
        url: `https://twitter.com/user/status/${i + 1}`
      })),
      count: Math.min(limit, 3)
    };
  }

  async executeNode(
    inputs: {},
    context: NodeContext
  ): Promise<{ tweets: Tweet[], count: number }> {
    try {
      const { query, limit, resultType, includeRetweets } = this.data;
      
      if (!query) {
        this.warn('No search query specified, results may be limited');
      }
      
      this.info(`Fetching ${limit} tweets related to "${query || 'any'}" (${resultType} type, ${includeRetweets ? 'including' : 'excluding'} retweets)`);

      const { tweets, count } = await this.fetchTwitterData(query, limit, resultType, includeRetweets);

      this.info(`Successfully fetched ${tweets.length} tweets`);

      return {
        tweets,
        count
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.error(`Error: ${errorMessage}`);
      throw error;
    }
  }
}
