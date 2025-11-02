import { createContext, ReactNode, useContext, useState, useEffect } from "react";

export interface CoffeeEntry {
    id: number;
    type: string;
    strength: number;
    createdDate: string;
}

interface CoffeeContextType {
    coffees: CoffeeEntry[];
    addCoffee: (entry: CoffeeEntry) => void;
    clearCoffees: () => void;
}

const CoffeeContext = createContext<CoffeeContextType | undefined>(undefined);

interface CoffeeProviderProps {
    children: ReactNode;
}

const STORAGE_KEY = "kaffeemaschine_coffees";

export const CoffeeProvider: React.FC<CoffeeProviderProps> = ({ children }) => {
    // Initialisiere mit Daten aus localStorage
    const [coffees, setCoffees] = useState<CoffeeEntry[]>(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (error) {
            console.error("Fehler beim Laden der Kaffee-Daten:", error);
        }
        return [];
    });

    // Speichere in localStorage bei jeder Änderung
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(coffees));
        } catch (error) {
            console.error("Fehler beim Speichern der Kaffee-Daten:", error);
        }
    }, [coffees]);

    const addCoffee = (entry: CoffeeEntry) => {
        setCoffees((prev) => [...prev, entry]);
        console.log("☕ Kaffee hinzugefügt:", entry);
    };

    const clearCoffees = () => {
        setCoffees([]);
        localStorage.removeItem(STORAGE_KEY);
        console.log("🗑️ Alle Kaffee-Daten gelöscht");
    };

    return (
        <CoffeeContext.Provider value={{ coffees, addCoffee, clearCoffees }}>
            {children}
        </CoffeeContext.Provider>
    );
};

export const useCoffeeContext = (): CoffeeContextType => {
    const context = useContext(CoffeeContext);
    if (!context) {
        throw new Error("CoffeeContext muss innerhalb des CoffeeProvider verwendet werden");
    }
    return context;
};