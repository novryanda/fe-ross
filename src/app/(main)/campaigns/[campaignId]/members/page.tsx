"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Plus, Users } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { RoleGuard } from "@/components/layout/role-guard";
import { RoleBadge } from "@/components/layout/role-badge";
import { CampaignShell } from "@/components/features/campaign/campaign-shell";
import { CampaignMembersTable } from "@/components/features/campaign/campaign-members-table";
import { StatusBadge } from "@/components/ui/badges";
import { campaignsApi } from "@/lib/api/campaigns";
import { campaignMembersApi } from "@/lib/api/campaign-members";
import { getErrorMessage, mapApiErrorToToastMessage } from "@/lib/api/errors";
import { usersApi } from "@/lib/api/users";
import type { CampaignMember } from "@/types";
import type { CampaignMemberRole } from "@/lib/api/mappers/campaign.mapper";
import { toast } from "sonner";

export default function CampaignMembersPage() {
  const { campaignId } = useParams<{ campaignId: string }>();
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState("");
  const [removingUserId, setRemovingUserId] = useState<string | undefined>();

  const campaignQuery = useQuery({
    queryKey: ["campaign", campaignId],
    queryFn: () => campaignsApi.get(campaignId),
  });
  const membersQuery = useQuery({
    queryKey: ["campaign-members", campaignId],
    queryFn: () => campaignMembersApi.list(campaignId),
  });
  const usersQuery = useQuery({
    queryKey: ["campaign-members-users"],
    queryFn: () => usersApi.list({ limit: 100, status: "ACTIVE" }),
  });

  const members = membersQuery.data?.data ?? [];
  const existingUserIds = new Set(members.map((member) => member.userId));
  const selectableUsers = (usersQuery.data?.items ?? []).filter(
    (user) =>
      user.status === "ACTIVE" &&
      user.role !== "PIC" &&
      !existingUserIds.has(user.id),
  );
  const selectedUser = selectableUsers.find(
    (user) => user.id === selectedUserId,
  );

  const addMutation = useMutation({
    mutationFn: () => {
      if (!selectedUser) throw new Error("Pilih user aktif terlebih dahulu.");
      if (selectedUser.role === "PIC") {
        throw new Error("Role PIC tidak bisa menjadi campaign member.");
      }
      return campaignMembersApi.add(campaignId, {
        members: [
          {
            userId: selectedUser.id,
            memberRole: selectedUser.role as CampaignMemberRole,
          },
        ],
      });
    },
    onSuccess: () => {
      toast.success("Member ditambahkan ke campaign.");
      setSelectedUserId("");
      queryClient.invalidateQueries({
        queryKey: ["campaign-members", campaignId],
      });
      queryClient.invalidateQueries({ queryKey: ["campaign", campaignId] });
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
    onError: (error) => {
      toast.error(mapApiErrorToToastMessage(error));
    },
  });

  const removeMutation = useMutation({
    mutationFn: (member: CampaignMember) => {
      setRemovingUserId(member.userId);
      return campaignMembersApi.remove(campaignId, member.userId);
    },
    onSuccess: () => {
      toast.success("Member dihapus dari campaign.");
      queryClient.invalidateQueries({
        queryKey: ["campaign-members", campaignId],
      });
      queryClient.invalidateQueries({ queryKey: ["campaign", campaignId] });
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
    onError: (error) => {
      toast.error(mapApiErrorToToastMessage(error));
    },
    onSettled: () => setRemovingUserId(undefined),
  });

  return (
    <RoleGuard roles={["ADMIN"]}>
      <CampaignShell campaign={campaignQuery.data} campaignId={campaignId}>
        <div className="section-heading-row">
          <div>
            <div className="section-kicker">Campaign Access</div>
            <h2 className="section-title">Campaign Members</h2>
            <p className="section-subtitle">
              Kelola member campaign agar Buzzer dapat melihat Blast Queue dan
              menerima CommentTask.
            </p>
          </div>
        </div>

        {(campaignQuery.isError || membersQuery.isError) && (
          <div
            className="blast-info-banner"
            style={{
              marginBottom: "1.25rem",
              borderColor: "rgba(239,68,68,0.35)",
            }}
          >
            <AlertCircle
              size={18}
              style={{ color: "var(--status-rejected)", flexShrink: 0 }}
            />
            <span>
              {getErrorMessage(
                campaignQuery.error ?? membersQuery.error,
                "Gagal memuat campaign members.",
              )}
            </span>
          </div>
        )}

        <div
          className="campaign-summary-panel"
          style={{ marginBottom: "1.25rem" }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "end",
              gap: "0.75rem",
              flexWrap: "wrap",
            }}
          >
            <div
              className="form-group"
              style={{ minWidth: 260, marginBottom: 0 }}
            >
              <label className="form-label">Add Member</label>
              <select
                className="input-field"
                value={selectedUserId}
                onChange={(event) => setSelectedUserId(event.target.value)}
                disabled={usersQuery.isLoading}
              >
                <option value="">
                  {usersQuery.isLoading
                    ? "Loading users..."
                    : "Select active user"}
                </option>
                {selectableUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} - {user.email} - {user.role} - {user.status}
                  </option>
                ))}
              </select>
              {selectedUser && (
                <div
                  style={{
                    display: "flex",
                    gap: "0.5rem",
                    alignItems: "center",
                    marginTop: "0.5rem",
                    flexWrap: "wrap",
                  }}
                >
                  <span style={{ fontWeight: 700 }}>{selectedUser.name}</span>
                  <span className="muted-meta">{selectedUser.email}</span>
                  <RoleBadge role={selectedUser.role} />
                  <StatusBadge
                    status={selectedUser.status}
                    type="user"
                    size="sm"
                  />
                </div>
              )}
            </div>
            <button
              type="button"
              className="btn-primary"
              disabled={!selectedUser || addMutation.isPending}
              onClick={() => addMutation.mutate()}
            >
              <Plus size={14} />
              {addMutation.isPending ? "Adding..." : "Add Member"}
            </button>
          </div>
        </div>

        {membersQuery.isLoading ? (
          <div className="campaign-summary-panel">
            <strong>Memuat members...</strong>
            <p className="muted-meta" style={{ marginTop: "0.5rem" }}>
              Mengambil daftar member campaign.
            </p>
          </div>
        ) : !members.length ? (
          <EmptyState
            icon={<Users size={48} />}
            title="Belum ada member"
            description="Tambahkan member campaign agar Buzzer dapat melihat blast queue dan menerima comment task."
          />
        ) : (
          <CampaignMembersTable
            members={members}
            onRemove={(member) => removeMutation.mutate(member)}
            removingUserId={removingUserId}
          />
        )}
      </CampaignShell>
    </RoleGuard>
  );
}
