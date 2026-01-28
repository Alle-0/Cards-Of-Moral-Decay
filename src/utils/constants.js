export const PLAYER_AVATARS = [
    "felix", "scooter", "fluffy", "shadow", "buster", "patch", "socks", "tiger",
    "pixel", "gizmo", "lucky", "muffin", "peanut", "oreo", "simba", "nalas",
    "lola", "coco", "luna", "bella", "daisy", "lucy", "bailey", "charlie",
    "max", "rocky", "buddy", "jack", "toby", "bear", "duke", "teddy",
    "ziggy", "zeus", "thor", "loki", "odin", "freya", "hera", "athena",
    "apollo", "artemis", "ares", "hades", "poseidon", "hercules", "achilles",
    "merlin", "arthur", "lancelot", "galahad", "gawain", "robin", "marian",
    "sherlock", "watson", "moriarty", "holmes", "dracula", "frankenstein",
    "wolfman", "mummy", "phantom", "jekyll", "hyde", "zorro", "tarzan",
    "gandalf", "frodo", "sam", "merry", "pippin", "aragorn", "legolas",
    "gimli", "boromir", "faramir", "eowyn", "galadriel", "elrond", "arwen",
    "bilbo", "thorin", "balin", "dwalin", "kili", "fili", "smaug"
];

export const MYSTERY_AVATAR = '###RANDOM###';

export const PLAYER_COLORS = [
    "#ffd36a",
    "#6ad3ff",
    "#9cff6a",
    "#ff6ad3",
    "#d36aff",
    "#ff9c6a",
    "#6affb1",
    "#ffaa6a",
    "#7dd3fc",
    "#fca5a5",
    "#a78bfa",
    "#fbbf24",
    "#34d399",
    "#60a5fa",
    "#f472b6",
    "#f59e0b",
    "#fb923c",
    "#a3e635",
    "#22d3ee",
    "#c084fc",
    "#f87171",
    "#fde047",
    "#4ade80",
    "#38bdf8"
];

export function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

export function pickColor(used = new Set()) {
    for (const c of PLAYER_COLORS) if (!used.has(c)) return c;
    return PLAYER_COLORS[Math.floor(Math.random() * PLAYER_COLORS.length)];
}
