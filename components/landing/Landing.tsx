import Link from "next/link";
import { StandaloneRedirect } from "./StandaloneRedirect";

const TESTFLIGHT_URL = "https://testflight.apple.com/join/Ad9Py8Xd";

/**
 * Die Haustür von platzda.app – nach zwei Kritiken (Design-Direktor,
 * Conversion-Texter) umgebaut:
 * - Das Produkt ist SICHTBAR: echter App-Screenshot im Geräterahmen, auf dem
 *   Handy rechts angeschnitten, auf Desktop als zweite Hero-Spalte.
 * - Desktop ist Komposition, nicht Zoom: eigene Typo-Skala ab lg, Glow an
 *   der Inhaltsspalte, EIN asymmetrisches Zwei-Spalten-Moment.
 * - Die Signatur (wandernder Schatten) folgt echter Physik – das Element
 *   behauptet „wir rechnen Schatten richtig", also muss es selbst stimmen.
 * - Texte ohne Werbesprech-Muster; der Absender hat einen Namen.
 */
export function Landing() {
  return (
    <div className="min-h-dvh bg-background text-dark">
      <StandaloneRedirect />

      {/* ---- Kopf: derselbe Himmel wie in der App, plus das Produkt ---- */}
      <header className="landing-hero relative overflow-hidden px-5 pt-[max(2.5rem,calc(env(safe-area-inset-top)+1.5rem))] pb-14 lg:pb-20">
        <div className="mx-auto w-full max-w-xl lg:grid lg:max-w-4xl lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-14">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/platzda-logo.png"
              alt="PlatzDa"
              width={720}
              height={209}
              className="h-11 w-auto lg:h-12"
            />

            <h1 className="mt-9 font-display text-[2.1rem] leading-[1.12] font-bold text-balance sm:text-5xl lg:text-6xl">
              Wo ist es mit Kind jetzt schön draußen?
            </h1>

            <p className="mt-5 max-w-md text-[17px] leading-relaxed lg:text-lg">
              PlatzDa findet Spielplätze, Parks und Wäldchen in deiner Nähe und
              rechnet aus, wie viel Schatten dort in dieser Stunde wirklich
              liegt.
            </p>

            <a
              href={TESTFLIGHT_URL}
              className="mt-8 inline-flex min-h-14 items-center justify-center rounded-full bg-primary-dark px-8 text-[17px] font-semibold text-white shadow-float transition hover:bg-primary-darker active:scale-[0.98]"
            >
              Kostenlos testen
            </a>
            <p className="mt-3 max-w-md text-sm text-sky-muted">
              Für iPhone, über Apples TestFlight. Zwei Schritte, gut zwei
              Minuten. Kein Konto, keine Werbung.
            </p>
          </div>

          {/* Das Produkt selbst: echte App-Oberfläche, echter Sonnentag.
              Mobil rechts angeschnitten (Scroll-Sog), Desktop aufrecht. */}
          <div className="mt-10 -mr-14 ml-auto w-60 rotate-2 sm:-mr-8 lg:m-0 lg:w-64 lg:rotate-0">
            <div className="rounded-[2.7rem] border-[9px] border-dark/90 bg-dark/90 shadow-float">
              <div className="overflow-hidden rounded-[2.1rem]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/app-vorschau.png"
                  alt="Die PlatzDa-App zeigt die beste Wahl gerade: Spielplatz mit viel Schatten, bewertet mit 82 von 100"
                  width={780}
                  height={1688}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ---- Signatur: der Schatten wandert, physikalisch richtig ---- */}
      <section
        aria-label="Schatten wandert über den Tag"
        className="mx-auto w-full max-w-xl px-5"
      >
        <div className="relative -mt-6 overflow-hidden rounded-card bg-card px-6 pt-8 pb-6 shadow-card">
          <div className="relative h-24">
            <span
              aria-hidden
              className="wander-sonne absolute top-1 size-7 rounded-full bg-[#f2ac33]"
            />
            <svg
              aria-hidden
              viewBox="0 0 60 64"
              className="absolute bottom-1 left-1/2 h-16 w-auto -translate-x-1/2"
            >
              <rect x="27" y="38" width="6" height="24" rx="2" fill="#7a5b3a" />
              <circle cx="30" cy="24" r="18" fill="#1e766c" />
              <circle cx="18" cy="30" r="10" fill="#2a9d8f" />
              <circle cx="42" cy="30" r="10" fill="#2a9d8f" />
            </svg>
            {/* Ursprung am Stamm: left 50 %, Origin links – scaleX streckt
                nach Osten, negativ kippt nach Westen. */}
            <span
              aria-hidden
              className="wander-schatten absolute bottom-0 left-1/2 h-3 w-24 rounded-[50%] bg-primary-dark/15"
            />
          </div>
          <div aria-hidden className="mx-auto h-px w-4/5 bg-line" />
          <p className="mt-4 text-center text-[15px] leading-relaxed text-muted lg:text-base">
            Schatten wandert mit der Sonne.{" "}
            <span className="font-semibold text-dark">
              PlatzDa rechnet ihn voraus
            </span>{" "}
            – aus Sonnenstand, Bäumen, Gebäuden und den Bergen am Horizont.
          </p>
        </div>
      </section>

      {/* ---- Was man vor dem Losgehen weiß ---- */}
      <section className="mx-auto w-full max-w-xl px-5 pt-14 lg:pt-20">
        <h2 className="font-display text-2xl leading-snug font-bold sm:text-3xl">
          Was du weißt, bevor ihr losgeht
        </h2>
        <div className="mt-6 space-y-6">
          <div className="border-l-2 border-primary/40 pl-4">
            <h3 className="font-display text-lg font-semibold">
              Schatten, der stimmt
            </h3>
            <p className="mt-2 max-w-[52ch] text-[15px] leading-relaxed text-muted lg:text-base">
              Für jeden Platz berechnet PlatzDa, wie viel Schatten dort gerade
              liegt. Im Winter rechnet sie Laubbäume lichter, weil sie kahl
              sind. Und sie sagt ehrlich dazu, wie verlässlich die Schätzung
              ist.
            </p>
          </div>
          <div className="border-l-2 border-primary/40 pl-4">
            <h3 className="font-display text-lg font-semibold">
              Das Wetter dieser Stunde
            </h3>
            <p className="mt-2 max-w-[52ch] text-[15px] leading-relaxed text-muted lg:text-base">
              Gefühlte Temperatur, UV, Wind und der Blick nach vorn: „Regen
              zieht auf: In rund 20 Minuten geht es los.“ Dazu ein Anzieh-Tipp,
              abgestimmt auf das Alter deines Kindes.
            </p>
          </div>
          <div className="border-l-2 border-primary/40 pl-4">
            <h3 className="font-display text-lg font-semibold">
              Was den Ausflug entscheidet
            </h3>
            <p className="mt-2 max-w-[52ch] text-[15px] leading-relaxed text-muted lg:text-base">
              Toilette, Zaun, Wickeltisch, Wasser zum Planschen, ein Unterstand
              für Regenpausen. Was andere Eltern gemeldet haben, siehst du
              auch – aus den letzten drei Stunden, nicht vom letzten Sommer.
            </p>
          </div>
        </div>
      </section>

      {/* ---- Echte Sequenz, darum nummeriert ---- */}
      <section className="mx-auto w-full max-w-xl px-5 pt-12 lg:pt-16">
        <h2 className="font-display text-2xl leading-snug font-bold sm:text-3xl">
          So testest du PlatzDa
        </h2>
        <ol className="mt-6 space-y-4">
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
                <p className="mt-0.5 max-w-[52ch] text-[15px] leading-relaxed text-muted lg:text-base">
                  {text}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* ---- Der Absender: ein Ich mit Namen ---- */}
      <section className="mx-auto w-full max-w-xl px-5 pt-12 lg:pt-16">
        <h2 className="font-display text-2xl leading-snug font-bold sm:text-3xl">
          Wer dahintersteckt
        </h2>
        <p className="mt-4 max-w-[52ch] text-[15px] leading-relaxed text-muted lg:text-base">
          Kein Unternehmen – ein Vater. Ich bin Nicolas und baue PlatzDa
          selbst. Wenn der Schatten vor Ort nicht stimmt oder dir etwas fehlt,
          schreib mir:{" "}
          <a
            href="mailto:kontakt@nicolas-daum.ai"
            className="font-medium text-primary-dark underline underline-offset-2"
          >
            kontakt@nicolas-daum.ai
          </a>
        </p>
      </section>

      {/* ---- Ehrlichkeit: die Fußnote zu allem darüber ---- */}
      <section className="mx-auto w-full max-w-xl px-5 pt-6">
        <p className="rounded-card bg-primary-soft p-5 text-[15px] leading-relaxed text-primary-dark">
          Orte und Ausstattung stammen von OpenStreetMap, das Wetter von
          Open-Meteo. Der Schatten ist{" "}
          <span className="font-semibold">gerechnet, nicht gemessen</span> – eine
          gute Schätzung, keine Garantie. Der Blick vor Ort bleibt deiner.
        </p>
      </section>

      {/* ---- Kurz gefragt ---- */}
      <section className="mx-auto w-full max-w-xl px-5 pt-12 lg:pt-16">
        <h2 className="font-display text-2xl leading-snug font-bold sm:text-3xl">
          Kurz gefragt
        </h2>
        <dl className="mt-6 space-y-5">
          <div>
            <dt className="font-display text-[17px] font-semibold">
              Was ist TestFlight?
            </dt>
            <dd className="mt-1 max-w-[52ch] text-[15px] leading-relaxed text-muted lg:text-base">
              Apples eigene App zum Ausprobieren neuer Apps – offiziell und
              kostenlos im App Store. Darüber kommt PlatzDa auf dein iPhone,
              solange es in der Testphase ist.
            </dd>
          </div>
          <div>
            <dt className="font-display text-[17px] font-semibold">
              Kostet das etwas?
            </dt>
            <dd className="mt-1 max-w-[52ch] text-[15px] leading-relaxed text-muted lg:text-base">
              Nein, nichts. Kein Konto, keine Werbung, keine Käufe.
            </dd>
          </div>
          <div>
            <dt className="font-display text-[17px] font-semibold">
              Was passiert mit meinen Daten?
            </dt>
            <dd className="mt-1 max-w-[52ch] text-[15px] leading-relaxed text-muted lg:text-base">
              Dein Standort dient nur der Suche. Er wird nicht bei uns
              gespeichert – nur dein Gerät merkt sich den letzten Ort. Kein
              Login, keine Nutzungsprofile.
            </dd>
          </div>
        </dl>
      </section>

      {/* ---- Finale ---- */}
      <section className="mx-auto w-full max-w-xl px-5 pt-16 pb-6 text-center">
        <a
          href={TESTFLIGHT_URL}
          className="inline-flex min-h-16 items-center justify-center rounded-full bg-primary-dark px-10 text-lg font-semibold text-white shadow-float transition hover:bg-primary-darker active:scale-[0.98]"
        >
          Jetzt mittesten
        </a>
        <p className="mt-4 text-sm text-muted">
          Android? Noch nicht – schreib mir, wenn du dabei sein willst:{" "}
          <a
            href="mailto:kontakt@nicolas-daum.ai"
            className="underline underline-offset-2"
          >
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
