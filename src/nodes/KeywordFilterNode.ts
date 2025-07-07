import { ClassicPreset, NodeEditor } from 'rete';
import { AreaPlugin } from 'rete-area-plugin';
import { BaseNode, NodeScheme } from '../core/BaseNode';
import { NodeContext } from '../types/node.types';

type NodeData = {
  keywords: string[];
  caseSensitive: boolean;
}

const socket = new ClassicPreset.Socket('socket');

export class KeywordFilterNode extends BaseNode<NodeData> {

  constructor(editor: NodeEditor<NodeScheme>, area: AreaPlugin<NodeScheme, any>) {
    super(editor, area, 'keyword-filter', 'Keyword Filter', {
      keywords: [],
      caseSensitive: false,
    });

    this.addInput('input', new ClassicPreset.Input(socket, 'Input', true));

    this.addOutput('output', new ClassicPreset.Output(socket, 'Output'));
    this.addOutput('matches', new ClassicPreset.Output(socket, 'Matches'));

    this.addControl('keywords', new ClassicPreset.InputControl('text', {
      initial: this.data.keywords.join(', '),
      change: (value) => {
        this.data.keywords = value
          .split(',')
          .map(k => k.trim())
          .filter(k => k.length > 0);
        this.update();
      }
    }));

    // A proper toggle would be a custom control.
    this.addControl('caseSensitive', new ClassicPreset.InputControl('text', {
      initial: String(this.data.caseSensitive),
      change: (value) => {
        this.data.caseSensitive = value === 'true';
        this.update();
      }
    }));
  }

  private containsKeywords(text: string): boolean {
    if (!text || typeof text !== 'string') return false;
    
    const searchText = this.data.caseSensitive ? text : text.toLowerCase();
    
    return this.data.keywords.some(keyword => {
      const searchKeyword = this.data.caseSensitive ? keyword : keyword.toLowerCase();
      return searchText.includes(searchKeyword);
    });
  }

  private filterArray(input: any[]): any[] {
    return input.filter(item => {
      if (typeof item === 'string') {
        return this.containsKeywords(item);
      } else if (item && typeof item === 'object') {
        return this.filterObject(item).matches > 0;
      }
      return false;
    });
  }

  private filterObject(input: Record<string, any>): { filtered: any; matches: number } {
    let matches = 0;
    const result: Record<string, any> = {};

    for (const [key, value] of Object.entries(input)) {
      if (typeof value === 'string' && this.containsKeywords(value)) {
        result[key] = value;
        matches++;
      } else if (Array.isArray(value)) {
        const filteredArray = this.filterArray(value);
        if (filteredArray.length > 0) {
          result[key] = filteredArray;
          matches += filteredArray.length;
        }
      } else if (value && typeof value === 'object') {
        const filteredObj = this.filterObject(value);
        if (filteredObj.matches > 0) {
          result[key] = filteredObj.filtered;
          matches += filteredObj.matches;
        }
      }
    }

    return { filtered: result, matches };
  }

  async executeNode(
    inputs: { input?: any[] },
    context: NodeContext
  ): Promise<{ output: any, matches: number }> {
    const input = inputs.input?.[0];
    
    if (!input) {
      this.warn('Input is required');
      return { output: undefined, matches: 0 };
    }

    if (this.data.keywords.length === 0) {
      this.info('No keywords specified, passing through all input');
      return {
        output: input,
        matches: Array.isArray(input) ? input.length : 1,
      };
    }

    this.info(`Filtering with keywords: ${this.data.keywords.join(', ')}`);
    
    let result: any;
    let matches: number = 0;

    if (Array.isArray(input)) {
      result = this.filterArray(input);
      matches = result.length;
    } else if (input && typeof input === 'object') {
      const filtered = this.filterObject(input);
      result = filtered.filtered;
      matches = filtered.matches;
    } else if (typeof input === 'string') {
      if (this.containsKeywords(input)) {
        result = input;
        matches = 1;
      } else {
        result = '';
      }
    } else {
      result = input;
    }

    this.info(`Found ${matches} matches`);
    
    return {
      output: result,
      matches,
    };
  }
}
