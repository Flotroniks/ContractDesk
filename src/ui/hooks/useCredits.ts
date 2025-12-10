/* eslint-disable jsdoc/require-jsdoc, jsdoc/require-param, jsdoc/require-param-type, jsdoc/require-returns, jsdoc/require-returns-type, jsdoc/check-tag-names */
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Credit, ElectronApi } from "../types";
import { parseNumberInput } from "../utils/numberParser";
import { calculateMonthlyPayment, totalMonthlyCharge } from "@/shared/credit";

export type CreditForm = {
    id?: number;
    credit_type: string;
    down_payment: string;
    principal: string;
    annual_rate: string;
    duration_months: string;
    start_date: string;
    insurance_monthly: string;
    notes: string;
    is_active: boolean;
};

const emptyForm: CreditForm = {
    credit_type: "",
    down_payment: "",
    principal: "",
    annual_rate: "",
    duration_months: "",
    start_date: "",
    insurance_monthly: "",
    notes: "",
    is_active: true,
};

function creditToForm(credit: Credit): CreditForm {
    return {
        id: credit.id,
        credit_type: credit.credit_type ?? "",
        down_payment: credit.down_payment?.toString() ?? "",
        principal: credit.principal?.toString() ?? "",
        annual_rate: credit.annual_rate != null ? (credit.annual_rate * 100).toString() : "",
        duration_months: credit.duration_months?.toString() ?? "",
        start_date: credit.start_date ?? "",
        insurance_monthly: credit.insurance_monthly?.toString() ?? "",
        notes: credit.notes ?? "",
        is_active: credit.is_active === 1,
    };
}

export function useCredits(electronApi: ElectronApi | null, propertyId: number | null, userId: number | null) {
    const [credits, setCredits] = useState<Credit[]>([]);
    const [form, setForm] = useState<CreditForm>(emptyForm);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [refinanceFromId, setRefinanceFromId] = useState<number | null>(null);

    const parseFields = useMemo(() => {
        const creditType = form.credit_type.trim() || "standard";
        const downPayment = parseNumberInput(form.down_payment);
        const principal = parseNumberInput(form.principal);
        const rate = parseNumberInput(form.annual_rate);
        const duration = parseNumberInput(form.duration_months);
        const insurance = parseNumberInput(form.insurance_monthly);
        return { creditType, downPayment, principal, rate, duration, insurance };
    }, [form.credit_type, form.down_payment, form.principal, form.annual_rate, form.duration_months, form.insurance_monthly]);

    /**
     * Monthly payment derived from the draft credit values.
     */
    const monthlyPayment = useMemo(() => {
        const principalValue = parseFields.principal.value ?? 0;
        const annualRateDecimal = parseFields.rate.value != null ? parseFields.rate.value / 100 : 0;
        const durationValue = parseFields.duration.value ?? 0;
        return calculateMonthlyPayment(principalValue, annualRateDecimal, durationValue);
    }, [parseFields]);

    const totalMonthly = useMemo(() => totalMonthlyCharge(monthlyPayment, parseFields.insurance.value ?? 0), [monthlyPayment, parseFields]);
    const totalCost = useMemo(() => {
        const months = parseFields.duration.value ?? 0;
        return monthlyPayment * months;
    }, [monthlyPayment, parseFields]);

    const resetForm = useCallback(() => {
        setForm(emptyForm);
        setRefinanceFromId(null);
    }, []);

    /**
     * Load all credits for the property and keep the current edit form refreshed.
     */
    const loadCredits = useCallback(async () => {
        if (!electronApi || !propertyId) {
            setCredits([]);
            resetForm();
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const list = await electronApi.listCreditsByProperty(propertyId);
            setCredits(list ?? []);
            if (form.id) {
                const refreshed = list.find((c: Credit) => c.id === form.id);
                if (refreshed) setForm(creditToForm(refreshed));
            }
        } catch (err) {
            console.error(err);
            setError("Impossible de charger les crédits.");
        } finally {
            setLoading(false);
        }
    }, [electronApi, propertyId, form.id, resetForm]);

    useEffect(() => {
        void loadCredits();
    }, [loadCredits]);

    useEffect(() => {
        setCredits([]);
        resetForm();
    }, [propertyId, resetForm]);

    /**
     * Validate and upsert a credit; supports refinancing flow via `refinanceFromId`.
     */
    async function saveCredit() {
        if (!electronApi || !propertyId || !userId) {
            setError("Sélectionnez un bien et un utilisateur valide.");
            return null;
        }
        const { creditType, downPayment, principal, rate, duration, insurance } = parseFields;
        if (!principal.valid || principal.value === null || principal.value <= 0) {
            setError("Montant emprunté invalide.");
            return null;
        }
        if (!duration.valid || duration.value === null || duration.value <= 0) {
            setError("Durée invalide.");
            return null;
        }
        if (!rate.valid || rate.value === null) {
            setError("Taux invalide.");
            return null;
        }

        setSaving(true);
        setError(null);
        try {
            const isRefinancing = refinanceFromId != null;
            const today = new Date().toISOString().slice(0, 10);
            const basePayload = {
                user_id: userId,
                property_id: propertyId,
                credit_type: creditType,
                down_payment: downPayment.value,
                principal: principal.value,
                annual_rate: rate.value / 100,
                duration_months: duration.value,
                start_date: form.start_date || null,
                insurance_monthly: insurance.value ?? 0,
                notes: isRefinancing
                    ? (form.notes ? `${form.notes} | ` : "") + `Refinancement le ${today}`
                    : form.notes || null,
                is_active: isRefinancing ? 1 : form.is_active ? 1 : 0,
                refinance_from_id: refinanceFromId,
            };

            const payload = !isRefinancing && form.id !== undefined ? { ...basePayload, id: form.id } : basePayload;

            const saved = await electronApi.saveCredit(payload);
            setForm(creditToForm(saved));
            setRefinanceFromId(null);
            await loadCredits();
            return saved;
        } catch (err) {
            console.error(err);
            setError("Echec de l'enregistrement du crédit.");
            return null;
        } finally {
            setSaving(false);
        }
    }

    /**
     * Delete a credit and reset the form if it was being edited.
     */
    async function removeCredit(id?: number) {
        if (!electronApi || !id) return false;
        try {
            await electronApi.deleteCredit(id);
            if (form.id === id) resetForm();
            await loadCredits();
            return true;
        } catch (err) {
            console.error(err);
            setError("Impossible de supprimer le crédit.");
            return false;
        }
    }

    /**
     * Flip the `is_active` flag for a credit row.
     */
    async function toggleActive(credit: Credit) {
        if (!electronApi) return;
        try {
            await electronApi.saveCredit({
                ...credit,
                is_active: credit.is_active === 1 ? 0 : 1,
            });
            await loadCredits();
        } catch (err) {
            console.error(err);
            setError("Impossible de mettre à jour l'état du crédit.");
        }
    }

    const editCredit = useCallback((credit: Credit) => setForm(creditToForm(credit)), []);

    const startRefinance = useCallback((credit: Credit) => {
        const { id: _omit, ...base } = creditToForm(credit);
        setRefinanceFromId(credit.id);
        setForm({
            ...base,
            credit_type: credit.credit_type || "Refinancement",
            is_active: true,
        });
    }, []);

    return {
        credits,
        form,
        setForm,
        loading,
        saving,
        error,
        monthlyPayment,
        totalMonthly,
        totalCost,
        resetForm,
        editCredit,
        startRefinance,
        saveCredit,
        removeCredit,
        toggleActive,
        refresh: loadCredits,
    };
}
