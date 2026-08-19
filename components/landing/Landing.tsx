import Link from "next/link";
import { Baby, CloudSun, TreeDeciduous } from "lucide-react";
import { Erscheint } from "./Erscheint";
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
      <header className="landing-hero relative overflow-hidden px-5 pt-[max(2.25rem,calc(env(safe-area-inset-top)+1.5rem))] pb-16 lg:pb-24">
        <div className="mx-auto w-full max-w-xl lg:grid lg:max-w-4xl lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-12">
          <div className="landing-auftakt">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/platzda-logo.png"
              alt="PlatzDa"
              width={720}
              height={209}
              className="h-11 w-auto lg:h-12"
            />

            <h1 className="mt-7 font-display text-[2.1rem] leading-[1.12] font-bold text-balance sm:text-5xl lg:text-6xl">
              Wo ist es mit Kind jetzt schön draußen?
            </h1>

            <p className="mt-5 max-w-md text-lg leading-relaxed">
              PlatzDa zeigt Spielplätze, Parks und Wäldchen in deiner Nähe und
              sagt dir, wie viel Schatten dort gerade liegt.
            </p>

            <a
              href={TESTFLIGHT_URL}
              className="mt-7 inline-flex min-h-14 items-center justify-center rounded-full bg-primary-dark px-9 text-lg font-semibold text-white transition-[background-color,transform] hover:bg-primary-darker active:scale-[0.98]"
            >
              Kostenlos testen
            </a>
            <p className="mt-3 max-w-md text-sm text-pretty text-dark/60">
              Für iPhone, über Apples TestFlight. Kein Konto, keine Werbung.
            </p>
          </div>

          {/* Das Produkt selbst: Nicolas' echtes Bildschirmfoto im
              CSS-Geräterahmen. Mobil VOLL sichtbar und mittig; der frühere
              Anschnitt an der rechten Kante las sich auf dem Handy als
              Fehler, nicht als Geste. */}
          <div className="landing-auftakt-spaeter mx-auto mt-10 w-60 lg:mx-0 lg:mt-0 lg:w-72">
            <GeraeteRahmen
              quelle="/app-bildschirm-start.webp"
              alt="Die PlatzDa-App auf dem iPhone: Startbildschirm mit Wetter, Werteleiste und der besten Wahl gerade an einem Regentag"
              breite={623}
              hoehe={1352}
              klasse="drop-shadow-[0_18px_40px_rgba(28,53,64,0.18)]"
            />
          </div>
        </div>
      </header>

      {/* ---- Signatur: die App beim Rechnen zeigen, nicht behaupten ---- */}
      <section className="mx-auto w-full max-w-xl px-5 lg:max-w-4xl lg:px-0">
        <Erscheint>
        <div className="relative -mt-6 overflow-hidden rounded-card bg-card shadow-card">
          <div className="grid items-center gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-12 lg:p-10">
            <GeraeteRahmen
              quelle="/app-bildschirm-detail.webp"
              alt="Die Detailseite eines Parks in der PlatzDa-App auf dem iPhone: Bewertung, ehrlicher Regen-Hinweis, Luftbild und die Karte, wie sonnig es dort ist"
              breite={623}
              hoehe={1354}
              klasse="mx-auto w-52 drop-shadow-[0_18px_40px_rgba(28,53,64,0.18)] lg:w-60"
            />
            <p className="text-left text-lg leading-relaxed text-balance text-dark/75 lg:text-xl">
              Die Bank, die um 12 noch im Schatten stand, liegt um 15 Uhr in
              der prallen Sonne.{" "}
              <span className="font-semibold text-dark">
                PlatzDa rechnet das voraus
              </span>: aus Sonnenstand, Bäumen, Gebäuden und dem Gelände. Für
              jeden Platz siehst du, wie es jetzt ist, in 30 Minuten und in
              einer Stunde.
            </p>
          </div>
        </div>
        </Erscheint>
      </section>

      {/* ---- Was man vor dem Losgehen weiß ---- */}
      {/* Ab lg liegen alle Sektionen im selben max-w-4xl-Container wie der
          Hero (lg:px-0, weil dort das Padding außen am Header sitzt) –
          H1 und H2s fluchten auf einer Achse statt zu springen. */}
      {/* Die Mitte spricht die Karten-Sprache der App selbst: weiße Karten
          mit weichem Schatten auf dem warmen Papier, App-Symbole als
          Absender. */}
      <section className="mx-auto w-full max-w-xl px-5 pt-12 lg:max-w-4xl lg:px-0 lg:pt-24">
        <Erscheint>
        <h2 className="font-display text-2xl leading-snug font-bold text-balance sm:text-3xl">
          Was du vor dem Losgehen weißt
        </h2>
        {/* Mobil EINE Karte mit Trennlinien und dem Symbol neben der
            Überschrift; ab lg drei eigenständige Karten mit dem Symbol
            darüber. */}
        <div className="mt-6 rounded-card bg-card p-6 shadow-card max-lg:divide-y max-lg:divide-line lg:grid lg:grid-cols-3 lg:gap-6 lg:bg-transparent lg:p-0 lg:shadow-none">
          <div className="max-lg:py-5 max-lg:first:pt-0 max-lg:last:pb-0 lg:rounded-card lg:bg-card lg:p-6 lg:shadow-card">
            <div className="flex items-center gap-3 lg:block">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary-dark">
                <TreeDeciduous
                  className="size-6"
                  strokeWidth={1.8}
                  aria-hidden
                />
              </span>
              <h3 className="font-display text-lg font-semibold lg:mt-4">
                Wo gerade Schatten ist
              </h3>
            </div>
            <p className="mt-2 text-base leading-relaxed text-muted">
              Für jeden Platz rechnet PlatzDa aus, wie viel Schatten in dieser
              Stunde da ist. Im Winter zählen Laubbäume weniger, weil sie kahl
              sind. Und wenn die Schätzung unsicher ist, steht „geschätzt“
              dabei.
            </p>
          </div>
          <div className="max-lg:py-5 max-lg:first:pt-0 max-lg:last:pb-0 lg:rounded-card lg:bg-card lg:p-6 lg:shadow-card">
            <div className="flex items-center gap-3 lg:block">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary-dark">
                <CloudSun className="size-6" strokeWidth={1.8} aria-hidden />
              </span>
              <h3 className="font-display text-lg font-semibold lg:mt-4">
                Das Wetter dieser Stunde
              </h3>
            </div>
            <p className="mt-2 text-base leading-relaxed text-muted">
              Gefühlte Temperatur, UV, Wind, Regenwahrscheinlichkeit. Wenn
              etwas aufzieht, warnt dich die App: „Regen zieht auf: In rund 20
              Minuten geht es los.“ Dazu ein Anzieh-Tipp, der zum Alter deines
              Kindes passt.
            </p>
          </div>
          <div className="max-lg:py-5 max-lg:first:pt-0 max-lg:last:pb-0 lg:rounded-card lg:bg-card lg:p-6 lg:shadow-card">
            <div className="flex items-center gap-3 lg:block">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary-dark">
                <Baby className="size-6" strokeWidth={1.8} aria-hidden />
              </span>
              <h3 className="font-display text-lg font-semibold lg:mt-4">
                Was vor Ort da ist
              </h3>
            </div>
            <p className="mt-2 text-base leading-relaxed text-muted">
              Toilette (mit Entfernung), Zaun, Wickeltisch, Wasser zum
              Planschen, ein Unterstand für Regenpausen. Dazu Meldungen anderer
              Eltern, etwa „Zu voll“. Die zählen nur drei Stunden, danach sind
              sie weg.
            </p>
          </div>
        </div>
        </Erscheint>
      </section>

      {/* ---- Echte Sequenz, darum nummeriert ---- */}
      <section className="mx-auto w-full max-w-xl px-5 pt-12 lg:max-w-4xl lg:px-0 lg:pt-24">
        <Erscheint>
        <h2 className="font-display text-2xl leading-snug font-bold text-balance sm:text-3xl">
          So testest du PlatzDa
        </h2>
        <ol className="mt-6 space-y-6 rounded-card bg-card p-6 shadow-card lg:grid lg:grid-cols-3 lg:gap-10 lg:space-y-0 lg:p-8">
          {[
            [
              "Link antippen",
              "Der Knopf oben bringt dich zu Apples Testseite. Von da installierst du PlatzDa wie jede andere App.",
            ],
            [
              "TestFlight laden, wenn es fehlt",
              "Falls TestFlight noch nicht auf deinem iPhone ist, führt dich die Seite zuerst in den App Store. Das machst du nur einmal.",
            ],
            [
              "Rausgehen",
              "Such dir einen Platz aus und geh hin. Wenn vor Ort etwas anders aussieht als in der App, sag mir Bescheid. Genau dafür ist die Testphase da.",
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
                <p className="mt-0.5 max-w-[52ch] text-base leading-relaxed text-muted">
                  {text}
                </p>
              </div>
            </li>
          ))}
        </ol>
        </Erscheint>
      </section>

      {/* ---- Der Absender: ein Ich mit Namen ---- */}
      {/* Absender und Ehrlichkeit sind EIN Gedanke: ein Vater, der ehrlich
          rechnet. Darum hängt die Fußnote direkt am Absatz, statt als
          eigene Sektion zu schweben. */}
      <section className="mx-auto w-full max-w-xl px-5 pt-12 lg:max-w-4xl lg:px-0 lg:pt-24">
        <Erscheint>
        <h2 className="font-display text-2xl leading-snug font-bold text-balance sm:text-3xl">
          Wer dahintersteckt
        </h2>
        <div className="mt-6 rounded-card bg-card p-6 shadow-card lg:p-8">
          <p className="max-w-[60ch] text-base leading-relaxed text-muted">
            Ich bin Nicolas, Vater aus Hamburg. PlatzDa habe ich gebaut, weil
            ich selbst ständig wissen wollte, auf welchem Platz nachmittags
            noch Schatten ist. Ich arbeite allein daran und teste jede Version
            mit meiner Familie. Wenn etwas nicht stimmt oder dir etwas fehlt,
            schreib mir:{" "}
            <a
              href="mailto:kontakt@nicolas-daum.ai"
              className="font-medium whitespace-nowrap text-primary-dark underline underline-offset-2 transition-colors hover:text-primary-darker"
            >
              kontakt@nicolas-daum.ai
            </a>
          </p>
          <p className="mt-5 max-w-[60ch] rounded-2xl bg-primary-soft p-5 text-base leading-relaxed text-primary-dark">
            Die Plätze und ihre Ausstattung kommen von OpenStreetMap, das
            Wetter von Open-Meteo. Der Schatten ist{" "}
            <span className="font-semibold">gerechnet, nicht gemessen</span>.
            Meistens passt die Schätzung gut, aber schau vor Ort trotzdem
            selbst hin.
          </p>
        </div>
        </Erscheint>
      </section>

      {/* ---- Kurz gefragt ---- */}
      <section className="mx-auto w-full max-w-xl px-5 pt-12 lg:max-w-4xl lg:px-0 lg:pt-24">
        <Erscheint>
        <h2 className="font-display text-2xl leading-snug font-bold text-balance sm:text-3xl">
          Kurz gefragt
        </h2>
        {/* Mobil EINE Karte mit Trennlinien (weniger Karten-Wand), ab lg
            drei eigenständige Karten. */}
        <dl className="mt-6 rounded-card bg-card p-6 shadow-card max-lg:divide-y max-lg:divide-line lg:grid lg:grid-cols-3 lg:gap-6 lg:bg-transparent lg:p-0 lg:shadow-none">
          <div className="max-lg:py-5 max-lg:first:pt-0 max-lg:last:pb-0 lg:rounded-card lg:bg-card lg:p-6 lg:shadow-card">
            <dt className="font-display text-lg font-semibold">
              Was ist TestFlight?
            </dt>
            <dd className="mt-2 text-base leading-relaxed text-muted">
              TestFlight ist Apples eigene App zum Ausprobieren neuer Apps,
              kostenlos im App Store. Solange PlatzDa in der Testphase ist,
              kommt es darüber auf dein iPhone.
            </dd>
          </div>
          <div className="max-lg:py-5 max-lg:first:pt-0 max-lg:last:pb-0 lg:rounded-card lg:bg-card lg:p-6 lg:shadow-card">
            <dt className="font-display text-lg font-semibold">
              Kostet das etwas?
            </dt>
            <dd className="mt-2 text-base leading-relaxed text-muted">
              Nein. Es gibt kein Konto, keine Werbung und nichts zu kaufen.
            </dd>
          </div>
          <div className="max-lg:py-5 max-lg:first:pt-0 max-lg:last:pb-0 lg:rounded-card lg:bg-card lg:p-6 lg:shadow-card">
            <dt className="font-display text-lg font-semibold">
              Was passiert mit meinen Daten?
            </dt>
            <dd className="mt-2 text-base leading-relaxed text-muted">
              Dein Standort wird nur für die Suche benutzt und nicht
              gespeichert. Dein iPhone merkt sich, wo du zuletzt gesucht hast,
              mehr nicht. Es gibt kein Login und keine Nutzungsprofile.
            </dd>
          </div>
        </dl>
        </Erscheint>
      </section>

      {/* ---- Finale: dieselbe Szene, nur als Abend ---- */}
      {/* ---- Finale: der Tagesbogen schließt sich. Wie der Hero mit dem
          Morgenhimmel beginnt, endet die Seite voll-breit im Abendhimmel;
          der Footer läuft still darauf aus. ---- */}
      <section className="landing-finale mt-12 w-full px-5 pt-14 text-center lg:mt-24 lg:pt-24">
        <Erscheint>
          <p className="mx-auto max-w-4xl font-display text-2xl leading-snug font-bold text-balance text-dark sm:text-3xl">
            Der nächste schöne Nachmittag kommt bestimmt.
          </p>
          <p className="mt-2 text-base text-balance text-dark/70">
            Diesmal weißt du vorher, wo ihr hingeht.
          </p>
          <a
            href={TESTFLIGHT_URL}
            className="mt-7 inline-flex min-h-14 items-center justify-center rounded-full bg-primary-dark px-9 text-lg font-semibold text-white transition-[background-color,transform] hover:bg-primary-darker active:scale-[0.98]"
          >
            Jetzt mittesten
          </a>
        </Erscheint>

        <footer className="mx-auto mt-14 w-full max-w-xl pb-[max(2rem,env(safe-area-inset-bottom))] lg:mt-20 lg:max-w-4xl">
          <p className="pb-3 text-xs text-balance text-dark/60">
            PlatzDa gibt es bisher nur fürs iPhone. Wenn du es auf Android
            nutzen willst, schreib mir:{" "}
            <a
              href="mailto:kontakt@nicolas-daum.ai"
              className="font-medium whitespace-nowrap text-primary-dark transition-colors hover:underline"
            >
              kontakt@nicolas-daum.ai
            </a>
          </p>
          <div className="flex flex-wrap justify-center gap-x-4 border-t border-dark/10 pt-4 text-xs text-dark/60">
            <Link href="/impressum" className="py-2 hover:underline">
              Impressum
            </Link>
            <Link href="/datenschutz" className="py-2 hover:underline">
              Datenschutz
            </Link>
            <Link href="/so-funktionierts" className="py-2 hover:underline">
              So funktioniert&apos;s
            </Link>
          </div>
        </footer>
      </section>
    </div>
  );
}
