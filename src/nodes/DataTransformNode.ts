import { ClassicPreset, NodeEditor } from 'rete';
import { AreaPlugin } from 'rete-area-plugin';
import { BaseNode, NodeScheme } from '../core/BaseNode';
import { NodeContext } from '../types/node.types';

interface DataTransformNodeData {
  transformationType: 'map' | 'filter' | 'sort' | 'merge' | 'custom';
  sortField: string;
  sortDirection: 'asc' | 'desc';
  filterExpression: string;
  mapTemplate: string;
  customCode: string;
}

const socket = new ClassicPreset.Socket('socket');

export class DataTransformNode extends BaseNode<DataTransformNodeData> {
  constructor(editor: NodeEditor<NodeScheme>, area: AreaPlugin<NodeScheme, any>) {
    super(editor, area, 'data-transform', 'Data Transform', {
      transformationType: 'map',
      sortField: 'title',
      sortDirection: 'desc',
      filterExpression: '',
      mapTemplate: '{ title: item.title, url: item.url }',
      customCode: 'return data.map(item => ({ ...item, transformed: true }));'
    });

    this.addInput('data', new ClassicPreset.Input(socket, 'Data Input', true));
    this.addInput('secondaryData', new ClassicPreset.Input(socket, 'Secondary Data', true));

    this.addOutput('result', new ClassicPreset.Output(socket, 'Result'));
    this.addOutput('count', new ClassicPreset.Output(socket, 'Count'));

    this.addControl('transformationType', new ClassicPreset.InputControl('text', {
      initial: this.data.transformationType,
      change: (value) => {
        this.data.transformationType = value as DataTransformNodeData['transformationType'];
        this.update();
      }
    }));

    this.addControl('sortField', new ClassicPreset.InputControl('text', {
      initial: this.data.sortField,
      change: (value) => {
        this.data.sortField = value;
        this.update();
      }
    }));

    this.addControl('sortDirection', new ClassicPreset.InputControl('text', {
      initial: this.data.sortDirection,
      change: (value) => {
        this.data.sortDirection = value as 'asc' | 'desc';
        this.update();
      }
    }));

    this.addControl('filterExpression', new ClassicPreset.InputControl('text', {
      initial: this.data.filterExpression,
      change: (value) => {
        this.data.filterExpression = value;
        this.update();
      }
    }));

    this.addControl('mapTemplate', new ClassicPreset.InputControl('text', {
      initial: this.data.mapTemplate,
      change: (value) => {
        this.data.mapTemplate = value;
        this.update();
      }
    }));

    this.addControl('customCode', new ClassicPreset.InputControl('text', {
      initial: this.data.customCode,
      change: (value) => {
        this.data.customCode = value;
        this.update();
      }
    }));
  }

  private mapData(data: any[]): any[] {
    try {
      const template = this.data.mapTemplate;
      return data.map(item => {
        try {
          // Using Function constructor to create a dynamic function from the template
          const mapFn = new Function('item', `return ${template};`);
          return mapFn(item);
        } catch (error) {
          this.warn(`Error mapping item: ${error instanceof Error ? error.message : String(error)}`);
          return item;
        }
      });
    } catch (error) {
      this.error(`Error in map operation: ${error instanceof Error ? error.message : String(error)}`);
      return data;
    }
  }

  private filterData(data: any[]): any[] {
    try {
      const expression = this.data.filterExpression;
      if (!expression) {
        return data;
      }
      
      return data.filter(item => {
        try {
          const filterFn = new Function('item', `return ${expression};`);
          return filterFn(item);
        } catch (error) {
          this.warn(`Error filtering item: ${error instanceof Error ? error.message : String(error)}`);
          return false;
        }
      });
    } catch (error) {
      this.error(`Error in filter operation: ${error instanceof Error ? error.message : String(error)}`);
      return data;
    }
  }

  private sortData(data: any[]): any[] {
    try {
      const field = this.data.sortField;
      const direction = this.data.sortDirection;
      
      if (!field) {
        return data;
      }
      
      return [...data].sort((a, b) => {
        let valueA = this.getNestedValue(a, field);
        let valueB = this.getNestedValue(b, field);
        
        // Handle string comparison
        if (typeof valueA === 'string' && typeof valueB === 'string') {
          return direction === 'asc' 
            ? valueA.localeCompare(valueB) 
            : valueB.localeCompare(valueA);
        }
        
        // Handle number comparison
        if (direction === 'asc') {
          return (valueA ?? 0) - (valueB ?? 0);
        } else {
          return (valueB ?? 0) - (valueA ?? 0);
        }
      });
    } catch (error) {
      this.error(`Error in sort operation: ${error instanceof Error ? error.message : String(error)}`);
      return data;
    }
  }

  private mergeData(primaryData: any[], secondaryData: any[]): any[] {
    try {
      if (!secondaryData || !Array.isArray(secondaryData)) {
        return primaryData;
      }
      
      return [...primaryData, ...secondaryData];
    } catch (error) {
      this.error(`Error in merge operation: ${error instanceof Error ? error.message : String(error)}`);
      return primaryData;
    }
  }

  private customTransform(data: any[], secondaryData: any[]): any[] {
    try {
      const customCode = this.data.customCode;
      if (!customCode) {
        return data;
      }
      
      const transformFn = new Function('data', 'secondaryData', customCode);
      return transformFn(data, secondaryData);
    } catch (error) {
      this.error(`Error in custom transform: ${error instanceof Error ? error.message : String(error)}`);
      return data;
    }
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((prev, curr) => {
      return prev && prev[curr] !== undefined ? prev[curr] : null;
    }, obj);
  }

  async executeNode(
    inputs: { data?: any[], secondaryData?: any[] },
    context: NodeContext
  ): Promise<{ result: any[], count: number }> {
    try {
      const data = inputs.data || [];
      const secondaryData = inputs.secondaryData || [];
      
      if (!Array.isArray(data)) {
        this.warn('Input data is not an array, converting to array');
        const convertedData = [data];
        return this.processData(convertedData, secondaryData);
      }
      
      return this.processData(data, secondaryData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.error(`Error: ${errorMessage}`);
      throw error;
    }
  }

  private async processData(data: any[], secondaryData: any[]): Promise<{ result: any[], count: number }> {
    this.info(`Processing ${data.length} items with transformation type: ${this.data.transformationType}`);
    
    let result: any[] = [];
    
    switch (this.data.transformationType) {
      case 'map':
        result = this.mapData(data);
        break;
      case 'filter':
        result = this.filterData(data);
        break;
      case 'sort':
        result = this.sortData(data);
        break;
      case 'merge':
        result = this.mergeData(data, secondaryData);
        break;
      case 'custom':
        result = this.customTransform(data, secondaryData);
        break;
      default:
        this.warn(`Unknown transformation type: ${this.data.transformationType}, returning original data`);
        result = data;
    }
    
    this.info(`Transformation complete. Result contains ${result.length} items`);
    
    return {
      result,
      count: result.length
    };
  }
}
