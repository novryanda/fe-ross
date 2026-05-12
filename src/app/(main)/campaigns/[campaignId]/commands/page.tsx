"use client";
import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  Clock,
  Eye,
  MessageCircle,
  Pause,
  Play,
  RotateCcw,
  Search,
  ShieldCheck,
  TimerReset,
  Users,
} from "lucide-react";
import { CampaignShell } from "@/components/features/campaign/campaign-shell";
import { RoleGuard } from "@/components/layout/role-guard";
import { EmptyState } from "@/components/ui/empty-state";
import {
  PlatformBadge,
  StanceBadge,
  StatusBadge,
} from "@/components/ui/badges";
import { Input } from "@/components/ui/input";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { campaignsApi } from "@/lib/api/campaigns";
import { commentCommandsApi } from "@/lib/api/comment-commands";
import { mapApiErrorToToastMessage } from "@/lib/api/errors";
import { formatDate } from "@/lib/utils";
import type {
  CommentCommand,
  CommentCommandStatus,
  PaginationMeta,
  Platform,
  Stance,
} from "@/types";
import { toast } from "sonner";

type CommentCommandsResponse = {
  data: CommentCommand[];
  meta: PaginationMeta;
};

type CommandStatusAction = "pause" | "resume" | "restore" | "activate" | "archive";

type UpdateCommandStatusVariables = {
  commandId: string;
  nextStatus: Extract<CommentCommandStatus, "ACTIVE" | "PAUSED" | "ARCHIVED">;
  action: CommandStatusAction;
};

const commandStatusSuccessMessage: Record<CommandStatusAction, string> = {
  pause: "Comment command dipause.",
  resume: "Comment command dilanjutkan.",
  restore: "Comment command direstore.",
  activate: "Comment command diaktifkan.",
  archive: "Comment command diarchive.",
};

function updateCommandStatusInResponse(
  old: CommentCommandsResponse | undefined,
  commandId: string,
  status: CommentCommandStatus,
): CommentCommandsResponse | undefined {
  if (!old) return old;

  return {
    ...old,
    data: old.data.map((command) =>
      command.id === commandId
        ? { ...command, status, updatedAt: new Date().toISOString() }
        : command,
    ),
  };
}

