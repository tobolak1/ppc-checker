import { db, T } from "@/db";
import type { SyncAction } from "@/db/types";
import { logger } from "@/lib/logger";
import { FeedProduct } from "../templates/types";

interface SyncResult {
  created: number;
  updated: number;
  paused: number;
  resumed: number;
}

/**
 * Synchronize feed products with generated campaigns.
 * Detects new, removed, and changed products and updates campaign structure.
 */
export async function syncFeedWithCampaigns(
  generatedCampaignId: string,
  currentProducts: FeedProduct[],
  previousProducts: FeedProduct[]
): Promise<SyncResult> {
  const result: SyncResult = { created: 0, updated: 0, paused: 0, resumed: 0 };

  const currentMap = new Map(currentProducts.map((p) => [p.id, p]));
  const previousMap = new Map(previousProducts.map((p) => [p.id, p]));

  const syncLogs: { action: SyncAction; changes: Record<string, unknown> }[] = [];

  // New products (in current, not in previous)
  for (const [id, product] of currentMap) {
    if (!previousMap.has(id)) {
      syncLogs.push({
        action: "CREATED",
        changes: { productId: id, title: product.title, price: product.price },
      });
      result.created++;
    }
  }

  // Removed products (in previous, not in current)
  for (const [id, product] of previousMap) {
    if (!currentMap.has(id)) {
      syncLogs.push({
        action: "PAUSED",
        changes: { productId: id, title: product.title, reason: "removed_from_feed" },
      });
      result.paused++;
    }
  }

  // Changed products (in both, but different)
  for (const [id, current] of currentMap) {
    const previous = previousMap.get(id);
    if (!previous) continue;

    const changes: Record<string, { old: unknown; new: unknown }> = {};

    if (current.price !== previous.price) {
      changes.price = { old: previous.price, new: current.price };
    }
    if (current.availability !== previous.availability) {
      changes.availability = { old: previous.availability, new: current.availability };
      if (current.availability === "out_of_stock") result.paused++;
      if (previous.availability === "out_of_stock" && current.availability === "in_stock") result.resumed++;
    }
    if (current.category !== previous.category) {
      changes.category = { old: previous.category, new: current.category };
    }

    if (Object.keys(changes).length > 0) {
      syncLogs.push({
        action: current.availability === "out_of_stock" ? "PAUSED" :
               previous.availability === "out_of_stock" ? "RESUMED" : "UPDATED",
        changes: { productId: id, ...changes },
      });
      result.updated++;
    }
  }

  // Persist sync logs
  if (syncLogs.length > 0) {
    await db.from(T.syncLogs).insert(
      syncLogs.map((log) => ({
        generated_campaign_id: generatedCampaignId,
        action: log.action,
        changes: log.changes,
      }))
    );

    await db
      .from(T.generatedCampaigns)
      .update({ synced_at: new Date().toISOString() })
      .eq("id", generatedCampaignId);
  }

  logger.info("Feed sync completed", {
    campaignId: generatedCampaignId,
    ...result,
    totalLogs: syncLogs.length,
  });

  return result;
}
