import electron from "electron";

type EventPayloadArgs = {
    statistics: void;
    getStaticData: void;
    listUsers: void;
    createUser: { username: string; password?: string };
    updateUser: { id: number; username: string };
    deleteUser: { id: number; password: string };
    listProperties: { userId: number };
    createProperty: {
        userId: number;
        name: string;
        address?: string;
        city_id?: number | null;
        department_id?: number | null;
        region_id?: number | null;
        state?: string;
        country_id?: number | null;
        type?: string;
        surface?: number | null;
        baseRent?: number | null;
        baseCharges?: number | null;
        purchase_price?: number | null;
    };
    updateProperty: {
        id: number;
        userId: number;
        name?: string;
        address?: string;
        city_id?: number | null;
        department_id?: number | null;
        region_id?: number | null;
        state?: string;
        country_id?: number | null;
        type?: string;
        surface?: number | null;
        baseRent?: number | null;
        baseCharges?: number | null;
        purchase_price?: number | null;
        status?: string;
    };
    listCountries: void;
    listRegions: { countryId?: number };
    listCities: { regionId?: number; departmentId?: number };
    listDepartments: { regionId?: number };
    createCountry: { name: string; code?: string | null };
    createRegion: { countryId?: number; name: string };
    createCity: { regionId?: number; countryId?: number; departmentId?: number | null; name: string };
    createDepartment: { regionId?: number; name: string };
    listExpensesByProperty: { propertyId: number; year?: number };
    createExpense: {
        property_id: number;
        date: string;
        category: string;
        description?: string | null;
        amount: number;
        is_recurring?: boolean;
        frequency?: string | null;
    };
    updateExpense: {
        id: number;
        date?: string;
        category?: string;
        description?: string | null;
        amount?: number;
        is_recurring?: boolean;
        frequency?: string | null;
    };
    deleteExpense: { id: number };
    listIncomesByProperty: { propertyId: number; year?: number };
    createIncome: {
        property_id: number;
        lease_id?: number | null;
        date: string;
        amount: number;
        payment_method?: string | null;
        notes?: string | null;
    };
    updateIncome: {
        id: number;
        lease_id?: number | null;
        date?: string;
        amount?: number;
        payment_method?: string | null;
        notes?: string | null;
    };
    deleteIncome: { id: number };
    listCreditsByProperty: { propertyId: number };
    getCreditByProperty: { propertyId: number };
    saveCredit: {
        id?: number;
        user_id: number;
        property_id: number;
        credit_type?: string | null;
        down_payment?: number | null;
        principal?: number | null;
        annual_rate?: number | null;
        duration_months?: number | null;
        start_date?: string | null;
        insurance_monthly?: number | null;
        notes?: string | null;
        is_active?: number | boolean;
           refinance_from_id?: number | null; // Added refinance_from_id support
    };
    deleteCredit: { id: number };
    listCategories: { type: "expense" | "income" };
    upsertCategory: { type: "expense" | "income"; name: string };
    listAmortizationsByProperty: { propertyId: number };
    listCashflowByProperty: { propertyId: number; year?: number };
    getPropertyAnnualSummary: { propertyId: number; year?: number; purchase_price?: number | null };
    listVacancyMonths: { propertyId: number; year?: number };
    exportFinanceExcel: { propertyId: number; year?: number; purchase_price?: number | null };
};

type UserProfile = {
    id: number;
    username: string;
    createdAt: string;
};

type Property = {
    id: number;
    user_id: number;
    name: string;
    address?: string;
    city_id?: number | null;
    department_id?: number | null;
    region_id?: number | null;
    state?: string;
    country_id?: number | null;
    type?: string;
    surface?: number;
    base_rent?: number;
    base_charges?: number;
    purchase_price?: number;
    status: string;
    created_at: string;
};

type Statistics = {
    cpuUsage: number;
    ramUsage: number;
    storageData: number;
};

type StaticData = {
    totalStorage: number;
    cpuModel: string;
    totalMemoryGB: number;
};

