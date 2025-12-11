/* eslint-disable jsdoc/require-jsdoc, jsdoc/require-param, jsdoc/require-param-type, jsdoc/require-returns, jsdoc/require-returns-type, jsdoc/check-tag-names */
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Credit, ElectronApi } from "../types";
import { parseNumberInput } from "../utils/numberParser";
import { calculateMonthlyPayment, totalMonthlyCharge } from "@/shared/credit";

export type CreditForm = {
    down_payment: string;
    principal: string;
    annual_rate: string;
    duration_months: string;
    start_date: string;
    insurance_monthly: string;
    notes: string;
};

const emptyForm: CreditForm = {
    down_payment: "",
    principal: "",
    annual_rate: "",
    duration_months: "",
    start_date: "",
    insurance_monthly: "",
    notes: "",
};

export function useCredit(electronApi: ElectronApi | null, propertyId: number | null, userId: number | null) {
    const [credit, setCredit] = useState<Credit | null>(null);
    const [form, setForm] = useState<CreditForm>(emptyForm);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const parseFields = useMemo(() => {
        const downPayment = parseNumberInput(form.down_payment);
        const principal = parseNumberInput(form.principal);
        const rate = parseNumberInput(form.annual_rate);
        const duration = parseNumberInput(form.duration_months);
        const insurance = parseNumberInput(form.insurance_monthly);
        return { downPayment, principal, rate, duration, insurance };
    }, [form.down_payment, form.principal, form.annual_rate, form.duration_months, form.insurance_monthly]);

    /**
     * Computed monthly payment based on form inputs; uses annual rate as percentage.
     */
    const monthlyPayment = useMemo(() => {
        const { principal, rate, duration } = parseFields;
        const principalValue = principal.value ?? 0;
        const annualRateDecimal = rate.value !== null && rate.value !== undefined ? rate.value / 100 : 0;
        const durationValue = duration.value ?? 0;
        return calculateMonthlyPayment(principalValue, annualRateDecimal, durationValue);
    }, [parseFields]);

    const totalMonthly = useMemo(() => totalMonthlyCharge(monthlyPayment, parseFields.insurance.value ?? 0), [monthlyPayment, parseFields]);
    const totalCost = useMemo(() => {
        const months = parseFields.duration.value ?? 0;
        return monthlyPayment * months;
    }, [monthlyPayment, parseFields]);

    /**
     * Load the credit for the current property and seed the edit form.
     */
    const loadCredit = useCallback(async () => {
        if (!electronApi || !propertyId) {
            setCredit(null);
            setForm({ ...emptyForm });
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const existing = await electronApi.getCreditByProperty(propertyId);
            setCredit(existing ?? null);
            if (existing) {
                setForm({
                    down_payment: existing.down_payment?.toString() ?? "",
                    principal: existing.principal?.toString() ?? "",
                    annual_rate: existing.annual_rate != null ? (existing.annual_rate * 100).toString() : "",
                    duration_months: existing.duration_months?.toString() ?? "",
                    start_date: existing.start_date ?? "",
                    insurance_monthly: existing.insurance_monthly?.toString() ?? "",
                    notes: existing.notes ?? "",
                });
            } else {
                setForm({ ...emptyForm });
            }
        } catch (err) {
            console.error(err);
            setError("Impossible de charger le credit.");
        } finally {
            setLoading(false);
        }
    }, [electronApi, propertyId]);

    useEffect(() => {
        void loadCredit();
    }, [loadCredit]);

    useEffect(() => {
        setForm({ ...emptyForm });
        setCredit(null);
    }, [propertyId]);

    /**
     * Validate and persist credit details for the active property/user.
     */
    async function saveCredit() {
        if (!electronApi || !propertyId || !userId) {
            setError("Selectionnez un bien et un utilisateur valide.");
            return null;
        }
        const { downPayment, principal, rate, duration, insurance } = parseFields;
        if (!principal.valid || principal.value === null || principal.value <= 0) {
            setError("Montant emprunte invalide.");
            return null;
        }
        if (!duration.valid || duration.value === null || duration.value <= 0) {
            setError("Duree invalide.");
            return null;
        }
        if (!rate.valid || rate.value === null) {
            setError("Taux invalide.");
            return null;
        }

        setSaving(true);
        setError(null);
        try {
            const annualRateDecimal = rate.value / 100;
            const payload: Parameters<typeof electronApi.saveCredit>[0] = {
                user_id: userId,
                property_id: propertyId,
                down_payment: downPayment.value ?? null,
                principal: principal.value,
                annual_rate: annualRateDecimal,
                duration_months: duration.value,
                start_date: form.start_date || null,
                insurance_monthly: insurance.value ?? 0,
                notes: form.notes || null,
                is_active: 1,
            };
            if (credit?.id !== undefined) {
                payload.id = credit.id;
            }
            const saved = await electronApi.saveCredit(payload);
            setCredit(saved);
            await loadCredit();
            return saved;
        } catch (err) {
            console.error(err);
            setError("Echec de l'enregistrement du credit.");
            return null;
        } finally {
            setSaving(false);
        }
    }

    /**
     * Delete the current credit record and clear local state.
     */
    async function removeCredit() {
        if (!electronApi || !credit?.id) return false;
        try {
            await electronApi.deleteCredit(credit.id);
            setCredit(null);
            setForm({ ...emptyForm });
            return true;
        } catch (err) {
            console.error(err);
            setError("Impossible de supprimer le credit.");
            return false;
        }
    }

    return {
        credit,
        form,
        setForm,
        loading,
        saving,
        error,
        monthlyPayment,
        totalMonthly,
        totalCost,
        saveCredit,
        removeCredit,
        refresh: loadCredit,
    };
}
