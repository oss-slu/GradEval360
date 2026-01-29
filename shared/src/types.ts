import { z } from "zod";

export const UserRoleEnum = z.enum(["Admin", "Mentor", "GA"]);
export type UserRole = z.infer<typeof UserRoleEnum>;

// FUTURE-PROOFING: Define a placeholder for permissions
export const UserPermissions = {
  CAN_EDIT_EVALUATION: "can_edit_evaluation",
  CAN_VIEW_ALL: "can_view_all",
} as const;