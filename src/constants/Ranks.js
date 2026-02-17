export const RANK_COLORS = {
    // Display Names (Legacy/Compat)
    "Capo supremo": "#ff00ff",
    "Entità Apocalittica": "#ef4444",
    "Eminenza Grigia": "#8b5cf6",
    "Architetto del Caos": "#f97316",
    "Socio del Vizio": "#eab308",
    "Corrotto": "#22c55e",
    "Innocente": "#3b82f6",
    "Anima Candida": "#94a3b8",

    // Internal Keys (New Standard)
    "rank_capo_supremo": "#ff00ff",
    "rank_entita_apocalittica": "#ef4444",
    "rank_eminenza_grigia": "#8b5cf6",
    "rank_architetto_del_caos": "#f97316",
    "rank_socio_del_vizio": "#eab308",
    "rank_corrotto": "#22c55e",
    "rank_innocente": "#3b82f6",
    "rank_anima_candida": "#94a3b8",
    "rank_bot": "#ef4444"
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
