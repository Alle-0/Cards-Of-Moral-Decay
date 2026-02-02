export const RANK_COLORS = {
    "Capo supremo": "#ff00ff", // Magenta for the boss
    "Entità Apocalittica": "#ef4444", // Red
    "Eminenza Grigia": "#8b5cf6", // Purple
    "Architetto del Caos": "#f97316", // Orange
    "Socio del Vizio": "#eab308", // Yellow
    "Corrotto": "#22c55e", // Green
    "Innocente": "#3b82f6", // Blue
    "Anima Candida": "#94a3b8"  // Gray
};

export const RANK_THRESHOLDS = [
    { name: "Anima Candida", min: 0 },
    { name: "Innocente", min: 1000 },
    { name: "Corrotto", min: 2500 },
    { name: "Socio del Vizio", min: 5000 },
    { name: "Architetto del Caos", min: 10000 },
    { name: "Eminenza Grigia", min: 25000 },
    { name: "Entità Apocalittica", min: 50000 }
];
