import { createContext, ReactNode, useContext, useState } from "react";

export interface CoffeeEntry {
    id: number;
    type: string;
    strength: number;
    createdDate: string;
}

interface CoffeeContextType {
    coffees: CoffeeEntry[];
    addCoffee: (entry: CoffeeEntry) => void;
}

const CoffeeContext = createContext<CoffeeContextType | undefined>(undefined);

interface CoffeeProviderProps {
    children: ReactNode;
}

export const CoffeeProvider: React.FC<CoffeeProviderProps> = ({ children }) => {
    const [coffees, setCoffees] = useState<CoffeeEntry[]>([]);

    const addCoffee = (entry: CoffeeEntry) => {
        setCoffees((prev) => [...prev, entry]);
    };

    return (
        <CoffeeContext.Provider value={{ coffees, addCoffee }}>
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
