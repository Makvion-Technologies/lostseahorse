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
    <div className="flex flex-wrap items-center gap-3">
      <Button onClick={nativeShare}>Share on X</Button>
      <Button href={intent} external variant="ghost">
        Open intent
      </Button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image}
        alt="Share card"
        width={320}
        height={168}
        className="mt-4 w-full max-w-sm rounded-2xl border border-line"
      />
    </div>
  );
}
