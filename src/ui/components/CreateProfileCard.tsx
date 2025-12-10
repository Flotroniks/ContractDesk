import { useState } from "react";
/* eslint-disable jsdoc/require-jsdoc, jsdoc/require-param, jsdoc/require-param-type, jsdoc/require-returns, jsdoc/require-returns-type, jsdoc/check-tag-names */
import { useTranslation } from "react-i18next";

type CreateProfileCardProps = {
    showForm: boolean;
    newUserName: string;
    creating: boolean;
    onShowForm: () => void;
    onHideForm: () => void;
    onNameChange: (name: string) => void;
    onPasswordChange: (password: string) => void;
    onCreate: () => void;
};

/**
 * Card that toggles between a CTA and a profile creation form with password validation.
 */
export function CreateProfileCard({
    showForm,
    newUserName,
    creating,
    onShowForm,
    onHideForm,
    onNameChange,
    onPasswordChange,
    onCreate,
}: CreateProfileCardProps) {
    const { t } = useTranslation();
    const [newUserPassword, setNewUserPassword] = useState("");
    const [passwordError, setPasswordError] = useState("");

    const isPasswordValid = newUserPassword.length >= 6;

    function handleCreateClick() {
        setPasswordError("");
        if (!newUserPassword.trim()) {
            setPasswordError(t("profileSelection.create.passwordRequired"));
            return;
        }
        if (newUserPassword.length < 6) {
            setPasswordError(t("profileSelection.create.passwordTooShort"));
            return;
        }
        onPasswordChange(newUserPassword);
        onCreate();
        setNewUserPassword("");
    }

    function handleHideForm() {
        setNewUserPassword("");
        setPasswordError("");
        onHideForm();
    }

    return (
        <div className="w-60">
            <div className="h-60 rounded-2xl border border-dashed border-slate-300 bg-white/70 shadow-inner flex items-center justify-center px-5 py-6">
            {showForm ? (
                <div className="w-full max-w-sm space-y-3">
                    <div className="text-center text-sm font-medium text-slate-700">{t("profileSelection.create.title")}</div>
                    <input
                        value={newUserName}
                        onChange={(e) => onNameChange(e.target.value)}
                        placeholder={t("profileSelection.create.placeholder")}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                    <div>
                        <input
                            type="password"
                            value={newUserPassword}
                            onChange={(e) => {
                                setNewUserPassword(e.target.value);
                                setPasswordError("");
                            }}
                            placeholder={t("profileSelection.create.passwordPlaceholder")}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        />
                        <div className="text-xs text-slate-500 mt-1">
                            {t("profileSelection.create.passwordHelper", { min: 6 })}
                        </div>
                    </div>
                    {passwordError && (
                        <div className="text-xs text-red-600">{passwordError}</div>
                    )}
                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={handleCreateClick}
                            disabled={creating || !isPasswordValid}
                            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 active:translate-y-[1px] disabled:opacity-60"
                        >
                            {creating ? t("profileSelection.create.creating") : t("profileSelection.create.create")}
                        </button>
                        <button
                            onClick={handleHideForm}
                            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        >
                            {t("profileSelection.create.cancel")}
                        </button>
                    </div>
                </div>
            ) : (
                <button
                    onClick={onShowForm}
                    className="flex h-full w-full flex-col items-center justify-center gap-3 text-slate-600 hover:text-blue-600"
                >
                    <div className="w-16 h-16 rounded-full border border-dashed border-slate-300 grid place-items-center text-3xl">
                        +
                    </div>
                    <div className="text-base font-semibold">{t("profileSelection.create.addTitle")}</div>
                    <div className="text-xs text-slate-500 max-w-[12rem] text-center">
                        {t("profileSelection.create.helper")}
                    </div>
                </button>
            )}
        </div>
        </div>
    );
}
