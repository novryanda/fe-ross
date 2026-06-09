import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email tidak valid."),
  password: z.string().min(6, "Password minimal 6 karakter."),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Email tidak valid."),
});

export const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, "Password baru minimal 8 karakter.")
      .max(128, "Password baru maksimal 128 karakter."),
    confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi."),
  })
  .superRefine((data, ctx) => {
    if (data.newPassword !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "Konfirmasi password harus sama dengan password baru.",
      });
    }
  });

export const campaignSchema = z.object({
  name: z
    .string()
    .min(3, "Nama campaign minimal 3 karakter.")
    .max(100, "Nama terlalu panjang."),
  description: z.string().max(500, "Deskripsi terlalu panjang.").optional(),
  startDate: z.string().min(1, "Tanggal mulai wajib diisi."),
  endDate: z.string().optional(),
  platforms: z
    .array(z.enum(["INSTAGRAM", "TIKTOK", "X_TWITTER", "FACEBOOK"]))
    .min(1, "Pilih minimal 1 platform."),
  status: z.enum(["DRAFT", "ACTIVE", "COMPLETED", "ARCHIVED"]),
});

export const blastTargetSchema = z.object({
  socialAccountId: z.string().min(1, "Social account wajib dipilih."),
  platform: z.enum(["INSTAGRAM", "TIKTOK", "X_TWITTER", "FACEBOOK"]),
  postUrl: z.string().url("URL tidak valid."),
  instruction: z.string().max(500).optional(),
  internalNotes: z.string().max(1000).optional(),
  createInitialAttempt: z.boolean(),
  keepDurationMinutes: z.coerce.number().int().min(30).max(480).optional(),
  status: z.enum(["ACTIVE", "PAUSED", "ARCHIVED"]).optional(),
});

export const blastReportSchema = z.object({
  views: z.number().int("Harus bilangan bulat.").min(0, "Minimal 0."),
  likes: z.number().int("Harus bilangan bulat.").min(0, "Minimal 0."),
  comments: z.number().int("Harus bilangan bulat.").min(0, "Minimal 0."),
  shares: z.number().int("Harus bilangan bulat.").min(0, "Minimal 0."),
  reposts: z.number().int("Harus bilangan bulat.").min(0, "Minimal 0."),
  proofLink: z.string().url("URL tidak valid."),
  notes: z.string().max(1000).optional(),
});

export const socialAccountSchema = z.object({
  platform: z.enum(["INSTAGRAM", "TIKTOK", "X_TWITTER", "FACEBOOK"]),
  username: z.string().min(2, "Username minimal 2 karakter.").max(50),
  displayName: z.string().trim().min(1, "Display name wajib diisi.").max(150),
  profileUrl: z.string().url("URL profil tidak valid."),
  category: z.enum(["MEDIA", "KOL", "BRAND", "COMMUNITY", "OTHER"]),
});

export const createMemberSchema = z
  .object({
    name: z.string().min(2, "Nama minimal 2 karakter.").max(150),
    email: z.string().email("Format email tidak valid.").max(255),
    role: z.enum(["ADMIN", "BUZZER", "PIC", "VIEWER"]),
    status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
    picUnitId: z.string().optional(),
    campaignIds: z
      .array(z.string().uuid("Campaign ID harus UUID."))
      .max(100, "Maksimal 100 campaign sekaligus.")
      .optional(),
    sendInviteEmail: z.boolean().default(false),
    setTemporaryPassword: z.boolean().default(false),
    temporaryPassword: z
      .string()
      .min(8, "Password minimal 8 karakter.")
      .max(128, "Password maksimal 128 karakter.")
      .optional(),
    requirePasswordChange: z.boolean().default(false),
    notes: z.string().max(1000).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.setTemporaryPassword && !data.temporaryPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["temporaryPassword"],
        message: "Password sementara wajib diisi ketika opsi ini aktif.",
      });
    }
    if (data.role === "PIC" && !data.picUnitId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["picUnitId"],
        message: "PIC wajib di-assign ke unit aktif.",
      });
    }
  });

export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(2, "Nama minimal 2 karakter.")
    .max(150, "Nama maksimal 150 karakter."),
  image: z
    .string()
    .url("URL avatar tidak valid.")
    .max(2048)
    .optional()
    .or(z.literal("")),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Password saat ini wajib diisi."),
    newPassword: z
      .string()
      .min(8, "Password baru minimal 8 karakter.")
      .max(128, "Password baru maksimal 128 karakter."),
    confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi."),
    revokeOtherSessions: z.boolean().default(true),
  })
  .superRefine((data, ctx) => {
    if (data.newPassword !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "Konfirmasi password harus sama dengan password baru.",
      });
    }
    if (data.newPassword && data.newPassword === data.currentPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["newPassword"],
        message: "Password baru harus berbeda dari password saat ini.",
      });
    }
  });

export const commentCommandSchema = z.object({
  targetPostUrl: z.string().url("URL target tidak valid."),
  platform: z.enum(["INSTAGRAM", "TIKTOK", "X_TWITTER", "FACEBOOK"]),
  stance: z.enum(["PRO", "KONTRA"]),
  narrative: z.string().min(1, "Narasi wajib diisi.").max(5000),
  instruction: z.string().max(5000).optional(),
  requiredSlots: z.coerce.number().int().min(1).max(10000),
  keepExpiryMinutes: z.coerce.number().int().min(1).max(1440).optional(),
  deadline: z.string().min(1, "Deadline wajib diisi."),
  socialAccountId: z.string().optional(),
  status: z.enum(["DRAFT", "ACTIVE"]).optional(),
});

export const commentProofSchema = z.object({
  proofLink: z.string().url("URL proof tidak valid."),
});

export type LoginForm = z.infer<typeof loginSchema>;
export type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;
export type CampaignForm = z.infer<typeof campaignSchema>;
export type BlastTargetForm = z.infer<typeof blastTargetSchema>;
export type BlastReportForm = z.infer<typeof blastReportSchema>;
export type SocialAccountForm = z.infer<typeof socialAccountSchema>;
export type CommentCommandForm = z.infer<typeof commentCommandSchema>;
export type CommentProofForm = z.infer<typeof commentProofSchema>;
export type CreateMemberForm = z.infer<typeof createMemberSchema>;
export type UpdateProfileForm = z.infer<typeof updateProfileSchema>;
export type ChangePasswordForm = z.infer<typeof changePasswordSchema>;
