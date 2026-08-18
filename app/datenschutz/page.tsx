import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Datenschutzerklärung · PlatzDa",
};

function Abschnitt({ titel, children }: { titel: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-lg font-semibold text-dark">{titel}</h2>
      <div className="mt-2 space-y-2 text-muted">{children}</div>
    </section>
  );
}

export default function DatenschutzPage() {
  return (
    <div className="mx-auto min-h-dvh max-w-lg bg-background px-4 pb-16 pt-[max(1rem,env(safe-area-inset-top))]">
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
      <p className="mt-1 text-xs text-muted">Stand: 14. August 2026</p>

      <div className="mt-6 space-y-7 text-[15px] leading-relaxed">
        <Abschnitt titel="Präambel">
          <p>
            Mit dieser Datenschutzerklärung möchten wir dich darüber aufklären,
            welche Arten deiner personenbezogenen Daten (nachfolgend auch kurz als
            „Daten“) wir zu welchen Zwecken und in welchem Umfang verarbeiten. Sie
            gilt für die Nutzung der App PlatzDa (nachfolgend „Onlineangebot“). Die
            verwendeten Begriffe sind nicht geschlechtsspezifisch.
          </p>
          <p>
            Kurz gesagt: PlatzDa kommt{" "}
            <strong>ohne Konto, ohne Login und ohne Tracking</strong> aus. Es
            werden keine Werbe- oder Analyse-Cookies gesetzt und keine
            Nutzungsprofile erstellt.
          </p>
        </Abschnitt>

        <Abschnitt titel="Verantwortlicher">
          <p>
            Nicolas Daum / PlatzDa.app
            <br />
            Bendestorfer Str. 6
            <br />
            21224 Rosengarten
          </p>
          <p>
            E-Mail:{" "}
            <a href="mailto:kontakt@nicolas-daum.ai" className="text-primary-dark underline">
              kontakt@nicolas-daum.ai
            </a>
            <br />
            <Link href="/impressum" className="text-primary-dark underline">
              Impressum
            </Link>
          </p>
        </Abschnitt>

        <Abschnitt titel="Übersicht der Verarbeitungen">
          <p>
            <strong>Verarbeitete Datenarten:</strong> Standortdaten (Koordinaten,
            nur mit deiner Freigabe), Nutzungs-, Meta- und Kommunikationsdaten
            (z. B. IP-Adresse, Zeitpunkt des Zugriffs), Protokolldaten, sowie bei
            einer Meldung die Art der Meldung und ein optionaler kurzer Text.
          </p>
          <p>
            <strong>Betroffene Personen:</strong> Nutzerinnen und Nutzer des
            Onlineangebots.
          </p>
          <p>
            <strong>Zwecke:</strong> Bereitstellung des Onlineangebots und seiner
            Funktionen, Sicherheit und Missbrauchsvermeidung, technische
            Infrastruktur.
          </p>
        </Abschnitt>

        <Abschnitt titel="Maßgebliche Rechtsgrundlagen">
          <p>
            Im Folgenden findest du die Rechtsgrundlagen der DSGVO, auf deren Basis
            wir personenbezogene Daten verarbeiten. Bitte beachte, dass neben der
            DSGVO nationale Datenschutzvorgaben gelten können.
          </p>
          <p>
            <strong>Einwilligung</strong> (Art. 6 Abs. 1 S. 1 lit. a DSGVO),{" "}
            <strong>berechtigte Interessen</strong> (Art. 6 Abs. 1 S. 1 lit. f
            DSGVO) sowie <strong>rechtliche Verpflichtung</strong> (Art. 6 Abs. 1
            S. 1 lit. c DSGVO). In Deutschland gilt ergänzend das
            Bundesdatenschutzgesetz (BDSG).
          </p>
        </Abschnitt>

        <Abschnitt titel="Sicherheitsmaßnahmen">
          <p>
            Wir treffen geeignete technische und organisatorische Maßnahmen, um ein
            dem Risiko angemessenes Schutzniveau zu gewährleisten. Die Übertragung
            der Daten erfolgt verschlüsselt über TLS/SSL (HTTPS).
          </p>
        </Abschnitt>

        <Abschnitt titel="Hosting und Server-Logfiles">
          <p>
            Das Onlineangebot wird bei <strong>Vercel</strong> gehostet (Vercel
            Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, USA). Beim Abruf fallen
            technisch bedingt Zugriffsdaten in Server-Logfiles an (u. a.
            IP-Adresse, Zeitpunkt, angefragte Adresse). Diese werden für die Dauer
            von maximal 30 Tagen gespeichert und danach gelöscht oder
            anonymisiert. Die IP-Adresse wird zusätzlich kurzzeitig genutzt, um
            Missbrauch der Melde-Funktion zu begrenzen, und nicht dauerhaft
            gespeichert. Rechtsgrundlage ist unser berechtigtes Interesse an einem
            sicheren, stabilen Betrieb (Art. 6 Abs. 1 lit. f DSGVO).
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
            Die Freigabe ist freiwillig; ohne sie zeigen wir eine Beispielstadt
            oder einen von dir gesuchten Ort. Rechtsgrundlage ist deine
            Einwilligung (Art. 6 Abs. 1 lit. a DSGVO), die du in den
            Browser-Einstellungen jederzeit widerrufen kannst.
          </p>
        </Abschnitt>

        <Abschnitt titel="Orts-, Wetter- und Suchdaten">
          <p>
            Orte (OpenStreetMap/Overpass), Wetter (Open-Meteo) und die Ortssuche
            (Nominatim) ruft <strong>unser Server</strong> für dich ab. Deine
            IP-Adresse wird dabei <strong>nicht</strong> an diese Dienste
            weitergegeben; übermittelt werden nur die für die Anfrage nötigen
            Angaben (Kartenausschnitt bzw. Suchbegriff). Rechtsgrundlage:
            berechtigtes Interesse an der Bereitstellung der Funktion (Art. 6 Abs.
            1 lit. f DSGVO).
          </p>
        </Abschnitt>

        <Abschnitt titel="Karten und Luftbilder">
          <p>
            Die Kartenansicht lädt Kartenkacheln von CARTO und Luftbilder von Esri
            direkt in deinen Browser. Dabei werden deine IP-Adresse und der
            angezeigte Kartenausschnitt an diese Anbieter übertragen. Es gelten
            deren Datenschutzbestimmungen. Rechtsgrundlage: berechtigtes Interesse
            an der Kartendarstellung (Art. 6 Abs. 1 lit. f DSGVO).
          </p>
        </Abschnitt>

        <Abschnitt titel="Fotos">
          <p>
            Wo vorhanden, zeigen wir Fotos von Wikimedia Commons. Diese werden beim
            Anzeigen direkt von den Servern der Wikimedia Foundation (USA) geladen,
            wobei deine IP-Adresse dorthin übertragen wird.
          </p>
        </Abschnitt>

        <Abschnitt titel="Community-Meldungen">
          <p>
            Du kannst zu einem Ort anonym melden, wie es dort gerade ist (z. B. „zu
            sonnig“). Gespeichert werden die Art der Meldung, ein optionaler kurzer
            Text, der Ortsbezug, eine zufällige, gerätebezogene Kennung (gegen
            Spam) sowie Zeitstempel. <strong>Kein Name, keine Anmeldung.</strong>{" "}
            Meldungen werden nach rund drei Stunden ausgeblendet und dann
            automatisch aus der Datenbank gelöscht.
          </p>
          <p>
            Die Speicherung erfolgt bei Supabase (Auftragsverarbeiter,
            Server-Standort Europa). Rechtsgrundlage ist unser berechtigtes
            Interesse an einer hilfreichen Gemeinschafts-Funktion (Art. 6 Abs. 1
            lit. f DSGVO). Bitte gib in Freitexten keine personenbezogenen Daten
            an.
          </p>
        </Abschnitt>

        <Abschnitt titel="Routenplanung">
          <p>
            Tippst du auf „Route dorthin“, öffnet sich Google Maps in einem neuen
            Fenster. Ab dann gilt die Datenschutzerklärung von Google (USA). Bis
            zum Tippen werden keine Daten an Google übermittelt.
          </p>
        </Abschnitt>

        <Abschnitt titel="Speicherung auf deinem Gerät">
          <p>
            Für Komfort speichern wir einige Angaben lokal in deinem Browser
            (localStorage): zuletzt bekannter Standort, Filter-Einstellungen,
            gemerkte Plätze, das Kind-Profil (Altersgruppe und
            Wärmeempfinden, steuert Anzieh-Tipps und Sortier-Wünsche), von dir ausgeblendete Meldungen
            sowie eine zufällige Spam-Schutz-Kennung. Diese verbleiben auf deinem Gerät,
            werden nicht an uns übermittelt und lassen sich über die
            Browser-Einstellungen löschen. Es werden{" "}
            <strong>keine Tracking-Cookies</strong> gesetzt.
          </p>
        </Abschnitt>

        <Abschnitt titel="Kontaktaufnahme">
          <p>
            Wenn du uns per E-Mail kontaktierst, verarbeiten wir deine Angaben, um
            deine Anfrage zu beantworten. Rechtsgrundlage ist unser berechtigtes
            Interesse an der Beantwortung (Art. 6 Abs. 1 lit. f DSGVO), bei
            vertraglichem Bezug Art. 6 Abs. 1 lit. b DSGVO.
          </p>
        </Abschnitt>

        <Abschnitt titel="Internationale Datentransfers">
          <p>
            Soweit Daten in ein Drittland außerhalb der EU/des EWR übermittelt
            werden (etwa an Vercel, Esri, Wikimedia oder Google in den USA),
            erfolgt dies im Einklang mit den gesetzlichen Vorgaben. Für
            Übermittlungen in die USA stützen wir uns, soweit einschlägig, auf das
            Data Privacy Framework (DPF) und/oder Standardvertragsklauseln.
          </p>
        </Abschnitt>

        <Abschnitt titel="Schriftarten">
          <p>
            Wir verwenden die Schriftarten Inter und Plus Jakarta Sans. Diese
            werden lokal von unserem Server ausgeliefert und nicht von externen
            Diensten wie Google Fonts geladen. Es findet keine Datenübermittlung an
            Google statt.
          </p>
        </Abschnitt>

        <Abschnitt titel="Speicherung und Löschung">
          <p>
            Wir löschen personenbezogene Daten, sobald die zugrundeliegenden
            Einwilligungen widerrufen werden oder keine weiteren Rechtsgrundlagen
            für die Verarbeitung bestehen, und beachten dabei gesetzliche
            Aufbewahrungsfristen. PlatzDa selbst speichert darüber hinaus keine
            personenbezogenen Daten dauerhaft.
          </p>
        </Abschnitt>

        <Abschnitt titel="Deine Rechte">
          <p>
            Du hast nach der DSGVO insbesondere folgende Rechte: Widerspruch gegen
            die Verarbeitung, Widerruf erteilter Einwilligungen, Auskunft,
            Berichtigung, Löschung, Einschränkung der Verarbeitung und
            Datenübertragbarkeit. Außerdem hast du das Recht, dich bei einer
            Datenschutz-Aufsichtsbehörde zu beschweren. Wende dich dafür an die im
            Impressum genannten Kontaktdaten.
          </p>
        </Abschnitt>

        <Abschnitt titel="Änderung und Aktualisierung">
          <p>
            Wir bitten dich, dich regelmäßig über den Inhalt dieser
            Datenschutzerklärung zu informieren. Wir passen sie an, sobald die
            Änderungen der von uns durchgeführten Datenverarbeitungen dies
            erforderlich machen.
          </p>
        </Abschnitt>

        <p className="text-xs leading-relaxed text-muted">
          Erstellt mit dem Datenschutz-Generator.de von Dr. Thomas Schwenke,
          angepasst an die tatsächliche Verarbeitung in PlatzDa.
        </p>
      </div>
    </div>
  );
}
