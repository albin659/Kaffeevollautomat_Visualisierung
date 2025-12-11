interface IStatusData {
    temperature: number;
    water_ok: boolean;
    grounds_ok: boolean;
    water_flow: number;
    current_date: string;
    current_step: string;
    powered_on: boolean;
    cups_since_empty: number;
    cups_since_filled: number;
    last_updated: string;
}