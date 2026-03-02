export const getDateString = (): string => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
};

export const isToday = (dateString: string): boolean => {
    return new Date(dateString).toDateString() === new Date().toDateString();
};

export const formatDateTime = (dateString: string): { date: string; time: string } => {
    const date = new Date(dateString);
    return {
        date: date.toLocaleDateString("de-DE"),
        time: date.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }),
    };
};

export const getWeekData = <T extends { createdDate: string }>(data: T[]): T[] => {
    const today = new Date();
    const diffToMonday = (today.getDay() + 6) % 7;

    const monday = new Date(today);
    monday.setDate(today.getDate() - diffToMonday);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    return data.filter((item) => {
        const d = new Date(item.createdDate);
        return d >= monday && d <= sunday;
    });
};