import React, { createContext, useContext, useState } from "react";

export type Lang = "tc" | "en";

interface LanguageContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (tc: string, en: string) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: "tc",
  setLang: () => {},
  t: (tc) => tc,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>("tc");
  const t = (tc: string, en: string) => (lang === "tc" ? tc : en);
  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}
