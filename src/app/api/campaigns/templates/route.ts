import { NextResponse } from "next/server";
import { db, T } from "@/db";
import type { CampaignType, Platform } from "@/db/types";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { projectId, name, campaignType, platform, segmentation, adTemplates, budget, biddingStrategy } = body;

    if (!projectId || !name || !campaignType || !platform) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data: template, error } = await db
      .from(T.campaignTemplates)
      .insert({
        project_id: projectId,
        name,
        campaign_type: campaignType as CampaignType,
        platform: platform as Platform,
        segmentation: segmentation ?? null,
        ad_templates: adTemplates ?? null,
        budget: budget ?? null,
        bidding_strategy: biddingStrategy ?? null,
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create template" },
      { status: 500 }
    );
  }
}
