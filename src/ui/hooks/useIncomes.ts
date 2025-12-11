/* eslint-disable jsdoc/require-jsdoc, jsdoc/require-param, jsdoc/require-param-type, jsdoc/require-returns, jsdoc/require-returns-type, jsdoc/check-tag-names */
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ElectronApi, Income, YearFilter } from "../types";
import { parseNumberInput } from "../utils/numberParser";

export type IncomeForm = {
    date: string;
    amount: string;
    payment_method: string;
    notes: string;
    lease_id?: number | null;
};

const emptyIncomeForm: IncomeForm = {
    date: "",
    amount: "",
    payment_method: "",
    notes: "",
};

export function useIncomes(electronApi: ElectronApi | null, propertyId: number | null, initialYear: YearFilter) {
    const [incomes, setIncomes] = useState<Income[]>([]);
    const [year, setYear] = useState<YearFilter>(initialYear);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [form, setForm] = useState<IncomeForm>(emptyIncomeForm);
    const [editingId, setEditingId] = useState<number | null>(null);

    /**
     * Load incomes for the selected property/year.
     */
    const fetchIncomes = useCallback(async () => {
        if (!electronApi?.listIncomesByProperty || !propertyId) return;
        setLoading(true);
        setError(null);
        try {
            const list = await electronApi.listIncomesByProperty(propertyId, year);
            setIncomes(list ?? []);
        } catch (err) {
            console.error(err);
            setError("Impossible de charger les revenus.");
        } finally {
            setLoading(false);
        }
    }, [electronApi, propertyId, year]);

    useEffect(() => {
        void fetchIncomes();
    }, [fetchIncomes]);

    useEffect(() => {
        setYear(initialYear);
    }, [initialYear]);

    const totals = useMemo(() => {
        const annual = incomes.reduce((sum, i) => sum + (i.amount ?? 0), 0);
        const avgMonthly = annual / 12;
        return { annual, avgMonthly };
    }, [incomes]);

    function resetForm() {
        setForm(emptyIncomeForm);
        setEditingId(null);
    }

    /**
     * Create or update an income entry after validation.
     */
    async function submitIncome(id?: number) {
        if (!electronApi || !propertyId) return null;
        const amountParsed = parseNumberInput(form.amount);
        if (!form.date) {
            setError("La date est obligatoire.");
            return null;
        }
        if (!amountParsed.valid || amountParsed.value === null) {
            setError("Montant invalide.");
            return null;
        }
        setSaving(true);
        setError(null);
        try {
            if (id) {
                const updated = await electronApi.updateIncome(id, {
                    date: form.date,
                    amount: amountParsed.value,
                    payment_method: form.payment_method || null,
                    notes: form.notes || null,
                    lease_id: form.lease_id ?? null,
                });
                setIncomes((prev) => prev.map((i) => (i.id === id ? updated : i)));
                resetForm();
                return updated;
            }
            const created = await electronApi.createIncome({
                property_id: propertyId,
                lease_id: form.lease_id ?? null,
                date: form.date,
                amount: amountParsed.value,
                payment_method: form.payment_method || null,
                notes: form.notes || null,
            });
            setIncomes((prev) => [created, ...prev]);
            resetForm();
            return created;
        } catch (err) {
            console.error(err);
            setError("Echec de l'enregistrement du revenu.");
            return null;
        } finally {
            setSaving(false);
        }
    }

    async function deleteIncome(id: number) {
        if (!electronApi?.deleteIncome) return;
        try {
            await electronApi.deleteIncome(id);
            setIncomes((prev) => prev.filter((i) => i.id !== id));
        } catch (err) {
            console.error(err);
            setError("Impossible de supprimer le revenu.");
        }
    }

    function startEdit(income: Income) {
        setEditingId(income.id);
        setForm({
            date: income.date,
            amount: String(income.amount ?? ""),
            payment_method: income.payment_method ?? "",
            notes: income.notes ?? "",
            lease_id: income.lease_id ?? null,
        });
    }

    return {
        year,
        setYear,
        incomes,
        loading,
        saving,
        error,
        form,
        setForm,
        editingId,
        startEdit,
        submitIncome,
        deleteIncome,
        resetForm,
        refresh: fetchIncomes,
        totals,
    };
}
