// ─────────────────────────────────────────────────────────────
// Database Cleanup Service — Handles Quota Management
// ─────────────────────────────────────────────────────────────

import { db } from './database';
import { conversationRepo } from './repositories/conversation-repo';

/**
 * Checks the current IndexedDB storage quota.
 * If usage exceeds the specified threshold (default 90%), it prunes old data.
 */
export async function checkAndPruneStorage(thresholdRatio: number = 0.9): Promise<void> {
  if (!navigator.storage || !navigator.storage.estimate) {
    console.warn('Storage Estimation API not supported.');
    return;
  }

  try {
    const estimate = await navigator.storage.estimate();
    if (estimate.usage !== undefined && estimate.quota !== undefined) {
      const usageRatio = estimate.usage / estimate.quota;
      
      console.log(`[Storage] Usage: ${(estimate.usage / 1024 / 1024).toFixed(2)} MB / ${(estimate.quota / 1024 / 1024).toFixed(2)} MB (${(usageRatio * 100).toFixed(1)}%)`);

      if (usageRatio > thresholdRatio) {
        console.warn(`[Storage] Quota usage exceeded threshold (${thresholdRatio * 100}%). Initiating cleanup...`);
        await pruneOldConversations();
      }
    }
  } catch (error) {
    console.error('Failed to estimate storage or prune database:', error);
  }
}

/**
 * Deletes older conversations to free up space.
 * Strategy:
 * 1. Delete empty conversations.
 * 2. Delete oldest unpinned, unfavorited conversations until we're safe.
 */
async function pruneOldConversations() {
  try {
    // 1. Delete all empty conversations
    const emptyConvs = await db.conversations
      .filter(c => c.messageCount === 0 && !c.isPinned && !c.isFavorite)
      .toArray();
      
    for (const conv of emptyConvs) {
      await conversationRepo.delete(conv.id);
    }
    
    console.log(`[Storage] Pruned ${emptyConvs.length} empty conversations.`);

    // 2. If still high, delete oldest 10 unpinned conversations
    const estimate = await navigator.storage.estimate();
    if (estimate.usage && estimate.quota && (estimate.usage / estimate.quota) > 0.85) {
      const oldConvs = await db.conversations
        .filter(c => !c.isPinned && !c.isFavorite)
        .sortBy('updatedAt');
        
      // Delete up to 10 of the oldest
      const toDelete = oldConvs.slice(0, 10);
      for (const conv of toDelete) {
        await conversationRepo.delete(conv.id);
      }
      
      console.log(`[Storage] Pruned ${toDelete.length} old conversations.`);
    }

  } catch (err) {
    console.error('[Storage] Error during pruning:', err);
  }
}

/**
 * Starts a background interval to check storage periodically (e.g. every hour).
 */
export function startStorageMonitor(intervalMs: number = 60 * 60 * 1000) {
  // Initial check on boot (delayed by 1 minute so it doesn't block startup)
  setTimeout(() => {
    checkAndPruneStorage().catch(console.error);
  }, 60000);

  // Periodic check
  setInterval(() => {
    checkAndPruneStorage().catch(console.error);
  }, intervalMs);
}
