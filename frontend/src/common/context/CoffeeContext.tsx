/*import { createContext, ReactNode, useContext } from "react";

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


 */
// HINWEIS: Dieser Context wird nicht mehr benötigt, da die History
// jetzt direkt vom Backend über WebSocketContext kommt.

/*export const CoffeeProvider: React.FC<CoffeeProviderProps> = ({ children }) => {
    // Leerer Provider - alle Daten kommen vom WebSocketContext
    const addCoffee = (entry: CoffeeEntry) => {
        console.log("⚠️ CoffeeContext.addCoffee ist deprecated - nutze WebSocketContext.addCoffeeToHistory");
    };

    const clearCoffees = () => {
        console.log("⚠️ CoffeeContext.clearCoffees ist deprecated");
    };

    return (
        <CoffeeContext.Provider value={{ coffees: [], addCoffee, clearCoffees }}>
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

 */