import { createContext, ReactNode, useContext, useState } from "react";

interface CoffeeContextType {
    id: number;
    type: string;
    strength: number;
    createdDate: string;
    setId: (id: number) => void;
    setType: (type: string) => void;
    setStrength: (strength: number) => void;
    setCreatedDate: (date: string) => void;
}

const CoffeeContext = createContext<CoffeeContextType | undefined>(undefined);

interface CoffeeProviderProps {
    children: ReactNode;
}

export const CoffeeProvider: React.FC<CoffeeProviderProps> = ({ children }) => {
    const [id, setId] = useState<number>(0);
    const [type, setType] = useState<string>("");
    const [strength, setStrength] = useState<number>(0);
    const [createdDate, setCreatedDate] = useState<string>("");

    return (
        <CoffeeContext.Provider
            value={{
                id,
                type,
                strength,
                createdDate,
                setId,
                setType,
                setStrength,
                setCreatedDate,
            }}
        >
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
