import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Redirect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useAuth } from "@/lib/auth/AuthContext";
import { colors, fonts, radii, shadow, spacing } from "@/lib/theme";

export default function LoginScreen() {
  const { session, isLoading, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.brand700} />
      </View>
    );
  }

  if (session) {
    return <Redirect href="/" />;
  }

  async function handleSubmit() {
    setError(null);
    setSubmitting(true);
    const { error: signInError } = await signIn(email.trim(), password);
    setSubmitting(false);
    if (signInError) setError(signInError);
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar style="dark" />
      <View style={styles.card}>
        <Image
          source={require("../assets/icon.png")}
          style={styles.logo}
          accessibilityLabel="Logo de Agronotes"
        />
        <Text style={styles.title}>Agronotes</Text>
        <Text style={styles.subtitle}>Cuaderno de campo digital</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
            style={styles.input}
            accessibilityLabel="Email"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Contraseña</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
            textContentType="password"
            style={styles.input}
            accessibilityLabel="Contraseña"
          />
        </View>

        {error && (
          <Text style={styles.error} accessibilityRole="alert">
            {error}
          </Text>
        )}

        <Pressable
          onPress={handleSubmit}
          disabled={submitting || !email || !password}
          style={({ pressed }) => [
            styles.button,
            (submitting || !email || !password) && styles.buttonDisabled,
            pressed && styles.buttonPressed,
          ]}
          accessibilityRole="button"
        >
          {submitting ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.buttonText}>Ingresar</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: spacing.xl, backgroundColor: colors.cream },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.cream },
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.xl,
    alignItems: "center",
    ...shadow,
  },
  logo: { width: 64, height: 64, borderRadius: radii.md, marginBottom: spacing.md },
  title: { fontFamily: fonts.extraBold, fontSize: 22, color: colors.brand900 },
  subtitle: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.inkMuted, marginBottom: spacing.xl },
  field: { width: "100%", marginBottom: spacing.md },
  label: { fontFamily: fonts.bold, fontSize: 12, marginBottom: 6, color: colors.ink },
  input: {
    width: "100%",
    borderWidth: 2,
    borderColor: colors.line,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 11,
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.ink,
    backgroundColor: colors.cream,
  },
  error: { fontFamily: fonts.bold, color: colors.danger, marginBottom: spacing.sm, fontSize: 13 },
  button: {
    width: "100%",
    backgroundColor: colors.brand900,
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: spacing.xs,
  },
  buttonPressed: { backgroundColor: colors.brand700 },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { fontFamily: fonts.extraBold, color: colors.white, fontSize: 16 },
});
