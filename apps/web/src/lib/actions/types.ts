// apps/web/src/lib/actions/types.ts — Etapa 6 (2026-08-16).
//
// Tipos y constantes compartidos por las Server Actions y por los
// formularios cliente que las consumen.
//
// **Por qué esto vive en su propio archivo y no junto a las actions:** un
// módulo con `"use server"` solo puede exportar funciones async. Todo lo
// demás que exporte (un objeto, una constante) React lo trata como una
// referencia de servidor, no como el valor en sí. Tener acá
// `initialActionState` evita ese problema: es un objeto plano común, con
// identidad estable entre renders, que es justo lo que `useActionState`
// necesita como estado inicial.

export type ActionState = { error: string | null; ok: boolean };

export const initialActionState: ActionState = { error: null, ok: false };
