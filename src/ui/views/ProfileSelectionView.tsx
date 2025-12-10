/* eslint-disable jsdoc/require-jsdoc, jsdoc/require-param, jsdoc/require-param-type, jsdoc/require-returns, jsdoc/require-returns-type, jsdoc/check-tag-names */
import { useTranslation } from "react-i18next";
import type { UserProfile } from "../types";
import { ProfileCard } from "../components/ProfileCard";
import { CreateProfileCard } from "../components/CreateProfileCard";

type ProfileSelectionViewProps = {
    users: UserProfile[];
    loading: boolean;
    error: string | null;
    selectedUser: UserProfile | null;
    editingId: number | null;
    editingValue: string;
    menuOpenId: number | null;
    showCreateForm: boolean;
    newUserName: string;
    creating: boolean;
    onSelect: (user: UserProfile) => void;
    onDoubleClick: (user: UserProfile) => void;
    onMenuToggle: (userId: number) => void;
    onEditStart: (user: UserProfile) => void;
    onEditChange: (value: string) => void;
    onEditSave: (id: number) => void;
    onEditCancel: () => void;
    onDeleteClick: (user: UserProfile) => void;
    onShowCreateForm: () => void;
    onHideCreateForm: () => void;
    onCreateNameChange: (name: string) => void;
    onCreatePasswordChange: (password: string) => void;
    onCreate: () => void;
};

/**
 * Landing view listing local profiles with creation, selection, and inline rename actions.
 */
export function ProfileSelectionView({
    users,
    loading,
    error,
    selectedUser,
    editingId,
    editingValue,
    menuOpenId,
    showCreateForm,
    newUserName,
    creating,
    onSelect,
    onDoubleClick,
    onMenuToggle,
    onEditStart,
    onEditChange,
    onEditSave,
    onEditCancel,
    onDeleteClick,
    onShowCreateForm,
    onHideCreateForm,
    onCreateNameChange,
    onCreatePasswordChange,
    onCreate,
}: ProfileSelectionViewProps) {
    const { t } = useTranslation();

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            <div className="max-w-5xl mx-auto px-6 py-10 space-y-8 flex flex-col items-center">
                <div className="w-full">
                    <div className="text-sm text-slate-500">{t("profileSelection.sectionLabel")}</div>
                    <div className="text-3xl font-semibold">{t("profileSelection.title")}</div>
                    <p className="text-slate-600 text-sm mt-1">{t("profileSelection.subtitle")}</p>
                </div>

                {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 w-full">{error}</div>
                )}

                <div className="flex flex-wrap gap-8 justify-center w-full">
                    {loading &&
                        Array.from({ length: 3 }).map((_, index) => (
                            <div
                                key={index}
                                className="h-48 w-64 rounded-2xl border border-slate-200 bg-white shadow-sm animate-pulse"
                            />
                        ))}

                    {!loading &&
                        users.map((user) => (
                            <ProfileCard
                                key={user.id}
                                user={user}
                                isActive={selectedUser?.id === user.id}
                                isEditing={editingId === user.id}
                                editValue={editingValue}
                                onSelect={() => onSelect(user)}
                                onDoubleClick={() => onDoubleClick(user)}
                                onMenuToggle={() => onMenuToggle(user.id)}
                                onEditStart={() => onEditStart(user)}
                                onEditChange={onEditChange}
                                onEditSave={() => onEditSave(user.id)}
                                onEditCancel={onEditCancel}
                                onDeleteClick={() => onDeleteClick(user)}
                                showMenu={menuOpenId === user.id}
                            />
                        ))}

                    {!loading && (
                        <CreateProfileCard
                            showForm={showCreateForm}
                            newUserName={newUserName}
                            creating={creating}
                            onShowForm={onShowCreateForm}
                            onHideForm={onHideCreateForm}
                            onNameChange={onCreateNameChange}
                            onPasswordChange={onCreatePasswordChange}
                            onCreate={onCreate}
                        />
                    )}
                </div>

                {selectedUser && (
                    <div className="text-center text-sm text-slate-600">
                        {t("profileSelection.activeProfile")} {" "}
                        <span className="font-semibold text-slate-900">{selectedUser.username}</span>
                    </div>
                )}
            </div>
        </div>
    );
}