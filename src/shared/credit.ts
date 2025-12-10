export type CreditInput = {
    principal: number;
    annualRate: number;
    durationMonths: number;
};

/**
 * Calculate amortized monthly payment (capital + interest).
 * Falls back to straight-line division when rate is zero.
 */
export function calculateMonthlyPayment(principal: number, annualRate: number, durationMonths: number): number {
    if (!principal || !durationMonths || durationMonths <= 0) return 0;
    const monthlyRate = annualRate > 0 ? annualRate / 12 : 0;
    if (monthlyRate === 0) {
        return principal / durationMonths;
    }
    const numerator = principal * monthlyRate;
    const denominator = 1 - Math.pow(1 + monthlyRate, -durationMonths);
    if (denominator === 0) return 0;
    return numerator / denominator;
}

/**
 * Sum scheduled monthly payment with optional insurance premium.
 */
export function totalMonthlyCharge(monthlyPayment: number, insuranceMonthly: number | null | undefined): number {
    return (monthlyPayment ?? 0) + (insuranceMonthly ?? 0);
}

type CreditLike = {
    start_date: string | null;
    duration_months: number | null;
};

function parseDate(value: string | null): Date | null {
    if (!value) return null;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed;
}

function addMonths(source: Date, months: number): Date {
    const next = new Date(source.getTime());
    next.setMonth(next.getMonth() + months);
    return next;
}

/**
 * Returns true when the credit term is over relative to the provided date.
 */
export function isCreditFinished(credit: CreditLike, now: Date = new Date()): boolean {
    if (!credit?.start_date) return false;
    if (!credit.duration_months || credit.duration_months <= 0) return false;

    const start = parseDate(credit.start_date);
    if (!start) return false;

    const end = addMonths(start, credit.duration_months);
    return now >= end;
}
