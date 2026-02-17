import { NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { CampaignType, Platform, Prisma } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { projectId, name, campaignType, platform, segmentation, adTemplates, budget, biddingStrategy } = body;

    if (!projectId || !name || !campaignType || !platform) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const template = await prisma.campaignTemplate.create({
      data: {
        projectId,
        name,
        campaignType: campaignType as CampaignType,
        platform: platform as Platform,
        segmentation: segmentation ? (segmentation as Prisma.InputJsonValue) : undefined,
        adTemplates: adTemplates ? (adTemplates as Prisma.InputJsonValue) : undefined,
        budget: budget ? budget : undefined,
        biddingStrategy,
      },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create template" },
      { status: 500 }
    );
  }
}
