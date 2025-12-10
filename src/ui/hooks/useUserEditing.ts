/* eslint-disable jsdoc/require-jsdoc, jsdoc/require-param, jsdoc/require-param-type, jsdoc/require-returns, jsdoc/require-returns-type, jsdoc/check-tag-names */
import { useState } from "react";
import type { UserProfile } from "../types";

/**
 * Manage UI-only editing state for user rows (selection, menus, inline rename).
 */
export function useUserEditing() {
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
    const [menuOpenId, setMenuOpenId] = useState<number | null>(null);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editingValue, setEditingValue] = useState<string>("");

    /**
     * Select a user and close any contextual menu.
     */
    function handleSelect(user: UserProfile) {
        setSelectedUser(user);
        setMenuOpenId(null);
    }

    /**
     * Enter edit mode for a user, seeding the current username.
     */
    function startEdit(user: UserProfile) {
        setEditingId(user.id);
        setEditingValue(user.username);
        setMenuOpenId(null);
    }

    /**
     * Exit edit mode and clear draft value.
     */
    function cancelEdit() {
        setEditingId(null);
        setEditingValue("");
    }

    /**
     * Toggle the action menu for a given user row.
     */
    function toggleMenu(userId: number) {
        setMenuOpenId(menuOpenId === userId ? null : userId);
    }

    return {
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
    };
}
