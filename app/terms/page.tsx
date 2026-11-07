import type { Metadata } from "next";
import { LegalList, LegalPage, LegalSection, MAIL } from "@/components/site/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "The rules for playing lost seahorse.",
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Use"
      updated="7 November 2026"
      intro={
        <p>
          These terms cover your use of lost seahorse, a typing race game operated by Makvion Technologies, Pune, Maharashtra,
          India (&ldquo;we&rdquo;, &ldquo;us&rdquo;). By using the site you agree to them. If you do not agree, please do not use it.
        </p>
      }
    >
      <LegalSection id="age" title="Who can play">
        <p>You must be at least 13 years old. If you are under 18, use the site with a parent or guardian&apos;s permission.</p>
      </LegalSection>

      <LegalSection id="names" title="Racer names">
        <LegalList
          items={[
            "Names are 3 to 16 characters: letters, numbers, _ and -, with at least one letter. Each name can be held by one racer only.",
            "You can change your name, with limits to prevent abuse (a short wait between changes and a daily cap). Your stats and leaderboard place stay with you.",
            "Names must not be offensive, hateful, sexual, impersonate someone, or include personal details such as phone numbers.",
            "We may block, reset or remove any name that breaks these rules, without notice.",
          ]}
        />
      </LegalSection>

      <LegalSection id="conduct" title="Fair play">
        <LegalList
          items={[
            "Type the passages yourself. No bots, scripts, macros, auto-typers or tampering with the game or its servers.",
            "Do not spam matchmaking, flood rooms, or try to break or overload the service.",
            "Results that look implausible may be flagged and left off the leaderboard. We may remove cheated results, reset stats or block a profile.",
          ]}
        />
      </LegalSection>

      <LegalSection id="donations" title="Donations">
        <p>
          The game is free. Donations are voluntary support, not a purchase: they do not unlock anything and are
          non-refundable, except where the law requires otherwise. Payments are handled by Stripe.
        </p>
      </LegalSection>

      <LegalSection id="content" title="Your passages">
        <p>Text you add for practice stays in your browser. You are responsible for having the right to use it.</p>
      </LegalSection>

      <LegalSection id="asis" title="Availability">
        <p>
          The site is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo;. We may change, pause or end any part of it,
          including leaderboards and stats, at any time. We do not promise it will always be online or free of bugs.
        </p>
      </LegalSection>

      <LegalSection id="liability" title="Limitation of liability">
        <p>
          To the extent the law allows, Makvion Technologies is not liable for any indirect or consequential loss, or loss of
          data or stats, from using the site. Our total liability for any claim is limited to the amount, if any, you donated
          in the previous 12 months.
        </p>
      </LegalSection>

      <LegalSection id="law" title="Governing law">
        <p>These terms are governed by the laws of India. Any dispute is subject to the exclusive jurisdiction of the courts in Pune, Maharashtra.</p>
      </LegalSection>

      <LegalSection id="changes" title="Changes">
        <p>We may update these terms. The date above shows the latest version; continuing to play after a change means you accept it.</p>
      </LegalSection>

      <LegalSection id="contact" title="Contact">
        <p>Makvion Technologies, Pune, Maharashtra, India. Email {MAIL}.</p>
      </LegalSection>
    </LegalPage>
  );
}
