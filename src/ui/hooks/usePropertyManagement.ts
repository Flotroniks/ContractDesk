import { useState } from "react";
import type { Property, PropertyDraft, TabKey, ElectronApi } from "../types";
import { useProperties } from "./useProperties";
import { usePropertyEditing } from "./usePropertyEditing";
import { emptyPropertyDraft } from "../constants/propertyTypes";

export function usePropertyManagement(electronApi: ElectronApi | null, userId: number | null) {
    const [activeTab, setActiveTab] = useState<TabKey>("dashboard");
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
