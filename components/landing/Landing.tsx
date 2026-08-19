import Link from "next/link";
import { StandaloneRedirect } from "./StandaloneRedirect";

const TESTFLIGHT_URL = "https://testflight.apple.com/join/Ad9Py8Xd";

/**
 * iPhone-Rahmen als CSS um Nicolas' echte Bildschirmfotos. Vorher wurden die
 * Fotos in ein Rahmen-FOTO hineinmontiert; dabei saßen Insel und Ecken nie
 * hundertprozentig. Hier zeichnet die Seite den Rahmen selbst, alle Maße in
 * `cqw` (Prozent der Rahmenbreite), dadurch stimmt die Geometrie in jeder
 * Größe. Die Eckenrundung des Bildschirms (8cqw) entspricht exakt der
 * Rundung, mit der der Inhalt in den webp-Dateien maskiert ist.
 */
function GeraeteRahmen({
  quelle,
  alt,
  breite,
  hoehe,
  klasse,
}: {
  quelle: string;
  alt: string;
  breite: number;
  hoehe: number;
  klasse?: string;
}) {
  return (
    <div className={`relative @container ${klasse ?? ""}`}>
      {/* Tasten links (Aktion, Lauter, Leiser) und rechts (Seitentaste) */}
      <span
        aria-hidden
        className="absolute top-[17.5%] -left-[0.8cqw] h-[3.2%] w-[1.6cqw] rounded-l-[0.8cqw] bg-[#3a3d42]"
      />
      <span
        aria-hidden
        className="absolute top-[24%] -left-[0.8cqw] h-[5.4%] w-[1.6cqw] rounded-l-[0.8cqw] bg-[#3a3d42]"
      />
      <span
        aria-hidden
        className="absolute top-[31.5%] -left-[0.8cqw] h-[5.4%] w-[1.6cqw] rounded-l-[0.8cqw] bg-[#3a3d42]"
      />
      <span
        aria-hidden
        className="absolute top-[26.5%] -right-[0.8cqw] h-[8.5%] w-[1.6cqw] rounded-r-[0.8cqw] bg-[#3a3d42]"
      />
      <div className="relative rounded-[11.2cqw] bg-[#17191d] p-[3.2cqw] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.14),inset_0_0_0.6cqw_1px_rgba(0,0,0,0.9)]">
        <div className="overflow-hidden rounded-[8cqw] bg-[#17191d]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={quelle}
            alt={alt}
            width={breite}
            height={hoehe}
            className="block w-full"
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Die Haustür von platzda.app – in drei Kritik-Runden (Design-Direktion,
 * Conversion-Text, System-Audit) geschliffen:
 * - Das Produkt ist SICHTBAR: echter App-Screenshot im Geräterahmen im Hero,
 *   darunter die Schatten-Vorhersage der Detailseite als zweiter Screenshot –
 *   die Seite zeigt die App beim Rechnen, statt eine Grafik zu behaupten.
 * - Keine gezeichneten Illustrationen: zweimal als „billig" aussortiert.
 *   Bildsprache der Seite = echte App-Screenshots plus das Logo, sonst nichts.
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

          {/* Das Produkt selbst: Nicolas' echtes Bildschirmfoto im
              CSS-Geräterahmen. Mobil rechts angeschnitten (Scroll-Sog);
              die sm-Formel bindet den Anschnitt an den VIEWPORT statt an
              den Container, damit das Telefon auch zwischen 640 und
              1023 px an der Kante bleibt. */}
          <div className="mt-10 -mr-14 ml-auto w-64 rotate-2 sm:mr-[calc((36rem-100vw)/2-2rem)] lg:mt-0 lg:mr-0 lg:ml-0 lg:w-72 lg:rotate-0">
            <GeraeteRahmen
              quelle="/app-bildschirm-start.webp"
              alt="Die PlatzDa-App auf dem iPhone: Startbildschirm mit Wetter, Werteleiste und der besten Wahl gerade an einem Regentag"
              breite={623}
              hoehe={1352}
              klasse="drop-shadow-[0_18px_40px_rgba(28,53,64,0.35)]"
            />
          </div>
        </div>
      </header>

      {/* ---- Signatur: die App beim Rechnen zeigen, nicht behaupten ---- */}
      <section className="mx-auto w-full max-w-xl px-5 lg:max-w-4xl lg:px-0">
        <div className="relative -mt-6 overflow-hidden rounded-card bg-card shadow-card">
          <div className="grid items-center gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-12 lg:p-8">
            <GeraeteRahmen
              quelle="/app-bildschirm-detail.webp"
              alt="Die Detailseite eines Parks in der PlatzDa-App auf dem iPhone: Bewertung, ehrlicher Regen-Hinweis, Luftbild und die Karte, wie sonnig es dort ist"
              breite={623}
              hoehe={1354}
              klasse="mx-auto w-52 drop-shadow-[0_14px_32px_rgba(28,53,64,0.3)] lg:w-60"
            />
            <p className="text-center text-[15px] leading-relaxed text-balance text-muted lg:text-left lg:text-lg">
              Schatten wandert mit der Sonne.{" "}
              <span className="font-semibold text-dark">
                PlatzDa rechnet ihn voraus
              </span>: aus Sonnenstand, Bäumen, Gebäuden und den Bergen am Horizont.
              Für jeden Platz siehst du, wie es gerade ist und wie lange der
              Schatten noch hält.
            </p>
          </div>
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
              auch: aus den letzten drei Stunden, nicht vom letzten Sommer.
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
              "Link antippen",
              "Der Knopf oben führt dich zu Apples Testseite. Von dort installiert sich PlatzDa wie eine normale App.",
            ],
            [
              "TestFlight laden, wenn es fehlt",
              "Die Testseite zeigt dir den Weg zu Apples kostenloser Test-App. Einmalig, dauert eine Minute.",
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
          Kein Unternehmen, ein Vater. Ich bin Nicolas und baue PlatzDa
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
          Plätze und Ausstattung stammen von OpenStreetMap, das Wetter von
          Open-Meteo. Der Schatten ist{" "}
          <span className="font-semibold">gerechnet, nicht gemessen</span>: eine
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
              Apples eigene App zum Ausprobieren neuer Apps, offiziell und
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
              gespeichert. Nur dein Gerät merkt sich den letzten Ort. Kein
              Login, keine Nutzungsprofile.
            </dd>
          </div>
        </dl>
      </section>

      {/* ---- Finale: dieselbe Szene, nur als Abend ---- */}
      <section className="mx-auto w-full max-w-xl px-5 pt-12 pb-6 lg:max-w-4xl lg:px-0 lg:pt-16">
        <div className="landing-finale rounded-card px-6 py-12 text-center lg:py-14">
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
            Android? Noch nicht. Schreib mir, wenn du dabei sein willst:{" "}
            <a
              href="mailto:kontakt@nicolas-daum.ai"
              className="font-medium whitespace-nowrap text-primary-dark underline underline-offset-2 transition-colors hover:text-primary-darker"
            >
              kontakt@nicolas-daum.ai
            </a>
          </p>
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
