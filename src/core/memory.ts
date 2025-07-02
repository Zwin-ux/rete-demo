/**
 * Memory system for Rete.js nodes
 * Provides persistent storage using localStorage
 */

const NAMESPACE = 'rete-memory-';

export class NodeMemory {
  private nodeId: string;
  private prefix: string;

  constructor(nodeId: string) {
    this.nodeId = nodeId;
    this.prefix = `${NAMESPACE}${nodeId}-`;
  }

  async get<T = any>(key: string): Promise<T | null> {
    try {
      const value = localStorage.getItem(this.prefix + key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Error reading from memory (${this.prefix}${key}):`, error);
      return null;
    }
  }

  async set(key: string, value: any): Promise<void> {
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error writing to memory (${this.prefix}${key}):`, error);
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      localStorage.removeItem(this.prefix + key);
    } catch (error) {
      console.error(`Error deleting from memory (${this.prefix}${key}):`, error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.prefix)) {
          keysToRemove.push(key);
        }
      }
      
      for (const key of keysToRemove) {
        localStorage.removeItem(key);
      }
    } catch (error) {
      console.error(`Error clearing memory for node ${this.nodeId}:`, error);
      throw error;
    }
  }

  static clearAll(): void {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(NAMESPACE)) {
          keysToRemove.push(key);
        }
      }
      
      for (const key of keysToRemove) {
        localStorage.removeItem(key);
      }
    } catch (error) {
      console.error('Error clearing all node memory:', error);
      throw error;
    }
  }
}
