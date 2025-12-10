import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type RefObject } from "react";
import { useTranslation, type TFunction } from "react-i18next";
/* eslint-disable jsdoc/require-jsdoc, jsdoc/require-param, jsdoc/require-param-type, jsdoc/require-returns, jsdoc/require-returns-type, jsdoc/check-tag-names */
import type { ElectronApi, Property } from "../types";
import { useFinancialDashboard } from "../hooks/useFinancialDashboard";
import { useExpenses } from "../hooks/useExpenses";
import { useIncomes } from "../hooks/useIncomes";
import type { ExpenseForm } from "../hooks/useExpenses";
import type { IncomeForm } from "../hooks/useIncomes";

const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 5 }, (_, idx) => currentYear - 2 + idx);

type FinancesHubProps = {
    electronApi: ElectronApi;
    properties: Property[];
    initialPropertyId?: number | null;
};

/**
 * Central finance workspace combining dashboard metrics, expenses, and incomes for a property.
 */
export function FinancesHub({ electronApi, properties, initialPropertyId = null }: FinancesHubProps) {
    const { t } = useTranslation();
    const activeProperties = useMemo(() => properties.filter((p) => p.status !== "archived"), [properties]);
    const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(initialPropertyId ?? null);
    const [year, setYear] = useState<number>(currentYear);
    const [panel, setPanel] = useState<"expenses" | "incomes">("expenses");
    useEffect(() => {
        if (!selectedPropertyId && activeProperties.length > 0) {
            setSelectedPropertyId(activeProperties[0].id);
        }
    }, [activeProperties, selectedPropertyId]);

    const { summary, cashflow, vacancy, loading: dashboardLoading, error: dashboardError, refresh: refreshDashboard } =
        useFinancialDashboard(electronApi, selectedPropertyId, year);

    const expenseState = useExpenses(electronApi, selectedPropertyId, year);
    const incomeState = useIncomes(electronApi, selectedPropertyId, year);
    const expenseAmountRef = useRef<HTMLInputElement | null>(null);
    const incomeAmountRef = useRef<HTMLInputElement | null>(null);
    const [exporting, setExporting] = useState(false);
    const [pendingFocus, setPendingFocus] = useState<"expenses" | "incomes" | null>(null);

    const { refresh: refreshExpenses, submitExpense, deleteExpense, ...expenseRest } = expenseState;
    const { refresh: refreshIncomes, submitIncome, deleteIncome, ...incomeRest } = incomeState;

    const [detailMonth, setDetailMonth] = useState<number | null>(null);

    const refreshAll = useCallback(async () => {
        await Promise.allSettled([refreshDashboard(), refreshExpenses(), refreshIncomes()]);
    }, [refreshDashboard, refreshExpenses, refreshIncomes]);

    useEffect(() => {
        if (!selectedPropertyId) return;
        const id = setInterval(() => {
            void refreshAll();
        }, 30000);
        return () => clearInterval(id);
    }, [refreshAll, selectedPropertyId, year]);

    useEffect(() => {
        if (!selectedPropertyId) return;
        void refreshAll();
    }, [selectedPropertyId, year, refreshAll]);

    const handleSignedAmountChange = (raw: string, source: "expenses" | "incomes") => {
        const trimmed = raw.trim();
        let target: "expenses" | "incomes" = source;
        let normalized = trimmed;

        if (trimmed.startsWith("-")) {
            target = "expenses";
            normalized = trimmed.slice(1).trimStart();
        } else if (trimmed.startsWith("+")) {
            target = "incomes";
            normalized = trimmed.slice(1).trimStart();
        }

        if (target === "expenses") {
            expenseState.setForm((prev: ExpenseForm) => ({ ...prev, amount: normalized }));
        } else {
            incomeState.setForm((prev: IncomeForm) => ({ ...prev, amount: normalized }));
        }

        setPanel(target);
        setPendingFocus(target);
    };

    useEffect(() => {
        if (!pendingFocus) return;
        const ref = pendingFocus === "expenses" ? expenseAmountRef.current : incomeAmountRef.current;
        if (ref) {
            requestAnimationFrame(() => {
                ref.focus();
                const len = ref.value.length;
                try {
                    ref.setSelectionRange(len, len);
                } catch (err) {
                    console.error(err);
                }
            });
        }
        setPendingFocus(null);
    }, [panel, pendingFocus]);

    const expensesProps = {
        ...expenseRest,
        onAmountChange: (raw: string) => handleSignedAmountChange(raw, "expenses"),
        amountInputRef: expenseAmountRef,
        submitExpense: async (id?: number) => {
            const res = await submitExpense(id);
            if (res) await refreshAll();
            return res;
        },
        deleteExpense: async (id: number) => {
            await deleteExpense(id);
            await refreshAll();
        },
        refresh: refreshExpenses,
    };

    const incomesProps = {
        ...incomeRest,
        onAmountChange: (raw: string) => handleSignedAmountChange(raw, "incomes"),
        amountInputRef: incomeAmountRef,
        submitIncome: async (id?: number) => {
            const res = await submitIncome(id);
            if (res) await refreshAll();
            return res;
        },
        deleteIncome: async (id: number) => {
            await deleteIncome(id);
            await refreshAll();
        },
        refresh: refreshIncomes,
    };

    const allExpenses = expenseState.allExpenses;
    const allIncomes = incomeState.incomes;

    const monthExpenses = useMemo(() => {
        if (!detailMonth) return [];
        return allExpenses.filter((expense) => monthFromDate(expense.date) === detailMonth);
    }, [allExpenses, detailMonth]);

    const monthIncomes = useMemo(() => {
        if (!detailMonth) return [];
        return allIncomes.filter((income) => monthFromDate(income.date) === detailMonth);
    }, [allIncomes, detailMonth]);

    const detailCashflow = useMemo(() => cashflow.find((c) => c.month === detailMonth) ?? null, [cashflow, detailMonth]);

    const selectedLabel = useMemo(() => {
        const found = activeProperties.find((p) => p.id === selectedPropertyId);
        if (!found) return t("finances.selectPropertyPlaceholder");
        return `${found.name}${found.address ? ` · ${found.address}` : ""}`;
    }, [activeProperties, selectedPropertyId, t]);

    return (
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 space-y-6">
            <div className="flex flex-wrap gap-3 items-end">
                <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-slate-600">{t("finances.propertyLabel")}</label>
                    <select
                        value={selectedPropertyId ?? ""}
                        onChange={(e) => setSelectedPropertyId(e.target.value ? Number(e.target.value) : null)}
                        className="min-w-[240px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                    >
                        <option value="" disabled>
                            {t("finances.selectPropertyPlaceholder")}
                        </option>
                        {activeProperties.map((property) => (
                            <option key={property.id} value={property.id}>
                                {property.name}
                                {property.address ? ` · ${property.address}` : ""}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-slate-600">{t("finances.yearLabel")}</label>
                    <select
                        value={year}
                        onChange={(e) => setYear(Number(e.target.value))}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                    >
                        {yearOptions.map((y) => (
                            <option key={y} value={y}>
                                {y}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="flex-1" />
                <div className="text-sm text-slate-500">{selectedLabel}</div>
            </div>
            <FinancialDashboardCard
                summary={summary}
                cashflow={cashflow}
                vacancy={vacancy}
                loading={dashboardLoading}
                error={dashboardError}
                onRefresh={refreshAll}
                onExport={async () => {
                    if (!electronApi || !selectedPropertyId) return;
                    setExporting(true);
                    try {
                        await electronApi.exportFinanceExcel(selectedPropertyId, year, undefined);
                    } catch (err) {
                        console.error(err);
                    } finally {
                        setExporting(false);
                    }
                }}
                exporting={exporting}
                detailMonth={detailMonth}
                onSelectMonth={(month) => setDetailMonth(month)}
                onCloseMonth={() => setDetailMonth(null)}
                monthIncomes={monthIncomes}
                monthExpenses={monthExpenses}
                detailCashflow={detailCashflow}
            />

            <div className="flex gap-2">
                <button
                    onClick={() => setPanel("expenses")}
                    className={`rounded-full px-4 py-2 text-sm font-semibold border transition ${
                        panel === "expenses"
                            ? "bg-blue-600 text-white border-blue-600"
                            : "border-slate-200 bg-white text-slate-700 hover:border-blue-200"
                    }`}
                >
                    {t("finances.expensesTab")}
                </button>
                <button
                    onClick={() => setPanel("incomes")}
                    className={`rounded-full px-4 py-2 text-sm font-semibold border transition ${
                        panel === "incomes"
                            ? "bg-blue-600 text-white border-blue-600"
                            : "border-slate-200 bg-white text-slate-700 hover:border-blue-200"
                    }`}
                >
                    {t("finances.incomesTab")}
                </button>
            </div>

            {panel === "expenses" ? <ExpensesPanel {...expensesProps} /> : <IncomesPanel {...incomesProps} />}
        </section>
    );
}

type DashboardProps = {
    summary: ReturnType<typeof useFinancialDashboard>["summary"];
    cashflow: ReturnType<typeof useFinancialDashboard>["cashflow"];
    vacancy: ReturnType<typeof useFinancialDashboard>["vacancy"];
    loading: boolean;
    error: string | null;
    onRefresh: () => void;
    onExport: () => Promise<void> | void;
    exporting?: boolean;
    detailMonth: number | null;
    onSelectMonth: (month: number) => void;
    onCloseMonth: () => void;
    monthIncomes: ReturnType<typeof useIncomes>["incomes"];
    monthExpenses: ReturnType<typeof useExpenses>["allExpenses"];
    detailCashflow: ReturnType<typeof useFinancialDashboard>["cashflow"][number] | null;
};

function FinancialDashboardCard({
    summary,
    cashflow,
    vacancy,
    loading,
    error,
    onRefresh,
    onExport,
    exporting,
    detailMonth,
    onSelectMonth,
    onCloseMonth,
    monthIncomes,
    monthExpenses,
    detailCashflow,
}: DashboardProps) {
    const { t } = useTranslation();
    const totalIncome = summary?.total_rents_received ?? 0;
    const totalExpenses = summary?.total_expenses ?? 0;
    const cashflowTotal = cashflow.reduce((acc, cur) => acc + cur.cashflow, 0);
    const grossYield = summary?.gross_yield ?? null;
    const netYield = summary?.net_yield ?? null;
    const vacancyCost = summary?.vacancy_cost ?? 0;
    const annualCredit = summary?.annual_credit ?? 0;
    const expenseBreakdown = summary?.expense_breakdown ?? [];

    return (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-inner space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-sm text-slate-500">{t("finances.overviewTitle")}</div>
                    <div className="text-xl font-semibold text-slate-900">{t("finances.overviewSubtitle")}</div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={onRefresh}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-white"
                    >
                        {t("finances.refresh")}
                    </button>
                    <button
                        onClick={onExport}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-white"
                        disabled={exporting}
                    >
                        {exporting ? t("finances.exporting") : t("finances.exportExcel")}
                    </button>
                </div>
            </div>

            {error && <div className="text-sm text-red-600">{error}</div>}
            {loading && <div className="text-sm text-slate-500">{t("common.loadingProperties")}</div>}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
                <StatCard label={t("finances.totalIncome")} value={totalIncome} tone="positive" />
                <StatCard label={t("finances.totalExpenses")} value={totalExpenses} tone="neutral" />
                <StatCard label={t("finances.cashflow")} value={cashflowTotal} tone={cashflowTotal >= 0 ? "positive" : "negative"} />
                <StatCard
                    label={t("finances.vacancy")}
                    value={Math.round((vacancy?.vacancyRate ?? 0) * 100)}
                    suffix="%"
                    tone="neutral"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
                <StatCard
                    label={t("finances.grossYield")}
                    value={grossYield ?? 0}
                    suffix="%"
                    tone={grossYield !== null && grossYield >= 0 ? "positive" : "neutral"}
                />
                <StatCard
                    label={t("finances.netYield")}
                    value={netYield ?? 0}
                    suffix="%"
                    tone={netYield !== null && netYield >= 0 ? "positive" : "negative"}
                />
                <StatCard label={t("finances.vacancyCost")} value={vacancyCost} tone="neutral" />
                <StatCard label={t("finances.creditAnnual")} value={annualCredit} tone="neutral" />
            </div>

            <div className="overflow-auto rounded-lg border border-slate-200 bg-white">
                <table className="min-w-full text-sm">
                    <thead className="bg-slate-100 text-slate-600">
                        <tr>
                            <th className="px-3 py-2 text-left">{t("finances.month")}</th>
                            <th className="px-3 py-2 text-left">{t("finances.income")}</th>
                            <th className="px-3 py-2 text-left">{t("finances.expenses")}</th>
                            <th className="px-3 py-2 text-left" title={t("finances.creditTooltip", { defaultValue: "Inclut assurance" })}>
                                {t("finances.credit")}
                            </th>
                            <th className="px-3 py-2 text-left">{t("finances.cashflow")}</th>
                            <th className="px-3 py-2 text-left">{t("finances.status")}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {cashflow.map((row) => (
                            <tr
                                key={row.month}
                                className="border-t border-slate-100 hover:bg-blue-50/40 cursor-pointer"
                                onClick={() => onSelectMonth(row.month)}
                            >
                                <td className="px-3 py-2">{formatMonth(row.month)}</td>
                                <td className="px-3 py-2">{row.income.toFixed(2)}</td>
                                <td className="px-3 py-2">{row.expenses.toFixed(2)}</td>
                                <td className="px-3 py-2">{row.credit.toFixed(2)}</td>
                                <td className={`px-3 py-2 ${row.cashflow >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                                    {row.cashflow.toFixed(2)}
                                </td>
                                <td className="px-3 py-2">
                                    <StatusBadge income={row.income} expected={row.expenses + row.credit} t={t} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {expenseBreakdown.length > 0 && <CategoryBreakdownCards breakdown={expenseBreakdown} t={t} />}

            {detailMonth && (
                <MonthDetailModal
                    month={detailMonth}
                    incomes={monthIncomes}
                    expenses={monthExpenses}
                    cashflow={detailCashflow}
                    onClose={onCloseMonth}
                    t={t}
                />
            )}
        </div>
    );
}

type StatCardProps = { label: string; value: number; suffix?: string; tone: "positive" | "neutral" | "negative" };

function StatCard({ label, value, suffix, tone }: StatCardProps) {
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

function StatusBadge({ income, expected, t }: { income: number; expected: number; t: TFunction<"translation", undefined> }) {
    const status = computePaymentStatus(income, expected);
    const tone = status === "paid" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : status === "partial" ? "bg-amber-50 text-amber-700 border-amber-100" : "bg-red-50 text-red-700 border-red-100";
    const label =
        status === "paid"
            ? t("finances.monthStatusPaid")
            : status === "partial"
                ? t("finances.monthStatusPartial")
                : t("finances.monthStatusUnpaid");

    return <span className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-semibold ${tone}`}>{label}</span>;
}

function CategoryBreakdownCards({
    breakdown,
    t,
}: {
    breakdown: Array<{ category: string; total: number }>;
    t: TFunction<"translation", undefined>;
}) {
    return (
        <div className="space-y-2">
            <div className="text-sm font-semibold text-slate-700">{t("finances.categoryBreakdown")}</div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {breakdown.map((item) => (
                    <div key={item.category} className="rounded-lg border border-slate-200 bg-white p-3">
                        <div className="text-xs text-slate-500">{item.category}</div>
                        <div className="text-lg font-semibold">{item.total.toFixed(2)}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function MonthDetailModal({
    month,
    incomes,
    expenses,
    cashflow,
    onClose,
    t,
}: {
    month: number;
    incomes: IncomesProps["incomes"];
    expenses: ExpensesProps["expenses"];
    cashflow: { income: number; expenses: number; credit: number; cashflow: number } | null;
    onClose: () => void;
    t: TFunction<"translation", undefined>;
}) {
    const incomeTotal = incomes.reduce((sum, i) => sum + (i.amount ?? 0), 0);
    const expenseTotal = expenses.reduce((sum, e) => sum + (e.amount ?? 0), 0);
    const credit = cashflow?.credit ?? 0;
    const difference = incomeTotal - expenseTotal - credit;

    const status = computePaymentStatus(incomeTotal, expenseTotal + credit);
    const statusTone = status === "paid" ? "text-emerald-700" : status === "partial" ? "text-amber-600" : "text-red-600";
    const statusLabel =
        status === "paid"
            ? t("finances.monthStatusPaid")
            : status === "partial"
                ? t("finances.monthStatusPartial")
                : t("finances.monthStatusUnpaid");

    return (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-900/40 p-4" onClick={onClose}>
            <div
                className="w-full max-w-3xl rounded-2xl bg-white shadow-xl border border-slate-200 p-6 space-y-4"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <div className="text-sm text-slate-500">{t("finances.monthDetailTitle", { month: formatMonth(month) })}</div>
                        <div className={`text-lg font-semibold ${statusTone}`}>{statusLabel}</div>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:bg-slate-50"
                    >
                        {t("common.cancel")}
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
                    <StatCard label={t("finances.income")} value={incomeTotal} tone="positive" />
                    <StatCard label={t("finances.expenses")} value={expenseTotal} tone="neutral" />
                    <StatCard label={t("finances.credit")} value={credit} tone="neutral" />
                    <StatCard label={t("finances.cashflow")} value={difference} tone={difference >= 0 ? "positive" : "negative"} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <MonthList title={t("finances.monthIncomeDetails")} rows={incomes} type="income" t={t} />
                    <MonthList title={t("finances.monthExpenseDetails")} rows={expenses} type="expense" t={t} />
                </div>
            </div>
        </div>
    );
}

function MonthList({
    title,
    rows,
    type,
    t,
}: {
    title: string;
    rows: Array<{ date: string; amount: number; category?: string | null; description?: string | null; payment_method?: string | null }>;
    type: "income" | "expense";
    t: TFunction<"translation", undefined>;
}) {
    return (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
            <div className="text-sm font-semibold text-slate-800">{title}</div>
            <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
                <table className="min-w-full text-sm">
                    <thead className="bg-slate-100 text-slate-600">
                        <tr>
                            <th className="px-3 py-2 text-left">{t("finances.date")}</th>
                            <th className="px-3 py-2 text-left">{t("finances.category")}</th>
                            <th className="px-3 py-2 text-left">{t("finances.amount")}</th>
                            {type === "income" && <th className="px-3 py-2 text-left">{t("finances.paymentMethod")}</th>}
                            <th className="px-3 py-2 text-left">{t("finances.description")}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.length === 0 && (
                            <tr>
                                <td className="px-3 py-2 text-slate-500" colSpan={type === "income" ? 4 : 4}>
                                    {t("finances.noEntriesForMonth")}
                                </td>
                            </tr>
                        )}
                        {rows.map((row) => (
                            <tr key={`${row.date}-${row.amount}-${row.category ?? ""}`} className="border-t border-slate-100">
                                <td className="px-3 py-2">{row.date}</td>
                                <td className="px-3 py-2">{row.category ?? "-"}</td>
                                <td className="px-3 py-2">{row.amount?.toFixed(2) ?? "0.00"}</td>
                                {type === "income" && <td className="px-3 py-2">{row.payment_method ?? "-"}</td>}
                                <td className="px-3 py-2">{row.description ?? "-"}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function monthFromDate(date: string): number {
    const parts = date.split("-");
    if (parts.length < 2) return 0;
    return Number(parts[1]);
}

function formatMonth(month: number): string {
    return new Date(2000, month - 1, 1).toLocaleString(undefined, { month: "short" });
}

function computePaymentStatus(income: number, expected: number): "paid" | "partial" | "unpaid" {
    if (income <= 0) return "unpaid";
    if (income >= expected) return "paid";
    return "partial";
}

type ExpensesProps = ReturnType<typeof useExpenses> & {
    onAmountChange: (value: string) => void;
    amountInputRef?: RefObject<HTMLInputElement | null>;
};

function ExpensesPanel({
    expenses,
    categories,
    categoryFilter,
    setCategoryFilter,
    loading,
    saving,
    error,
    form,
    setForm,
    editingId,
    startEdit,
    submitExpense,
    deleteExpense,
    resetForm,
    totals,
    onAmountChange,
    amountInputRef,
}: ExpensesProps) {
    const { t } = useTranslation();

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        await submitExpense(editingId ?? undefined);
    }

    return (
        <div className="space-y-4">
            <div className="rounded-lg border border-slate-200 p-4 bg-slate-50 space-y-3">
                <div className="flex flex-wrap gap-3 items-end">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-slate-600">{t("finances.date")}</label>
                        <input
                            type="date"
                            value={form.date}
                            onChange={(e) => setForm({ ...form, date: e.target.value })}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-slate-600">{t("finances.amount")}</label>
                        <input
                            value={form.amount}
                            onChange={(e) => onAmountChange(e.target.value)}
                            ref={amountInputRef}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-slate-600">{t("finances.category")}</label>
                        <input
                            value={form.category}
                            onChange={(e) => setForm({ ...form, category: e.target.value })}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white"
                            list="expense-categories"
                        />
                        <datalist id="expense-categories">
                            {categories.map((c) => (
                                <option key={c.id} value={c.name} />
                            ))}
                        </datalist>
                    </div>
                    <div className="flex flex-col gap-1 flex-1 min-w-[160px]">
                        <label className="text-xs text-slate-600">{t("finances.description")}</label>
                        <input
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleSubmit}
                            className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                            disabled={saving}
                            type="button"
                        >
                            {saving ? t("finances.saving") : editingId ? t("finances.updateExpense") : t("finances.addExpense")}
                        </button>
                        {editingId && (
                            <button
                                onClick={resetForm}
                                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-white"
                                type="button"
                            >
                                {t("finances.cancelEdit")}
                            </button>
                        )}
                    </div>
                </div>
                {error && <div className="text-sm text-red-600">{error}</div>}
            </div>

            <div className="flex items-center justify-between text-sm text-slate-600">
                <div className="flex items-center gap-2">
                    <span>{t("finances.filterCategory")}:</span>
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm"
                    >
                        <option value="">{t("finances.allCategories")}</option>
                        {categories.map((c) => (
                            <option key={c.id} value={c.name}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="flex gap-4">
                    <span>
                        {t("finances.total")}: <strong>{totals.annual.toFixed(2)}</strong>
                    </span>
                </div>
            </div>

            <div className="overflow-auto rounded-lg border border-slate-200">
                <table className="min-w-full text-sm">
                    <thead className="bg-slate-100 text-slate-600">
                        <tr>
                            <th className="px-3 py-2 text-left">{t("finances.date")}</th>
                            <th className="px-3 py-2 text-left">{t("finances.category")}</th>
                            <th className="px-3 py-2 text-left">{t("finances.amount")}</th>
                            <th className="px-3 py-2 text-left">{t("finances.description")}</th>
                            <th className="px-3 py-2"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && (
                            <tr>
                                <td className="px-3 py-2" colSpan={5}>
                                    {t("common.loadingProperties")}
                                </td>
                            </tr>
                        )}
                        {!loading && expenses.length === 0 && (
                            <tr>
                                <td className="px-3 py-3 text-slate-500" colSpan={5}>
                                    {t("finances.noExpenses")}
                                </td>
                            </tr>
                        )}
                        {expenses.map((expense) => (
                            <tr key={expense.id} className="border-t border-slate-100">
                                <td className="px-3 py-2">{expense.date}</td>
                                <td className="px-3 py-2">{expense.category}</td>
                                <td className="px-3 py-2">{expense.amount.toFixed(2)}</td>
                                <td className="px-3 py-2">{expense.description ?? ""}</td>
                                <td className="px-3 py-2 text-right flex gap-2 justify-end">
                                    <button
                                        onClick={() => startEdit(expense)}
                                        className="rounded border border-slate-200 px-2 py-1 text-xs text-slate-700"
                                    >
                                        {t("common.edit")}
                                    </button>
                                    <button
                                        onClick={() => deleteExpense(expense.id)}
                                        className="rounded border border-red-200 px-2 py-1 text-xs text-red-700"
                                    >
                                        {t("finances.delete")}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

type IncomesProps = ReturnType<typeof useIncomes> & {
    onAmountChange: (value: string) => void;
    amountInputRef?: RefObject<HTMLInputElement | null>;
};

function IncomesPanel({ incomes, loading, saving, error, form, setForm, editingId, startEdit, submitIncome, deleteIncome, totals, onAmountChange, amountInputRef }: IncomesProps) {
    const { t } = useTranslation();

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        await submitIncome(editingId ?? undefined);
    }

    return (
        <div className="space-y-4">
            <div className="rounded-lg border border-slate-200 p-4 bg-slate-50 space-y-3">
                <div className="flex flex-wrap gap-3 items-end">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-slate-600">{t("finances.date")}</label>
                        <input
                            type="date"
                            value={form.date}
                            onChange={(e) => setForm({ ...form, date: e.target.value })}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-slate-600">{t("finances.amount")}</label>
                        <input
                            value={form.amount}
                            onChange={(e) => onAmountChange(e.target.value)}
                            ref={amountInputRef}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-slate-600">{t("finances.paymentMethod")}</label>
                        <input
                            value={form.payment_method}
                            onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white"
                        />
                    </div>
                    <div className="flex flex-col gap-1 flex-1 min-w-[160px]">
                        <label className="text-xs text-slate-600">{t("finances.notes")}</label>
                        <input
                            value={form.notes}
                            onChange={(e) => setForm({ ...form, notes: e.target.value })}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleSubmit}
                            className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                            disabled={saving}
                            type="button"
                        >
                            {saving ? t("finances.saving") : editingId ? t("finances.updateIncome") : t("finances.addIncome")}
                        </button>
                        {editingId && (
                            <button
                                onClick={() => setForm({ date: "", amount: "", payment_method: "", notes: "", lease_id: null })}
                                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-white"
                                type="button"
                            >
                                {t("finances.cancelEdit")}
                            </button>
                        )}
                    </div>
                </div>
                {error && <div className="text-sm text-red-600">{error}</div>}
            </div>

            <div className="flex items-center justify-between text-sm text-slate-600">
                <div>
                    {t("finances.total")}: <strong>{totals.annual.toFixed(2)}</strong> ({t("finances.avgMonthly", { value: totals.avgMonthly.toFixed(2) })})
                </div>
            </div>

            <div className="overflow-auto rounded-lg border border-slate-200">
                <table className="min-w-full text-sm">
                    <thead className="bg-slate-100 text-slate-600">
                        <tr>
                            <th className="px-3 py-2 text-left">{t("finances.date")}</th>
                            <th className="px-3 py-2 text-left">{t("finances.amount")}</th>
                            <th className="px-3 py-2 text-left">{t("finances.paymentMethod")}</th>
                            <th className="px-3 py-2 text-left">{t("finances.notes")}</th>
                            <th className="px-3 py-2"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && (
                            <tr>
                                <td className="px-3 py-2" colSpan={5}>
                                    {t("common.loadingProperties")}
                                </td>
                            </tr>
                        )}
                        {!loading && incomes.length === 0 && (
                            <tr>
                                <td className="px-3 py-3 text-slate-500" colSpan={5}>
                                    {t("finances.noIncomes")}
                                </td>
                            </tr>
                        )}
                        {incomes.map((income) => (
                            <tr key={income.id} className="border-t border-slate-100">
                                <td className="px-3 py-2">{income.date}</td>
                                <td className="px-3 py-2">{income.amount.toFixed(2)}</td>
                                <td className="px-3 py-2">{income.payment_method ?? ""}</td>
                                <td className="px-3 py-2">{income.notes ?? ""}</td>
                                <td className="px-3 py-2 text-right flex gap-2 justify-end">
                                    <button
                                        onClick={() => startEdit(income)}
                                        className="rounded border border-slate-200 px-2 py-1 text-xs text-slate-700"
                                    >
                                        {t("common.edit")}
                                    </button>
                                    <button
                                        onClick={() => deleteIncome(income.id)}
                                        className="rounded border border-red-200 px-2 py-1 text-xs text-red-700"
                                    >
                                        {t("finances.delete")}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
