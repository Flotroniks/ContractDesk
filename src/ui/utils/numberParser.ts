import type { NumberParseResult } from "../types";

export function parseNumberInput(value: string): NumberParseResult {
    const trimmed = value.trim();
    if (!trimmed) return { valid: true, value: null };

    const normalized = trimmed.replace(",", ".");
    const num = Number(normalized);
    if (!Number.isFinite(num)) return { valid: false, value: null };
    return { valid: true, value: num };
}
