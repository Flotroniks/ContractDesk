import { useTranslation } from "react-i18next";

export function LanguageSwitcher() {
    const { i18n, t } = useTranslation();
    const current = i18n.language?.startsWith("en") ? "en" : "fr";

    const handleChange = (lang: "fr" | "en") => {
        void i18n.changeLanguage(lang);
    };

    return (
        <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-xs shadow-sm">
            <span className="text-slate-500">{t("language.fr")}/{t("language.en")}</span>
            <div className="flex gap-1">
                <button
                    type="button"
                    onClick={() => handleChange("fr")}
                    className={`rounded-full px-2 py-1 font-semibold transition ${
                        current === "fr"
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                >
                    FR
                </button>
                <button
                    type="button"
                    onClick={() => handleChange("en")}
                    className={`rounded-full px-2 py-1 font-semibold transition ${
                        current === "en"
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                >
                    EN
                </button>
            </div>
        </div>
    );
}
