import { NodeEditor } from 'rete';
import { BaseNode } from '../core/BaseNode';
import { NodeInput, NodeOutput, NodeControl } from '../types/node.types';

export class KeywordFilterNode extends BaseNode {
  private keywords: string[] = [];
  private caseSensitive: boolean = false;

  constructor(editor: NodeEditor) {
    super(editor, 'keyword-filter', 'Keyword Filter');
  }

  getInputs(): NodeInput[] {
    return [
      { 
        name: 'input', 
        type: 'any', 
        description: 'Input data to filter (can be string, array, or object with text properties)',
        required: true
      },
    ];
  }

  getOutputs(): NodeOutput[] {
    return [
      { 
        name: 'output', 
        type: 'any', 
        description: 'Filtered output (same type as input)' 
      },
      { 
        name: 'matches', 
        type: 'number', 
        description: 'Number of matches found' 
      },
    ];
  }

  getControls(): NodeControl[] {
    return [
      {
        type: 'text',
        key: 'keywords',
        label: 'Keywords (comma-separated)',
        placeholder: 'gpt, ai, machine learning',
        value: this.keywords.join(', '),
        onChange: (value: string) => {
          this.keywords = value
            .split(',')
            .map(k => k.trim())
            .filter(k => k.length > 0);
          this.update();
        },
      },
      {
        type: 'toggle',
        key: 'caseSensitive',
        label: 'Case Sensitive',
        value: this.caseSensitive,
        onChange: (value: unknown) => {
          this.caseSensitive = value as boolean;
          this.update();
        },
      },
    ];
  }

  private containsKeywords(text: string): boolean {
    if (!text || typeof text !== 'string') return false;
    
    const searchText = this.caseSensitive ? text : text.toLowerCase();
    
    return this.keywords.some(keyword => {
      const searchKeyword = this.caseSensitive ? keyword : keyword.toLowerCase();
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

  protected async executeNode(
    inputs: Record<string, any>,
    context: any
  ): Promise<Record<string, any>> {
    const input = inputs.input;
    
    if (!input) {
      throw new Error('Input is required');
    }

    if (this.keywords.length === 0) {
      this.log('No keywords specified, passing through all input');
      return {
        output: input,
        matches: Array.isArray(input) ? input.length : 1,
      };
    }

    this.log(`Filtering with keywords: ${this.keywords.join(', ')}`);
    
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

    this.log(`Found ${matches} matches`);
    
    return {
      output: result,
      matches,
    };
  }

  async onCreated() {
    super.onCreated();
    this.log('Keyword Filter Node created');
  }

  async onDestroy() {
    this.log('Keyword Filter Node destroyed');
    super.onDestroy();
  }
}