export default function CommandsPage() {
  const { campaignId } = useParams<{ campaignId: string }>();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [stance, setStance] = useState<"ALL" | Stance>("ALL");
  const [platform, setPlatform] = useState<"ALL" | Platform>("ALL");
  const [status, setStatus] = useState<"ALL" | CommentCommandStatus>("ALL");
  const [deadline, setDeadline] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 400);
    return () => window.clearTimeout(timeout);
  }, [search]);

  const resetPage = () => setPage(1);

  const deadlineRange = useMemo(() => {
    if (!deadline) return { dateFrom: undefined, dateTo: undefined };
    const nextDay = new Date(`${deadline}T00:00:00`);
    nextDay.setDate(nextDay.getDate() + 1);
    return {
      dateFrom: `${deadline}T00:00:00.000Z`,
      dateTo: nextDay.toISOString(),
    };
  }, [deadline]);

  const campaignQuery = useQuery({
    queryKey: ["campaign", campaignId],
    queryFn: () => campaignsApi.get(campaignId),
  });
  const commandsQuery = useQuery({
    queryKey: [
      "comment-commands",
      campaignId,
      {
        page,
        limit,
        search: debouncedSearch,
        stance,
        platform,
        status,
        deadline,
      },
    ],
    queryFn: () =>
      commentCommandsApi.list(campaignId, {
        page,
        limit,
        sortBy: "createdAt",
        sortOrder: "desc",
        search: debouncedSearch || undefined,
        stance: stance === "ALL" ? undefined : stance,
        platform: platform === "ALL" ? undefined : platform,
        status: status === "ALL" ? undefined : status,
        dateFrom: deadlineRange.dateFrom,
        dateTo: deadlineRange.dateTo,
      }),
  });
  const commands = useMemo(
    () => commandsQuery.data?.data ?? [],
    [commandsQuery.data],
  );
  const meta = commandsQuery.data?.meta;

  const statusMutation = useMutation({
    mutationFn: ({ commandId, nextStatus }: UpdateCommandStatusVariables) =>
      commentCommandsApi.updateStatus(commandId, nextStatus),
    onMutate: async ({ commandId, nextStatus }) => {
      await queryClient.cancelQueries({
        queryKey: ["comment-commands", campaignId],
      });

      const previousLists =
        queryClient.getQueriesData<CommentCommandsResponse>({
          queryKey: ["comment-commands", campaignId],
        });

      queryClient.setQueriesData<CommentCommandsResponse>(
        { queryKey: ["comment-commands", campaignId] },
        (old) => updateCommandStatusInResponse(old, commandId, nextStatus),
      );

      return { previousLists };
    },
    onError: (error, _variables, context) => {
      context?.previousLists.forEach(([queryKey, previous]) => {
        queryClient.setQueryData(queryKey, previous);
      });
      toast.error(mapApiErrorToToastMessage(error));
    },
    onSuccess: (command, variables) => {
      queryClient.setQueriesData<CommentCommandsResponse>(
        { queryKey: ["comment-commands", campaignId] },
        (old) => updateCommandStatusInResponse(old, command.id, command.status),
      );
      toast.success(commandStatusSuccessMessage[variables.action]);
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["comment-commands", campaignId],
      });
      queryClient.invalidateQueries({
        queryKey: ["comment-tasks", campaignId],
      });
      queryClient.invalidateQueries({
        queryKey: ["campaign-dashboard", campaignId],
      });
      queryClient.invalidateQueries({ queryKey: ["buzzer-comment-queue"] });
    },
  });

  const totals = {
    commands: commands.length,
    available: commands.reduce(
      (sum, command) => sum + command.availableSlots,
      0,
    ),
    kept: commands.reduce((sum, command) => sum + command.keptSlots, 0),
    completed: commands.reduce(
      (sum, command) => sum + command.completedSlots,
      0,
    ),
    review: commands.reduce(
      (sum, command) =>
        sum +
        Math.max(
          0,
          command.requiredSlots -
            command.availableSlots -
            command.keptSlots -
            command.completedSlots,
        ),
      0,
    ),
  };

  const error = campaignQuery.error ?? commandsQuery.error;

  return (
    <RoleGuard roles={["ADMIN"]}>
      <CampaignShell campaign={campaignQuery.data} campaignId={campaignId}>
        <div className="section-heading-row">
          <div>
            <div className="section-kicker">Comment Keep Queue</div>
            <h2 className="section-title">Comment Commands</h2>
            <p className="section-subtitle">
              Command terbuka untuk semua Buzzer member campaign. Slot diambil
              dengan Keep, first come first served.
            </p>
          </div>
          <Link
            href={`/campaigns/${campaignId}/commands/new`}
            className="btn-primary"
            style={{ textDecoration: "none" }}
          >
            <MessageCircle size={14} /> New Command
          </Link>
        </div>

        {commandsQuery.isLoading || campaignQuery.isLoading ? (
          <div className="skeleton" style={{ height: 260, borderRadius: 12 }} />
        ) : error ? (
          <EmptyState
            icon={<AlertTriangle size={48} />}
            title="Gagal memuat comment commands"
            description={mapApiErrorToToastMessage(error)}
          />
        ) : (
          <>
            <div
              className="kpi-grid"
              style={{ gridTemplateColumns: "repeat(5, 1fr)" }}
            >
              <Kpi
                label="Total Commands"
                value={totals.commands}
                icon={<MessageCircle size={20} />}
                color="var(--violet)"
              />
              <Kpi
                label="Available Slots"
                value={totals.available}
                icon={<ShieldCheck size={20} />}
                color="var(--status-available)"
              />
              <Kpi
                label="Kept / In Progress"
                value={totals.kept}
                icon={<Users size={20} />}
                color="var(--status-kept)"
              />
              <Kpi
                label="Completed"
                value={totals.completed}
                icon={<CheckCircle2 size={20} />}
                color="var(--status-completed)"
              />
              <Kpi
                label="Expired / Needs Review"
                value={totals.review}
                icon={<TimerReset size={20} />}
                color="var(--status-expired)"
              />
            </div>

            <div className="comment-filter-toolbar">
              <Input
                icon={<Search size={14} />}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search command or target URL..."
              />
              <select
                className="input-field"
                value={stance}
                onChange={(event) => {
                  setStance(event.target.value as "ALL" | Stance);
                  resetPage();
                }}
              >
                <option value="ALL">All Stance</option>
                <option value="PRO">PRO</option>
                <option value="KONTRA">KONTRA</option>
              </select>
              <select
                className="input-field"
                value={platform}
                onChange={(event) => {
                  setPlatform(event.target.value as "ALL" | Platform);
                  resetPage();
                }}
              >
                <option value="ALL">All Platforms</option>
                <option value="INSTAGRAM">Instagram</option>
                <option value="TIKTOK">TikTok</option>
                <option value="X_TWITTER">X/Twitter</option>
                <option value="FACEBOOK">Facebook</option>
              </select>
              <select
                className="input-field"
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value as "ALL" | CommentCommandStatus);
                  resetPage();
                }}
              >
                <option value="ALL">All Status</option>
                <option value="DRAFT">Draft</option>
                <option value="ACTIVE">Active</option>
                <option value="PAUSED">Paused</option>
                <option value="ARCHIVED">Archived</option>
              </select>
              <Input
                type="date"
                value={deadline}
                onChange={(event) => {
                  setDeadline(event.target.value);
                  resetPage();
                }}
              />
            </div>

            <div className="blast-table-shell">
              <div className="blast-table-scroll">
                <table className="blast-table">
                <thead>
                  <tr>
                    <th>Stance</th>
                    <th>Platform</th>
                    <th>Target Post URL</th>
                    <th>Narrative Preview</th>
                    <th>Required Slots</th>
                    <th>Available Slots</th>
                    <th>Kept Slots</th>
                    <th>Completed</th>
                    <th>Deadline</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {commands.map((command) => {
                    const pendingVariables = statusMutation.variables;
                    const pendingAction =
                      statusMutation.isPending &&
                      pendingVariables?.commandId === command.id
                        ? pendingVariables.action
                        : undefined;

                    return (
                    <tr key={command.id}>
                      <td>
                        <StanceBadge stance={command.stance} size="sm" />
                      </td>
                      <td>
                        <PlatformBadge platform={command.platform} size="sm" />
                      </td>
                      <td>
                        <a
                          href={command.targetPostUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ext-link"
                          style={{ maxWidth: 220 }}
                        >
                          {command.targetPostUrl}
                        </a>
                      </td>
                      <td>
                        <div
                          style={{
                            maxWidth: 280,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            color: "var(--text-primary)",
                            fontWeight: 700,
                          }}
                        >
                          {command.narrative}
                        </div>
                      </td>
                      <td>{command.requiredSlots}</td>
                      <td>
                        <strong
                          style={{
                            color:
                              command.availableSlots > 0
                                ? "var(--status-available)"
                                : "var(--text-muted)",
                          }}
                        >
                          {command.availableSlots}
                        </strong>
                      </td>
                      <td>{command.keptSlots}</td>
                      <td>{command.completedSlots}</td>
                      <td>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.3rem",
                          }}
                        >
                          <Clock size={12} />{" "}
                          {command.deadline
                            ? formatDate(command.deadline)
                            : "-"}
                        </span>
                      </td>
                      <td>
                        <StatusBadge
                          status={command.status}
                          type="command"
                          size="sm"
                        />
                      </td>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            gap: "0.4rem",
                            flexWrap: "wrap",
                          }}
                        >
                          <Link
                            href={`/campaigns/${campaignId}/commands/${command.id}`}
                            className="btn-secondary"
                            style={{
                              padding: "0.25rem 0.5rem",
                              fontSize: "0.75rem",
                              textDecoration: "none",
                            }}
                          >
                            <Eye size={12} /> Detail
                          </Link>
                          {command.status === "ACTIVE" && (
                            <button
                              className="btn-ghost"
                              type="button"
                              disabled={Boolean(pendingAction)}
                              onClick={() =>
                                statusMutation.mutate({
                                  commandId: command.id,
                                  nextStatus: "PAUSED",
                                  action: "pause",
                                })
                              }
                              style={{
                                padding: "0.25rem 0.5rem",
                                fontSize: "0.75rem",
                                color: "var(--status-paused)",
                              }}
                            >
                              {pendingAction === "pause" ? (
                                <span className="spinner" />
                              ) : (
                                <Pause size={12} />
                              )}{" "}
                              Pause
                            </button>
                          )}
                          {command.status === "PAUSED" && (
                            <button
                              className="btn-ghost"
                              type="button"
                              disabled={Boolean(pendingAction)}
                              onClick={() =>
                                statusMutation.mutate({
                                  commandId: command.id,
                                  nextStatus: "ACTIVE",
                                  action: "resume",
                                })
                              }
                              style={{
                                padding: "0.25rem 0.5rem",
                                fontSize: "0.75rem",
                                color: "var(--cyan)",
                              }}
                            >
                              {pendingAction === "resume" ? (
                                <span className="spinner" />
                              ) : (
                                <Play size={12} />
                              )}{" "}
                              Resume
                            </button>
                          )}
                          {command.status === "ARCHIVED" && (
                            <button
                              className="btn-ghost"
                              type="button"
                              disabled={Boolean(pendingAction)}
                              onClick={() =>
                                statusMutation.mutate({
                                  commandId: command.id,
                                  nextStatus: "ACTIVE",
                                  action: "restore",
                                })
                              }
                              style={{
                                padding: "0.25rem 0.5rem",
                                fontSize: "0.75rem",
                                color: "var(--cyan)",
                              }}
                            >
                              {pendingAction === "restore" ? (
                                <span className="spinner" />
                              ) : (
                                <RotateCcw size={12} />
                              )}{" "}
                              Restore
                            </button>
                          )}
                          {command.status === "DRAFT" && (
                            <button
                              className="btn-ghost"
                              type="button"
                              disabled={Boolean(pendingAction)}
                              onClick={() =>
                                statusMutation.mutate({
                                  commandId: command.id,
                                  nextStatus: "ACTIVE",
                                  action: "activate",
                                })
                              }
                              style={{
                                padding: "0.25rem 0.5rem",
                                fontSize: "0.75rem",
                                color: "var(--cyan)",
                              }}
                            >
                              {pendingAction === "activate" ? (
                                <span className="spinner" />
                              ) : (
                                <Play size={12} />
                              )}{" "}
                              Activate
                            </button>
                          )}
                          {command.status !== "ARCHIVED" && (
                            <button
                              className="btn-ghost"
                              type="button"
                              disabled={Boolean(pendingAction)}
                              onClick={() =>
                                statusMutation.mutate({
                                  commandId: command.id,
                                  nextStatus: "ARCHIVED",
                                  action: "archive",
                                })
                              }
                              style={{
                                padding: "0.25rem 0.5rem",
                                fontSize: "0.75rem",
                                color: "var(--status-rejected)",
                              }}
                            >
                              {pendingAction === "archive" ? (
                                <span className="spinner" />
                              ) : (
                                <Archive size={12} />
                              )}{" "}
                              Archive
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                </tbody>
              </table>
              </div>
              {!commands.length && (
                <EmptyState
                  icon={<MessageCircle size={48} />}
                  title="Tidak ada comment command sesuai filter"
                />
              )}
              <PaginationControls
                meta={meta}
                pageSize={limit}
                itemLabel="commands"
                onPageChange={setPage}
                onPageSizeChange={(nextLimit) => {
                  setLimit(nextLimit);
                  setPage(1);
                }}
              />
            </div>
          </>
        )}
      </CampaignShell>
    </RoleGuard>
  );
}

function Kpi({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: ReactNode;
  color: string;
}) {
  return (
    <div className="kpi-v2" style={{ borderLeftColor: color }}>
      <div
        className="kpi-v2-icon"
        style={{
          background: `color-mix(in srgb, ${color} 16%, transparent)`,
          color,
        }}
      >
        {icon}
      </div>
      <div>
        <div className="kpi-v2-label">{label}</div>
        <div className="kpi-v2-value">{value}</div>
      </div>
    </div>
  );
}
