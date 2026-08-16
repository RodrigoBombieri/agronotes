import { createAdminClient } from "@/lib/supabase/admin";
import { statusLabel } from "@/lib/subscription-status";

// Chequea si un usuario es superadmin de la plataforma. Usa la service
// role porque platform_admins no tiene ninguna policy para el rol
// authenticated (a propósito, ver la migración) — con el cliente normal
// (anon/publishable key) esta consulta siempre devolvería 0 filas.
export async function isPlatformAdmin(userId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("platform_admins")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  return Boolean(data);
}

export type PlatformSummary = {
  totalOrganizations: number;
  byStatus: { status: string; count: number }[];
  recentEvents: {
    id: string;
    organizationName: string;
    provider: string;
    resultingStatus: string | null;
    receivedAt: string;
  }[];
};

// Pedidos de eliminación de cuenta (Etapa 6, 2026-08-16) — ver
// account_deletion_requests en la migración del mismo nombre y
// lib/actions/account-deletion.ts. Solo se muestran los pendientes; los ya
// resueltos no aportan nada a la vista de "qué falta hacer".
export type DeletionRequest = {
  id: string;
  email: string;
  reason: string | null;
  requestedAt: string;
};

export async function getPendingDeletionRequests(): Promise<DeletionRequest[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("account_deletion_requests")
    .select("id, email, reason, requested_at")
    .eq("status", "pending")
    .order("requested_at", { ascending: true });

  return (data ?? []).map((r) => ({
    id: r.id,
    email: r.email,
    reason: r.reason,
    requestedAt: r.requested_at,
  }));
}

// statusLabel se movió a src/lib/subscription-status.ts (Etapa 6,
// 2026-08-16) para compartirlo con la página /suscripcion — se re-exporta
// acá para no romper imports existentes desde app/admin/page.tsx.
export { statusLabel };

export async function getPlatformSummary(): Promise<PlatformSummary> {
  const admin = createAdminClient();

  const [{ data: orgs }, { data: events }] = await Promise.all([
    admin.from("organizations").select("id, name, subscriptions(status)"),
    admin
      .from("payment_events")
      .select("id, provider, resulting_status, received_at, organizations(name)")
      .order("received_at", { ascending: false })
      .limit(25),
  ]);

  const orgRows = orgs ?? [];
  const statusCounts = new Map<string, number>();
  for (const org of orgRows) {
    const status = org.subscriptions?.status ?? "sin_suscripcion";
    statusCounts.set(status, (statusCounts.get(status) ?? 0) + 1);
  }

  return {
    totalOrganizations: orgRows.length,
    byStatus: [...statusCounts.entries()].map(([status, count]) => ({ status, count })),
    recentEvents: (events ?? []).map((e) => ({
      id: e.id,
      organizationName: e.organizations?.name ?? "—",
      provider: e.provider,
      resultingStatus: e.resulting_status,
      receivedAt: e.received_at,
    })),
  };
}
