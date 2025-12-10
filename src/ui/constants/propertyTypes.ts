import type { PropertyTypeOption } from "../types";

export const propertyTypes: PropertyTypeOption[] = [
    { value: "appartement", label: "Appartement" },
    { value: "maison", label: "Maison" },
    { value: "studio", label: "Studio" },
    { value: "bureau", label: "Bureau" },
    { value: "local_commercial", label: "Local commercial" },
    { value: "parking", label: "Parking / box" },
    { value: "autre", label: "Autre" },
];

export const emptyPropertyDraft = {
    name: "",
    address: "",
    city_id: null,
    region_id: null,
    country_id: null,
    department_id: null,
    type: propertyTypes[0].value,
    surface: "",
    baseRent: "",
    baseCharges: "",
    purchasePrice: "",
};
