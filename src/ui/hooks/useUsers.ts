import { useState, useEffect, useMemo, useCallback } from "react";
import type { UserProfile, ElectronApi } from "../types";

export function useUsers() {
    const electronApi = useMemo<ElectronApi | null>(
        () => (typeof window !== "undefined" ? (window as any).electron : null),
        []
    );

    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [creating, setCreating] = useState<boolean>(false);

    const loadUsers = useCallback(async () => {
        if (!electronApi) return;
        setLoading(true);
        setError(null);
        try {
            const list = await electronApi.listUsers();
            setUsers(list);
        } catch (err: unknown) {
            console.error(err);
            setError("Impossible de récupérer les profils locaux.");
        } finally {
            setLoading(false);
        }
    }, [electronApi]);

    useEffect(() => {
        if (!electronApi) {
            setLoading(false);
            return;
        }
        void loadUsers();
    }, [electronApi, loadUsers]);

    async function createUser(username: string, password: string = ''): Promise<UserProfile | null> {
        if (!electronApi) return null;
        const trimmed = username.trim();
        if (!trimmed) {
            setError("Donne un nom au profil.");
            return null;
        }
        setCreating(true);
        setError(null);
        try {
            const created = await electronApi.createUser(trimmed, password);
            setUsers(prev => [...prev, created]);
            return created;
        } catch (err: unknown) {
            console.error(err);
            const errorObj = err as { message?: string };
            if (errorObj?.message === "user_already_exists") {
                setError("Ce nom est déjà utilisé.");
            } else {
                setError("Création impossible pour le moment.");
            }
            return null;
        } finally {
            setCreating(false);
        }
    }

    async function updateUser(id: number, username: string): Promise<UserProfile | null> {
        if (!electronApi) return null;
        const trimmed = username.trim();
        if (!trimmed) {
            setError("Le nom ne peut pas être vide.");
            return null;
        }
        try {
            const updated = await electronApi.updateUser(id, trimmed);
            setUsers(prev => prev.map(user => (user.id === id ? updated : user)));
            return updated;
        } catch (err: unknown) {
            console.error(err);
            const errorObj = err as { message?: string };
            if (errorObj?.message === "user_already_exists") {
                setError("Ce nom est déjà utilisé.");
            } else {
                setError("Impossible de renommer ce profil.");
            }
            return null;
        }
    }

    async function deleteUser(id: number, password: string = ''): Promise<{ propertiesDeleted: number } | null> {
        if (!electronApi) return null;
        try {
            const result = await electronApi.deleteUser(id, password);
            setUsers(prev => prev.filter(user => user.id !== id));
            return result;
        } catch (err: unknown) {
            console.error(err);
            const errorObj = err as { message?: string };
            if (errorObj?.message === "password_invalid") {
                setError("Le mot de passe est incorrect.");
            } else {
                setError("Impossible de supprimer ce profil.");
            }
            throw err;
        }
    }

    function clearError() {
        setError(null);
    }

    return {
        electronApi,
        users,
        loading,
        error,
        creating,
        createUser,
        updateUser,
        deleteUser,
        clearError,
        refreshUsers: loadUsers,
    };
}
