"use client";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Eye,
  FileSpreadsheet,
  FileText,
  Heart,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { campaignsApi } from "@/lib/api/campaigns";
import { reportsApi, type ReportKind } from "@/lib/api/reports";
import { exportsApi } from "@/lib/api/exports";
import { mapApiErrorToToastMessage } from "@/lib/api/errors";
import { CampaignShell } from "@/components/features/campaign/campaign-shell";
import { DataFilters } from "@/components/ui/data-filters";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  ReportsTable,
  type ReportsTableItem,
} from "@/components/features/reports/reports-table";
import { formatNumber, calcEngagement } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

const REPORT_KIND_FILTER: { value: ReportKind; label: string }[] = [
  { value: "BLAST", label: "Blast Reports" },
  { value: "COMMENT", label: "Comment Proofs" },
];

export default function CampaignReportsPage() {
  const { campaignId } = useParams<{ campaignId: string }>();
  const { isAdmin } = useAuth();
  const [search, setSearch] = useState("");
  const [reportKind, setReportKind] = useState<ReportKind>("BLAST");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const queryClient = useQueryClient();

  const { data: campaign } = useQuery({
    queryKey: ["campaign", campaignId],
    queryFn: () => campaignsApi.get(campaignId),
  });

  const reportsQuery = useQuery({
    queryKey: ["campaign-reports", campaignId, { reportKind, page, limit }],
    queryFn: () =>
      reportsApi.listCampaignReports(
        campaignId,
        { page, limit, sortBy: "submittedAt", sortOrder: "desc" },
        reportKind,
      ),
  });

  const exportMutation = useMutation({
    mutationFn: (format: "PDF" | "EXCEL") =>
      exportsApi.create(campaignId, { format, scope: "FULL" }),
    onSuccess: (record) => {
      toast.success(`Export ${record.format} sedang diproses…`);
      queryClient.invalidateQueries({ queryKey: ["exports"] });
      queryClient.invalidateQueries({ queryKey: ["exports", campaignId] });
    },
    onError: (error) => {
      toast.error(mapApiErrorToToastMessage(error));
    },
  });

  const bundle = reportsQuery.data;
  const items = useMemo<ReportsTableItem[]>(() => {
    if (!bundle) return [];
    const blast: ReportsTableItem[] = bundle.blastReports.map((report) => ({
      kind: "BLAST",
      ...report,
      campaignId: report.campaignId,
      campaignName: campaign?.name,
    }));
    const comment: ReportsTableItem[] = bundle.commentProofs.map((task) => ({
      kind: "COMMENT",
      ...task,
      campaignId: task.command?.campaignId ?? campaignId,
      campaignName: campaign?.name,
    }));
    return [...blast, ...comment];
  }, [bundle, campaign, campaignId]);

  const filtered = useMemo(() => {
    if (!search) return items;
    const needle = search.toLowerCase();
    return items.filter((item) => {
      if (item.kind === "BLAST") {
        return (
          item.submittedByUser?.name?.toLowerCase().includes(needle) ||
          item.submittedBy?.toLowerCase().includes(needle) ||
          item.proofLink?.toLowerCase().includes(needle) ||
          item.notes?.toLowerCase().includes(needle)
        );
      }
      return (
        item.keptByUser?.name?.toLowerCase().includes(needle) ||
        item.keptBy?.toLowerCase().includes(needle) ||
        item.proofLink?.toLowerCase().includes(needle) ||
        item.notes?.toLowerCase().includes(needle)
      );
    });
  }, [items, search]);

  const blastReports = bundle?.blastReports ?? [];
  const totalViews = blastReports.reduce((sum, r) => sum + r.views, 0);
  const totalLikes = blastReports.reduce((sum, r) => sum + r.likes, 0);
  const totalReports = blastReports.length;
  const totalEngagement = blastReports.reduce(
    (sum, r) => sum + calcEngagement(r),
    0,
  );

  return (
    <CampaignShell campaign={campaign} campaignId={campaignId}>
      <div className="section-heading-row">
        <div>
          <div className="section-kicker">Reports</div>
          <h2 className="section-title">Campaign Reports</h2>
          <p className="section-subtitle">
            Blast reports dan Comment proofs yang disubmit untuk campaign ini.
          </p>
        </div>
        {isAdmin && (
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <Button
              variant="secondary"
              icon={<FileText size={14} />}
              loading={exportMutation.isPending}
              onClick={() => exportMutation.mutate("PDF")}
            >
              Export PDF
            </Button>
            <Button
              variant="secondary"
              icon={<FileSpreadsheet size={14} />}
              loading={exportMutation.isPending}
              onClick={() => exportMutation.mutate("EXCEL")}
            >
              Export Excel
            </Button>
          </div>
        )}
      </div>

      <div
        className="kpi-grid"
        style={{ gridTemplateColumns: "repeat(4, 1fr)" }}
      >
        <div
          className="kpi-v2"
          style={{ borderLeftColor: "var(--status-completed)" }}
        >
          <div
            className="kpi-v2-icon"
            style={{
              background: "var(--status-completed-bg)",
              color: "var(--status-completed)",
            }}
          >
            <FileText size={20} />
          </div>
          <div>
            <div className="kpi-v2-label">Blast Reports</div>
            <div className="kpi-v2-value">{formatNumber(totalReports)}</div>
          </div>
        </div>
        <div className="kpi-v2" style={{ borderLeftColor: "var(--cyan)" }}>
          <div
            className="kpi-v2-icon"
            style={{ background: "var(--cyan-dim)", color: "var(--cyan)" }}
          >
            <Eye size={20} />
          </div>
          <div>
            <div className="kpi-v2-label">Total Views</div>
            <div className="kpi-v2-value">{formatNumber(totalViews)}</div>
          </div>
        </div>
        <div className="kpi-v2" style={{ borderLeftColor: "#f43f5e" }}>
          <div
            className="kpi-v2-icon"
            style={{ background: "rgba(244,63,94,0.12)", color: "#f43f5e" }}
          >
            <Heart size={20} />
          </div>
          <div>
            <div className="kpi-v2-label">Total Likes</div>
            <div className="kpi-v2-value">{formatNumber(totalLikes)}</div>
          </div>
        </div>
        <div
          className="kpi-v2"
          style={{ borderLeftColor: "var(--status-active)" }}
        >
          <div
            className="kpi-v2-icon"
            style={{
              background: "var(--status-active-bg)",
              color: "var(--status-active)",
            }}
          >
            <TrendingUp size={20} />
          </div>
          <div>
            <div className="kpi-v2-label">Total Engagement</div>
            <div className="kpi-v2-value">{formatNumber(totalEngagement)}</div>
          </div>
        </div>
      </div>

      <DataFilters
        search={search}
        onSearchChange={setSearch}
        placeholder="Cari buzzer, proof, atau catatan..."
        filters={[
          {
            label: "All Report Types",
            value: reportKind === "ALL" ? "" : reportKind,
            options: REPORT_KIND_FILTER.map((o) => ({
              value: o.value,
              label: o.label,
            })),
            onChange: (value) => {
              setReportKind((value as ReportKind) || "BLAST");
              setPage(1);
            },
          },
        ]}
      />
      {bundle?.paginationSource === "NONE" && (
        <div className="blast-info-banner" style={{ marginBottom: "1rem" }}>
          <span>
            Comment proofs belum punya endpoint report aggregator berpaginasi;
            data ditampilkan dari completed CommentTask.
          </span>
        </div>
      )}

      {reportsQuery.isLoading ? (
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} height={52} />
          ))}
        </div>
      ) : reportsQuery.isError ? (
        <ErrorState
          title="Gagal memuat reports"
          message={mapApiErrorToToastMessage(reportsQuery.error)}
          retry={() => reportsQuery.refetch()}
        />
      ) : !filtered.length ? (
        <EmptyState
          icon={<FileText size={48} />}
          title="Belum ada report"
          description="Report akan muncul setelah Buzzer menyelesaikan blast atau comment task."
        />
      ) : (
        <>
          <ReportsTable items={filtered} />
          {bundle?.paginationSource === "BLAST_REPORTS" && (
            <PaginationControls
              meta={bundle.meta}
              pageSize={limit}
              itemLabel="reports"
              onPageChange={setPage}
              onPageSizeChange={(nextLimit) => {
                setLimit(nextLimit);
                setPage(1);
              }}
            />
          )}
        </>
      )}
    </CampaignShell>
  );
}
