import type { Metadata } from "next";
import { LegalList, LegalPage, LegalSection, MAIL } from "@/components/site/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "What lost seahorse collects, why, and how to have it deleted.",
};

const code = "rounded bg-foam px-1 font-mono text-[0.9em] text-ink";

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="7 November 2026"
      intro={
        <p>
          lost seahorse is a typing race game operated by Makvion Technologies, Pune, Maharashtra, India
          (&ldquo;we&rdquo;, &ldquo;us&rdquo;). We collect as little as the game needs to work. There are no accounts, no
          email sign-up, no passwords, no analytics and no ads.
        </p>
      }
    >
      <LegalSection id="collect" title="What we collect">
        <LegalList
          items={[
            <><b className="text-ink">Racer name.</b> The name you pick (3 to 16 letters, numbers, _ or -). It is shown to other racers and on the public leaderboard.</>,
            <><b className="text-ink">Profile ID.</b> A random ID created in your browser. It links your name and stats to you without any personal details.</>,
            <><b className="text-ink">Race stats.</b> Number of races, best WPM, last WPM, the date your profile was created and the times of your recent name changes (kept for 24 hours to limit rename spam). Race results (WPM, accuracy) are used for the leaderboard.</>,
            <><b className="text-ink">IP address.</b> Read when you look for a Strangers match, only to limit how often one address can join the queue. It is kept in server memory for a short time and is never written to storage.</>,
          ]}
        />
        <p>We do not collect your email, phone number, real name, location or payment details.</p>
      </LegalSection>

      <LegalSection id="why" title="Why we use it">
        <LegalList
          items={[
            "To run races: match you with other players, sync live progress and show results.",
            "To keep your racer name and stats between visits without an account.",
            "To show the public leaderboard.",
            "To prevent abuse: rate limiting, duplicate names and implausible (cheated) results.",
          ]}
        />
        <p>The legal basis is our legitimate interest in providing the game you asked to use, and your consent when you choose a name.</p>
      </LegalSection>

      <LegalSection id="public" title="Public leaderboard">
        <p>
          Your racer name and best WPM can appear on the public leaderboard and are visible to anyone. Pick a name you are happy
          to be public, and avoid using your real full name.
        </p>
      </LegalSection>

      <LegalSection id="storage" title="Cookies and browser storage">
        <p>We use one first-party cookie and some browser storage. All of it is needed for the site to work, so there is no cookie banner. Nothing is used for tracking or advertising.</p>
        <LegalList
          items={[
            <><span className={code}>ls_pid</span> cookie: your profile ID, kept for 5 years so your name survives clearing site data.</>,
            <>localStorage: <span className={code}>lostseahorse.pid</span> and <span className={code}>lostseahorse.profile</span> (profile ID and a cached copy of your profile), <span className={code}>lostseahorse.cid</span> (a random device ID for races), <span className={code}>lostseahorse.save</span> (local progress and unlocks), <span className={code}>lostseahorse.strangers</span> and <span className={code}>lostseahorse.friends</span> (race settings), <span className={code}>lostseahorse.recentUploads</span> (practice passages you added, kept only in your browser) and <span className={code}>lostseahorse.theme</span> (light or dark).</>,
            <>sessionStorage: <span className={code}>lostseahorse.host</span> and <span className={code}>lostseahorse.setup</span>, room settings that are cleared when you close the tab.</>,
          ]}
        />
        <p>You can clear these at any time in your browser settings. Doing so on every device will disconnect you from your racer profile.</p>
      </LegalSection>

      <LegalSection id="third" title="Service providers">
        <LegalList
          items={[
            <><b className="text-ink">PartyKit, running on Cloudflare.</b> Hosts live races and stores profiles (name, ID, stats) and leaderboards. Data may be processed on Cloudflare servers outside India.</>,
            <><b className="text-ink">Stripe.</b> Only if you choose to donate. Payment happens on Stripe&apos;s own page under Stripe&apos;s privacy policy; we never see your card details.</>,
          ]}
        />
        <p>We do not sell or share your data with anyone else. Fonts are served from our own site.</p>
      </LegalSection>

      <LegalSection id="retention" title="How long we keep it">
        <LegalList
          items={[
            "Profiles, stats and leaderboard entries: until you ask us to delete them, or we remove them for breaking the Terms.",
            "IP addresses: only in memory for the matchmaking rate limit, a few minutes at most.",
            "Live race data: only while the room is open.",
            "Browser storage: until you clear it (the cookie expires after 5 years).",
          ]}
        />
      </LegalSection>

      <LegalSection id="rights" title="Your rights">
        <p>
          Under India&apos;s Digital Personal Data Protection Act, 2023 and, where it applies, the EU/UK GDPR, you can ask to
          access, correct or delete your data, withdraw consent, and complain to a data protection authority. To delete your
          profile and leaderboard entries, email {MAIL} with your racer name. We reply within 30 days.
        </p>
      </LegalSection>

      <LegalSection id="children" title="Children">
        <p>The game is meant for people aged 13 and over. If you believe a child under 13 has created a profile, contact us and we will remove it.</p>
      </LegalSection>

      <LegalSection id="changes" title="Changes">
        <p>If we change what we collect, we will update this page and its date. Big changes will be noted on the site.</p>
      </LegalSection>

      <LegalSection id="contact" title="Contact and grievance officer">
        <p>
          Makvion Technologies, Pune, Maharashtra, India. Email {MAIL} for privacy questions, deletion requests or
          grievances.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
