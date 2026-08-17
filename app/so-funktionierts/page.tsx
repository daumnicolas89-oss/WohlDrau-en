import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  MapPin,
  MessageCircle,
  Navigation,
  Sparkles,
  Sun,
  Toilet,
} from "lucide-react";

export const metadata: Metadata = {
  title: "So funktioniert's · PlatzDa",
};

function Abschnitt({
  Icon,
  titel,
  children,
}: {
  Icon: typeof Sun;
  titel: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-card bg-card p-5 shadow-card">
      <h2 className="flex items-center gap-2.5 font-display text-lg font-semibold text-dark">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary-dark">
          <Icon size={18} aria-hidden />
        </span>
        {titel}
      </h2>
      <div className="mt-3 space-y-2 text-[15px] leading-relaxed text-dark">
        {children}
      </div>
    </section>
  );
}

export default function SoFunktioniertsPage() {
  return (
    <div className="mx-auto min-h-dvh max-w-lg bg-background px-4 pb-16 pt-[max(1rem,env(safe-area-inset-top))]">
      <Link
        href="/"
        className="inline-flex min-h-11 items-center gap-1.5 px-1 text-sm font-semibold text-primary-dark"
      >
        <ArrowLeft size={18} aria-hidden />
        Zurück
      </Link>

      <h1 className="mt-4 px-1 font-display text-2xl font-bold text-dark">
        So funktioniert PlatzDa
      </h1>
      <p className="mt-2 px-1 text-[15px] leading-relaxed text-muted">
        PlatzDa zeigt dir, wo es jetzt draußen am angenehmsten ist:
        Spielplätze und Grünflächen in deiner Nähe, mit genug Schatten und allem,
        was zählt.
      </p>

      <div className="mt-6 space-y-4">
        <Abschnitt Icon={Sun} titel="Der Wert „Angenehm jetzt“">
          <p>
            Jeder Ort bekommt einen Wert von 0 bis 100, wie angenehm es dort{" "}
            <strong>gerade</strong> ist. Der Ring zeigt ihn auf einen Blick:
            grün = angenehm, gelb = mittel, rot = eher ungünstig.
          </p>
          <p>
            Er fasst vier Dinge zusammen: <strong>Schatten</strong> (zählt bei
            Sonne am meisten), <strong>Ausstattung</strong> (Toilette, Zaun …),{" "}
            <strong>Meldungen anderer Eltern</strong> und die{" "}
            <strong>Entfernung</strong>. Auf der Detailseite kannst du unter „Wie
            kommt dieser Wert zustande?“ genau nachsehen.
          </p>
          <p>
            Der Schatten ist <strong>gerechnet, nicht gemessen</strong>. Er kommt
            aus dem Sonnenstand, den erfassten Bäumen, den Gebäuden ringsum und
            dem Gelände am Horizont.
            Eine gute Schätzung, keine Garantie.
          </p>
        </Abschnitt>

        <Abschnitt Icon={Sparkles} titel="Die Liste und die „Beste Wahl“">
          <p>
            Ganz oben steht der Favorit für <strong>genau jetzt</strong>, darunter
            eine ruhige Liste weiterer Orte, sortiert danach, wie angenehm es dort gerade ist. Tippe
            einen Ort an, um alle Details zu sehen.
          </p>
        </Abschnitt>

        <Abschnitt Icon={Clock} titel="Jetzt, in 30 Minuten oder in 1 Stunde">
          <p>
            Über die Leiste oben wählst du den Zeitpunkt. Die Sonne wandert, ein
            Ort kann in einer Stunde deutlich schattiger (oder sonniger) sein.
          </p>
        </Abschnitt>

        <Abschnitt Icon={MapPin} titel="Standort und Ortssuche">
          <p>
            Beim Öffnen fragt die App nach deinem Standort, um Orte in der Nähe zu
            zeigen. Über den <strong>Ortsnamen oben</strong> kannst du deinen
            Standort freigeben oder einen <strong>anderen Ort suchen</strong>.
            Praktisch, um vorab zu schauen, wohin man fährt.
          </p>
          <p>
            Dein Standort wird nur verwendet, um Orte in deiner Nähe zu finden und das Wetter dafür zu laden.
            Es gibt <strong>kein Konto und keinen Login.</strong>
          </p>
        </Abschnitt>

        <Abschnitt Icon={Navigation} titel="Hinkommen, Karte und Satellit">
          <p>
            Auf der Detailseite bringt dich <strong>„Route dorthin“</strong> direkt
            zur Navigation. In der Karten-Ansicht kannst du zwischen{" "}
            <strong>Karte und Satellit</strong> umschalten, aus der Luft erkennt
            man Bäume und den Platz oft leichter.
          </p>
        </Abschnitt>

        <Abschnitt Icon={Toilet} titel="Öffentliche Toiletten">
          <p>
            Über <strong>„Öffentliche Toilette suchen“</strong> siehst du öffentliche Toiletten
            in der Nähe, sortiert nach Entfernung, mit Route dorthin.
          </p>
        </Abschnitt>

        <Abschnitt Icon={MessageCircle} titel="Meldungen anderer Eltern">
          <p>
            Bist du an einem Ort, kannst du kurz melden, wie es gerade ist („zu
            sonnig“, „sehr voll“, „verschmutzt“ …). Das hilft den nächsten Eltern.
          </p>
          <p>
            Meldungen werden <strong>anonym</strong> gespeichert, sind an den{" "}
            <strong>Ort</strong> gebunden (nicht an dich) und rund{" "}
            <strong>drei Stunden</strong> sichtbar, danach zählen sie nicht mehr.
            Kein Login nötig.
          </p>
        </Abschnitt>
      </div>

      <p className="mt-6 px-1 text-xs leading-relaxed text-muted">
        Ortsdaten, Namen und Ausstattung stammen aus OpenStreetMap, einer freien
        Karte, die Freiwillige pflegen. Sie ist gut, aber lückenhaft; im Zweifel
        lohnt der Blick vor Ort. Das Wetter kommt von Open-Meteo.
      </p>

      <div className="mt-6 px-1">
        <Link href="/impressum" className="text-sm font-semibold text-primary-dark underline underline-offset-2">
          Impressum
        </Link>
      </div>
    </div>
  );
}
