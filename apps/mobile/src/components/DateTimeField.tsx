// Selector de fecha y hora para el alta/edición de tareas (Etapa 6,
// 2026-08-16). Antes la fecha de una tarea era siempre "ahora", lo que no
// sirve para el caso real: el encargado carga lo que hizo al final del día,
// o al día siguiente cuando vuelve a tener señal.
//
// Por qué está hecho a mano y no con @react-native-community/datetimepicker:
// (a) no suma una dependencia nativa nueva, así Rodrigo lo puede seguir
// probando en Expo Go sin reinstalar nada; (b) los botones grandes de
// "un día menos / media hora menos" se usan mucho mejor con guantes y al sol
// que un picker de rueda; (c) el 95% de los casos es "hoy" o "ayer", que
// están a un toque en los atajos de arriba.
//
// Regla dura: nunca se puede elegir una fecha futura — una tarea es algo que
// ya pasó. Los botones de "avanzar" se deshabilitan solos al llegar a ahora.

import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fonts, radii, spacing } from "@/lib/theme";

const MINUTE_STEP = 30;

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  weekday: "short",
  day: "2-digit",
  month: "2-digit",
});

const timeFormatter = new Intl.DateTimeFormat("es-AR", {
  hour: "2-digit",
  minute: "2-digit",
});

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function daysAgo(n: number): Date {
  const day = startOfDay(new Date());
  day.setDate(day.getDate() - n);
  return day;
}

const SHORTCUTS = [
  { label: "Hoy", days: 0 },
  { label: "Ayer", days: 1 },
  { label: "Anteayer", days: 2 },
];

export function DateTimeField({
  value,
  onChange,
  label = "Fecha y hora",
}: {
  value: Date;
  onChange: (next: Date) => void;
  label?: string;
}) {
  // Tope superior = ahora, sin segundos (para que comparar contra los pasos
  // de 30 minutos no dependa del segundo exacto en que se toca el botón).
  const maxDate = new Date();
  maxDate.setSeconds(0, 0);

  const clamp = (date: Date): Date => (date > maxDate ? maxDate : date);

  const shiftDays = (amount: number) => {
    const next = new Date(value);
    next.setDate(next.getDate() + amount);
    onChange(clamp(next));
  };

  const shiftMinutes = (amount: number) => {
    const next = new Date(value);
    next.setMinutes(next.getMinutes() + amount);
    onChange(clamp(next));
  };

  const selectDay = (days: number) => {
    const next = daysAgo(days);
    next.setHours(value.getHours(), value.getMinutes(), 0, 0);
    onChange(clamp(next));
  };

  const valueDay = startOfDay(value).getTime();
  const canGoLaterDay = valueDay < startOfDay(maxDate).getTime();
  const nextHalfHour = new Date(value);
  nextHalfHour.setMinutes(nextHalfHour.getMinutes() + MINUTE_STEP);
  const canGoLaterTime = nextHalfHour <= maxDate;
  const isToday = valueDay === startOfDay(maxDate).getTime();

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.shortcuts}>
        {SHORTCUTS.map((shortcut) => {
          const active = valueDay === daysAgo(shortcut.days).getTime();
          return (
            <Pressable
              key={shortcut.label}
              onPress={() => selectDay(shortcut.days)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {shortcut.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Stepper
        onDecrease={() => shiftDays(-1)}
        onIncrease={() => shiftDays(1)}
        canIncrease={canGoLaterDay}
        decreaseLabel="Un día antes"
        increaseLabel="Un día después"
        value={dateFormatter.format(value)}
      />

      <Stepper
        onDecrease={() => shiftMinutes(-MINUTE_STEP)}
        onIncrease={() => shiftMinutes(MINUTE_STEP)}
        canIncrease={canGoLaterTime}
        decreaseLabel="Media hora antes"
        increaseLabel="Media hora después"
        value={`${timeFormatter.format(value)} hs`}
      />

      {!isToday && (
        <Text style={styles.hint}>
          Estás registrando una tarea de una fecha anterior. Va a aparecer en el historial, no en
          la lista de hoy.
        </Text>
      )}
    </View>
  );
}

function Stepper({
  value,
  onDecrease,
  onIncrease,
  canIncrease,
  decreaseLabel,
  increaseLabel,
}: {
  value: string;
  onDecrease: () => void;
  onIncrease: () => void;
  canIncrease: boolean;
  decreaseLabel: string;
  increaseLabel: string;
}) {
  return (
    <View style={styles.stepper}>
      <Pressable
        onPress={onDecrease}
        accessibilityRole="button"
        accessibilityLabel={decreaseLabel}
        style={({ pressed }) => [styles.stepperButton, pressed && styles.stepperButtonPressed]}
      >
        <Text style={styles.stepperButtonText}>−</Text>
      </Pressable>

      <Text style={styles.stepperValue}>{value}</Text>

      <Pressable
        onPress={onIncrease}
        disabled={!canIncrease}
        accessibilityRole="button"
        accessibilityLabel={increaseLabel}
        accessibilityState={{ disabled: !canIncrease }}
        style={({ pressed }) => [
          styles.stepperButton,
          !canIncrease && styles.stepperButtonDisabled,
          pressed && canIncrease && styles.stepperButtonPressed,
        ]}
      >
        <Text style={styles.stepperButtonText}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.md },
  label: { fontFamily: fonts.bold, fontSize: 12, marginBottom: 6, color: colors.ink },
  shortcuts: { flexDirection: "row", marginBottom: spacing.sm },
  chip: {
    backgroundColor: colors.brand50,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    marginRight: spacing.sm,
  },
  chipActive: { backgroundColor: colors.brand900 },
  chipText: { fontSize: 13, fontFamily: fonts.bold, color: colors.brand800 },
  chipTextActive: { color: colors.white },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 2,
    borderColor: colors.line,
    borderRadius: radii.md,
    backgroundColor: colors.white,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  stepperButton: {
    width: 52,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.sm,
  },
  stepperButtonPressed: { backgroundColor: colors.brand50 },
  stepperButtonDisabled: { opacity: 0.3 },
  stepperButtonText: { fontFamily: fonts.extraBold, fontSize: 24, color: colors.brand700 },
  stepperValue: {
    flex: 1,
    textAlign: "center",
    fontFamily: fonts.extraBold,
    fontSize: 16,
    color: colors.ink,
  },
  hint: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.inkMuted,
    marginTop: spacing.xs,
  },
});
