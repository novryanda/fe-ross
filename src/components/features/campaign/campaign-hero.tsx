"use client";
import Link from "next/link";
import type { ReactNode } from "react";
import { CalendarDays, Users } from "lucide-react";
import { CampaignTabs } from "@/components/features/campaign/campaign-tabs";
import { PlatformBadge, StatusBadge } from "@/components/ui/badges";
import { formatDate } from "@/lib/utils";
import type { Campaign } from "@/types";

interface CampaignHeroProps {
  campaign?: Campaign;
  campaignId: string;
  actions?: ReactNode;
  viewer?: boolean;
  memberCount?: number;
  memberCountLoading?: boolean;
}

export function CampaignHero({
  campaign,
  campaignId,
  actions,
  viewer = false,
  memberCount,
  memberCountLoading = false,
}: CampaignHeroProps) {
  const title = campaign?.name ?? "Campaign";
  const initial = title.charAt(0).toUpperCase();
  const resolvedMemberCount = memberCount ?? campaign?.memberCount;

  return (
    <section className="campaign-hero">
      <div
        style={{
          marginBottom: "0.75rem",
          color: "var(--text-muted)",
          fontSize: "0.75rem",
        }}
      >
        <Link href="/campaigns" style={{ color: "var(--text-muted)" }}>
          Campaigns
        </Link>
        <span style={{ margin: "0 0.45rem" }}>/</span>
        <span>{title}</span>
      </div>

      <div className="campaign-hero-main">
        <div className="campaign-identity">
          <div className="campaign-avatar">{initial}</div>
          <div style={{ minWidth: 0 }}>
            <div className="campaign-title-row">
              <h1 className="campaign-title">{title}</h1>
              {campaign && (
                <StatusBadge
                  status={campaign.status}
                  type="campaign"
                  size="sm"
                />
              )}
            </div>
            <p className="campaign-description">
              {campaign?.description ?? "Campaign blast management workspace."}
            </p>
            <div className="campaign-meta-row">
              <span className="campaign-meta-item">
                <CalendarDays size={13} />
                {campaign
                  ? `${formatDate(campaign.startDate)} - ${campaign.endDate ? formatDate(campaign.endDate) : "Ongoing"}`
                  : "Campaign period"}
              </span>
              <span className="campaign-meta-item">
                <Users size={13} />
                {memberCountLoading && resolvedMemberCount === undefined
                  ? "—"
                  : (resolvedMemberCount ?? "—")}{" "}
                members
              </span>

              <span className="campaign-meta-item" style={{ gap: "0.35rem" }}>
                {campaign?.platforms?.map((platform) => (
                  <PlatformBadge key={platform} platform={platform} size="sm" />
                ))}
              </span>
            </div>
          </div>
        </div>

        {actions && <div className="campaign-hero-actions">{actions}</div>}
      </div>

      <div className="campaign-tabs-wrap">
        <CampaignTabs campaignId={campaignId} viewer={viewer} />
      </div>
    </section>
  );
}
