import { calculateMonthlyPayment, totalMonthlyCharge, isCreditFinished } from "@/shared/credit";

describe("calculateMonthlyPayment", () => {
    it("returns zero when principal or duration is invalid", () => {
        expect(calculateMonthlyPayment(0, 0.04, 12)).toBe(0);
        expect(calculateMonthlyPayment(1000, 0.04, 0)).toBe(0);
    });

    it("handles zero rate by straight division", () => {
        expect(calculateMonthlyPayment(1200, 0, 12)).toBe(100);
    });

    it("computes amortized payments with interest", () => {
        const payment = calculateMonthlyPayment(200000, 0.04, 360);
        expect(payment).toBeCloseTo(954.83, 1);
    });
});

describe("totalMonthlyCharge", () => {
    it("sums payment and insurance gracefully", () => {
        expect(totalMonthlyCharge(500, 25)).toBe(525);
        expect(totalMonthlyCharge(500, null)).toBe(500);
    });
});

describe("isCreditFinished", () => {
    it("returns false when credit is incomplete", () => {
        expect(isCreditFinished({ start_date: null, duration_months: null })).toBe(false);
    });

    it("returns true when the term has elapsed", () => {
        const start = new Date();
        start.setFullYear(start.getFullYear() - 2);
        const startStr = start.toISOString().slice(0, 10);
        expect(
            isCreditFinished(
                {
                    start_date: startStr,
                    duration_months: 12,
                },
                new Date()
            )
        ).toBe(true);
    });
});
