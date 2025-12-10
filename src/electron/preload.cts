import electron from "electron";

type EventPayloadArgs = {
    statistics: void;
    getStaticData: void;
    listUsers: void;
    createUser: { username: string; password?: string | undefined };
    updateUser: { id: number; username: string };
    deleteUser: { id: number; password: string };
    listProperties: { userId: number };
    createProperty: {
        userId: number;
        name: string;
        address?: string | null | undefined;
        city_id?: number | null | undefined;
        department_id?: number | null | undefined;
        region_id?: number | null | undefined;
        state?: string | undefined;
        country_id?: number | null | undefined;
        type?: string | undefined;
        surface?: number | null | undefined;
        baseRent?: number | null | undefined;
        baseCharges?: number | null | undefined;
        purchase_price?: number | null | undefined;
    };
    updateProperty: {
        id: number;
        userId: number;
        name?: string | undefined;
        address?: string | null | undefined;
        city_id?: number | null | undefined;
        department_id?: number | null | undefined;
        region_id?: number | null | undefined;
        state?: string | undefined;
        country_id?: number | null | undefined;
        type?: string | undefined;
        surface?: number | null | undefined;
        baseRent?: number | null | undefined;
        baseCharges?: number | null | undefined;
        purchase_price?: number | null | undefined;
        status?: string | undefined;
    };
    listCountries: void;
    listRegions: { countryId: number };
    listCities: { regionId?: number | undefined; departmentId?: number | null | undefined };
    listDepartments: { regionId?: number | undefined };
    createCountry: { name: string; code?: string | null | undefined };
    createRegion: { countryId: number; name: string };
    createCity: { regionId?: number | undefined; countryId?: number | undefined; departmentId?: number | null | undefined; name: string };
    createDepartment: { regionId?: number | undefined; name: string };
    listExpensesByProperty: { propertyId: number; year?: number | undefined };
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
        date?: string | undefined;
        category?: string | undefined;
        description?: string | null | undefined;
        amount?: number | undefined;
        is_recurring?: boolean | undefined;
        frequency?: string | null | undefined;
    };
    deleteExpense: { id: number };
    listIncomesByProperty: { propertyId: number; year?: number | undefined };
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
        lease_id?: number | null | undefined;
        date?: string | undefined;
        amount?: number | undefined;
        payment_method?: string | null | undefined;
        notes?: string | null | undefined;
    };
    deleteIncome: { id: number };
    listCreditsByProperty: { propertyId: number };
    getCreditByProperty: { propertyId: number };
    saveCredit: {
        id?: number;
        user_id: number;
        property_id: number;
        credit_type?: string | null;
        down_payment?: number | null | undefined;
        principal?: number | null | undefined;
        annual_rate?: number | null | undefined;
        duration_months?: number | null | undefined;
        start_date?: string | null | undefined;
        insurance_monthly?: number | null | undefined;
        notes?: string | null | undefined;
        is_active?: number | boolean | undefined;
        refinance_from_id?: number | null | undefined;
    };
    deleteCredit: { id: number };
    listCategories: { type: "expense" | "income" };
    upsertCategory: { type: "expense" | "income"; name: string };
    listAmortizationsByProperty: { propertyId: number };
    listCashflowByProperty: { propertyId: number; year?: number | undefined };
    getMonthlyStats: { propertyId: number; year?: number | undefined };
    getPropertyAnnualSummary: { propertyId: number; year?: number | undefined; purchase_price?: number | null | undefined };
    listVacancyMonths: { propertyId: number; year?: number | undefined };
    exportFinanceExcel: { propertyId: number; year?: number | undefined; purchase_price?: number | null | undefined };
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
    address?: string | null;
    city_id?: number | null;
    department_id?: number | null;
    region_id?: number | null;
    state?: string | null;
    country_id?: number | null;
    type?: string | null;
    surface?: number | null;
    base_rent?: number | null;
    base_charges?: number | null;
    purchase_price?: number | null;
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

