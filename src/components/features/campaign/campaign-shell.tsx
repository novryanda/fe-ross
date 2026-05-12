"use client";
import Link from "next/link";
import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { MessageCircle, Settings, Target } from "lucide-react";
import { CampaignHero } from "@/components/features/campaign/campaign-hero";
import { useAuth } from "@/hooks/use-auth";
import { campaignMembersApi } from "@/lib/api/campaign-members";
import type { Campaign } from "@/types";

interface CampaignShellProps {
  campaign?: Campaign;
  campaignId: string;
  children: ReactNode;
  actions?: ReactNode;
}

export function CampaignShell({
  campaign,
  campaignId,
  children,
  actions,
}: CampaignShellProps) {
  const { isAdmin, isViewer } = useAuth();
  const membersCountQuery = useQuery({
    queryKey: ["campaign-members", campaignId, "count"],
    queryFn: () => campaignMembersApi.list(campaignId, { page: 1, limit: 1 }),
    enabled: isAdmin && !!campaignId && campaign?.memberCount === undefined,
  });

  const campaignWithCounts = campaign
    ? {
        ...campaign,
        memberCount: campaign.memberCount ?? membersCountQuery.data?.meta.total,
      }
    : campaign;
  const defaultActions = isAdmin ? (
    <>
      <Link
        href={`/campaigns/${campaignId}/blast-links/new`}
        className="btn-primary"
        style={{ textDecoration: "none" }}
      >
        <Target size={14} /> Add Blast Link
      </Link>
      <Link
        href={`/campaigns/${campaignId}/commands/new`}
        className="btn-secondary"
        style={{ textDecoration: "none" }}
      >
        <MessageCircle size={14} /> New Command
      </Link>
      <Link
        href={`/campaigns/${campaignId}/edit`}
        className="btn-ghost"
        style={{ textDecoration: "none" }}
      >
        <Settings size={14} /> Edit
      </Link>
    </>
  ) : undefined;

  return (
    <div>
      <CampaignHero
        campaign={campaignWithCounts}
        campaignId={campaignId}
        viewer={isViewer}
        actions={actions ?? defaultActions}
        memberCountLoading={membersCountQuery.isLoading}
      />
      {children}
    </div>
  );
}
