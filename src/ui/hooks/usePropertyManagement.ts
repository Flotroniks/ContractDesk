import { useMemo, useState } from "react";
import type { Property, PropertyDraft, TabKey, ElectronApi } from "../types";
import { useProperties } from "./useProperties";
import { usePropertyEditing } from "./usePropertyEditing";
import { emptyPropertyDraft } from "../constants/propertyTypes";

export function usePropertyManagement(electronApi: ElectronApi | null, userId: number | null) {
    const initialTab = useMemo<TabKey>(() => {
        if (typeof window === "undefined") return "dashboard";
        if (window.location.pathname === "/finances") return "finances";
        if (window.location.pathname === "/stats") return "stats";
        return "dashboard";
    }, []);

    const [activeTab, setActiveTabState] = useState<TabKey>(initialTab);
    const [propertyForm, setPropertyForm] = useState<PropertyDraft>(emptyPropertyDraft);

    const { editingPropertyId, editPropertyDraft, setEditPropertyDraft, startEditProperty, cancelEditProperty, resetEditing } =
        usePropertyEditing();

    const { properties, loading, error, creating, createProperty, updateProperty, toggleArchive } = useProperties(electronApi, userId);

    async function handleCreateProperty() {
        const created = await createProperty(propertyForm);
        if (created) setPropertyForm(emptyPropertyDraft);
        return created;
    }

    async function handleSavePropertyEdit(id: number) {
        const updated = await updateProperty(id, editPropertyDraft);
        if (updated) cancelEditProperty();
        return updated;
    }

    function handleStartEditProperty(property: Property) {
        startEditProperty(property);
    }

    function setActiveTab(tab: TabKey) {
        setActiveTabState(tab);
        if (typeof window !== "undefined") {
            const path = tab === "finances" ? "/finances" : tab === "stats" ? "/stats" : "/";
            if (window.location.pathname !== path) window.history.replaceState(null, "", path);
        }
    }

    return {
        activeTab,
        propertyForm,
        editingPropertyId,
        editPropertyDraft,
        properties,
        propertiesLoading: loading,
        propertyError: error,
        creatingProperty: creating,
        setActiveTab,
        setPropertyForm,
        setEditPropertyDraft,
        handleCreateProperty,
        handleStartEditProperty,
        cancelEditProperty,
        handleSavePropertyEdit,
        toggleArchive,
        resetEditing,
    };
}
