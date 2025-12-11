interface IWebSocketContext {
    send: (msg: string) => void;
    isConnected: boolean;
    isOn: boolean;
    isReady: boolean;
    isBrewing: boolean;
    logs: string[];
    coffeeHistory: ICoffee[];
    statusData: IStatusData | null;
    setIsOn: (v: boolean) => void;
    setIsReady: (v: boolean) => void;
    setIsBrewing: (v: boolean) => void;
    addCoffeeToHistory: (entry: ICoffee) => void;
    requestHistoryUpdate: () => void;
}