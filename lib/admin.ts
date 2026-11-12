import "server-only";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function getConfiguredAdminId(): string | null {
  const adminId = process.env.ADMIN_USER_ID?.trim();

  if (!adminId || !UUID_PATTERN.test(adminId)) {
    return null;
  }

  return adminId.toLowerCase();
}

export function isAdminUserId(userId: string): boolean {
  const adminId = getConfiguredAdminId();
  return adminId !== null && userId.toLowerCase() === adminId;
}
