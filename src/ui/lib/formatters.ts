/**
 * Centralized formatting utilities for currency, percentages, and numbers.
 * All formatting follows French locale conventions (fr-FR).
 */

/**
 * Format a number as French currency (EUR) with 2 decimal places.
 * @param value - The numeric value to format
 * @returns Formatted string like "1 234,56 €"
 */
export function formatCurrency(value: number): string {
    if (!Number.isFinite(value)) return "0,00 €";
    return value.toLocaleString("fr-FR", {
        style: "currency",
        currency: "EUR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

/**
 * Format a number as a percentage with 2 decimal places.
 * @param value - The numeric value to format (e.g., 0.85 for 85%)
 * @returns Formatted string like "85,00 %"
 */
export function formatPercent(value: number): string {
    if (!Number.isFinite(value)) return "0,00 %";
    return `${value.toLocaleString("fr-FR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })} %`;
}

/**
 * Format a number as an integer percentage (no decimals).
 * @param value - The numeric value to format (e.g., 0.85 for 85%)
 * @returns Formatted string like "85 %"
 */
export function formatPercentInteger(value: number): string {
    if (!Number.isFinite(value)) return "0 %";
    return `${Math.round(value).toLocaleString("fr-FR")} %`;
}

/**
 * Format a plain number with French locale thousand separators.
 * @param value - The numeric value to format
 * @param decimals - Number of decimal places (default: 0)
 * @returns Formatted string like "1 234" or "1 234,56"
 */
export function formatNumber(value: number, decimals = 0): string {
    if (!Number.isFinite(value)) return "0";
    return value.toLocaleString("fr-FR", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });
}
