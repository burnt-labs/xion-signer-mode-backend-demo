/**
 * Memory-based storage strategy for backend usage
 * Stores data in memory using a Map
 * Note: Data is lost when the process restarts
 */

import type { StorageStrategy } from "@burnt-labs/abstraxion-core";

export class MemoryStorageStrategy implements StorageStrategy {
  private storage: Map<string, string> = new Map();

  async getItem(key: string): Promise<string | null> {
    return this.storage.get(key) || null;
  }

  async setItem(key: string, value: string): Promise<void> {
    this.storage.set(key, value);
  }

  async removeItem(key: string): Promise<void> {
    this.storage.delete(key);
  }

  clear(): void {
    this.storage.clear();
  }

  /**
   * Get all stored keys (useful for debugging)
   */
  getAllKeys(): string[] {
    return Array.from(this.storage.keys());
  }

  /**
   * Get storage size (useful for debugging)
   */
  getSize(): number {
    return this.storage.size;
  }
}
