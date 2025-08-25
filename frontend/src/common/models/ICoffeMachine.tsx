export interface ICoffeMachine {
    isOn: boolean;
    hasEnoughWater: boolean;
    binIsNotFull: boolean;
    temperature: number;
    waterFlow: number;
    currentState: string;
}