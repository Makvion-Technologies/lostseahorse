"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { stripeLink } from "@/lib/env";

export function ShopScreen() {
  const donate = stripeLink();
  return (
    <Card className="mx-auto max-w-lg">
      <p className="font-display text-4xl italic">Buy the lost ones some shrimp.</p>
      <p className="mt-4 text-muted">
        Cosmetics only. Never speed. Support is a quiet current, not a paywall.
      </p>
      <div className="mt-8">
        {donate ? (
          <Button href={donate} external>
            Support
          </Button>
        ) : (
          <p className="text-sm text-muted">
            Set NEXT_PUBLIC_STRIPE_LINK to enable a Payment Link.
          </p>
        )}
      </div>
    </Card>
  );
}
