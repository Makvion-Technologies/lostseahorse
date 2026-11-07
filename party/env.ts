import type { Matchmaker } from "./matchmaker";
import type { Profiles } from "./profiles";
import type { RaceRoom } from "./race-room";

/** Durable Object bindings (see wrangler.jsonc). Binding names kebab-case to the URL party: Main -> main. */
export type Env = {
  Main: DurableObjectNamespace<RaceRoom>;
  Matchmaker: DurableObjectNamespace<Matchmaker>;
  Profiles: DurableObjectNamespace<Profiles>;
};
