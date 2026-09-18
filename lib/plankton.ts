export function planktonForRace(opts: {
  place: number;
  finished: boolean;
  accuracy: number;
}): number {
  let amount = 0;
  if (opts.place === 1) amount = 3;
  else if (opts.place === 2) amount = 2;
  else if (opts.finished) amount = 1;
  if (opts.accuracy >= 97) amount += 1;
  return amount;
}

export function planktonForPractice(finished: boolean): number {
  return finished ? 1 : 0;
}
