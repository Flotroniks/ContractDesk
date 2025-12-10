/* eslint-disable jsdoc/require-jsdoc, jsdoc/require-param, jsdoc/require-param-type, jsdoc/require-returns, jsdoc/require-returns-type, jsdoc/check-tag-names */
import { useEffect, useMemo, useRef, useState } from "react";
import type { ElectronApi, Property } from "../types";
import { useCredits } from "../hooks/useCredits";
import { isCreditFinished, totalMonthlyCharge } from "@/shared/credit";

type PropertyCreditsCardProps = {
    electron: ElectronApi | null;
    properties: Property[];
    userId: number | null;
    selectedPropertyId?: number | null;
    onSelectProperty?: (propertyId: number | null) => void;
};

function formatAmount(value?: number | null) {
    if (value == null || Number.isNaN(value)) return "-";
    return `${value.toFixed(0)} €`;
}

const CREDIT_TYPES = ["Amortissable", "In Fine", "Relais", "PTZ", "Refinancement", "Autre"];

/**
 * Manage and display credits for a selected property with quick refinancing helpers.
 */
export function PropertyCreditsCard({ electron, properties, userId, selectedPropertyId, onSelectProperty }: PropertyCreditsCardProps) {
    const [propertyId, setPropertyId] = useState<number | null>(selectedPropertyId ?? null);
    const firstFieldRef = useRef<HTMLSelectElement | null>(null);
    const selectedProperty = useMemo(() => properties.find((p) => p.id === propertyId) ?? null, [properties, propertyId]);

    const {
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
    } = useCredits(electron, propertyId, userId);

    useEffect(() => {
        if (selectedPropertyId !== undefined) {
            setPropertyId(selectedPropertyId ?? null);
        }
    }, [selectedPropertyId]);

    useEffect(() => {
        if (!propertyId && properties.length > 0) {
            setPropertyId(properties[0].id ?? null);
        }
    }, [properties, propertyId]);

    const handleSelectProperty = (value: number | null) => {
        setPropertyId(value);
        onSelectProperty?.(value);
    };

    const handleAddCredit = () => {
        resetForm();
        firstFieldRef.current?.focus();
    };

    const primaryButton =
        "rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-60";
    const secondaryButton =
        "rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60";
    const cardShell = "rounded-2xl border border-slate-200 bg-white shadow-sm";

    return (
        <section className={`${cardShell} p-6 space-y-6`}>
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex flex-col">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Crédits du bien</p>
                    <p className="text-lg font-semibold text-slate-900">Suivi des financements par propriété</p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                    {onSelectProperty ? (
                        <div className="text-sm text-slate-700">
                            {selectedProperty ? selectedProperty.name : "Sélectionnez un bien"}
                        </div>
                    ) : (
                        <select
                            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-200"
                            value={propertyId ?? ""}
                            onChange={(e) => handleSelectProperty(e.target.value ? Number(e.target.value) : null)}
                        >
                            <option value="">Sélectionnez un bien</option>
                            {properties.map((property) => (
                                <option key={property.id} value={property.id ?? ""}>
                                    {property.name ?? `Bien ${property.id}`}
                                </option>
                            ))}
                        </select>
                    )}
                    <button className={secondaryButton} onClick={handleAddCredit} disabled={saving}>
                        Ajouter un crédit
                    </button>
                </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-4">
                    {loading ? (
                        <p className="text-sm text-slate-600">Chargement des crédits...</p>
                    ) : credits.length === 0 ? (
                        <div className="flex flex-col gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-slate-700 shadow-inner">
                            <p className="text-base font-semibold text-slate-900">Aucun crédit associé à ce bien</p>
                            <p className="text-sm text-slate-600">Ajoutez un premier crédit pour suivre le financement de ce bien.</p>
                            <div>
                                <button className={primaryButton} onClick={handleAddCredit}>
                                    Ajouter un crédit
                                </button>
                            </div>
                        </div>
                    ) : (
                        credits.map((credit) => {
                            const monthlyTotal = totalMonthlyCharge(credit.monthly_payment ?? 0, credit.insurance_monthly ?? 0);
                            const finished = isCreditFinished(credit);
                            const statusLabel = credit.is_active === 1 ? (finished ? "Terminé" : "Actif") : "Inactif";
                            return (
                                <div key={credit.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="space-y-1">
                                            <p className="text-xs uppercase tracking-wide text-slate-500">{credit.credit_type || "Crédit"}</p>
                                            <p className="text-base font-semibold text-slate-900">{formatAmount(credit.principal)} emprunté</p>
                                            <div className="flex flex-wrap gap-3 text-xs text-slate-600">
                                                <span>Mensualité: {formatAmount(monthlyTotal)}</span>
                                                {credit.annual_rate ? <span>Taux: {(credit.annual_rate * 100).toFixed(2)}%</span> : null}
                                                {credit.duration_months ? <span>Durée: {credit.duration_months} mois</span> : null}
                                                {credit.start_date ? <span>Début: {credit.start_date}</span> : null}
                                                {credit.insurance_monthly ? <span>Assurance: {formatAmount(credit.insurance_monthly)}</span> : null}
                                            </div>
                                        </div>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                statusLabel === "Actif"
                                                    ? "bg-emerald-100 text-emerald-700"
                                                    : statusLabel === "Terminé"
                                                    ? "bg-amber-100 text-amber-700"
                                                    : "bg-slate-200 text-slate-700"
                                            }`}
                                        >
                                            {statusLabel}
                                        </span>
                                    </div>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        <button
                                            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                            onClick={() => editCredit(credit)}
                                        >
                                            Modifier
                                        </button>
                                        {credit.is_active === 1 ? (
                                            <button
                                                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                                onClick={() => startRefinance(credit)}
                                            >
                                                Refinancer
                                            </button>
                                        ) : null}
                                        <button
                                            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
                                            onClick={() => void removeCredit(credit.id)}
                                        >
                                            Supprimer
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-inner">
                    <div>
                        <p className="text-sm font-semibold text-slate-900">Ajouter / modifier un crédit</p>
                        {selectedProperty && <p className="text-xs text-slate-600">Bien : {selectedProperty.name}</p>}
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <label className="flex flex-col gap-1 text-sm text-slate-700">
                            Type de crédit
                            <select
                                ref={firstFieldRef}
                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                                value={form.credit_type}
                                onChange={(e) => setForm((prev) => ({ ...prev, credit_type: e.target.value }))}
                            >
                                <option value="">Sélectionnez un type</option>
                                {CREDIT_TYPES.map((opt) => (
                                    <option key={opt} value={opt}>
                                        {opt}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="flex flex-col gap-1 text-sm text-slate-700">
                            Montant emprunté
                            <input
                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                                value={form.principal}
                                onChange={(e) => setForm((prev) => ({ ...prev, principal: e.target.value }))}
                                placeholder="120000"
                                inputMode="decimal"
                            />
                        </label>
                        <label className="flex flex-col gap-1 text-sm text-slate-700">
                            Apport
                            <input
                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                                value={form.down_payment}
                                onChange={(e) => setForm((prev) => ({ ...prev, down_payment: e.target.value }))}
                                placeholder="0"
                                inputMode="decimal"
                            />
                        </label>
                        <label className="flex flex-col gap-1 text-sm text-slate-700">
                            Durée (mois)
                            <input
                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                                value={form.duration_months}
                                onChange={(e) => setForm((prev) => ({ ...prev, duration_months: e.target.value }))}
                                placeholder="240"
                                inputMode="numeric"
                            />
                        </label>
                        <label className="flex flex-col gap-1 text-sm text-slate-700">
                            Taux annuel (%)
                            <input
                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                                value={form.annual_rate}
                                onChange={(e) => setForm((prev) => ({ ...prev, annual_rate: e.target.value }))}
                                placeholder="3.2"
                                inputMode="decimal"
                            />
                        </label>
                        <label className="flex flex-col gap-1 text-sm text-slate-700">
                            Assurance mensuelle
                            <input
                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                                value={form.insurance_monthly}
                                onChange={(e) => setForm((prev) => ({ ...prev, insurance_monthly: e.target.value }))}
                                placeholder="25"
                                inputMode="decimal"
                            />
                        </label>
                        <label className="flex flex-col gap-1 text-sm text-slate-700">
                            Début du prêt
                            <input
                                type="date"
                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                                value={form.start_date}
                                onChange={(e) => setForm((prev) => ({ ...prev, start_date: e.target.value }))}
                            />
                        </label>
                        <label className="flex items-center gap-2 text-sm text-slate-700">
                            <input
                                type="checkbox"
                                checked={form.is_active}
                                onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                            />
                            Crédit actif
                        </label>
                        <label className="md:col-span-2 flex flex-col gap-1 text-sm text-slate-700">
                            Notes
                            <textarea
                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                                value={form.notes}
                                onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                                placeholder="Optionnel"
                            />
                        </label>
                    </div>

                    <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-3">
                        <div className="text-sm text-slate-700">
                            <p className="text-xs uppercase tracking-wide text-slate-500">Mensualité estimée</p>
                            <p className="text-base font-semibold text-slate-900">{formatAmount(monthlyPayment)}</p>
                        </div>
                        <div className="text-sm text-slate-700">
                            <p className="text-xs uppercase tracking-wide text-slate-500">Mensualité totale</p>
                            <p className="text-base font-semibold text-slate-900">{formatAmount(totalMonthly)}</p>
                        </div>
                        <div className="text-sm text-slate-700">
                            <p className="text-xs uppercase tracking-wide text-slate-500">Coût total du crédit</p>
                            <p className="text-base font-semibold text-slate-900">{formatAmount(totalCost)}</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <button
                            className={primaryButton}
                            onClick={() => void saveCredit()}
                            disabled={saving || !propertyId || !userId}
                        >
                            {form.id ? "Mettre à jour" : "Enregistrer le crédit"}
                        </button>
                        <button className={secondaryButton} onClick={handleAddCredit} disabled={saving}>
                            Réinitialiser
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}
