process.env.CONTRACTDESK_DB_PATH = ":memory:";

import {
    createUser,
    createProperty,
    listProperties,
    createExpense,
    listExpensesByProperty,
    createIncome,
    listIncomesByProperty,
    resetDbForTests,
    listCategories,
    upsertCategory,
} from "@/electron/db/database";

describe("SQLite repository", () => {
    beforeEach(() => {
        resetDbForTests();
    });

    afterAll(() => {
        resetDbForTests();
    });

    it("creates users and properties in-memory", () => {
        const user = createUser("alice", "secret");
        const property = createProperty({ userId: user.id, name: "Loft", surface: 80 });
        const properties = listProperties(user.id);

        expect(properties).toHaveLength(1);
        expect(properties[0].name).toBe(property.name);
    });

    it("stores expenses and incomes per property and year", () => {
        const user = createUser("bob", "secret");
        const property = createProperty({ userId: user.id, name: "Flat" });

        createExpense({ property_id: property.id, date: "2024-03-10", category: "maintenance", amount: 120 });
        createExpense({ property_id: property.id, date: "2025-01-05", category: "tax", amount: 300 });
        createIncome({ property_id: property.id, date: "2025-01-08", amount: 900 });

        const expenses2025 = listExpensesByProperty(property.id, 2025);
        const incomes2025 = listIncomesByProperty(property.id, 2025);

        expect(expenses2025).toHaveLength(1);
        expect(expenses2025[0].category).toBe("tax");
        expect(incomes2025).toHaveLength(1);
        expect(incomes2025[0].amount).toBe(900);
    });

    it("upserts and lists categories", () => {
        const user = createUser("carol", "secret");
        const property = createProperty({ userId: user.id, name: "House" });
        void property; // silences unused variable

        const category = upsertCategory("expense", "insurance");
        const categories = listCategories("expense");

        expect(category.name).toBe("insurance");
        expect(categories.map((c) => c.name)).toContain("insurance");
    });
});
