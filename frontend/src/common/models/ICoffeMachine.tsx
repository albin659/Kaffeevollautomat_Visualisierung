export interface ICoffeMachine {
    isOn: boolean;
    hasEnoughWater: boolean;
    binIsNotFull: boolean;
    temperature: number;
    waterFlow: string;
    currentState: string;
}