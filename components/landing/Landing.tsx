import Link from "next/link";
import { StandaloneRedirect } from "./StandaloneRedirect";

const TESTFLIGHT_URL = "https://testflight.apple.com/join/Ad9Py8Xd";

/**
 * Die Haustür von platzda.app – in drei Kritik-Runden (Design-Direktion,
 * Conversion-Text, System-Audit) geschliffen:
 * - Das Produkt ist SICHTBAR: echter App-Screenshot im Geräterahmen, auf dem
 *   Handy rechts angeschnitten, auf Desktop als zweite Hero-Spalte.
 * - EINE Zeichensprache: Baum und Sonne der Szene sind aus dem Logo
 *   abgeleitet (einfarbige Teal-Silhouette, Strahlen-Sonne) – die Seite
 *   konkurriert nicht mehr mit ihrem eigenen Markenzeichen.
 * - Die Signatur (wandernder Schatten) folgt echter Physik, und das Finale
 *   schließt die Klammer: dieselbe Szene, nur als Abend.
 * - `normal-nums`: Die App braucht Tabellenziffern (tickende Werte), eine
 *   Textseite nicht – ohne dies rendert Inter jeden Bindestrich gesperrt
 *   („Test - App" statt „Test-App").
 */
export function Landing() {
  return (
    <div className="min-h-dvh bg-background text-dark normal-nums">
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
              className="mt-8 inline-flex min-h-14 items-center justify-center rounded-full bg-primary-dark px-8 text-[17px] font-semibold text-white shadow-float transition-[background-color,transform] hover:bg-primary-darker active:scale-[0.98]"
            >
              Kostenlos testen
            </a>
            <p className="mt-3 max-w-md text-sm text-sky-muted">
              Für iPhone, über Apples TestFlight. Zwei Schritte, gut zwei
              Minuten. Kein Konto, keine Werbung.
            </p>
          </div>

          {/* Das Produkt selbst: echte App-Oberfläche, echter Sonnentag.
              Mobil rechts angeschnitten (Scroll-Sog); die sm-Formel bindet
              den Anschnitt an den VIEWPORT statt an den Container, damit das
              Telefon auch zwischen 640 und 1023 px an der Kante bleibt. */}
          <div className="mt-10 -mr-14 ml-auto w-60 rotate-2 sm:mr-[calc((36rem-100vw)/2-2rem)] lg:mt-0 lg:mr-0 lg:ml-0 lg:w-64 lg:rotate-0">
            <div className="rounded-[2.7rem] border-[9px] border-dark/90 bg-dark/90 shadow-float">
              <div className="overflow-hidden rounded-[2.1rem]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/app-vorschau.png"
                  alt="Die PlatzDa-App zeigt die beste Wahl gerade: Spielplatz mit viel Schatten, bewertet mit 82 von 100"
                  width={780}
                  height={1472}
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
        className="mx-auto w-full max-w-xl px-5 lg:max-w-4xl lg:px-0"
      >
        <div className="relative -mt-6 overflow-hidden rounded-card bg-card shadow-card">
          {/* Die Szene: Himmel, Wiese, ein Baum – randlos bis an die Karte,
              ab lg als breites Panorama. */}
          <div className="landing-szene relative h-44 overflow-hidden lg:h-52">
            <Sonne className="wander-sonne landing-sonne absolute top-4 size-9" />
            {/* Wiese als flacher Hügel: eine große Ellipse, deren Kuppe die
                Horizontlinie zeichnet. */}
            <div
              aria-hidden
              className="landing-wiese absolute -bottom-24 left-1/2 h-40 w-[165%] -translate-x-1/2 rounded-[100%]"
            />
            {/* Ursprung am Stamm: left 50 %, Origin links – scaleX streckt
                nach Osten, negativ kippt nach Westen. */}
            <span
              aria-hidden
              className="wander-schatten absolute bottom-8 left-1/2 h-2.5 w-24 rounded-[50%] bg-primary-dark/25"
            />
            <Baum className="absolute bottom-8 left-1/2 h-[104px] w-auto -translate-x-1/2" />
          </div>
          <p className="px-6 pt-5 pb-6 text-center text-[15px] leading-relaxed text-balance text-muted lg:text-base">
            Schatten wandert mit der Sonne.{" "}
            <span className="font-semibold text-dark">
              PlatzDa rechnet ihn voraus
            </span>{" "}
            – aus Sonnenstand, Bäumen, Gebäuden und den Bergen am Horizont.
          </p>
        </div>
      </section>

      {/* ---- Was man vor dem Losgehen weiß ---- */}
      {/* Ab lg liegen alle Sektionen im selben max-w-4xl-Container wie der
          Hero (lg:px-0, weil dort das Padding außen am Header sitzt) –
          H1 und H2s fluchten auf einer Achse statt zu springen. */}
      <section className="mx-auto w-full max-w-xl px-5 pt-14 lg:max-w-4xl lg:px-0 lg:pt-20">
        <h2 className="font-display text-2xl leading-snug font-bold text-balance sm:text-3xl">
          Was du weißt, bevor ihr losgeht
        </h2>
        <div className="mt-6 space-y-6 lg:grid lg:grid-cols-3 lg:gap-8 lg:space-y-0">
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
      <section className="mx-auto w-full max-w-xl px-5 pt-12 lg:max-w-4xl lg:px-0 lg:pt-16">
        <h2 className="font-display text-2xl leading-snug font-bold text-balance sm:text-3xl">
          So testest du PlatzDa
        </h2>
        <ol className="mt-6 space-y-4 lg:grid lg:grid-cols-3 lg:gap-8 lg:space-y-0">
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
                <h3 className="font-display text-lg font-semibold">{titel}</h3>
                <p className="mt-0.5 max-w-[52ch] text-[15px] leading-relaxed text-muted lg:text-base">
                  {text}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* ---- Der Absender: ein Ich mit Namen ---- */}
      <section className="mx-auto w-full max-w-xl px-5 pt-12 lg:max-w-4xl lg:px-0 lg:pt-16">
        <h2 className="font-display text-2xl leading-snug font-bold text-balance sm:text-3xl">
          Wer dahintersteckt
        </h2>
        <p className="mt-4 max-w-[52ch] text-[15px] leading-relaxed text-muted lg:text-base">
          Kein Unternehmen – ein Vater. Ich bin Nicolas und baue PlatzDa
          selbst. Wenn der Schatten vor Ort nicht stimmt oder dir etwas fehlt,
          schreib mir:{" "}
          <a
            href="mailto:kontakt@nicolas-daum.ai"
            className="font-medium whitespace-nowrap text-primary-dark underline underline-offset-2 transition-colors hover:text-primary-darker"
          >
            kontakt@nicolas-daum.ai
          </a>
        </p>
      </section>

      {/* ---- Ehrlichkeit: die Fußnote zu allem darüber ---- */}
      <section className="mx-auto w-full max-w-xl px-5 pt-6 lg:max-w-4xl lg:px-0">
        <p className="rounded-card bg-primary-soft p-5 text-[15px] leading-relaxed text-primary-dark lg:max-w-2xl lg:text-base">
          Orte und Ausstattung stammen von OpenStreetMap, das Wetter von
          Open-Meteo. Der Schatten ist{" "}
          <span className="font-semibold">gerechnet, nicht gemessen</span> – eine
          gute Schätzung, keine Garantie. Der Blick vor Ort bleibt deiner.
        </p>
      </section>

      {/* ---- Kurz gefragt ---- */}
      <section className="mx-auto w-full max-w-xl px-5 pt-12 lg:max-w-4xl lg:px-0 lg:pt-16">
        <h2 className="font-display text-2xl leading-snug font-bold text-balance sm:text-3xl">
          Kurz gefragt
        </h2>
        <dl className="mt-6 space-y-5 lg:grid lg:grid-cols-3 lg:gap-8 lg:space-y-0">
          <div>
            <dt className="font-display text-lg font-semibold">
              Was ist TestFlight?
            </dt>
            <dd className="mt-1 max-w-[52ch] text-[15px] leading-relaxed text-muted lg:text-base">
              Apples eigene App zum Ausprobieren neuer Apps – offiziell und
              kostenlos im App Store. Darüber kommt PlatzDa auf dein iPhone,
              solange es in der Testphase ist.
            </dd>
          </div>
          <div>
            <dt className="font-display text-lg font-semibold">
              Kostet das etwas?
            </dt>
            <dd className="mt-1 max-w-[52ch] text-[15px] leading-relaxed text-muted lg:text-base">
              Nein, nichts. Kein Konto, keine Werbung, keine Käufe.
            </dd>
          </div>
          <div>
            <dt className="font-display text-lg font-semibold">
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

      {/* ---- Finale: dieselbe Szene, nur als Abend ---- */}
      <section className="mx-auto w-full max-w-xl px-5 pt-12 pb-6 lg:max-w-4xl lg:px-0 lg:pt-16">
        <div className="landing-finale relative overflow-hidden rounded-card px-6 pt-12 pb-0 text-center lg:pt-14">
          <p className="font-display text-xl font-semibold text-balance text-dark">
            Der nächste schöne Nachmittag kommt bestimmt.
          </p>
          <a
            href={TESTFLIGHT_URL}
            className="mt-6 inline-flex min-h-16 items-center justify-center rounded-full bg-primary-dark px-10 text-lg font-semibold text-white shadow-float transition-[background-color,transform] hover:bg-primary-darker active:scale-[0.98]"
          >
            Jetzt mittesten
          </a>
          <p className="mt-4 text-sm text-balance text-muted">
            Android? Noch nicht – schreib mir, wenn du dabei sein willst:{" "}
            <a
              href="mailto:kontakt@nicolas-daum.ai"
              className="font-medium whitespace-nowrap text-primary-dark underline underline-offset-2 transition-colors hover:text-primary-darker"
            >
              kontakt@nicolas-daum.ai
            </a>
          </p>
          {/* Abend-Vignette: die Signatur-Szene, nur später am Tag – Sonne
              halb versunken im Westen, langer Schatten nach Osten. */}
          <div aria-hidden className="relative mx-auto mt-8 h-16 w-full max-w-sm">
            <span className="absolute right-1/2 bottom-0 h-2 w-36 rounded-[50%] bg-primary-dark/20" />
            <Baum className="absolute bottom-0 left-1/2 h-14 w-auto -translate-x-1/2" />
            <Sonne className="landing-sonne absolute right-[10%] -bottom-3 size-9" />
          </div>
        </div>
      </section>

      <footer className="mx-auto w-full max-w-xl px-5 pb-[max(2rem,env(safe-area-inset-bottom))] lg:max-w-4xl lg:px-0">
        <div className="flex flex-wrap justify-center gap-x-4 border-t border-line pt-4 text-xs text-muted">
          <Link
            href="/impressum"
            className="py-2 underline underline-offset-2 transition-colors hover:text-dark"
          >
            Impressum
          </Link>
          <Link
            href="/datenschutz"
            className="py-2 underline underline-offset-2 transition-colors hover:text-dark"
          >
            Datenschutz
          </Link>
          <Link
            href="/so-funktionierts"
            className="py-2 underline underline-offset-2 transition-colors hover:text-dark"
          >
            So funktioniert&apos;s
          </Link>
        </div>
      </footer>
    </div>
  );
}

