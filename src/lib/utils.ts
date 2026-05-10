import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type {
  Platform,
  BlastAttemptStatus,
  BlastTargetStatus,
  CampaignStatus,
  CommentTaskStatus,
  CommentCommandStatus,
  Stance,
} from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toLocaleString();
}

export function formatDate(
  date: string | Date,
  options?: Intl.DateTimeFormatOptions,
): string {
  return new Date(date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...options,
  });
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const d = new Date(date);
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return "Baru saja";
  if (minutes < 60) return `${minutes}m lalu`;
  if (hours < 24) return `${hours}j lalu`;
  return `${days}h lalu`;
}

export function formatCountdown(expiresAt: string | Date): string {
  const now = new Date();
  const exp = new Date(expiresAt);
  const diff = exp.getTime() - now.getTime();
  if (diff <= 0) return "Expired";
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function isExpiringSoon(
  expiresAt: string | Date,
  thresholdMinutes = 15,
): boolean {
  const now = new Date();
  const exp = new Date(expiresAt);
  const diff = exp.getTime() - now.getTime();
  return diff > 0 && diff < thresholdMinutes * 60 * 1000;
}

export function isGoogleDriveUrl(url: string): boolean {
  return url.includes("drive.google.com");
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function getPlatformLabel(platform: Platform): string {
  const labels: Record<Platform, string> = {
    INSTAGRAM: "Instagram",
    TIKTOK: "TikTok",
    X_TWITTER: "X (Twitter)",
    FACEBOOK: "Facebook",
  };
  return labels[platform] ?? platform;
}

export function getPlatformClass(platform: Platform): string {
  const classes: Record<Platform, string> = {
    INSTAGRAM: "platform-instagram",
    TIKTOK: "platform-tiktok",
    X_TWITTER: "platform-x",
    FACEBOOK: "platform-facebook",
  };
  return classes[platform] ?? "";
}

export function getAttemptStatusConfig(status: BlastAttemptStatus) {
  const config: Record<
    BlastAttemptStatus,
    { label: string; color: string; bg: string }
  > = {
    AVAILABLE: {
      label: "Available",
      color: "var(--status-available)",
      bg: "var(--status-available-bg)",
    },
    KEPT: {
      label: "Kept",
      color: "var(--status-kept)",
      bg: "var(--status-kept-bg)",
    },
    COMPLETED: {
      label: "Completed",
      color: "var(--status-completed)",
      bg: "var(--status-completed-bg)",
    },
    RELEASED: {
      label: "Released",
      color: "var(--status-released)",
      bg: "var(--status-released-bg)",
    },
    EXPIRED: {
      label: "Expired",
      color: "var(--status-expired)",
      bg: "var(--status-expired-bg)",
    },
    CANCELLED: {
      label: "Cancelled",
      color: "var(--status-cancelled)",
      bg: "var(--status-cancelled-bg)",
    },
  };
  return config[status];
}

export function getCampaignStatusConfig(status: CampaignStatus | BlastTargetStatus) {
  const config: Record<
    CampaignStatus | BlastTargetStatus,
    { label: string; color: string; bg: string }
  > = {
    DRAFT: {
      label: "Draft",
      color: "var(--status-draft)",
      bg: "var(--status-draft-bg)",
    },
    ACTIVE: {
      label: "Active",
      color: "var(--status-active)",
      bg: "var(--status-active-bg)",
    },
    COMPLETED: {
      label: "Completed",
      color: "var(--status-completed)",
      bg: "var(--status-completed-bg)",
    },
    ARCHIVED: {
      label: "Archived",
      color: "var(--status-cancelled)",
      bg: "var(--status-cancelled-bg)",
    },
    PAUSED: {
      label: "Paused",
      color: "var(--status-paused)",
      bg: "var(--status-paused-bg)",
    },
  };
  return config[status];
}

export function getCommentTaskStatusConfig(status: CommentTaskStatus) {
  const config: Record<
    CommentTaskStatus,
    { label: string; color: string; bg: string }
  > = {
    AVAILABLE: {
      label: "Available",
      color: "var(--status-available)",
      bg: "var(--status-available-bg)",
    },
    KEPT: {
      label: "Kept",
      color: "var(--status-kept)",
      bg: "var(--status-kept-bg)",
    },
    IN_PROGRESS: {
      label: "In Progress",
      color: "var(--status-in-progress)",
      bg: "var(--status-in-progress-bg)",
    },
    COMPLETED: {
      label: "Completed",
      color: "var(--status-completed)",
      bg: "var(--status-completed-bg)",
    },
    RELEASED: {
      label: "Released",
      color: "var(--status-released)",
      bg: "var(--status-released-bg)",
    },
    EXPIRED: {
      label: "Expired",
      color: "var(--status-expired)",
      bg: "var(--status-expired-bg)",
    },
    CANCELLED: {
      label: "Cancelled",
      color: "var(--status-cancelled)",
      bg: "var(--status-cancelled-bg)",
    },
  };
  return config[status];
}

export function getCommentCommandStatusConfig(status: CommentCommandStatus) {
  const config: Record<CommentCommandStatus, { label: string; color: string; bg: string }> = {
    DRAFT: {
      label: "Draft",
      color: "var(--status-draft)",
      bg: "var(--status-draft-bg)",
    },
    ACTIVE: {
      label: "Active",
      color: "var(--status-active)",
      bg: "var(--status-active-bg)",
    },
    PAUSED: {
      label: "Paused",
      color: "var(--status-paused)",
      bg: "var(--status-paused-bg)",
    },
    ARCHIVED: {
      label: "Archived",
      color: "var(--status-cancelled)",
      bg: "var(--status-cancelled-bg)",
    },
  };
  return config[status];
}

export function getStanceConfig(stance: Stance) {
  const config: Record<Stance, { label: string; color: string; bg: string }> = {
    PRO: {
      label: "PRO",
      color: "var(--stance-pro)",
      bg: "var(--stance-pro-bg)",
    },
    KONTRA: {
      label: "KONTRA",
      color: "var(--stance-kontra)",
      bg: "var(--stance-kontra-bg)",
    },
  };
  return config[stance];
}

export function calcEngagement(report: {
  likes: number;
  comments: number;
  shares: number;
  reposts: number;
}): number {
  return report.likes + report.comments + report.shares + report.reposts;
}
