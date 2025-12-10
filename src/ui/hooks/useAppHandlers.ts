/* eslint-disable jsdoc/require-jsdoc, jsdoc/require-param, jsdoc/require-param-type, jsdoc/require-returns, jsdoc/require-returns-type, jsdoc/check-tag-names */
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

/**
 * Aggregate UI callbacks that fan out to user/property mutations while keeping
 * component code lean.
 */
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
    /**
     * Create a new profile and wire selection state when successful.
     */
    async function handleCreateUser(newUserName: string) {
        const created = await createUser(newUserName);
        if (created) {
            setShowCreateForm(false);
            setNewUserName("");
            setSelectedUser(created);
        }
    }

    /**
     * Persist a username change and refresh selected/entered references.
     */
    async function saveEdit(id: number) {
        const updated = await updateUser(id, editingValue);
        if (updated) {
            if (selectedUser?.id === id) setSelectedUser(updated);
            if (enteredUser?.id === id) setEnteredUser(updated);
            cancelEdit();
        }
    }

    /**
     * Navigate into a profile while resetting any editing state.
     */
    function enterUserProfile(user: UserProfile) {
        setEnteredUser(user);
        setSelectedUser(user);
        setActiveTab("properties");
        resetEditing();
    }

    /**
     * Create a new property and reset the draft when successful.
     */
    async function handleCreateProperty(propertyForm: PropertyDraft) {
        const created = await createProperty(propertyForm);
        if (created) setPropertyForm(emptyPropertyDraft);
    }

    /**
     * Save property edits and exit editing mode after success.
     */
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
