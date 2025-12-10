import { useState } from "react";
import type { UserProfile } from "../types";

export function useUserEditing() {
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
    const [menuOpenId, setMenuOpenId] = useState<number | null>(null);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editingValue, setEditingValue] = useState<string>("");

    function handleSelect(user: UserProfile) {
        setSelectedUser(user);
        setMenuOpenId(null);
    }

    function startEdit(user: UserProfile) {
        setEditingId(user.id);
        setEditingValue(user.username);
        setMenuOpenId(null);
    }

    function cancelEdit() {
        setEditingId(null);
        setEditingValue("");
    }

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
