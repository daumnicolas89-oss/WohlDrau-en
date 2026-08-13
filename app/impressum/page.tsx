import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Impressum · PlatzDa",
};

/**
 * ENTWURF. Die [Platzhalter] müssen ausgefüllt werden, und vor der
 * Veröffentlichung sollte das Impressum einmal juristisch geprüft werden.
 */
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

      <p className="mt-3 rounded-2xl border border-accent/50 bg-accent-soft p-3 text-xs leading-relaxed text-accent-ink">
        Entwurf, bitte alle [Platzhalter] ausfüllen und vor der Veröffentlichung
        einmal juristisch prüfen lassen.
      </p>

      <div className="mt-6 space-y-7 text-[15px] leading-relaxed text-dark">
        <section>
          <h2 className="font-display font-semibold text-dark">
            Angaben gemäß § 5 DDG
          </h2>
          <p className="mt-2 text-muted">
            [Vor- und Nachname]
            <br />
            [Straße und Hausnummer]
            <br />
            [PLZ und Ort]
          </p>
        </section>

        <section>
          <h2 className="font-display font-semibold text-dark">Kontakt</h2>
          <p className="mt-2 text-muted">
            E-Mail: [deine-adresse@beispiel.de]
            <br />
            Telefon (freiwillig): [Telefonnummer]
          </p>
        </section>

        <section>
          <h2 className="font-display font-semibold text-dark">
            Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV
          </h2>
          <p className="mt-2 text-muted">[Vor- und Nachname], Anschrift wie oben</p>
        </section>

        <section>
          <h2 className="font-display font-semibold text-dark">
            Karten, Wetter und Bilder
          </h2>
          <p className="mt-2 text-muted">
            Ortsdaten und Namen: © OpenStreetMap-Mitwirkende (ODbL). Wetterdaten:
            Open-Meteo. Ortssuche: Nominatim/OpenStreetMap. Luftbilder: Esri,
            Maxar, Earthstar Geographics. Fotos: OpenStreetMap-Mitwirkende /
            Wikimedia Commons.
          </p>
        </section>

        <section>
          <h2 className="font-display font-semibold text-dark">Haftung für Inhalte</h2>
          <p className="mt-2 text-muted">
            Die Angaben zu Schatten, Ausstattung und Entfernung sind Schätzungen
            auf Basis freier Kartendaten und können unvollständig oder veraltet
            sein. Sie ersetzen nicht den Blick vor Ort. Für Richtigkeit und
            Aktualität wird keine Gewähr übernommen.
          </p>
        </section>
      </div>
    </div>
  );
}
