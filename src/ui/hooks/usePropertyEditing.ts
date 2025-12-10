import { useState } from "react";
import type { PropertyDraft, Property } from "../types";
import { emptyPropertyDraft } from "../constants/propertyTypes";

export function usePropertyEditing() {
    const [editingPropertyId, setEditingPropertyId] = useState<number | null>(null);
    const [editPropertyDraft, setEditPropertyDraft] = useState<PropertyDraft & { status: string }>({
        ...emptyPropertyDraft,
        status: "active",
    });

    function startEditProperty(property: Property) {
        setEditingPropertyId(property.id);
        setEditPropertyDraft({
            name: property.name,
            address: property.address ?? "",
            city_id: property.city_id ?? null,
            region_id: property.region_id ?? null,
            country_id: property.country_id ?? null,
            department_id: property.department_id ?? null,
            type: property.type ?? emptyPropertyDraft.type,
            surface: property.surface?.toString() ?? "",
            baseRent: property.base_rent?.toString() ?? "",
            baseCharges: property.base_charges?.toString() ?? "",
            purchasePrice: property.purchase_price?.toString() ?? "",
            status: property.status,
        });
    }

    function cancelEditProperty() {
        setEditingPropertyId(null);
        setEditPropertyDraft({ ...emptyPropertyDraft, status: "active" });
    }

    function resetEditing() {
        setEditingPropertyId(null);
        setEditPropertyDraft({ ...emptyPropertyDraft, status: "active" });
    }

    return {
        editingPropertyId,
        editPropertyDraft,
        setEditPropertyDraft,
        startEditProperty,
        cancelEditProperty,
        resetEditing,
    };
}
