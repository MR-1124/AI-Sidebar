import { db } from '../database';
import { generateId } from '../../lib/utils';

export interface PromptTemplate {
  id: string;
  name: string;
  content: string;
  category: string;
  isDefault: boolean;
  createdAt: number;
  updatedAt: number;
}

export const promptRepo = {
  async list(): Promise<PromptTemplate[]> {
    return db.prompts.orderBy('updatedAt').reverse().toArray();
  },

  async create(data: Omit<PromptTemplate, 'id' | 'createdAt' | 'updatedAt' | 'isDefault'> & { isDefault?: boolean }): Promise<PromptTemplate> {
    const prompt: PromptTemplate = {
      ...data,
      id: generateId(),
      isDefault: data.isDefault || false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await db.prompts.add(prompt);
    return prompt;
  },

  async update(id: string, updates: Partial<Omit<PromptTemplate, 'id' | 'createdAt'>>): Promise<void> {
    await db.prompts.update(id, {
      ...updates,
      updatedAt: Date.now(),
    });
  },

  async delete(id: string): Promise<void> {
    await db.prompts.delete(id);
  },
  
  async search(query: string): Promise<PromptTemplate[]> {
    const lowerQuery = query.toLowerCase();
    return db.prompts.filter(p => 
      p.name.toLowerCase().includes(lowerQuery) || 
      p.content.toLowerCase().includes(lowerQuery) ||
      p.category.toLowerCase().includes(lowerQuery)
    ).toArray();
  }
};
