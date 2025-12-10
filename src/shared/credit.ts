/**
 * Payload describing a mortgage/credit input used for repayment calculations.
 * @property {number} principal Total borrowed amount.
 * @property {number} annualRate Nominal annual interest rate expressed as a decimal (e.g. 0.04 for 4%).
 * @property {number} durationMonths Total number of monthly installments.
 */
export type CreditInput = {
    principal: number;
    annualRate: number;
    durationMonths: number;
};

/**
 * Calculate amortized monthly payment (capital + interest).
 * Falls back to straight-line division when the rate is zero to avoid divide-by-zero in the annuity formula.
 * @param {number} principal Total borrowed capital.
 * @param {number} annualRate Nominal annual interest rate as a decimal (0.04 = 4%).
 * @param {number} durationMonths Number of monthly installments.
 * @returns {number} Monthly payment amount combining principal and interest, rounded by caller if needed.
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
 * @param {number} monthlyPayment Base credit repayment amount per month.
 * @param {number | null | undefined} insuranceMonthly Optional insurance premium to tack on.
 * @returns {number} Total cash outflow per month for the credit including insurance.
 */
export function totalMonthlyCharge(monthlyPayment: number, insuranceMonthly: number | null | undefined): number {
    return (monthlyPayment ?? 0) + (insuranceMonthly ?? 0);
}

type CreditLike = {
    start_date: string | null;
    duration_months: number | null;
};

/**
 * Parse a date string into a Date instance while guarding against invalid inputs.
 * @param {string | null} value ISO-like date string.
 * @returns {Date | null} Date if valid; otherwise null.
 */
function parseDate(value: string | null): Date | null {
    if (!value) return null;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed;
}

/**
 * Offset a date by a number of months.
 * @param {Date} source Base date.
 * @param {number} months Number of months to add (can be negative).
 * @returns {Date} New date shifted by the requested months.
 */
function addMonths(source: Date, months: number): Date {
    const next = new Date(source.getTime());
    next.setMonth(next.getMonth() + months);
    return next;
}

/**
 * Determine whether a credit has finished based on its start date and duration.
 * @param {CreditLike} credit Credit-like object holding start and duration metadata.
 * @param {Date} [now] Reference date used for comparison, defaults to current time.
 * @returns {boolean} True if the credit term has elapsed; false otherwise.
 */
export function isCreditFinished(credit: CreditLike, now: Date = new Date()): boolean {
    if (!credit?.start_date) return false;
    if (!credit.duration_months || credit.duration_months <= 0) return false;

    const start = parseDate(credit.start_date);
    if (!start) return false;

    const end = addMonths(start, credit.duration_months);
    return now >= end;
}
