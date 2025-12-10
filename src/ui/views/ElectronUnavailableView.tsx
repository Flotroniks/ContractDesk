/* eslint-disable jsdoc/require-jsdoc, jsdoc/require-param, jsdoc/require-param-type, jsdoc/require-returns, jsdoc/require-returns-type, jsdoc/check-tag-names */
import { useTranslation } from "react-i18next";

/**
 * Fallback view when the renderer runs without the Electron preload bridge.
 */
export function ElectronUnavailableView() {
    const { t } = useTranslation();

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 grid place-items-center px-6">
            <div className="max-w-lg space-y-4 text-center">
                <div className="text-2xl font-semibold">{t("electronUnavailable.title")}</div>
                <p className="text-slate-600 text-sm">{t("electronUnavailable.description")}</p>
            </div>
        </div>
    );
}
