import { db, T } from "@/db";
import type { GeneratedCampaign, CampaignTemplate, Project, MerchantAccount } from "@/db/types";
import { logger } from "@/lib/logger";
import { syncFeedWithCampaigns } from "@/campaign-builder/sync/feed-sync";
import { FeedProduct } from "@/campaign-builder/templates/types";

/**
 * Feed sync job — synchronizes product feeds with generated campaigns.
 * Runs periodically to detect product changes and update campaigns.
 */
export async function feedSyncJob(): Promise<void> {
  logger.info("Feed sync job started");

  const { data: activeCampaigns } = await db
    .from(T.generatedCampaigns)
    .select("*")
    .eq("status", "active");

  for (const campaign of (activeCampaigns ?? []) as GeneratedCampaign[]) {
    try {
      // Fetch current products from Merchant Center
      // TODO: Use MerchantClient to fetch real products
      const currentProducts: FeedProduct[] = [];
      const previousProducts: FeedProduct[] = []; // Cache from last sync

      const result = await syncFeedWithCampaigns(
        campaign.id,
        currentProducts,
        previousProducts
      );

      logger.info("Feed sync for campaign completed", {
        campaignId: campaign.id,
        campaignName: campaign.name,
        ...result,
      });
    } catch (error) {
      logger.error("Feed sync failed for campaign", {
        campaignId: campaign.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  logger.info("Feed sync job completed");
}
