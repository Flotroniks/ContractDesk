import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ElectronApi, Property, UserProfile } from "../types";

const currentYear = new Date().getFullYear();

export function PortfolioFinances({ electronApi, properties, onBack, user }: { electronApi: ElectronApi; properties: Property[]; onBack: () => void; user: UserProfile }) {
    const { t } = useTranslation();
    const activeProperties = useMemo(() => properties.filter((p) => p.status !== "archived"), [properties]);
    const [year, setYear] = useState<number>(currentYear);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);

    useEffect(() => {
        if (!electronApi || activeProperties.length === 0) return;
        let cancelled = false;
        async function load() {
            setLoading(true);
            setError(null);
            try {
                const entries = await Promise.all(
                    activeProperties.map(async (property) => {
                        const [summary, cashflow, vacancy] = await Promise.all([
                            electronApi.getPropertyAnnualSummary(property.id, year, property.purchase_price ?? null),
                            electronApi.listCashflowByProperty(property.id, year),
                            electronApi.listVacancyMonths(property.id, year),
                        ]);
                        const totalCashflow = cashflow.reduce((acc: number, row: any) => acc + (row.cashflow ?? 0), 0);
                        return { property, summary, cashflow, vacancy, totalCashflow };
                    })
                );

                if (cancelled) return;

                const monthly = Array.from({ length: 12 }, (_, idx) => ({ month: idx + 1, income: 0, expenses: 0, credit: 0, cashflow: 0 }));
                let totalIncome = 0;
                let totalExpenses = 0;
                let totalCredit = 0;
                let totalVacancyCost = 0;
                let totalPurchasePrice = 0;
                let vacancyMonthsCount = 0;

                entries.forEach((entry) => {
                    totalIncome += entry.summary.total_rents_received ?? 0;
                    totalExpenses += entry.summary.total_expenses ?? 0;
                    totalCredit += entry.summary.annual_credit ?? 0;
                    totalVacancyCost += entry.summary.vacancy_cost ?? 0;
                    totalPurchasePrice += entry.property.purchase_price ?? 0;
                    vacancyMonthsCount += entry.vacancy?.vacantMonths?.length ?? 0;

                    entry.cashflow.forEach((row: any) => {
                        const target = monthly[row.month - 1];
                        target.income += row.income ?? 0;
                        target.expenses += row.expenses ?? 0;
                        target.credit += row.credit ?? 0;
                        target.cashflow += row.cashflow ?? 0;
                    });
                });

                const grossYield = totalPurchasePrice ? (totalIncome / totalPurchasePrice) * 100 : null;
                const netYield = totalPurchasePrice
                    ? ((totalIncome - totalExpenses - totalCredit - totalVacancyCost) / totalPurchasePrice) * 100
                    : null;

                const vacancyRate = activeProperties.length > 0 ? vacancyMonthsCount / (12 * activeProperties.length) : 0;

                const ranking = [...entries].sort((a, b) => b.totalCashflow - a.totalCashflow);

                setPortfolio({
                    monthly,
                    totals: {
                        income: totalIncome,
                        expenses: totalExpenses,
                        credit: totalCredit,
                        vacancyCost: totalVacancyCost,
                        cashflow: monthly.reduce((acc, m) => acc + m.cashflow, 0),
                    },
                    yields: { gross: grossYield, net: netYield },
                    vacancyRate,
                    ranking,
                });
            } catch (err) {
                console.error(err);
                if (!cancelled) setError("Impossible de charger le portefeuille.");
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        void load();
        return () => {
            cancelled = true;
        };
    }, [electronApi, activeProperties, year]);

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 text-slate-900">
            <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-sm text-slate-500">{t("finances.portfolioTitle")}</div>
                        <div className="text-3xl font-semibold">{t("finances.portfolioSubtitle", { user: user.username })}</div>
                        <p className="text-slate-600 text-sm mt-1">{t("finances.portfolioHelper")}</p>
                    </div>
                    <div className="flex gap-2 items-center">
                        <select
                            value={year}
                            onChange={(e) => setYear(Number(e.target.value))}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                        >
                            {Array.from({ length: 5 }, (_, idx) => currentYear - 2 + idx).map((y) => (
                                <option key={y} value={y}>
                                    {y}
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={onBack}
                            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        >
                            {t("common.backToProfiles")}
                        </button>
                    </div>
                </div>

                {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
                {loading && <div className="text-sm text-slate-500">{t("common.loadingProperties")}</div>}

                {portfolio && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                            <StatCard label={t("finances.totalIncome")} value={portfolio.totals.income} tone="positive" />
                            <StatCard label={t("finances.totalExpenses")} value={portfolio.totals.expenses} tone="neutral" />
                            <StatCard label={t("finances.cashflow")} value={portfolio.totals.cashflow} tone={portfolio.totals.cashflow >= 0 ? "positive" : "negative"} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                            <StatCard label={t("finances.vacancyCost")} value={portfolio.totals.vacancyCost} tone="neutral" />
                            <StatCard label={t("finances.creditAnnual")} value={portfolio.totals.credit} tone="neutral" />
                            <StatCard label={t("finances.vacancy")} value={Math.round(portfolio.vacancyRate * 100)} suffix="%" tone="neutral" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <StatCard
                                label={t("finances.grossYield")}
                                value={portfolio.yields.gross ?? 0}
                                suffix="%"
                                tone={portfolio.yields.gross !== null && portfolio.yields.gross >= 0 ? "positive" : "neutral"}
                            />
                            <StatCard
                                label={t("finances.netYield")}
                                value={portfolio.yields.net ?? 0}
                                suffix="%"
                                tone={portfolio.yields.net !== null && portfolio.yields.net >= 0 ? "positive" : "negative"}
                            />
                        </div>

                        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                                <div className="text-sm font-semibold text-slate-700">{t("finances.portfolioMonthly")}</div>
                                <div className="text-xs text-slate-500">{t("finances.portfolioProperties", { count: activeProperties.length })}</div>
                            </div>
                            <div className="overflow-auto rounded-lg border border-slate-200">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-slate-100 text-slate-600">
                                        <tr>
                                            <th className="px-3 py-2 text-left">{t("finances.month")}</th>
                                            <th className="px-3 py-2 text-left">{t("finances.income")}</th>
                                            <th className="px-3 py-2 text-left">{t("finances.expenses")}</th>
                                            <th className="px-3 py-2 text-left">{t("finances.credit")}</th>
                                            <th className="px-3 py-2 text-left">{t("finances.cashflow")}</th>
                                            <th className="px-3 py-2 text-left">{t("finances.status")}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {portfolio.monthly.map((row) => (
                                            <tr key={row.month} className="border-t border-slate-100">
                                                <td className="px-3 py-2">{formatMonth(row.month)}</td>
                                                <td className="px-3 py-2">{row.income.toFixed(2)}</td>
                                                <td className="px-3 py-2">{row.expenses.toFixed(2)}</td>
                                                <td className="px-3 py-2">{row.credit.toFixed(2)}</td>
                                                <td className={`px-3 py-2 ${row.cashflow >= 0 ? "text-emerald-700" : "text-red-600"}`}>{row.cashflow.toFixed(2)}</td>
                                                <td className="px-3 py-2">
                                                    <StatusBadge income={row.income} expected={row.expenses + row.credit} t={t} />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                            <div className="text-sm font-semibold text-slate-700 mb-2">{t("finances.portfolioRanking")}</div>
                            <div className="space-y-2">
                                {portfolio.ranking.map((item) => (
                                    <div
                                        key={item.property.id}
                                        className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                                    >
                                        <div>
                                            <div className="font-semibold">{item.property.name}</div>
                                            <div className="text-slate-500 text-xs">
                                                {item.property.address ?? ""}
                                            </div>
                                        </div>
                                        <div className="flex gap-4">
                                            <div className="text-slate-600">{t("finances.cashflow")}: {item.totalCashflow.toFixed(2)}</div>
                                            <div className="text-slate-600">{t("finances.totalIncome")}: {item.summary.total_rents_received.toFixed(2)}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function StatCard({ label, value, suffix, tone }: { label: string; value: number; suffix?: string; tone: "positive" | "neutral" | "negative" }) {
    const colors = {
        positive: "text-emerald-700 bg-emerald-50",
        neutral: "text-slate-700 bg-white",
        negative: "text-red-700 bg-red-50",
    };
    return (
        <div className={`rounded-lg border border-slate-200 p-3 ${colors[tone]}`}>
            <div className="text-xs text-slate-500">{label}</div>
            <div className="text-lg font-semibold">
                {value.toFixed(2)}
                {suffix ? ` ${suffix}` : ""}
            </div>
        </div>
    );
}

function StatusBadge({ income, expected, t }: { income: number; expected: number; t: (key: string) => string }) {
    const status = computePaymentStatus(income, expected);
    const tone =
        status === "paid"
            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
            : status === "partial"
                ? "bg-amber-50 text-amber-700 border-amber-100"
                : "bg-red-50 text-red-700 border-red-100";
    const label =
        status === "paid"
            ? t("finances.monthStatusPaid")
            : status === "partial"
                ? t("finances.monthStatusPartial")
                : t("finances.monthStatusUnpaid");

    return <span className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-semibold ${tone}`}>{label}</span>;
}

function computePaymentStatus(income: number, expected: number): "paid" | "partial" | "unpaid" {
    if (income <= 0) return "unpaid";
    if (income >= expected) return "paid";
    return "partial";
}

function formatMonth(month: number): string {
    return new Date(2000, month - 1, 1).toLocaleString(undefined, { month: "short" });
}

type PortfolioData = {
    monthly: Array<{ month: number; income: number; expenses: number; credit: number; cashflow: number }>;
    totals: { income: number; expenses: number; credit: number; vacancyCost: number; cashflow: number };
    yields: { gross: number | null; net: number | null };
    vacancyRate: number;
    ranking: Array<{
        property: Property;
        summary: any;
        cashflow: any[];
        vacancy: { vacantMonths: number[]; vacancyRate: number };
        totalCashflow: number;
    }>;
};
