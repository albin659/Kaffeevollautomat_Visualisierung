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
        console.log("translate() called with:", value);
        console.log("Current language:", language);

        // Backend sendet Status auf Englisch
        const enStates = texts['en'].state;
        const currentStates = texts[language].state;

        // DEBUG: Zeige alle verfügbaren States
        console.log("Available en states:", enStates);
        console.log("Available current states:", currentStates);

        for (const key in enStates) {
            const stateKey = key as keyof typeof enStates;
            const enValue = enStates[stateKey];
            console.log(`Checking: ${key} -> en: "${enValue}" vs input: "${value}"`);

            if (enValue === value) {
                const translatedValue = currentStates[stateKey];
                console.log(`✓ Found match: ${key} -> ${translatedValue}`);
                return translatedValue;
            }
        }

        // Normale Übersetzung für andere Texte
        const text = texts[language][value as keyof typeof texts['de']];
        if (typeof text === 'string') {
            console.log("Found in general texts:", text);
            return text;
        }

        console.log("No translation found, returning original:", value);
        return value;
    };

    return (
        <LanguageContext.Provider value={{ setLanguage, translate, language, texts: texts[language] }}>
            {children}
        </LanguageContext.Provider>
    )
}