type Country = {
    id: number;
    name: string;
    code: string | null;
    created_at: string;
};

type Region = {
    id: number;
    country_id: number;
    name: string;
    created_at: string;
};

type City = {
    id: number;
    region_id: number;
    country_id: number;
    department_id: number | null;
    name: string;
    created_at: string;
};

type Department = {
    id: number;
    region_id: number;
    name: string;
    created_at: string;
};

type Expense = {
    id: number;
    property_id: number;
    date: string;
    category: string;
    description: string | null;
    amount: number;
    is_recurring: number;
    frequency: string | null;
    created_at: string;
};

type Income = {
    id: number;
    property_id: number;
    lease_id: number | null;
    date: string;
    amount: number;
    payment_method: string | null;
    notes: string | null;
    created_at: string;
};

type Credit = {
    id: number;
    user_id: number;
    property_id: number;
    credit_type: string | null;
    down_payment: number | null;
    principal: number | null;
    annual_rate: number | null;
    duration_months: number | null;
    start_date: string | null;
    monthly_payment: number | null;
    insurance_monthly: number | null;
    notes: string | null;
    is_active: number;
    created_at: string;
};

type Category = {
    id: number;
    type: "expense" | "income";
    name: string;
};

type Amortization = {
    id: number;
    property_id: number;
    start_date: string;
    end_date: string;
    amount: number;
    category: string;
    created_at: string;
};

type CashflowRow = {
    month: number;
    income: number;
    expenses: number;
    credit: number;
    cashflow: number;
};

type AnnualSummary = {
    total_rents_received: number;
    total_expenses: number;
    expense_breakdown: Array<{ category: string; total: number }>;
    gross_yield: number | null;
    net_yield: number | null;
    annual_credit: number;
    vacancy_cost: number;
};

type EventPayloadMapping = {
    statistics: Statistics;
    getStaticData: StaticData;
    listUsers: UserProfile[];
    createUser: UserProfile;
    updateUser: UserProfile;
    deleteUser: { propertiesDeleted: number };
    listProperties: Property[];
    createProperty: Property;
    updateProperty: Property;
    listCountries: Country[];
    listRegions: Region[];
    listCities: City[];
    listDepartments: Department[];
    createCountry: Country;
    createRegion: Region;
    createCity: City;
    createDepartment: Department;
    listExpensesByProperty: Expense[];
    createExpense: Expense;
    updateExpense: Expense;
    deleteExpense: { success: boolean };
    listIncomesByProperty: Income[];
    createIncome: Income;
    updateIncome: Income;
    deleteIncome: { success: boolean };
    listCreditsByProperty: Credit[];
    getCreditByProperty: Credit | null;
    saveCredit: Credit;
    deleteCredit: { success: boolean };
    listCategories: Category[];
    upsertCategory: Category;
    listAmortizationsByProperty: Amortization[];
    listCashflowByProperty: CashflowRow[];
    getPropertyAnnualSummary: AnnualSummary;
    listVacancyMonths: { vacantMonths: number[]; vacancyRate: number };
    exportFinanceExcel: { path: string };
};

