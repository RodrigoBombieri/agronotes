import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { PRICE_PER_FIELD_ARS } from "@/lib/subscription-status";

// apps/web/src/lib/queries/subscription.ts
//
// Info de suscripción de la organización del usuario logueado, para la
// página /suscripcion (Etapa 6, 2026-08-16). A diferencia de admin.ts, acá
// se usa el cliente normal (RLS) — subscriptions y fields tienen policy de
// SELECT para miembros de la propia organización, no hace falta service
// role.

export type SubscriptionInfo = {
  isAdmin: boolean;
  organizationId: string;
  status: string;
  providerSubscriptionId: string | null;
  currentPeriodEnd: string | null;
  contractedFieldsCount: number | null;
  activeFieldsCount: number;
  pricePerField: number;
  currentAmount: number;
  amountIsStale: boolean;
};

export async function getSubscriptionInfo(
  supabase: SupabaseClient<Database>,
): Promise<SubscriptionInfo | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("organization_id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) return null;

  const [{ data: subscription }, { count: activeFieldsCount }] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("status, provider_subscription_id, current_period_end, contracted_fields_count")
      .eq("organization_id", profile.organization_id)
      .maybeSingle(),
    supabase
      .from("fields")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", profile.organization_id)
      .is("deleted_at", null),
  ]);

  const fieldsCount = activeFieldsCount ?? 0;
  const contracted = subscription?.contracted_fields_count ?? null;

  return {
    isAdmin: profile.role === "admin",
    organizationId: profile.organization_id,
    status: subscription?.status ?? "sin_suscripcion",
    providerSubscriptionId: subscription?.provider_subscription_id ?? null,
    currentPeriodEnd: subscription?.current_period_end ?? null,
    contractedFieldsCount: contracted,
    activeFieldsCount: fieldsCount,
    pricePerField: PRICE_PER_FIELD_ARS,
    currentAmount: PRICE_PER_FIELD_ARS * fieldsCount,
    amountIsStale: contracted !== null && contracted !== fieldsCount,
  };
}

// Versión liviana para el banner global del header (Etapa 6, 2026-08-16,
// modo solo lectura) — solo pide el status, no cuenta campos. Se llama en
// cada página vía AppHeader, así que se mantiene lo más barata posible.
export async function getSubscriptionBannerInfo(
  supabase: SupabaseClient<Database>,
): Promise<{ isAdmin: boolean; status: string } | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("organization_id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) return null;

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("status")
    .eq("organization_id", profile.organization_id)
    .maybeSingle();

  return {
    isAdmin: profile.role === "admin",
    status: subscription?.status ?? "sin_suscripcion",
  };
}
