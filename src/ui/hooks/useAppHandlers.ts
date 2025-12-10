import type { UserProfile, PropertyDraft, Property, TabKey } from "../types";
import { emptyPropertyDraft } from "../constants/propertyTypes";

type UseAppHandlersProps = {
    createUser: (username: string) => Promise<UserProfile | null>;
    updateUser: (id: number, username: string) => Promise<UserProfile | null>;
    createProperty: (draft: PropertyDraft) => Promise<Property | null>;
    updateProperty: (id: number, draft: PropertyDraft & { status: string }) => Promise<Property | null>;
    setShowCreateForm: (show: boolean) => void;
    setNewUserName: (name: string) => void;
    setSelectedUser: (user: UserProfile | null) => void;
    setEnteredUser: (user: UserProfile | null) => void;
    setActiveTab: (tab: TabKey) => void;
    setPropertyForm: (form: PropertyDraft) => void;
    cancelEdit: () => void;
    cancelEditProperty: () => void;
    resetEditing: () => void;
    selectedUser: UserProfile | null;
    enteredUser: UserProfile | null;
    editingValue: string;
};

export function useAppHandlers({
    createUser,
    updateUser,
    createProperty,
    updateProperty,
    setShowCreateForm,
    setNewUserName,
    setSelectedUser,
    setEnteredUser,
    setActiveTab,
    setPropertyForm,
    cancelEdit,
    cancelEditProperty,
    resetEditing,
    selectedUser,
    enteredUser,
    editingValue,
}: UseAppHandlersProps) {
    async function handleCreateUser(newUserName: string) {
        const created = await createUser(newUserName);
        if (created) {
            setShowCreateForm(false);
            setNewUserName("");
            setSelectedUser(created);
        }
    }

    async function saveEdit(id: number) {
        const updated = await updateUser(id, editingValue);
        if (updated) {
            if (selectedUser?.id === id) setSelectedUser(updated);
            if (enteredUser?.id === id) setEnteredUser(updated);
            cancelEdit();
        }
    }

    function enterUserProfile(user: UserProfile) {
        setEnteredUser(user);
        setSelectedUser(user);
        setActiveTab("properties");
        resetEditing();
    }

    async function handleCreateProperty(propertyForm: PropertyDraft) {
        const created = await createProperty(propertyForm);
        if (created) setPropertyForm(emptyPropertyDraft);
    }

    async function savePropertyEdit(id: number, editPropertyDraft: PropertyDraft & { status: string }) {
        const updated = await updateProperty(id, editPropertyDraft);
        if (updated) cancelEditProperty();
    }

    return {
        handleCreateUser,
        saveEdit,
        enterUserProfile,
        handleCreateProperty,
        savePropertyEdit,
    };
}