const api = {
    subscribeStatistics: (callback: (stats: Statistics) => void) =>
        ipcOn("statistics", stats => {
            callback(stats);
        }),
    getStaticData: () => ipcInvoke("getStaticData"),
    listUsers: () => ipcInvoke("listUsers"),
    createUser: (username: string, password?: string) => ipcInvoke("createUser", { username, password }),
    updateUser: (id: number, username: string) => ipcInvoke("updateUser", { id, username }),
    deleteUser: (id: number, password: string) => ipcInvoke("deleteUser", { id, password }),
    listProperties: (userId: number) => ipcInvoke("listProperties", { userId }),
    createProperty: (data: EventPayloadArgs['createProperty']) => ipcInvoke("createProperty", data),
    updateProperty: (data: EventPayloadArgs['updateProperty']) => ipcInvoke("updateProperty", data),
    listCountries: () => ipcInvoke("listCountries"),
    listRegions: (countryId: number) => ipcInvoke("listRegions", { countryId }),
    listCities: (regionId?: number, departmentId?: number) => ipcInvoke("listCities", { regionId, departmentId }),
    listDepartments: (regionId?: number) => ipcInvoke("listDepartments", { regionId }),
    createCountry: (name: string, code?: string | null) => ipcInvoke("createCountry", { name, code }),
    createRegion: (countryId: number, name: string) => ipcInvoke("createRegion", { countryId, name }),
    createCity: (regionId: number, countryId: number, departmentId: number | null, name: string) =>
        ipcInvoke("createCity", { regionId, countryId, departmentId, name }),
    createDepartment: (regionId: number, name: string) => ipcInvoke("createDepartment", { regionId, name }),
    listExpensesByProperty: (propertyId: number, year?: number) => ipcInvoke("listExpensesByProperty", { propertyId, year }),
    createExpense: (data: EventPayloadArgs['createExpense']) => ipcInvoke("createExpense", data),
    updateExpense: (id: number, data: Omit<EventPayloadArgs['updateExpense'], 'id'>) =>
        ipcInvoke("updateExpense", { id, ...data }),
    deleteExpense: (id: number) => ipcInvoke("deleteExpense", { id }),
    listIncomesByProperty: (propertyId: number, year?: number) => ipcInvoke("listIncomesByProperty", { propertyId, year }),
    createIncome: (data: EventPayloadArgs['createIncome']) => ipcInvoke("createIncome", data),
    updateIncome: (id: number, data: Omit<EventPayloadArgs['updateIncome'], 'id'>) => ipcInvoke("updateIncome", { id, ...data }),
    deleteIncome: (id: number) => ipcInvoke("deleteIncome", { id }),
    listCreditsByProperty: (propertyId: number) => ipcInvoke("listCreditsByProperty", { propertyId }),
    getCreditByProperty: (propertyId: number) => ipcInvoke("getCreditByProperty", { propertyId }),
    saveCredit: (data: EventPayloadArgs['saveCredit']) => ipcInvoke("saveCredit", data),
    deleteCredit: (id: number) => ipcInvoke("deleteCredit", { id }),
    listCategories: (type: "expense" | "income") => ipcInvoke("listCategories", { type }),
    upsertCategory: (type: "expense" | "income", name: string) => ipcInvoke("upsertCategory", { type, name }),
    listAmortizationsByProperty: (propertyId: number) => ipcInvoke("listAmortizationsByProperty", { propertyId }),
    listCashflowByProperty: (propertyId: number, year?: number) => ipcInvoke("listCashflowByProperty", { propertyId, year }),
    getPropertyAnnualSummary: (propertyId: number, year?: number, purchase_price?: number | null) =>
        ipcInvoke("getPropertyAnnualSummary", { propertyId, year, purchase_price }),
    listVacancyMonths: (propertyId: number, year?: number) => ipcInvoke("listVacancyMonths", { propertyId, year }),
    exportFinanceExcel: (propertyId: number, year?: number, purchase_price?: number | null) =>
        ipcInvoke("exportFinanceExcel", { propertyId, year, purchase_price }),
};

electron.contextBridge.exposeInMainWorld("electron", api);

console.log("[preload] chargé", {
    cwd: process.cwd(),
    dirname: __dirname,
    electron: process.versions.electron
});

function ipcInvoke<Key extends keyof EventPayloadMapping>(
    key: Key,
    payload?: EventPayloadArgs[Key]
): Promise<EventPayloadMapping[Key]> {
    return electron.ipcRenderer.invoke(key as string, payload as any);
}

function ipcOn<Key extends keyof EventPayloadMapping>(
    key: Key,
    callback: (payload: EventPayloadMapping[Key]) => void
) {
    const cb = (_: Electron.IpcRendererEvent, payload: any) => callback(payload);
    electron.ipcRenderer.on(key as string, cb);
    return () => electron.ipcRenderer.off(key as string, cb);
}
