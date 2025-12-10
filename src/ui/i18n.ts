import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import frTranslation from "./locales/fr.json";
import enTranslation from "./locales/en.json";

const resources = {
    fr: { translation: frTranslation },
    en: { translation: enTranslation },
};

i18n.use(initReactI18next).init({
    resources,
    lng: "fr",
    fallbackLng: "en",
    interpolation: {
        escapeValue: false,
    },
});

export default i18n;
