import React, { createContext, ReactNode, useContext, useState } from 'react';
import { texts } from '../data/texts';

type Language = 'de' | 'en';

interface LanguageProps {
    language: Language,
    setLanguage: (value: Language) => void,
    translate(value: string): string,
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

    const translate = (value: string): string => {
        if (language === 'de') return value;

        const text = texts[language][value as keyof typeof texts['de']];
        if (typeof text === 'string') {
            return text;
        }

        const deStates = texts['de'].state;
        const enStates = texts['en'].state;

        for (const key in deStates) {
            if (deStates[key as keyof typeof deStates] === value) {
                return enStates[key as keyof typeof enStates];
            }
        }

        return value;
    };

    return (
        <LanguageContext.Provider value={{ setLanguage, translate, language, texts: texts[language] }}>
            {children}
        </LanguageContext.Provider>
    )
}