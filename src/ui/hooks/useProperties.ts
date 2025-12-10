/* eslint-disable jsdoc/require-jsdoc, jsdoc/require-param, jsdoc/require-param-type, jsdoc/require-returns, jsdoc/require-returns-type, jsdoc/check-tag-names */
import { useState, useEffect, useCallback } from "react";
import type { Property, PropertyDraft, ElectronApi } from "../types";
import { parseNumberInput } from "../utils/numberParser";

/**
 * CRUD helper hook for properties scoped to a user, with validation and error messaging.
 */
export function useProperties(electronApi: ElectronApi | null, userId: number | null) {
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [creating, setCreating] = useState<boolean>(false);

    const fetchProperties = useCallback(async () => {
        if (!electronApi || !userId) return;
        setLoading(true);
        setError(null);
        try {
            const list = await electronApi.listProperties(userId);
            setProperties(list);
        } catch (err: unknown) {
            console.error(err);
            setError("Impossible de charger les biens.");
        } finally {
            setLoading(false);
        }
    }, [electronApi, userId]);

    useEffect(() => {
        if (!electronApi || !userId) return;
        void fetchProperties();
    }, [electronApi, userId, fetchProperties]);

    /**
     * Validate and persist a property draft, then prepend it to state.
     */
    async function createProperty(draft: PropertyDraft): Promise<Property | null> {
        if (!electronApi || !userId) return null;

        const name = draft.name.trim();
        if (!name) {
            setError("Le nom du bien est obligatoire.");
            return null;
        }

        const surface = parseNumberInput(draft.surface);
        const baseRent = parseNumberInput(draft.baseRent);
        const baseCharges = parseNumberInput(draft.baseCharges);
        const purchasePrice = parseNumberInput(draft.purchasePrice ?? "");

        if (!surface.valid) {
            setError("Surface invalide.");
            return null;
        }
        if (!baseRent.valid) {
            setError("Loyer invalide.");
            return null;
        }
        if (!baseCharges.valid) {
            setError("Charges invalides.");
            return null;
        }
        if (!purchasePrice.valid) {
            setError("Prix d'achat invalide.");
            return null;
        }

        setCreating(true);
        setError(null);
        try {
            const payload: Parameters<ElectronApi["createProperty"]>[0] = {
                userId,
                name,
            };

            const address = draft.address.trim();
            if (address) payload.address = address;
            if (draft.city_id !== undefined) payload.city_id = draft.city_id ?? null;
            if (draft.region_id !== undefined) payload.region_id = draft.region_id ?? null;
            if (draft.country_id !== undefined) payload.country_id = draft.country_id ?? null;
            if (draft.department_id !== undefined) payload.department_id = draft.department_id ?? null;
            if (draft.type) payload.type = draft.type;
            if (surface.value !== null) payload.surface = surface.value;
            if (baseRent.value !== null) payload.baseRent = baseRent.value;
            if (baseCharges.value !== null) payload.baseCharges = baseCharges.value;
            if (purchasePrice.value !== null) payload.purchase_price = purchasePrice.value;

            const created = await electronApi.createProperty(payload);
            setProperties(prev => [created, ...prev]);
            return created;
        } catch (err: unknown) {
            console.error(err);
            const errorObj = err as { message?: string };
            if (errorObj?.message === "property_name_required") {
                setError("Le nom du bien est obligatoire.");
            } else {
                setError("Impossible d'ajouter le bien.");
            }
            return null;
        } finally {
            setCreating(false);
        }
    }

    /**
     * Validate and persist edits to an existing property.
     */
    async function updateProperty(
        id: number,
        draft: PropertyDraft & { status: string }
    ): Promise<Property | null> {
        if (!electronApi || !userId) return null;

        const name = draft.name.trim();
        if (!name) {
            setError("Le nom du bien est obligatoire.");
            return null;
        }

        const surface = parseNumberInput(draft.surface);
        const baseRent = parseNumberInput(draft.baseRent);
        const baseCharges = parseNumberInput(draft.baseCharges);
        const purchasePrice = parseNumberInput(draft.purchasePrice ?? "");

        if (!surface.valid) {
            setError("Surface invalide.");
            return null;
        }
        if (!baseRent.valid) {
            setError("Loyer invalide.");
            return null;
        }
        if (!baseCharges.valid) {
            setError("Charges invalides.");
            return null;
        }
        if (!purchasePrice.valid) {
            setError("Prix d'achat invalide.");
            return null;
        }

        try {
            const payload: Parameters<ElectronApi["updateProperty"]>[0] = {
                id,
                userId,
                name,
                status: draft.status,
            };

            const address = draft.address.trim();
            if (address) payload.address = address;
            if (draft.city_id !== undefined) payload.city_id = draft.city_id ?? null;
            if (draft.region_id !== undefined) payload.region_id = draft.region_id ?? null;
            if (draft.country_id !== undefined) payload.country_id = draft.country_id ?? null;
            if (draft.department_id !== undefined) payload.department_id = draft.department_id ?? null;
            if (draft.type) payload.type = draft.type;
            if (surface.value !== null) payload.surface = surface.value;
            if (baseRent.value !== null) payload.baseRent = baseRent.value;
            if (baseCharges.value !== null) payload.baseCharges = baseCharges.value;
            if (purchasePrice.value !== null) payload.purchase_price = purchasePrice.value;

            const updated = await electronApi.updateProperty(payload);
            setProperties(prev => prev.map(p => (p.id === id ? updated : p)));
            return updated;
        } catch (err: unknown) {
            console.error(err);
            const errorObj = err as { message?: string };
            if (errorObj?.message === "property_not_found") {
                setError("Bien introuvable.");
            } else {
                setError("Mise à jour impossible pour le moment.");
            }
            return null;
        }
    }

    /**
     * Toggle archived/active status on a property and sync local state.
     */
    async function toggleArchive(property: Property): Promise<boolean> {
        if (!electronApi || !userId) return false;
        const newStatus = property.status === "archived" ? "active" : "archived";
        try {
            const updated = await electronApi.updateProperty({
                id: property.id,
                userId,
                status: newStatus,
            });
            setProperties(prev => prev.map(p => (p.id === property.id ? updated : p)));
            return true;
        } catch (err: unknown) {
            console.error(err);
            setError("Impossible de changer le statut.");
            return false;
        }
    }

    function clearError() {
        setError(null);
    }

    return {
        properties,
        loading,
        error,
        creating,
        createProperty,
        updateProperty,
        toggleArchive,
        clearError,
        refreshProperties: fetchProperties,
    };
}
