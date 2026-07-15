/**
 * LostSeahorse game architecture public API.
 * UI components should import from here or subpaths under @/game/*.
 */

export * from "./types";
export * from "./constants";
export * from "./state";
export * from "./engine";
export * from "./systems";
export * from "./utils";
export * from "./audio";
export {
  WORD_PACKS,
  WORD_PACK_META,
  DEFAULT_WORD_PACK_ID,
  getWordPack,
  getWordPool,
  isWordPackId,
  type WordPackId,
  type WordPack,
  type WordPackMeta,
} from "./data/wordPacks";
export { typingEvents, type TypingEventType } from "./events/TypingEvents";
export { combatRuntime } from "./combat/CombatRuntime";
