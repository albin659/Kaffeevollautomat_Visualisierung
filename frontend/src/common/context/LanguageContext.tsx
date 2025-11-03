// src/common/context/LanguageContext.js
import React, { createContext, ReactNode, useContext, useState } from 'react';
import { texts } from './texts';

type Language = 'de' | 'en';

interface LanguageProps {
    language: Language,
    setLanguage: (value: Language) => void,
    texts: typeof texts['de']
}

const LanguageContext = createContext<LanguageProps | undefined>(undefined);

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error("LanguageContext must be used within LanguageProvider")
    }
    return context;
}

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
    const [language, setLanguage] = useState<Language>('de');

    return (
        <LanguageContext.Provider value={{ setLanguage, language, texts: texts[language] }}>
            {children}
        </LanguageContext.Provider>
    )
}