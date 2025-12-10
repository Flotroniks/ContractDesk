import { render, screen } from "@testing-library/react";

jest.mock("react-i18next", () => ({
    useTranslation: () => ({ t: (key: string) => key }),
}));

import { ElectronUnavailableView } from "@/ui/views/ElectronUnavailableView";

describe("ElectronUnavailableView", () => {
    it("renders the fallback messaging", () => {
        render(<ElectronUnavailableView />);

        expect(screen.getByText("electronUnavailable.title")).toBeInTheDocument();
        expect(screen.getByText("electronUnavailable.description")).toBeInTheDocument();
    });
});
