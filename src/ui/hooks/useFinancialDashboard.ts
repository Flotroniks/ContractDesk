import { useCallback, useEffect, useState } from "react";
import type { AnnualSummary, CashflowRow } from "../types";

export function useFinancialDashboard(electronApi: any, propertyId: number | null, initialYear: number) {
    const [year, setYear] = useState<number>(initialYear);
    const [summary, setSummary] = useState<AnnualSummary | null>(null);
    const [cashflow, setCashflow] = useState<CashflowRow[]>([]);
    const [vacancy, setVacancy] = useState<{ vacantMonths: number[]; vacancyRate: number }>({ vacantMonths: [], vacancyRate: 0 });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        if (!electronApi || !propertyId) return;
        setLoading(true);
        setError(null);
        try {
            if (electronApi.getPropertyAnnualSummary) {
                const res = await electronApi.getPropertyAnnualSummary(propertyId, year);
                setSummary(res);
            }
            if (electronApi.listCashflowByProperty) {
                const rows = await electronApi.listCashflowByProperty(propertyId, year);
                setCashflow(rows ?? []);
            }
            if (electronApi.listVacancyMonths) {
                const v = await electronApi.listVacancyMonths(propertyId, year);
                setVacancy(v ?? { vacantMonths: [], vacancyRate: 0 });
            }
        } catch (err) {
            console.error(err);
            setError("Impossible de charger les donnees financieres.");
        } finally {
            setLoading(false);
        }
    }, [electronApi, propertyId, year]);

    useEffect(() => {
        setYear(initialYear);
    }, [initialYear]);

    useEffect(() => {
        void fetchData();
    }, [fetchData]);

    return { year, setYear, summary, cashflow, vacancy, loading, error, refresh: fetchData };
}
