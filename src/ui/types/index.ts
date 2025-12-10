export type UserProfile = {
    id: number;
    username: string;
    createdAt: string;
};

export type Property = {
    id: number;
    user_id: number;
    name: string;
    address?: string | null;
    city_id?: number | null;
    region_id?: number | null;
    country_id?: number | null;
    department_id?: number | null;
    type?: string | null;
    surface?: number | null;
    base_rent?: number | null;
    base_charges?: number | null;
    purchase_price?: number | null;
    status: string;
    created_at: string;
};

export type TabKey = "dashboard" | "finances" | "properties" | "stats";

export type MonthlyStat = {
    month: number;
    income: number;
    expense: number;
    credit: number;
    cashflow: number;
    vacancy: number;
};

export type PropertyMonthlyStats = {
    propertyId: number;
    propertyName: string;
    stats: MonthlyStat[];
};

export type CreditSavePayload = {
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
    refinance_from_id?: number | null;
};

export type ElectronApi = {
    listProperties: (userId: number) => Promise<Property[]>;
    createProperty: (payload: {
        userId: number;
        name: string;
        address?: string;
        city_id?: number | null;
        region_id?: number | null;
        country_id?: number | null;
        department_id?: number | null;
        type?: string;
        surface?: number | null;
        baseRent?: number | null;
        baseCharges?: number | null;
        purchase_price?: number | null;
    }) => Promise<Property>;
    updateProperty: (payload: {
        id: number;
        userId: number;
        name?: string;
        address?: string;
        city_id?: number | null;
        region_id?: number | null;
        country_id?: number | null;
        department_id?: number | null;
        type?: string;
        surface?: number | null;
        baseRent?: number | null;
        baseCharges?: number | null;
        purchase_price?: number | null;
        status?: string;
    }) => Promise<Property>;
    listUsers: () => Promise<UserProfile[]>;
    createUser: (username: string, password: string) => Promise<UserProfile>;
    updateUser: (id: number, username: string) => Promise<UserProfile>;
    deleteUser: (id: number, password?: string) => Promise<{ propertiesDeleted: number }>;
    verifyUserPassword?: (username: string, password: string) => Promise<UserProfile | null>;

    listCountries: () => Promise<Country[]>;
    listRegions: (countryId: number) => Promise<Region[]>;
    listCities: (regionId: number, departmentId?: number | null) => Promise<City[]>;
    listDepartments: (regionId: number) => Promise<Department[]>;
    createCountry: (name: string, code?: string) => Promise<Country>;
    createRegion: (countryId: number, name: string) => Promise<Region>;
    createCity: (regionId: number, countryId: number, departmentId: number | null, name: string) => Promise<City>;
    createDepartment: (regionId: number, name: string) => Promise<Department>;

    listExpensesByProperty: (propertyId: number, year?: number) => Promise<Expense[]>;
    createExpense: (payload: {
        property_id: number;
        date: string;
        category: string;
        description: string | null;
        amount: number;
        is_recurring?: boolean;
        frequency?: string | null;
    }) => Promise<Expense>;
    updateExpense: (
        id: number,
        payload: Partial<{
            date: string;
            category: string;
            description: string | null;
            amount: number;
            is_recurring?: boolean;
            frequency?: string | null;
        }>
    ) => Promise<Expense>;
    deleteExpense: (id: number) => Promise<void>;
    listCategories?: (type: "expense" | "income") => Promise<Category[]>;

    listIncomesByProperty: (propertyId: number, year?: number) => Promise<Income[]>;
    createIncome: (payload: {
        property_id: number;
        lease_id: number | null;
        date: string;
        amount: number;
        payment_method: string | null;
        notes: string | null;
    }) => Promise<Income>;
    updateIncome: (
        id: number,
        payload: Partial<{
            date: string;
            amount: number;
            payment_method: string | null;
            notes: string | null;
            lease_id: number | null;
        }>
    ) => Promise<Income>;
    deleteIncome: (id: number) => Promise<void>;

    listCreditsByProperty: (propertyId: number) => Promise<Credit[]>;
    getCreditByProperty: (propertyId: number) => Promise<Credit | null>;
    saveCredit: (payload: CreditSavePayload) => Promise<Credit>;
    deleteCredit: (id: number) => Promise<{ success?: boolean } | void>;

    getPropertyAnnualSummary: (propertyId: number, year: number, purchasePrice?: number | null) => Promise<AnnualSummary>;
    listCashflowByProperty: (propertyId: number, year: number) => Promise<CashflowRow[]>;
    listVacancyMonths: (propertyId: number, year: number) => Promise<{ vacantMonths: number[]; vacancyRate: number }>;
    exportFinanceExcel: (propertyId: number, year: number, outputPath?: string) => Promise<void>;

    getMonthlyStats: (propertyId: number, year: number) => Promise<MonthlyStat[]>;
};

export type NumberParseResult = { 
    valid: boolean; 
    value: number | null;
};

export type PropertyDraft = {
    name: string;
    address: string;
    city_id: number | null;
    region_id: number | null;
    country_id: number | null;
    department_id: number | null;
    type: string;
    surface: string;
    baseRent: string;
    baseCharges: string;
    purchasePrice?: string;
    status?: string;
};

export type PropertyTypeOption = {
    value: string;
    label: string;
};

export type Country = {
    id: number;
    name: string;
    code?: string;
    created_at: string;
};

export type Region = {
    id: number;
    country_id: number;
    name: string;
    created_at: string;
};

export type City = {
    id: number;
    region_id: number;
    country_id: number;
    department_id: number | null;
    name: string;
    created_at: string;
};

export type Department = {
    id: number;
    region_id: number;
    name: string;
    created_at: string;
};

export type Expense = {
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

export type Income = {
    id: number;
    property_id: number;
    lease_id: number | null;
    date: string;
    amount: number;
    payment_method: string | null;
    notes: string | null;
    created_at: string;
};

export type Credit = {
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

export type Amortization = {
    id: number;
    property_id: number;
    start_date: string;
    end_date: string;
    amount: number;
    category: string;
    created_at: string;
};

export type Category = {
    id: number;
    type: "expense" | "income";
    name: string;
};

export type CashflowRow = {
    month: number;
    income: number;
    expenses: number;
    credit: number;
    cashflow: number;
};

export type AnnualSummary = {
    total_rents_received: number;
    total_expenses: number;
    expense_breakdown: Array<{ category: string; total: number }>;
    gross_yield: number | null;
    net_yield: number | null;
    annual_credit: number;
    vacancy_cost: number;
};

declare global {
    interface Window {
        electron?: ElectronApi;
    }
}

export {};
