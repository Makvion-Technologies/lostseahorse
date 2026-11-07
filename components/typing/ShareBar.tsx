"use client";

import { Button } from "@/components/ui/Button";
import {
  ogImageUrl,
  tweetIntentUrl,
  type SharePayload,
} from "@/lib/share";

export function ShareBar({ payload }: { payload: SharePayload }) {
  const intent = tweetIntentUrl(payload);
  const image = ogImageUrl(payload);

  const nativeShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "lost seahorse",
          text: `${payload.wpm} WPM on lostseahorse.com`,
          url: image,
        });
      } catch {
        window.open(intent, "_blank", "noopener,noreferrer");
      }
      return;
    }
    window.open(intent, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="grid items-center gap-4 sm:grid-cols-[minmax(0,20rem)_1fr]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image}
        alt="Share card"
        width={320}
        height={168}
        className="aspect-[1200/630] w-full rounded-2xl border border-line object-cover"
      />
      <div className="flex flex-col gap-2 xs:flex-row sm:flex-col sm:items-start">
        <Button className="min-h-11" onClick={nativeShare}>
          Share on X
        </Button>
        <Button href={intent} external variant="ghost" className="min-h-11">
          Open intent
        </Button>
      </div>
    </div>
  );
}