type MonthlyStat = {
    month: number;
    income: number;
    expense: number;
    credit: number;
    cashflow: number;
    vacancy: number;
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
    getMonthlyStats: MonthlyStat[];
    getPropertyAnnualSummary: AnnualSummary;
    listVacancyMonths: { vacantMonths: number[]; vacancyRate: number };
    exportFinanceExcel: { path: string };
};

/**
 * Typed IPC facade exposed to the renderer via `window.electron`.
 * Each method mirrors an ipcMain handler declared in `main.ts`.
 */
const api = {
    subscribeStatistics: (callback: (stats: Statistics) => void) =>
        ipcOn("statistics", stats => {
            callback(stats);
        }),
    getStaticData: () => ipcInvoke("getStaticData"),
    listUsers: () => ipcInvoke("listUsers"),
    createUser: (username: string, password?: string) => {
        const payload = password === undefined ? { username } : { username, password };
        return ipcInvoke("createUser", payload);
    },
    updateUser: (id: number, username: string) => ipcInvoke("updateUser", { id, username }),
    deleteUser: (id: number, password: string) => ipcInvoke("deleteUser", { id, password }),
    listProperties: (userId: number) => ipcInvoke("listProperties", { userId }),
    createProperty: (data: EventPayloadArgs['createProperty']) => {
        const payload: EventPayloadArgs['createProperty'] = {
            userId: data.userId,
            name: data.name,
        };
        if (data.address !== undefined) payload.address = data.address;
        if (data.city_id !== undefined) payload.city_id = data.city_id;
        if (data.department_id !== undefined) payload.department_id = data.department_id;
        if (data.region_id !== undefined) payload.region_id = data.region_id;
        if (data.state !== undefined) payload.state = data.state;
        if (data.country_id !== undefined) payload.country_id = data.country_id;
        if (data.type !== undefined) payload.type = data.type;
        if (data.surface !== undefined) payload.surface = data.surface;
        if (data.baseRent !== undefined) payload.baseRent = data.baseRent;
        if (data.baseCharges !== undefined) payload.baseCharges = data.baseCharges;
        if (data.purchase_price !== undefined) payload.purchase_price = data.purchase_price;
        return ipcInvoke("createProperty", payload);
    },
    updateProperty: (data: EventPayloadArgs['updateProperty']) => {
        const payload: EventPayloadArgs['updateProperty'] = {
            id: data.id,
            userId: data.userId,
        };
        if (data.name !== undefined) payload.name = data.name;
        if (data.address !== undefined) payload.address = data.address;
        if (data.city_id !== undefined) payload.city_id = data.city_id;
        if (data.department_id !== undefined) payload.department_id = data.department_id;
        if (data.region_id !== undefined) payload.region_id = data.region_id;
        if (data.state !== undefined) payload.state = data.state;
        if (data.country_id !== undefined) payload.country_id = data.country_id;
        if (data.type !== undefined) payload.type = data.type;
        if (data.surface !== undefined) payload.surface = data.surface;
        if (data.baseRent !== undefined) payload.baseRent = data.baseRent;
        if (data.baseCharges !== undefined) payload.baseCharges = data.baseCharges;
        if (data.purchase_price !== undefined) payload.purchase_price = data.purchase_price;
        if (data.status !== undefined) payload.status = data.status;
        return ipcInvoke("updateProperty", payload);
    },
    listCountries: () => ipcInvoke("listCountries"),
    listRegions: (countryId: number) => ipcInvoke("listRegions", { countryId }),
    listCities: (regionId?: number, departmentId?: number) => {
        const payload: { regionId?: number; departmentId?: number } = {};
        if (regionId !== undefined) payload.regionId = regionId;
        if (departmentId !== undefined) payload.departmentId = departmentId;
        return ipcInvoke("listCities", payload);
    },
    listDepartments: (regionId?: number) => {
        const payload: { regionId?: number } = {};
        if (regionId !== undefined) payload.regionId = regionId;
        return ipcInvoke("listDepartments", payload);
    },
    createCountry: (name: string, code?: string | null) => {
        const payload: { name: string; code?: string | null } = { name };
        if (code !== undefined) payload.code = code;
        return ipcInvoke("createCountry", payload);
    },
    createRegion: (countryId: number, name: string) => ipcInvoke("createRegion", { countryId, name }),
    createCity: (regionId: number, countryId: number, departmentId: number | null, name: string) => {
        const payload: { regionId: number; countryId: number; departmentId?: number | null; name: string } = { regionId, countryId, name };
        if (departmentId !== undefined) payload.departmentId = departmentId;
        return ipcInvoke("createCity", payload);
    },
    createDepartment: (regionId: number, name: string) => ipcInvoke("createDepartment", { regionId, name }),
    listExpensesByProperty: (propertyId: number, year?: number) => {
        const payload: { propertyId: number; year?: number } = { propertyId };
        if (year !== undefined) payload.year = year;
        return ipcInvoke("listExpensesByProperty", payload);
    },
    createExpense: (data: EventPayloadArgs['createExpense']) => {
        const payload: EventPayloadArgs['createExpense'] = {
            property_id: data.property_id,
            date: data.date,
            category: data.category,
            amount: data.amount,
        };
        if (data.description !== undefined) payload.description = data.description;
        if (data.is_recurring !== undefined) payload.is_recurring = data.is_recurring;
        if (data.frequency !== undefined) payload.frequency = data.frequency;
        return ipcInvoke("createExpense", payload);
    },
    updateExpense: (id: number, data: Omit<EventPayloadArgs['updateExpense'], 'id'>) => {
        const payload: EventPayloadArgs['updateExpense'] = { id };
        if (data.date !== undefined) payload.date = data.date;
        if (data.category !== undefined) payload.category = data.category;
        if (data.description !== undefined) payload.description = data.description;
        if (data.amount !== undefined) payload.amount = data.amount;
        if (data.is_recurring !== undefined) payload.is_recurring = data.is_recurring;
        if (data.frequency !== undefined) payload.frequency = data.frequency;
        return ipcInvoke("updateExpense", payload);
    },
    deleteExpense: (id: number) => ipcInvoke("deleteExpense", { id }),
    listIncomesByProperty: (propertyId: number, year?: number) => {
        const payload: { propertyId: number; year?: number } = { propertyId };
        if (year !== undefined) payload.year = year;
        return ipcInvoke("listIncomesByProperty", payload);
    },
    createIncome: (data: EventPayloadArgs['createIncome']) => {
        const payload: EventPayloadArgs['createIncome'] = {
            property_id: data.property_id,
            date: data.date,
            amount: data.amount,
        };
        if (data.lease_id !== undefined) payload.lease_id = data.lease_id;
        if (data.payment_method !== undefined) payload.payment_method = data.payment_method;
        if (data.notes !== undefined) payload.notes = data.notes;
        return ipcInvoke("createIncome", payload);
    },
    updateIncome: (id: number, data: Omit<EventPayloadArgs['updateIncome'], 'id'>) => {
        const payload: EventPayloadArgs['updateIncome'] = { id };
        if (data.lease_id !== undefined) payload.lease_id = data.lease_id;
        if (data.date !== undefined) payload.date = data.date;
        if (data.amount !== undefined) payload.amount = data.amount;
        if (data.payment_method !== undefined) payload.payment_method = data.payment_method;
        if (data.notes !== undefined) payload.notes = data.notes;
        return ipcInvoke("updateIncome", payload);
    },
    deleteIncome: (id: number) => ipcInvoke("deleteIncome", { id }),
    listCreditsByProperty: (propertyId: number) => ipcInvoke("listCreditsByProperty", { propertyId }),
    getCreditByProperty: (propertyId: number) => ipcInvoke("getCreditByProperty", { propertyId }),
    saveCredit: (data: EventPayloadArgs['saveCredit']) => {
        const payload: EventPayloadArgs['saveCredit'] = {
            user_id: data.user_id,
            property_id: data.property_id,
        };
        if (data.id !== undefined) payload.id = data.id;
        if (data.credit_type !== undefined) payload.credit_type = data.credit_type;
        if (data.down_payment !== undefined) payload.down_payment = data.down_payment;
        if (data.principal !== undefined) payload.principal = data.principal;
        if (data.annual_rate !== undefined) payload.annual_rate = data.annual_rate;
        if (data.duration_months !== undefined) payload.duration_months = data.duration_months;
        if (data.start_date !== undefined) payload.start_date = data.start_date;
        if (data.insurance_monthly !== undefined) payload.insurance_monthly = data.insurance_monthly;
        if (data.notes !== undefined) payload.notes = data.notes;
        if (data.is_active !== undefined) payload.is_active = data.is_active;
        if (data.refinance_from_id !== undefined) payload.refinance_from_id = data.refinance_from_id;
        return ipcInvoke("saveCredit", payload);
    },
    deleteCredit: (id: number) => ipcInvoke("deleteCredit", { id }),
    listCategories: (type: "expense" | "income") => ipcInvoke("listCategories", { type }),
    upsertCategory: (type: "expense" | "income", name: string) => ipcInvoke("upsertCategory", { type, name }),
    listAmortizationsByProperty: (propertyId: number) => ipcInvoke("listAmortizationsByProperty", { propertyId }),
    listCashflowByProperty: (propertyId: number, year?: number) => {
        const payload: { propertyId: number; year?: number } = { propertyId };
        if (year !== undefined) payload.year = year;
        return ipcInvoke("listCashflowByProperty", payload);
    },
    getMonthlyStats: (propertyId: number, year?: number) => {
        const payload: { propertyId: number; year?: number } = { propertyId };
        if (year !== undefined) payload.year = year;
        return ipcInvoke("getMonthlyStats", payload);
    },
    getPropertyAnnualSummary: (propertyId: number, year?: number, purchase_price?: number | null) => {
        const payload: { propertyId: number; year?: number; purchase_price?: number | null } = { propertyId };
        if (year !== undefined) payload.year = year;
        if (purchase_price !== undefined) payload.purchase_price = purchase_price;
        return ipcInvoke("getPropertyAnnualSummary", payload);
    },
    listVacancyMonths: (propertyId: number, year?: number) => {
        const payload: { propertyId: number; year?: number } = { propertyId };
        if (year !== undefined) payload.year = year;
        return ipcInvoke("listVacancyMonths", payload);
    },
    exportFinanceExcel: (propertyId: number, year?: number, purchase_price?: number | null) => {
        const payload: { propertyId: number; year?: number; purchase_price?: number | null } = { propertyId };
        if (year !== undefined) payload.year = year;
        if (purchase_price !== undefined) payload.purchase_price = purchase_price;
        return ipcInvoke("exportFinanceExcel", payload);
    },
};

electron.contextBridge.exposeInMainWorld("electron", api);

console.log("[preload] chargé", {
    cwd: process.cwd(),
    dirname: __dirname,
    electron: process.versions.electron
});

/**
 * Invoke a typed IPC channel and return the mapped payload.
 */
function ipcInvoke<Key extends keyof EventPayloadMapping>(
    key: Key,
    payload?: EventPayloadArgs[Key]
): Promise<EventPayloadMapping[Key]> {
    return electron.ipcRenderer.invoke(key as string, payload as any);
}

/**
 * Subscribe to an IPC event and provide an unsubscribe callback.
 */
function ipcOn<Key extends keyof EventPayloadMapping>(
    key: Key,
    callback: (payload: EventPayloadMapping[Key]) => void
) {
    const cb = (_: Electron.IpcRendererEvent, payload: any) => callback(payload);
    electron.ipcRenderer.on(key as string, cb);
    return () => electron.ipcRenderer.off(key as string, cb);
}
