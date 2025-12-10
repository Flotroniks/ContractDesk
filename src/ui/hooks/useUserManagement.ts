/* eslint-disable jsdoc/require-jsdoc, jsdoc/require-param, jsdoc/require-param-type, jsdoc/require-returns, jsdoc/require-returns-type, jsdoc/check-tag-names */
import { useState } from "react";
import type { UserProfile } from "../types";
import { useUsers } from "./useUsers";
import { useUserEditing } from "./useUserEditing";

/**
 * High-level orchestrator for profile creation/selection/editing flows.
 */
export function useUserManagement() {
    const { electronApi, users, loading, error, creating, createUser, updateUser, deleteUser, clearError } = useUsers();
    const [newUserName, setNewUserName] = useState("");
    const [newUserPassword, setNewUserPassword] = useState("");
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [enteredUser, setEnteredUser] = useState<UserProfile | null>(null);

    const {
        selectedUser,
        setSelectedUser,
        menuOpenId,
        editingId,
        editingValue,
        setEditingValue,
        handleSelect,
        startEdit,
        cancelEdit,
        toggleMenu,
    } = useUserEditing();

    /**
     * Create a profile from local state and move selection to it.
     */
    async function handleCreateUser() {
        const created = await createUser(newUserName, newUserPassword);
        if (created) {
            setShowCreateForm(false);
            setNewUserName("");
            setNewUserPassword("");
            setSelectedUser(created);
        }
        return created;
    }

    /**
     * Persist a username edit and resync selected/entered users.
     */
    async function handleSaveEdit(id: number) {
        const updated = await updateUser(id, editingValue);
        if (updated) {
            if (selectedUser?.id === id) setSelectedUser(updated);
            if (enteredUser?.id === id) setEnteredUser(updated);
            cancelEdit();
        }
        return updated;
    }

    /**
     * Switch the active/entered profile, used by UI navigation.
     */
    function handleEnterUserProfile(user: UserProfile | null) {
        setEnteredUser(user);
        setSelectedUser(user);
    }

    function handleShowCreateForm() {
        clearError();
        setShowCreateForm(true);
    }

    function handleHideCreateForm() {
        setShowCreateForm(false);
        setNewUserName("");
        setNewUserPassword("");
    }

    /**
     * Delete a profile then clear selection if it was active.
     */
    async function handleDeleteUser(id: number, password: string) {
        const result = await deleteUser(id, password);
        if (result) {
            if (enteredUser?.id === id) {
                setEnteredUser(null);
                setSelectedUser(null);
            }
            if (selectedUser?.id === id) {
                setSelectedUser(null);
            }
        }
        return result;
    }

    return {
        electronApi,
        users,
        loading,
        error,
        creating,
        selectedUser,
        menuOpenId,
        editingId,
        editingValue,
        newUserName,
        showCreateForm,
        enteredUser,
        setEditingValue,
        setNewUserName,
        setNewUserPassword,
        handleSelect,
        startEdit,
        cancelEdit,
        toggleMenu,
        handleCreateUser,
        handleSaveEdit,
        handleDeleteUser,
        handleEnterUserProfile,
        handleShowCreateForm,
        handleHideCreateForm,
    };
}
