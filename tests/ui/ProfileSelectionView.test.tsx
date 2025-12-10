import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type React from "react";

jest.mock("react-i18next", () => ({
    useTranslation: () => ({ t: (key: string) => key, i18n: { language: "en" } }),
}));

import { ProfileSelectionView } from "@/ui/views/ProfileSelectionView";
import type { UserProfile } from "@/ui/types";

describe("ProfileSelectionView", () => {
    const baseProps = {
        loading: false,
        error: null,
        selectedUser: null,
        editingId: null,
        editingValue: "",
        menuOpenId: null,
        showCreateForm: false,
        newUserName: "",
        creating: false,
        onSelect: jest.fn(),
        onDoubleClick: jest.fn(),
        onMenuToggle: jest.fn(),
        onEditStart: jest.fn(),
        onEditChange: jest.fn(),
        onEditSave: jest.fn(),
        onEditCancel: jest.fn(),
        onDeleteClick: jest.fn(),
        onShowCreateForm: jest.fn(),
        onHideCreateForm: jest.fn(),
        onCreateNameChange: jest.fn(),
        onCreatePasswordChange: jest.fn(),
        onCreate: jest.fn(),
    } satisfies Omit<React.ComponentProps<typeof ProfileSelectionView>, "users">;

    const users: UserProfile[] = [
        { id: 1, username: "Alice" },
        { id: 2, username: "Bob" },
    ];

    it("allows selecting a user", async () => {
        const user = userEvent.setup();
        render(<ProfileSelectionView {...baseProps} users={users} />);

        await user.click(screen.getByText("Alice"));
        expect(baseProps.onSelect).toHaveBeenCalledWith(users[0]);
    });
});
