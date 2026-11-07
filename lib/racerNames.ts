/** Names used by server-run racers. Reserved so no human profile can take one. */
export const BOT_NAMES = [
  "Mara", "Jonah", "Sable", "Wren", "Theo", "Ines", "Cole", "Nia",
  "Ellis", "Priya", "Omar", "June", "Felix", "Hana", "Rhys", "Ada",
  "Nico", "Leila", "Quinn", "Yasmin", "Hugo", "Freya", "Amir", "Cleo",
  "Silas", "Noor", "Pavel", "Iris", "Mateo", "Sage", "Anika", "Lars",
  "Vera", "Kian", "Dalia", "Owen", "Mina", "Reza", "Tess", "Yuki",
  "Camille", "Arlo", "Soren", "Bea", "Malik", "Imani", "Luca", "Petra",
  "Devi", "Callum", "Aisha", "Niels", "Rosa", "Kenji", "Esme", "Farid",
  "Lila", "Tomas", "Gita", "Eoin", "Nadia", "Haruki", "Saoirse", "Wynn",
] as const;

const BOT_KEYS = new Set<string>(BOT_NAMES.map((n) => n.toLowerCase()));
export function isBotName(name: string): boolean {
  return BOT_KEYS.has(name.trim().toLowerCase());
}

const ADJ = [
  "Swift", "Quiet", "Brave", "Lucky", "Sunny", "Bold", "Calm", "Clever", "Rapid", "Bright",
  "Nimble", "Steady", "Cosmic", "Silver", "Coral", "Misty", "Salty", "Zippy", "Gentle", "Wild",
];
const NOUN = [
  "Otter", "Seal", "Marlin", "Tuna", "Orca", "Squid", "Pelican", "Puffin", "Manta", "Turtle",
  "Dolphin", "Kelp", "Wave", "Reef", "Gull", "Crab", "Narwhal", "Shark", "Tide", "Comet",
];

/** A clean two-word suggestion like "SwiftOtter" (always 3-16 chars). */
export function suggestName(rand: () => number = Math.random): string {
  const a = ADJ[Math.floor(rand() * ADJ.length)];
  const b = NOUN[Math.floor(rand() * NOUN.length)];
  return rand() < 0.3 ? `${a}${b}${Math.floor(rand() * 90) + 10}`.slice(0, 16) : `${a}${b}`;
}
