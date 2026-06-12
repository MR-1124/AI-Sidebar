import { db } from '../database';
import type { Folder } from '../../types/chat';
import { generateId } from '../../lib/utils';

export const folderRepo = {
  async list(): Promise<Folder[]> {
    return db.folders.orderBy('sortOrder').toArray();
  },

  async create(name: string, parentId?: string, color?: string): Promise<Folder> {
    const folders = await this.list();
    const sortOrder = folders.length > 0 ? folders[folders.length - 1].sortOrder + 100 : 0;
    
    const folder: Folder = {
      id: generateId(),
      name,
      parentId,
      color,
      sortOrder,
      createdAt: Date.now(),
    };
    
    await db.folders.add(folder);
    return folder;
  },

  async update(id: string, updates: Partial<Omit<Folder, 'id' | 'createdAt'>>): Promise<void> {
    await db.folders.update(id, updates);
  },

  async delete(id: string): Promise<void> {
    // Delete the folder
    await db.folders.delete(id);
    
    // Also remove folderId from any conversations inside it
    await db.conversations.where('folderId').equals(id).modify({ folderId: undefined });
  },

  async reorder(id: string, newSortOrder: number): Promise<void> {
    await db.folders.update(id, { sortOrder: newSortOrder });
  }
};