/** Der Baum aus dem Logo, als Silhouette: eine Farbe, ein Stamm im selben
 *  Teal – kein brauner Fremdkörper. Wird in Szene UND Abend-Finale benutzt,
 *  damit die Seite EINE Zeichensprache spricht. */
function Baum({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 76 88" className={className}>
      <rect
        x="35"
        y="46"
        width="6"
        height="42"
        rx="3"
        fill="var(--color-primary-dark)"
      />
      <circle cx="38" cy="28" r="24" fill="var(--color-primary-dark)" />
      <circle cx="19" cy="41" r="13" fill="var(--color-primary-dark)" />
      <circle cx="57" cy="41" r="13" fill="var(--color-primary-dark)" />
    </svg>
  );
}

/** Die Sonne aus dem Logo: flache Scheibe mit Strahlen statt Verlaufs-Kugel –
 *  dieselbe Bauart wie im Markenzeichen und im App-Screenshot. */
function Sonne({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 40 40" className={className}>
      <g
        stroke="var(--color-sonne)"
        strokeWidth="3"
        strokeLinecap="round"
      >
        <line x1="32.5" y1="20" x2="37.5" y2="20" />
        <line x1="28.8" y1="28.8" x2="32.4" y2="32.4" />
        <line x1="20" y1="32.5" x2="20" y2="37.5" />
        <line x1="11.2" y1="28.8" x2="7.6" y2="32.4" />
        <line x1="2.5" y1="20" x2="7.5" y2="20" />
        <line x1="11.2" y1="11.2" x2="7.6" y2="7.6" />
        <line x1="20" y1="7.5" x2="20" y2="2.5" />
        <line x1="28.8" y1="11.2" x2="32.4" y2="7.6" />
      </g>
      <circle cx="20" cy="20" r="9.5" fill="var(--color-sonne)" />
    </svg>
  );
}
