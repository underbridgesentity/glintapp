export const ROLES = [
  "residential_subscriber",
  "fleet_manager",
  "once_off",
  "technician",
  "site_lead",
  "ops_admin",
  "developer_partner",
] as const;

export type Role = (typeof ROLES)[number];

export const CUSTOMER_ROLES: Role[] = [
  "residential_subscriber",
  "fleet_manager",
  "once_off",
];

export const FIELD_ROLES: Role[] = ["technician", "site_lead"];

// Permissions are data-driven: route prefix -> roles allowed.
export const ROUTE_ACCESS: Record<string, Role[]> = {
  "/app": CUSTOMER_ROLES,
  "/tech": FIELD_ROLES,
  "/ops": ["ops_admin"],
  "/partner": ["developer_partner"],
};

export function homeFor(role: Role): string {
  if (CUSTOMER_ROLES.includes(role)) return "/app";
  if (FIELD_ROLES.includes(role)) return "/tech";
  if (role === "ops_admin") return "/ops";
  return "/partner";
}
