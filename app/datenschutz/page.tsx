import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Datenschutzerklärung · PlatzDa",
};

function Abschnitt({ titel, children }: { titel: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display font-semibold text-dark">{titel}</h2>
      <div className="mt-2 space-y-2 text-muted">{children}</div>
    </section>
  );
}

/**
 * ENTWURF. Auf die tatsächliche Datenverarbeitung der App zugeschnitten, aber
 * vor der Veröffentlichung ausfüllen ([Platzhalter]) und juristisch prüfen lassen.
 */
export default function DatenschutzPage() {
  return (
    <div className="mx-auto min-h-dvh max-w-lg bg-background px-5 pb-16 pt-[max(1rem,env(safe-area-inset-top))]">
      <Link
        href="/"
        className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-primary-dark"
      >
        <ArrowLeft size={18} aria-hidden />
        Zurück
      </Link>

      <h1 className="mt-4 font-display text-2xl font-bold text-dark">
        Datenschutzerklärung
      </h1>

      <p className="mt-3 rounded-2xl border border-accent/50 bg-accent-soft p-3 text-xs leading-relaxed text-accent-ink">
        Entwurf, auf die App zugeschnitten, aber bitte [Platzhalter] ausfüllen und
        vor der Veröffentlichung juristisch prüfen lassen.
      </p>

      <div className="mt-6 space-y-7 text-[15px] leading-relaxed">
        <Abschnitt titel="Verantwortlicher">
          <p>
            Verantwortlich für die Datenverarbeitung ist die im{" "}
            <Link href="/impressum" className="text-primary-dark underline">
              Impressum
            </Link>{" "}
            genannte Person.
          </p>
        </Abschnitt>

        <Abschnitt titel="Überblick">
          <p>
            PlatzDa kommt <strong>ohne Konto, ohne Login und ohne Tracking</strong>{" "}
            aus. Es werden keine Cookies zu Werbe- oder Analysezwecken gesetzt und
            keine Nutzungsprofile erstellt.
          </p>
        </Abschnitt>

        <Abschnitt titel="Hosting und Server-Logfiles">
          <p>
            Die App wird bei [Hosting-Anbieter, z. B. Vercel] gehostet. Beim Abruf
            fallen technisch bedingt Zugriffsdaten an (u. a. IP-Adresse, Zeitpunkt,
            angefragte Adresse). Die IP-Adresse wird zusätzlich kurzzeitig genutzt,
            um Missbrauch der Melde-Funktion zu begrenzen (Rate-Limiting), und nicht
            dauerhaft gespeichert.
          </p>
          <p>
            Rechtsgrundlage ist unser berechtigtes Interesse an einem sicheren,
            stabilen Betrieb (Art. 6 Abs. 1 lit. f DSGVO).
          </p>
        </Abschnitt>

        <Abschnitt titel="Standortdaten">
          <p>
            Wenn du es erlaubst, ermittelt dein Browser deinen Standort, damit wir
            Orte in deiner Nähe zeigen können. Die Koordinaten werden an unseren
            Server übermittelt, um passende Orte und das Wetter abzurufen. Es
            entsteht <strong>kein dauerhaftes Standortprofil</strong>.
          </p>
          <p>
            Die Freigabe ist freiwillig; ohne sie zeigen wir eine Beispielstadt oder
            einen von dir gesuchten Ort. Rechtsgrundlage ist deine Einwilligung
            (Art. 6 Abs. 1 lit. a DSGVO), die du in den Browser-Einstellungen
            jederzeit widerrufen kannst.
          </p>
        </Abschnitt>

        <Abschnitt titel="Community-Meldungen">
          <p>
            Du kannst zu einem Ort anonym melden, wie es dort gerade ist (z. B. „zu
            sonnig“). Gespeichert werden die Art der Meldung, ein optionaler kurzer
            Text, der Ortsbezug, eine zufällige, gerätebezogene Kennung (gegen Spam)
            sowie Zeitstempel. <strong>Kein Name, keine Anmeldung.</strong> Meldungen
            werden nach rund drei Stunden ausgeblendet und dann automatisch aus
            der Datenbank gelöscht.
          </p>
          <p>
            Die Speicherung erfolgt bei Supabase (Server-Standort Europa) als
            Auftragsverarbeiter. Rechtsgrundlage ist unser berechtigtes Interesse an
            einer hilfreichen Gemeinschafts-Funktion (Art. 6 Abs. 1 lit. f DSGVO).
            Bitte gib in Freitexten keine personenbezogenen Daten an.
          </p>
        </Abschnitt>

        <Abschnitt titel="Karten und Luftbilder">
          <p>
            Die Kartenansicht lädt Kartenkacheln von CARTO und Luftbilder von Esri
            direkt in deinen Browser. Dabei werden deine IP-Adresse und der
            angezeigte Kartenausschnitt an diese Anbieter übertragen. Es gelten deren
            Datenschutzbestimmungen. Rechtsgrundlage: berechtigtes Interesse an der
            Kartendarstellung (Art. 6 Abs. 1 lit. f DSGVO).
          </p>
        </Abschnitt>

        <Abschnitt titel="Fotos">
          <p>
            Wo vorhanden, zeigen wir Fotos von Wikimedia Commons. Diese werden beim
            Anzeigen direkt von den Servern der Wikimedia Foundation geladen, wobei
            deine IP-Adresse dorthin übertragen wird.
          </p>
        </Abschnitt>

        <Abschnitt titel="Orts-, Wetter- und Suchdaten">
          <p>
            Orte (OpenStreetMap/Overpass), Wetter (Open-Meteo) und die Ortssuche
            (Nominatim) ruft <strong>unser Server</strong> für dich ab. Deine
            IP-Adresse wird dabei <strong>nicht</strong> an diese Dienste
            weitergegeben, übermittelt werden nur die für die Anfrage nötigen Angaben
            (Kartenausschnitt bzw. Suchbegriff).
          </p>
        </Abschnitt>

        <Abschnitt titel="Routenplanung">
          <p>
            Tippst du auf „Route dorthin“, öffnet sich Google Maps in einem neuen
            Fenster. Ab dann gilt die Datenschutzerklärung von Google. Bis zum Tippen
            werden keine Daten an Google übermittelt.
          </p>
        </Abschnitt>

        <Abschnitt titel="Speicherung auf deinem Gerät">
          <p>
            Für Komfort speichern wir einige Angaben lokal in deinem Browser
            (zuletzt bekannter Standort, Filter-Einstellungen, eine Spam-Schutz-
            Kennung). Diese verbleiben auf deinem Gerät und lassen sich über die
            Browser-Einstellungen löschen. Es werden keine Tracking-Cookies gesetzt.
          </p>
        </Abschnitt>

        <Abschnitt titel="Deine Rechte">
          <p>
            Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der
            Verarbeitung, Datenübertragbarkeit und Widerspruch sowie das Recht, eine
            erteilte Einwilligung zu widerrufen. Außerdem kannst du dich bei einer
            Datenschutz-Aufsichtsbehörde beschweren. Wende dich dafür an die im
            Impressum genannten Kontaktdaten.
          </p>
        </Abschnitt>
      </div>
    </div>
  );
}
