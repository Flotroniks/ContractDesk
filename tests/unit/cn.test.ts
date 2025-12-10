import { cn } from "@/lib/utils";

describe("cn", () => {
    it("merges tailwind classes by last occurrence", () => {
        expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
    });

    it("drops falsy values while keeping truthy ones", () => {
        const hidden = false as boolean;
        expect(cn("btn", undefined, null as unknown as string, hidden && "hidden", "active")).toBe("btn active");
    });
});
