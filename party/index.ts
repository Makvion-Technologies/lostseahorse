import { routePartykitRequest } from "partyserver";
import type { Env } from "./env";
import { gateOrigin } from "./origin";

export { Matchmaker } from "./matchmaker";
export { Profiles } from "./profiles";
export { RaceRoom } from "./race-room";

/**
 * Worker entry: /parties/<party>/<room> -> the matching Durable Object
 * (main = race rooms, matchmaker, profiles), same paths as hosted PartyKit.
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const routed = await routePartykitRequest(request, env, {
      onBeforeConnect: (req, lobby) =>
        lobby.className === "Profiles" ? new Response("Not here", { status: 404 }) : gateOrigin(req),
      onBeforeRequest: (req) => gateOrigin(req),
    });
    return routed ?? new Response("Not found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;
