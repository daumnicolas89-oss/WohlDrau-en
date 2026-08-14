import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Impressum · PlatzDa",
};

function Abschnitt({ titel, children }: { titel: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display font-semibold text-dark">{titel}</h2>
      <div className="mt-2 space-y-2 text-muted">{children}</div>
    </section>
  );
}

export default function ImpressumPage() {
  return (
    <div className="mx-auto min-h-dvh max-w-lg bg-background px-5 pb-16 pt-[max(1rem,env(safe-area-inset-top))]">
      <Link
        href="/"
        className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-primary-dark"
      >
        <ArrowLeft size={18} aria-hidden />
        Zurück
      </Link>

      <h1 className="mt-4 font-display text-2xl font-bold text-dark">Impressum</h1>

      <div className="mt-6 space-y-7 text-[15px] leading-relaxed">
        <Abschnitt titel="Angaben gemäß § 5 DDG">
          <p>
            Nicolas Daum / PlatzDa.app
            <br />
            Bendestorfer Str. 6
            <br />
            21224 Rosengarten
          </p>
        </Abschnitt>

        <Abschnitt titel="Vertreten durch">
          <p>Nicolas Daum</p>
        </Abschnitt>

        <Abschnitt titel="Kontakt">
          <p>
            Telefon:{" "}
            <a href="tel:+491705523252" className="text-primary-dark underline">
              +49 170 5523252
            </a>
            <br />
            E-Mail:{" "}
            <a href="mailto:impressum@nicolas-daum.ai" className="text-primary-dark underline">
              impressum@nicolas-daum.ai
            </a>
          </p>
        </Abschnitt>

        <Abschnitt titel="Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV">
          <p>
            Nicolas Daum
            <br />
            Bendestorfer Str. 6
            <br />
            21224 Rosengarten
          </p>
        </Abschnitt>

        <Abschnitt titel="Verbraucherstreitbeilegung">
          <p>
            Wir nehmen nicht an Streitbeilegungsverfahren vor einer
            Verbraucherschlichtungsstelle teil und sind dazu auch nicht
            verpflichtet.
          </p>
        </Abschnitt>

        <Abschnitt titel="Haftung für die Angaben in PlatzDa">
          <p>
            PlatzDa ist eine kostenlose App, die zeigt, wo es in der Nähe gerade
            angenehm ist, draußen zu sein. Die Angaben zu Schatten, Ausstattung,
            Entfernung und Wetter sind <strong>Schätzungen und Vorschläge</strong>{" "}
            auf Basis freier Kartendaten (OpenStreetMap), Wetterdaten (Open-Meteo)
            und dem berechneten Sonnenstand. Der Schatten wird berechnet, nicht
            vor Ort gemessen. Meldungen anderer Nutzerinnen und Nutzer
            („Community-Meldungen“) sind ungeprüft und geben nur deren
            persönlichen Eindruck wieder.
          </p>
          <p>
            Diese Angaben ersetzen nicht den eigenen Blick vor Ort und die eigene
            Einschätzung. Das gilt besonders für die Sicherheit (etwa an Straßen
            oder Gewässern) und die Aufsichtspflicht gegenüber Kindern. Für die
            Richtigkeit, Vollständigkeit und Aktualität übernehmen wir keine
            Gewähr. Eine Haftung für Schäden, die durch die Nutzung dieser
            Angaben entstehen, ist ausgeschlossen, soweit dies gesetzlich
            zulässig ist.
          </p>
        </Abschnitt>

        <Abschnitt titel="Haftung für Inhalte">
          <p>
            Die Inhalte unserer Seiten wurden mit größter Sorgfalt erstellt. Für
            die Richtigkeit, Vollständigkeit und Aktualität der Inhalte können wir
            jedoch keine Gewähr übernehmen. Als Diensteanbieter sind wir gemäß § 7
            Abs. 1 DDG für eigene Inhalte auf diesen Seiten nach den allgemeinen
            Gesetzen verantwortlich. Nach §§ 8 bis 10 DDG sind wir als
            Diensteanbieter jedoch nicht verpflichtet, übermittelte oder
            gespeicherte fremde Informationen zu überwachen oder nach Umständen zu
            forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
            Verpflichtungen zur Entfernung oder Sperrung der Nutzung von
            Informationen nach den allgemeinen Gesetzen bleiben hiervon unberührt.
            Eine diesbezügliche Haftung ist jedoch erst ab dem Zeitpunkt der
            Kenntnis einer konkreten Rechtsverletzung möglich. Bei Bekanntwerden
            von entsprechenden Rechtsverletzungen werden wir diese Inhalte
            umgehend entfernen.
          </p>
        </Abschnitt>

        <Abschnitt titel="Haftung für Links">
          <p>
            Unser Angebot enthält Links zu externen Webseiten Dritter, auf deren
            Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden
            Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten
            Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten
            verantwortlich. Die verlinkten Seiten wurden zum Zeitpunkt der
            Verlinkung auf mögliche Rechtsverstöße überprüft. Rechtswidrige Inhalte
            waren zum Zeitpunkt der Verlinkung nicht erkennbar. Eine permanente
            inhaltliche Kontrolle der verlinkten Seiten ist jedoch ohne konkrete
            Anhaltspunkte einer Rechtsverletzung nicht zumutbar. Bei Bekanntwerden
            von Rechtsverletzungen werden wir derartige Links umgehend entfernen.
          </p>
        </Abschnitt>

        <Abschnitt titel="Karten, Wetter und Bilder">
          <p>
            Ortsdaten und Namen: © OpenStreetMap-Mitwirkende (ODbL). Wetterdaten:
            Open-Meteo. Ortssuche: Nominatim/OpenStreetMap. Luftbilder: Esri,
            Maxar, Earthstar Geographics. Fotos: OpenStreetMap-Mitwirkende /
            Wikimedia Commons.
          </p>
        </Abschnitt>

        <Abschnitt titel="Urheberrecht">
          <p>
            Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen
            Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung,
            Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der
            Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des
            jeweiligen Autors bzw. Erstellers. Downloads und Kopien dieser Seite
            sind nur für den privaten, nicht kommerziellen Gebrauch gestattet.
            Soweit die Inhalte auf dieser Seite nicht vom Betreiber erstellt
            wurden, werden die Urheberrechte Dritter beachtet. Insbesondere werden
            Inhalte Dritter als solche gekennzeichnet. Solltest du trotzdem auf
            eine Urheberrechtsverletzung aufmerksam werden, bitten wir um einen
            entsprechenden Hinweis. Bei Bekanntwerden von Rechtsverletzungen werden
            wir derartige Inhalte umgehend entfernen.
          </p>
        </Abschnitt>

        <Abschnitt titel="Datenschutz">
          <p>
            Unsere Datenschutzerklärung findest du{" "}
            <Link href="/datenschutz" className="text-primary-dark underline">
              hier
            </Link>
            .
          </p>
        </Abschnitt>

        <p className="text-xs leading-relaxed text-muted">
          Erstellt mit Impressum-Generator.de. Nach einer Vorlage der Kanzlei
          Hasselbach.
        </p>
      </div>
    </div>
  );
}
