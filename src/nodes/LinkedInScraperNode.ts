import { ClassicPreset, NodeEditor } from 'rete';
import { AreaPlugin } from 'rete-area-plugin';
import { BaseNode, NodeScheme } from '../core/BaseNode';
import { NodeContext } from '../types/node.types';
import { isMockMode } from '../utils/mockLLM';

// Define a type for the LinkedIn API response
type LinkedInApiResponse = {
  data: {
    elements: Array<{
      title?: string;
      url?: string;
      author?: {
        name?: string;
        profileUrl?: string;
      };
      postedDate?: string;
      content?: string;
      likes?: number;
      comments?: number;
    }>;
  };
};

interface LinkedInScraperNodeData {
  keywords: string;
  limit: number;
  timeRange: 'day' | 'week' | 'month' | 'year';
  contentType: 'posts' | 'jobs' | 'people';
}

export interface LinkedInPost {
  title: string;
  url: string;
  author: string;
  authorUrl: string;
  postedDate: string;
  content: string;
  likes: number;
  comments: number;
}

const socket = new ClassicPreset.Socket('socket');

export class LinkedInScraperNode extends BaseNode<LinkedInScraperNodeData> {
  constructor(editor: NodeEditor<NodeScheme>, area: AreaPlugin<NodeScheme, any>) {
    super(editor, area, 'linkedin-scraper', 'LinkedIn Scraper', {
      keywords: '',
      limit: 10,
      timeRange: 'week',
      contentType: 'posts'
    });

    this.addInput('exec', new ClassicPreset.Input(socket, 'Exec'));

    this.addOutput('posts', new ClassicPreset.Output(socket, 'Posts'));
    this.addOutput('count', new ClassicPreset.Output(socket, 'Count'));

    this.addControl('keywords', new ClassicPreset.InputControl('text', {
      initial: this.data.keywords,
      change: (value) => {
        this.data.keywords = value;
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

    // Time range control
    this.addControl('timeRange', new ClassicPreset.InputControl('text', {
      initial: this.data.timeRange,
      change: (value) => {
        this.data.timeRange = value as LinkedInScraperNodeData['timeRange'];
        this.update();
      }
    }));

    // Content type control
    this.addControl('contentType', new ClassicPreset.InputControl('text', {
      initial: this.data.contentType,
      change: (value) => {
        this.data.contentType = value as LinkedInScraperNodeData['contentType'];
        this.update();
      }
    }));
  }

  private async fetchLinkedInData(keywords: string, limit: number, timeRange: string, contentType: string): Promise<{ posts: LinkedInPost[], count: number }> {
    // Mock implementation for development/demo
    if (isMockMode()) {
      this.warn('Using mock LinkedIn data - running in demo mode');
      return {
        posts: Array.from({ length: limit }, (_, i) => ({
          title: `Mock LinkedIn ${contentType === 'jobs' ? 'Job' : 'Post'} ${i + 1} about "${keywords}"`,
          url: `https://linkedin.com/mock-${contentType}/${i + 1}`,
          author: `LinkedIn User ${Math.floor(Math.random() * 1000)}`,
          authorUrl: `https://linkedin.com/in/user-${Math.floor(Math.random() * 1000)}`,
          postedDate: new Date(Date.now() - Math.floor(Math.random() * 604800000)).toISOString(),
          content: `This is a mock LinkedIn ${contentType === 'jobs' ? 'job posting' : 'post'} about ${keywords}. #${keywords.split(' ')[0]} #trending`,
          likes: Math.floor(Math.random() * 500),
          comments: Math.floor(Math.random() * 50)
        })),
        count: limit
      };
    }

    // Real implementation would use LinkedIn API
    // Note: LinkedIn API requires authentication and proper API access
    this.warn('LinkedIn API implementation requires proper API credentials');
    this.info('To use the LinkedIn API, users need to:');
    this.info('1. Create a LinkedIn Developer account');
    this.info('2. Register an application to get API credentials');
    this.info('3. Authenticate and authorize the application');
    
    // This is a placeholder for the actual API implementation
    // In a real implementation, you would:
    // 1. Use the LinkedIn API client with proper authentication
    // 2. Make API requests to search for content based on keywords
    // 3. Process and format the response data
    
    // For now, return mock data with a warning
    return {
      posts: Array.from({ length: Math.min(limit, 3) }, (_, i) => ({
        title: `LinkedIn ${contentType === 'jobs' ? 'Job' : 'Post'} about "${keywords}"`,
        url: `https://linkedin.com/${contentType}/${i + 1}`,
        author: 'LinkedIn User',
        authorUrl: 'https://linkedin.com/in/user',
        postedDate: new Date().toISOString(),
        content: `This is a placeholder for LinkedIn content about ${keywords}.`,
        likes: 0,
        comments: 0
      })),
      count: Math.min(limit, 3)
    };
  }

  async executeNode(
    inputs: {},
    context: NodeContext
  ): Promise<{ posts: LinkedInPost[], count: number }> {
    try {
      const { keywords, limit, timeRange, contentType } = this.data;
      
      if (!keywords) {
        this.warn('No keywords specified, results may be limited');
      }
      
      this.info(`Fetching ${limit} LinkedIn ${contentType} related to "${keywords || 'any'}" (${timeRange} time range)`);

      const { posts, count } = await this.fetchLinkedInData(keywords, limit, timeRange, contentType);

      this.info(`Successfully fetched ${posts.length} LinkedIn ${contentType}`);

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
