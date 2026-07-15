/**
 * Shared app types — re-exports game domain types for convenience.
 * Prefer importing mode definitions from @/game/constants.
 */

export type { GameModeId as GameMode } from "@/game/constants/modes";
export type { ModeDefinition as GameModeOption } from "@/game/constants/modes";
export { GAME_MODES, getModeById, DEFAULT_MODE_ID } from "@/game/constants/modes";

export { GameStatus, GAME_STATUS_FLOW } from "@/game/types/GameStatus";
export type { Word } from "@/game/types/Word";
export { GameEventType } from "@/game/types/GameEvent";
export type { GameResults } from "@/game/types/Results";
