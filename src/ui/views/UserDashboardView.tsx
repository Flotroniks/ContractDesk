import { useTranslation } from "react-i18next";
import type { UserProfile, PropertyDraft, TabKey, Property, ElectronApi } from "../types";
import { PropertyForm } from "../components/PropertyForm";
import { PropertyCard } from "../components/PropertyCard";
import { PropertyCreditsCard } from "../components/PropertyCreditsCard";
import { FinancesHub } from "../components/FinancesHub";
import { StatsView } from "../components/StatsView";

type UserDashboardViewProps = {
    user: UserProfile;
    activeTab: TabKey;
    properties: Property[];
    propertiesLoading: boolean;
    propertyError: string | null;
    propertyForm: PropertyDraft;
    creatingProperty: boolean;
    editingPropertyId: number | null;
    editPropertyDraft: PropertyDraft & { status: string };
    onBack: () => void;
    onTabChange: (tab: TabKey) => void;
    onPropertyFormChange: (form: PropertyDraft) => void;
    onCreateProperty: () => void;
    onEditPropertyStart: (property: Property) => void;
    onEditPropertyCancel: () => void;
    onEditPropertySave: (id: number) => void;
    onEditPropertyChange: (draft: PropertyDraft & { status: string }) => void;
    onToggleArchive: (property: Property) => void;
    electronApi: ElectronApi;
};

const tabs: Array<{ key: TabKey }> = [
    { key: "dashboard" },
    { key: "finances" },
    { key: "properties" },
    { key: "stats" },
];

export function UserDashboardView({
    user,
    activeTab,
    properties,
    propertiesLoading,
    propertyError,
    propertyForm,
    creatingProperty,
    editingPropertyId,
    editPropertyDraft,
    onBack,
    onTabChange,
    onPropertyFormChange,
    onCreateProperty,
    onEditPropertyStart,
    onEditPropertyCancel,
    onEditPropertySave,
    onEditPropertyChange,
    onToggleArchive,
    electronApi,
}: UserDashboardViewProps) {
    const { t } = useTranslation();

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 text-slate-900">
            <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-sm text-slate-500">{t("dashboard.activeProfileLabel")}</div>
                        <div className="text-3xl font-semibold">{t("dashboard.greeting", { name: user.username })}</div>
                        <p className="text-slate-600 text-sm mt-1">{t("dashboard.subtitle")}</p>
                    </div>
                    <button
                        onClick={onBack}
                        className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                        {t("common.backToProfiles")}
                    </button>
                </div>

                <div className="flex flex-wrap gap-2">
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => onTabChange(tab.key)}
                            className={`rounded-full px-4 py-2 text-sm font-semibold border transition ${
                                activeTab === tab.key
                                    ? "bg-blue-600 text-white border-blue-600"
                                    : "border-slate-200 bg-white text-slate-700 hover:border-blue-200"
                            }`}
                        >
                            {t(`dashboard.tabs.${tab.key}`)}
                        </button>
                    ))}
                </div>

                {activeTab === "properties" ? (
                    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-semibold">{t("dashboard.properties.title")}</h2>
                                <p className="text-sm text-slate-500">{t("dashboard.properties.subtitle")}</p>
                            </div>
                        </div>

                        {propertyError && (
                            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                {propertyError}
                            </div>
                        )}

                        <PropertyForm
                            form={propertyForm}
                            creating={creatingProperty}
                            onChange={onPropertyFormChange}
                            onCreate={onCreateProperty}
                        />

                        <PropertyCreditsCard electron={electronApi} properties={properties} userId={user.id} />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {propertiesLoading && (
                                <div className="col-span-2 text-sm text-slate-500">{t("common.loadingProperties")}</div>
                            )}
                            {!propertiesLoading && properties.length === 0 && (
                                <div className="col-span-2 text-sm text-slate-500">{t("dashboard.properties.empty")}</div>
                            )}
                            {properties.map((property) => (
                                <PropertyCard
                                    key={property.id}
                                    property={property}
                                    isEditing={editingPropertyId === property.id}
                                    editDraft={editPropertyDraft}
                                    onEditStart={() => onEditPropertyStart(property)}
                                    onEditCancel={onEditPropertyCancel}
                                    onEditSave={() => onEditPropertySave(property.id)}
                                    onEditChange={onEditPropertyChange}
                                    onToggleArchive={() => onToggleArchive(property)}
                                />
                            ))}
                        </div>
                    </section>
                ) : activeTab === "finances" ? (
                    <FinancesHub electronApi={electronApi} properties={properties} />
                ) : activeTab === "stats" ? (
                    <StatsView electronApi={electronApi} properties={properties} />
                ) : (
                    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
                        <div className="text-center text-slate-500 py-12">
                            {t("dashboard.comingSoon", { tab: t(`dashboard.tabs.${activeTab}`) })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
