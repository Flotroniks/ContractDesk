import { useTranslation } from "react-i18next";
import type { UserProfile } from "../types";
import { buildAvatar } from "../utils/avatar";

type ProfileCardProps = {
    user: UserProfile;
    isActive: boolean;
    isEditing: boolean;
    editValue: string;
    onSelect: () => void;
    onDoubleClick: () => void;
    onMenuToggle: () => void;
    onEditStart: () => void;
    onEditChange: (value: string) => void;
    onEditSave: () => void;
    onEditCancel: () => void;
    onDeleteClick: () => void;
    showMenu: boolean;
};

export function ProfileCard({
    user,
    isActive,
    isEditing,
    editValue,
    onSelect,
    onDoubleClick,
    onMenuToggle,
    onEditStart,
    onEditChange,
    onEditSave,
    onEditCancel,
    onDeleteClick,
    showMenu,
}: ProfileCardProps) {
    const avatar = buildAvatar(user.username);
    const { t, i18n } = useTranslation();

    return (
        <article
            role="button"
            tabIndex={0}
            aria-pressed={isActive}
            onClick={() => {
                if (showMenu) return;
                onSelect();
            }}
            onDoubleClick={(e) => {
                e.preventDefault();
                if (!showMenu) onDoubleClick();
            }}
            onContextMenu={(e) => {
                e.preventDefault();
                onMenuToggle();
            }}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    if (!showMenu) onSelect();
                }
            }}
            className={`group relative h-60 w-60 cursor-pointer overflow-visible rounded-2xl border text-left transition-all duration-300 bg-gradient-to-b from-white to-slate-50 hover:-translate-y-1 hover:shadow-2xl ${
                isActive
                    ? "border-blue-500 ring-4 ring-blue-100 shadow-xl"
                    : "border-slate-200 shadow-sm hover:border-blue-200"
            }`}
        >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.08),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(56,189,248,0.08),transparent_40%)]" />
            <div className="absolute right-4 top-4 flex items-center gap-2 text-xs text-slate-500">
                {isActive && (
                    <span className="rounded-full bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-700 shadow-sm">
                        {t("profileSelection.card.active", "Actif")}
                    </span>
                )}
                {showMenu && (
                    <div className="relative">
                        <div
                            className="absolute right-0 mt-2 w-36 rounded-xl border border-slate-200 bg-white shadow-lg z-30"
                            onClick={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                        >
                            <button
                                type="button"
                                className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEditStart();
                                }}
                                onMouseDown={(e) => e.stopPropagation()}
                            >
                                {t("profileSelection.card.rename")}
                            </button>
                            <button
                                type="button"
                                className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteClick();
                                }}
                                onMouseDown={(e) => e.stopPropagation()}
                            >
                                {t("profileSelection.card.delete")}
                            </button>
                        </div>
                    </div>
                )}
            </div>
            <div className="relative flex h-full flex-col items-center justify-center gap-3 px-4">
                <div
                    className="w-20 h-20 rounded-2xl grid place-items-center text-3xl font-semibold text-white shadow-inner shadow-blue-200/60 ring-4 ring-white ring-offset-2 ring-offset-slate-50"
                    style={{ background: avatar.color }}
                >
                    <span>{avatar.initials}</span>
                </div>
                {isEditing ? (
                    <div className="w-full px-6">
                        <input
                            autoFocus
                            value={editValue}
                            onChange={(e) => onEditChange(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                        />
                        <div className="mt-2 flex gap-2 justify-end">
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEditSave();
                                }}
                                onMouseDown={(e) => e.stopPropagation()}
                                className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700"
                            >
                                Enregistrer
                            </button>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEditCancel();
                                }}
                                onMouseDown={(e) => e.stopPropagation()}
                                className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                            >
                                Annuler
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="text-lg font-semibold text-slate-900">{user.username}</div>
                        <div className="flex flex-col items-center">
                            <span className="text-xs text-slate-500">{t("profileSelection.card.localLabel")}</span>
                            <div className="text-xs text-slate-500">
                                {t("profileSelection.card.since", {
                                    date: new Date(user.createdAt).toLocaleDateString(i18n.language),
                                })}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </article>
    );
}
