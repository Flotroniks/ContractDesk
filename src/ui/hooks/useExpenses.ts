/* eslint-disable jsdoc/require-jsdoc, jsdoc/require-param, jsdoc/require-param-type, jsdoc/require-returns, jsdoc/require-returns-type, jsdoc/check-tag-names */
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Category, ElectronApi, Expense, YearFilter } from "../types";
import { parseNumberInput } from "../utils/numberParser";

export type ExpenseForm = {
    date: string;
    category: string;
    amount: string;
    description: string;
    is_recurring: boolean;
    frequency: string;
};

const emptyExpenseForm: ExpenseForm = {
    date: "",
    category: "",
    amount: "",
    description: "",
    is_recurring: false,
    frequency: "",
};

export function useExpenses(electronApi: ElectronApi | null, propertyId: number | null, initialYear: YearFilter) {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [year, setYear] = useState<YearFilter>(initialYear);
    const [categoryFilter, setCategoryFilter] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [form, setForm] = useState<ExpenseForm>(emptyExpenseForm);
    const [editingId, setEditingId] = useState<number | null>(null);

    const fetchCategories = useCallback(async () => {
        if (!electronApi?.listCategories) return;
        const data = await electronApi.listCategories("expense");
        setCategories(data);
    }, [electronApi]);

    /**
     * Load expenses for the selected property/year.
     */
    const fetchExpenses = useCallback(async () => {
        if (!electronApi?.listExpensesByProperty || !propertyId) return;
        setLoading(true);
        setError(null);
        try {
            const list = await electronApi.listExpensesByProperty(propertyId, year);
            setExpenses(list ?? []);
        } catch (err) {
            console.error(err);
            setError("Impossible de charger les depenses.");
        } finally {
            setLoading(false);
        }
    }, [electronApi, propertyId, year]);

    useEffect(() => {
        void fetchCategories();
    }, [fetchCategories]);

    useEffect(() => {
        void fetchExpenses();
    }, [fetchExpenses]);

    useEffect(() => {
        setYear(initialYear);
    }, [initialYear]);

    const filteredExpenses = useMemo(() => {
        if (!categoryFilter) return expenses;
        return expenses.filter((e) => e.category === categoryFilter);
    }, [expenses, categoryFilter]);

    const totals = useMemo(() => {
        const annual = filteredExpenses.reduce((sum, e) => sum + (e.amount ?? 0), 0);
        const byCategory = filteredExpenses.reduce<Record<string, number>>((acc, e) => {
            acc[e.category] = (acc[e.category] ?? 0) + (e.amount ?? 0);
            return acc;
        }, {});
        return { annual, byCategory };
    }, [filteredExpenses]);

    function resetForm() {
        setForm(emptyExpenseForm);
        setEditingId(null);
    }

    /**
     * Create or update an expense entry with validation.
     */
    async function submitExpense(id?: number) {
        if (!electronApi || !propertyId) return null;
        const amountParsed = parseNumberInput(form.amount);
        if (!form.date) {
            setError("La date est obligatoire.");
            return null;
        }
        if (!form.category.trim()) {
            setError("La categorie est obligatoire.");
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
                const updated = await electronApi.updateExpense(id, {
                    date: form.date,
                    category: form.category,
                    description: form.description || null,
                    amount: amountParsed.value,
                    is_recurring: form.is_recurring,
                    frequency: form.frequency || null,
                });
                setExpenses((prev) => prev.map((e) => (e.id === id ? updated : e)));
                resetForm();
                return updated;
            }
            const created = await electronApi.createExpense({
                property_id: propertyId,
                date: form.date,
                category: form.category,
                description: form.description || null,
                amount: amountParsed.value,
                is_recurring: form.is_recurring,
                frequency: form.frequency || null,
            });
            setExpenses((prev) => [created, ...prev]);
            resetForm();
            return created;
        } catch (err) {
            console.error(err);
            setError("Echec de l'enregistrement de la depense.");
            return null;
        } finally {
            setSaving(false);
        }
    }

    async function deleteExpense(id: number) {
        if (!electronApi?.deleteExpense) return;
        try {
            await electronApi.deleteExpense(id);
            setExpenses((prev) => prev.filter((e) => e.id !== id));
        } catch (err) {
            console.error(err);
            setError("Impossible de supprimer la depense.");
        }
    }

    function startEdit(expense: Expense) {
        setEditingId(expense.id);
        setForm({
            date: expense.date,
            category: expense.category,
            amount: String(expense.amount ?? ""),
            description: expense.description ?? "",
            is_recurring: !!expense.is_recurring,
            frequency: expense.frequency ?? "",
        });
    }

    return {
        year,
        setYear,
        categoryFilter,
        setCategoryFilter,
        expenses: filteredExpenses,
        allExpenses: expenses,
        categories,
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
        refresh: fetchExpenses,
        totals,
    };
}
