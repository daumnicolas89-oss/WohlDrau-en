import Link from "next/link";
import { StandaloneRedirect } from "./StandaloneRedirect";

const TESTFLIGHT_URL = "https://testflight.apple.com/join/Ad9Py8Xd";

/**
 * Die Haustür von platzda.app: Sie sieht aus wie der Anfang der App (gleicher
 * Himmel, gleiche Schrift, gleiche Stimme), damit Installieren sich wie
 * Weitermachen anfühlt. Ein einziges Erinnerungs-Bild trägt die Seite: der
 * wandernde Baumschatten – genau das, was die App vorausrechnet.
 */
export function Landing() {
  return (
    <div className="min-h-dvh bg-background text-dark">
      <StandaloneRedirect />

      {/* ---- Kopf: derselbe Himmel wie in der App ---- */}
      <header className="sky-hero relative overflow-hidden px-5 pt-[max(2.5rem,calc(env(safe-area-inset-top)+1.5rem))] pb-14">
        <div className="mx-auto w-full max-w-xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/platzda-logo.png"
            alt="PlatzDa"
            width={720}
            height={209}
            className="h-11 w-auto"
          />

          <h1 className="mt-9 font-display text-[2.1rem] leading-[1.12] font-bold text-balance sm:text-5xl">
            Wo ist es mit Kind jetzt schön draußen?
          </h1>

          <p className="mt-5 max-w-md text-[17px] leading-relaxed">
            PlatzDa findet Spielplätze, Parks und Wäldchen in deiner Nähe und
            sortiert sie nach dem Schatten, der dort gerade wirklich liegt.
            Nicht irgendwann. In dieser Stunde.
          </p>

          <a
            href={TESTFLIGHT_URL}
            className="mt-8 inline-flex min-h-14 items-center justify-center rounded-2xl bg-primary-dark px-7 text-[17px] font-semibold text-white shadow-float transition hover:bg-primary-darker active:scale-[0.98]"
          >
            Kostenlos testen
          </a>
          <p className="mt-3 text-sm text-sky-muted">
            Für iPhone, über Apples TestFlight. Kein Konto, keine Werbung.
          </p>
        </div>
      </header>

      {/* ---- Signatur: der Schatten wandert ---- */}
      <section
        aria-label="Schatten wandert über den Tag"
        className="mx-auto w-full max-w-xl px-5"
      >
        <div className="relative -mt-6 overflow-hidden rounded-card bg-card px-6 pt-8 pb-6 shadow-card">
          <div className="relative h-24">
            {/* Sonne läuft ihren Bogen … */}
            <span aria-hidden className="wander-sonne absolute top-1 size-7 rounded-full bg-[#f2ac33]" />
            {/* … der Baum bleibt stehen … */}
            <svg
              aria-hidden
              viewBox="0 0 60 64"
              className="absolute bottom-0 left-1/2 h-16 w-auto -translate-x-1/2"
            >
              <rect x="27" y="38" width="6" height="24" rx="2" fill="#7a5b3a" />
              <circle cx="30" cy="24" r="18" fill="#1e766c" />
              <circle cx="18" cy="30" r="10" fill="#2a9d8f" />
              <circle cx="42" cy="30" r="10" fill="#2a9d8f" />
            </svg>
            {/* … und sein Schatten wandert gegenläufig. */}
            <span
              aria-hidden
              className="wander-schatten absolute bottom-0.5 h-2.5 w-24 rounded-full bg-dark/20"
            />
          </div>
          <div aria-hidden className="h-px w-full bg-line" />
          <p className="mt-4 text-center text-[15px] leading-relaxed text-muted">
            Schatten wandert mit der Sonne.{" "}
            <span className="font-semibold text-dark">
              PlatzDa rechnet ihn voraus
            </span>{" "}
            – aus Sonnenstand, Bäumen, Gebäuden und den Bergen am Horizont.
          </p>
        </div>
      </section>

      {/* ---- Was die App weiß ---- */}
      <section className="mx-auto w-full max-w-xl px-5 pt-12">
        <h2 className="font-display text-2xl leading-snug font-bold">
          Ein Blick statt drei Apps
        </h2>
        <div className="mt-5 space-y-3">
          <div className="rounded-card bg-card p-5 shadow-card">
            <h3 className="font-display text-lg font-semibold">
              Gerechnet, nicht geraten
            </h3>
            <p className="mt-1.5 text-[15px] leading-relaxed text-muted">
              Für jeden Platz berechnet PlatzDa, wie viel Schatten dort gerade
              liegt. Im Winter rechnet sie Laubbäume lichter, weil sie kahl
              sind. Und sie sagt ehrlich dazu, wie verlässlich die Schätzung
              ist.
            </p>
          </div>
          <div className="rounded-card bg-card p-5 shadow-card">
            <h3 className="font-display text-lg font-semibold">
              Das Wetter dieser Stunde
            </h3>
            <p className="mt-1.5 text-[15px] leading-relaxed text-muted">
              Gefühlte Temperatur, UV, Wind und der Blick nach vorn: „Regen
              zieht auf: In rund 20 Minuten geht es los.“ Dazu ein Anzieh-Tipp,
              abgestimmt auf das Alter deines Kindes.
            </p>
          </div>
          <div className="rounded-card bg-card p-5 shadow-card">
            <h3 className="font-display text-lg font-semibold">
              Was den Ausflug entscheidet
            </h3>
            <p className="mt-1.5 text-[15px] leading-relaxed text-muted">
              Toilette, Zaun, Wickeltisch, Wasser zum Planschen, ein Unterstand
              für Regenpausen. Und was andere Eltern in den letzten drei
              Stunden gemeldet haben.
            </p>
          </div>
        </div>
      </section>

      {/* ---- Echte Sequenz, darum nummeriert ---- */}
      <section className="mx-auto w-full max-w-xl px-5 pt-12">
        <h2 className="font-display text-2xl leading-snug font-bold">
          So testest du PlatzDa
        </h2>
        <ol className="mt-5 space-y-4">
          {[
            [
              "TestFlight laden",
              "Apples kostenlose Test-App aus dem App Store. Einmalig, dauert eine Minute.",
            ],
            [
              "Link antippen",
              "Der Knopf oben führt dich hin. PlatzDa installiert sich wie eine normale App.",
            ],
            [
              "Rausgehen",
              "Und wenn der Schatten vor Ort nicht stimmt: Sag es mir. Genau dafür ist der Test da.",
            ],
          ].map(([titel, text], i) => (
            <li key={titel} className="flex gap-4">
              <span
                aria-hidden
                className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-soft font-display text-[15px] font-bold text-primary-dark"
              >
                {i + 1}
              </span>
              <div>
                <h3 className="font-display text-[17px] font-semibold">{titel}</h3>
                <p className="mt-0.5 text-[15px] leading-relaxed text-muted">{text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* ---- Die Ehrlichkeits-Zeile, O-Ton der App ---- */}
      <section className="mx-auto w-full max-w-xl px-5 pt-12">
        <p className="rounded-card bg-primary-soft p-5 text-[15px] leading-relaxed text-primary-dark">
          Orte und Ausstattung stammen von OpenStreetMap, das Wetter von
          Open-Meteo. Der Schatten ist{" "}
          <span className="font-semibold">gerechnet, nicht gemessen</span> – eine
          gute Schätzung, keine Garantie. Der Blick vor Ort bleibt deiner.
        </p>
      </section>

      {/* ---- Zweite Chance zum Ja ---- */}
      <section className="mx-auto w-full max-w-xl px-5 pt-12 pb-6 text-center">
        <a
          href={TESTFLIGHT_URL}
          className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-primary-dark px-7 text-[17px] font-semibold text-white shadow-float transition hover:bg-primary-darker active:scale-[0.98]"
        >
          PlatzDa kostenlos testen
        </a>
        <p className="mt-3 text-sm text-muted">
          Android? Noch nicht – schreib mir, wenn du dabei sein willst:{" "}
          <a href="mailto:kontakt@nicolas-daum.ai" className="underline underline-offset-2">
            kontakt@nicolas-daum.ai
          </a>
        </p>
      </section>

      <footer className="mx-auto flex w-full max-w-xl flex-wrap justify-center gap-x-4 gap-y-1 px-5 pt-6 pb-[max(2rem,env(safe-area-inset-bottom))] text-xs text-muted">
        <Link href="/impressum" className="underline underline-offset-2">
          Impressum
        </Link>
        <Link href="/datenschutz" className="underline underline-offset-2">
          Datenschutz
        </Link>
        <Link href="/so-funktionierts" className="underline underline-offset-2">
          So funktioniert&apos;s
        </Link>
      </footer>
    </div>
  );
}
