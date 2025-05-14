
import es from "./i18n-es";
import en from "./i18n-en";

const translations = { es, en };

export type TranslationKey = keyof typeof es;

export function t(key: TranslationKey, lang: "es" | "en", vars?: Record<string, any>) {
  let str = translations[lang][key] || key;
  if (vars) {
    Object.keys(vars).forEach(v => {
      str = str.replace(`{${v}}`, vars[v]);
    });
  }
  return str;
}
