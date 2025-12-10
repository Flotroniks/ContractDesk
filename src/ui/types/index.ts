export type UserProfile = {
    id: number;
    username: string;
    createdAt: string;
};

export type Property = {
    id: number;
    user_id: number;
    name: string;
    address?: string;
    city_id?: number;
    region_id?: number;
    country_id?: number;
    department_id?: number;
    type?: string;
    surface?: number;
    base_rent?: number;
    base_charges?: number;
    purchase_price?: number | null;
    status: string;
    created_at: string;
};

export type TabKey = "dashboard" | "finances" | "properties";

export type ElectronApi = any;

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
