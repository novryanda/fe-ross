"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { History, Loader2 } from "lucide-react";
import { DataFilters } from "@/components/ui/data-filters";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { RoleGuard } from "@/components/layout/role-guard";
import { CampaignShell } from "@/components/features/campaign/campaign-shell";
import { AuditLogTable } from "@/components/features/audit/audit-log-table";
import { auditLogsApi } from "@/lib/api/audit-logs";
import { campaignsApi } from "@/lib/api/campaigns";
import { mapApiErrorToToastMessage } from "@/lib/api/errors";
import { AUDIT_ACTION_LABELS } from "@/lib/constants";
import type { AuditLog } from "@/types";

const ENTITY_TYPES = [
  { value: "Campaign", label: "Campaign" },
  { value: "CampaignMember", label: "Campaign Member" },
  { value: "BlastTarget", label: "Blast Target" },
  { value: "BlastAttempt", label: "Blast Attempt" },
  { value: "BlastReport", label: "Blast Report" },
  { value: "CommentCommand", label: "Comment Command" },
  { value: "CommentTask", label: "Comment Task" },
  { value: "ExportReport", label: "Export" },
];

export default function CampaignAuditPage() {
  const { campaignId } = useParams<{ campaignId: string }>();
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("");
  const [entityType, setEntityType] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(
      () => setDebouncedSearch(search.trim()),
      400,
    );
    return () => window.clearTimeout(timeout);
  }, [search]);

  const { data: campaign } = useQuery({
    queryKey: ["campaign", campaignId],
    queryFn: () => campaignsApi.get(campaignId),
  });

  const logsQuery = useInfiniteQuery({
    queryKey: [
      "campaign-audit",
      campaignId,
      { action, entityType, dateFrom, dateTo, search: debouncedSearch },
    ],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      auditLogsApi.listByCampaign(campaignId, {
        page: pageParam,
        limit: 20,
        action: action || undefined,
        entityType: entityType || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        search: debouncedSearch || undefined,
        sortBy: "createdAt",
        sortOrder: "desc",
      }),
    getNextPageParam: (lastPage) =>
      lastPage.meta.page < lastPage.meta.totalPages
        ? lastPage.meta.page + 1
        : undefined,
  });

  const logs = useMemo(() => {
    const byId = new Map<string, AuditLog>();
    for (const page of logsQuery.data?.pages ?? []) {
      for (const log of page.data) byId.set(log.id, log);
    }
    const rows = [...byId.values()];
    if (!debouncedSearch) return rows;
    const needle = debouncedSearch.toLowerCase();
    return rows.filter(
      (log) =>
        log.details?.toLowerCase().includes(needle) ||
        log.actorName?.toLowerCase().includes(needle) ||
        log.action.toLowerCase().includes(needle) ||
        log.target.toLowerCase().includes(needle),
    );
  }, [logsQuery.data?.pages, debouncedSearch]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (
          entry.isIntersecting &&
          logsQuery.hasNextPage &&
          !logsQuery.isFetchingNextPage
        ) {
          void logsQuery.fetchNextPage();
        }
      },
      { rootMargin: "240px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [logsQuery]);

  const actionOptions = useMemo(
    () =>
      Object.entries(AUDIT_ACTION_LABELS).map(([value, label]) => ({
        value,
        label,
      })),
    [],
  );

  return (
    <RoleGuard roles={["ADMIN"]}>
      <CampaignShell campaign={campaign} campaignId={campaignId}>
        <div className="section-heading-row">
          <div>
            <div className="section-kicker">Audit Trail</div>
            <h2 className="section-title">Campaign Audit</h2>
            <p className="section-subtitle">
              Aktivitas penting campaign tercatat di sini.
            </p>
          </div>
        </div>

        <DataFilters
          search={search}
          onSearchChange={setSearch}
          placeholder="Cari aktor, aksi, atau target..."
          filters={[
            {
              label: "All Actions",
              value: action,
              options: actionOptions,
              onChange: setAction,
            },
            {
              label: "All Entity Types",
              value: entityType,
              options: ENTITY_TYPES,
              onChange: setEntityType,
            },
          ]}
          actions={
            <div
              style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}
            >
              <input
                type="date"
                className="input-field"
                style={{ width: "auto" }}
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                aria-label="Dari tanggal"
              />
              <span className="muted-meta" style={{ fontSize: "0.75rem" }}>
                →
              </span>
              <input
                type="date"
                className="input-field"
                style={{ width: "auto" }}
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                aria-label="Sampai tanggal"
              />
            </div>
          }
        />

        {logsQuery.isLoading ? (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} height={44} />
            ))}
          </div>
        ) : logsQuery.isError ? (
          <ErrorState
            title="Gagal memuat audit log"
            message={mapApiErrorToToastMessage(logsQuery.error)}
            retry={() => logsQuery.refetch()}
          />
        ) : !logs.length ? (
          <EmptyState
            icon={<History size={48} />}
            title="Belum ada audit log"
            description="Aktivitas penting campaign akan tercatat di sini."
          />
        ) : (
          <>
            <AuditLogTable
              logs={logs}
              onLoadDetail={auditLogsApi.getAuditLog}
            />
            <div
              ref={sentinelRef}
              style={{
                minHeight: 40,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                color: "var(--text-muted)",
                fontSize: "0.8125rem",
              }}
            >
              {logsQuery.isFetchingNextPage ? (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Loader2
                    size={14}
                    style={{ animation: "spin 1s linear infinite" }}
                  />
                  Loading more audit logs...
                </span>
              ) : logsQuery.hasNextPage ? (
                <span>Scroll untuk memuat audit log berikutnya.</span>
              ) : (
                <span>Semua audit log sudah ditampilkan.</span>
              )}
            </div>
          </>
        )}
      </CampaignShell>
    </RoleGuard>
  );
}
