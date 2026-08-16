// Eliminación de cuenta desde la app mobile (Etapa 6, 2026-08-16).
//
// Google Play exige que exista una vía de eliminación de cuenta accesible
// TANTO dentro de la app como desde una página web pública que no requiera
// tener la app instalada ni sesión iniciada — la web está en
// apps/web/src/app/legal/eliminar-cuenta/page.tsx, esta pantalla es la
// contraparte dentro de la app, linkeada desde Home junto a "Cerrar
// sesión".
//
// El pedido va a la misma tabla `account_deletion_requests` que la versión
// web (insert público, permitido por RLS incluso para `authenticated`,
// identificado por email, no por user_id — ver la migración). Después de
// mandarlo cerramos la sesión: no tiene sentido dejar a la persona logueada
// después de haber pedido que la borren.

import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth/AuthContext";
import { colors, fonts, radii, spacing } from "@/lib/theme";

export default function EliminarCuentaScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session, signOut } = useAuth();
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const email = session?.user.email ?? null;

  function handleConfirmar() {
    if (!email) return;

    Alert.alert(
      "Eliminar tu cuenta",
      "Vamos a borrar tu usuario y tus datos personales. Las tareas de campo que cargaste quedan como registro de tu organización. Esta acción no se puede deshacer desde la app.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar mi cuenta",
          style: "destructive",
          onPress: async () => {
            setError(null);
            setSending(true);
            try {
              const { error: insertError } = await supabase
                .from("account_deletion_requests")
                .insert({ email, reason: reason.trim() || null });

              if (insertError) {
                throw new Error("No se pudo enviar el pedido, intentá de nuevo.");
              }

              Alert.alert(
                "Pedido enviado",
                "Vamos a eliminar tu cuenta en los próximos días hábiles y te avisamos por mail. Ahora cerramos tu sesión.",
                [
                  {
                    text: "Aceptar",
                    onPress: async () => {
                      await signOut();
                      router.replace("/login");
                    },
                  },
                ],
              );
            } catch (err) {
              setError(err instanceof Error ? err.message : "No se pudo enviar el pedido.");
              setSending(false);
            }
          },
        },
      ],
    );
  }

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
    >
      <Text style={styles.title}>Eliminar tu cuenta</Text>
      <Text style={styles.body}>
        Al pedir la eliminación de tu cuenta, borramos tu usuario y dejamos de darte acceso a
        Agronotes. Las tareas de campo que cargaste quedan registradas a nombre de tu
        organización, pero tus datos personales (nombre y email) se eliminan de nuestros
        sistemas. Si sos el único admin de tu organización, contactanos antes de confirmar.
      </Text>

      <Text style={styles.label}>Cuenta a eliminar</Text>
      <Text style={styles.email}>{email ?? "—"}</Text>

      <Text style={styles.label}>Motivo (opcional)</Text>
      <TextInput
        value={reason}
        onChangeText={setReason}
        placeholder="Contanos por qué, nos ayuda a mejorar"
        placeholderTextColor={colors.inkFaint}
        multiline
        numberOfLines={4}
        style={styles.textArea}
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable
        onPress={handleConfirmar}
        disabled={sending || !email}
        style={({ pressed }) => [
          styles.dangerButton,
          pressed && styles.dangerButtonPressed,
          (sending || !email) && styles.disabled,
        ]}
        accessibilityRole="button"
      >
        <Text style={styles.dangerButtonText}>
          {sending ? "Enviando…" : "Pedir eliminación de mi cuenta"}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.cream },
  content: { padding: spacing.lg },
  title: { fontFamily: fonts.extraBold, fontSize: 18, color: colors.brand900, marginBottom: spacing.sm },
  body: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: colors.inkMuted,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  label: { fontFamily: fonts.bold, fontSize: 12, marginBottom: 6, color: colors.ink },
  email: {
    fontFamily: fonts.extraBold,
    fontSize: 15,
    color: colors.brand900,
    marginBottom: spacing.lg,
  },
  textArea: {
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radii.md,
    padding: spacing.md,
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: colors.ink,
    backgroundColor: colors.white,
    minHeight: 90,
    textAlignVertical: "top",
    marginBottom: spacing.lg,
  },
  error: { fontFamily: fonts.bold, color: colors.danger, marginBottom: spacing.sm, fontSize: 13 },
  dangerButton: {
    borderWidth: 1.5,
    borderColor: colors.danger,
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: "center",
  },
  dangerButtonPressed: { backgroundColor: colors.dangerBg },
  disabled: { opacity: 0.6 },
  dangerButtonText: { fontFamily: fonts.extraBold, color: colors.danger, fontSize: 15 },
});
