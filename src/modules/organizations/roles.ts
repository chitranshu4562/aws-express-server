import type { MemberRole } from "../../generated/prisma/client.ts";

const ROLE_RANK: Record<MemberRole, number> = { member: 1, admin: 2, owner: 3 };

export const hasAtLeastRole = (role: MemberRole, minRole: MemberRole) => ROLE_RANK[role] >= ROLE_RANK[minRole];
