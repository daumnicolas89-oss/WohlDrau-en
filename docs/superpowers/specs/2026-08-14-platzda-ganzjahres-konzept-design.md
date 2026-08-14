# PlatzDa — Ganzjahres-Konzept (Design)

Stand: 14. August 2026

## Kontext & Problem

PlatzDa beantwortet heute stark eine Sommer-Frage: „Wo ist Schatten?" Der
Schatten steht im Zentrum (Schatten-Balken, „Wie lange hält der Schatten?",
UV). Das ist im Sommer exzellent, macht die App aber gefühlt zu einem
**Sommer-Produkt**: Im Herbst/Winter wirkt sie weniger relevant, und Nutzer
vergessen sie über die Hälfte des Jahres.

Der Bewertungs-Motor ist bereits wetterabhängig gebaut (bei Kälte zählt
Schatten kaum noch, sonnige Ecken werden bevorzugt, der Rat-Satz kippt auf
„sonnige Ecken sind angenehmer"). Was fehlt, ist, dass das **Gesicht** der App
diesem Kippen folgt.

## Zielgruppe

Familien mit Kindern, Schwerpunkt **Krippe und Kita (ca. 1–6 Jahre)**,
Grundschule als Randbereich. Kleine Kinder sind das ganze Jahr draußen und
brauchen mehr Schutz (Hitze, UV, Kälte, Wind), deshalb ist ein ganzjährig
nützliches Konzept für diese Gruppe besonders wertvoll.

## Positionierung / Kern

PlatzDa ist im Kern ein **Orts-Finder**, der sich an Wetter und Jahreszeit
anpasst („eher A"), angereichert um **leichte, eingewobene Helfer** („ein bisschen
B"). Die Orte (Liste/Karte) und der „Angenehm-jetzt"-Wert bleiben der Held;
die Helfer stützen den Moment, ersetzen ihn nicht.

Eine-Satz-Kern (ganzjährig): **„Wo ist es gerade am angenehmsten draußen — und
wie gehe ich gut raus?"**

## Leitidee: Ein Gesicht, das dem Wetter folgt

**Entscheidung: wetter- statt kalendergesteuert.** Die App richtet sich nach
dem tatsächlichen Wetter jetzt am Ort, nicht nach dem Monat. Ein warmer
Oktobertag zeigt das Sommer-Gesicht, ein kalter Julitag das Kälte-Gesicht.
Das nutzt genau die Werte, die der Motor schon berechnet
(`desiredShade`, `coldPenalty`, Sonnenstand), und wirkt dadurch immer echt.

## Die drei Gesichter (plus Nacht)

Es ändern sich nur **Überschrift**, die **Begründung des Werts** und **welcher
Helfer oben steht**. Der Wert (0–100), Liste und Karte bleiben unverändert das
Rückgrat.

| Regime | Auslöser (aus vorhandenen Werten) | Überschrift sinngemäß | Betonung | Prominenter Helfer |
|---|---|---|---|---|
| 🔆 Heiß & sonnig | hoher Schatten-Bedarf (Hitze/UV), Sonne oben | „Wo ist Schatten?" | Schatten-Wert, UV, Eincremen | Was anziehen (Sonnenschutz) |
| 🌤️ Mild / Übergang | geringer Schatten-Bedarf, angenehme Temperatur | „Fast überall schön, such dir was Nettes" | Platz-Qualitäten (Spielplatz, Planschen, Nähe) | Beste Zeit (locker) |
| 🧥 Kalt & windig | niedrige gefühlte Temperatur, Kälte-Malus aktiv | „Wo ist Sonne und Windschutz?" | Sonne, Wind, Tageslicht | Was anziehen (warm) + Tageslicht-Fenster |
| 🌙 Nacht | Sonne unter dem Horizont | (bereits umgesetzt) „ohne Sonne, angenehm draußen" | keine Schatten-Aussage | — |

Das Nacht-Gesicht existiert bereits (kürzlich umgesetzt) und dient als Muster
dafür, wie ein Regime das Gesicht umschaltet.

## Neue Bausteine („B") — eingewoben, klein

### 1. „Was anziehen & mitnehmen"
Ein kurzer, wetterabhängiger Satz nahe dem Kopf (der „bevor ich losgehe"-Moment).
- Heiß: „Leichte Sachen, Sonnenhut, eincremen. Wasser mit."
- Mild: „Leichte Jacke reicht."
- Kalt/windig: „Warm anziehen, Mütze. Windig, also winddicht."

**v1 bewusst altersneutral** (passt für Krippe bis Grundschule). Feinjustierung
nach Kind-Alter ist eine spätere, optionale Erweiterung, kein Teil von v1.

Datenbasis: gefühlte Temperatur, UV, Wind, Regenrisiko (alles aus Open-Meteo,
schon vorhanden). Reine Ableitung, keine neue Schätzung.

### 2. „Beste Zeit heute / noch X Std Sonne"
Ein kleiner Hinweis aus dem Sonnenstand (exakt berechenbar, `sunTimes` liegt
schon vor).
- Heiß: „Jetzt volle Sonne, angenehmer ab dem späten Nachmittag."
- Kurze Tage/Kälte: „Noch rund 2 Std Sonne (bis 16:48)."

Datenbasis: Sonnenauf-/untergang und der bestehende Zeit-Vorschau-Mechanismus.

## Kuratiert aus „C" — nur auf echten Daten

- **Wind** (Open-Meteo, vorhanden) im Kälte-Gesicht sichtbarer machen.
- **„nass / matschig"** aus den **Community-Meldungen** (Meldungstyp existiert)
  nach Regen im relevanten Regime hervorheben.

Bewusst **nicht** dabei: geratene Modelle für vereisten Boden oder
Windschutz. Das wären neue, wackelige Schätzungen aus lückenhaften Daten,
genau die Falle, die wir beim Schatten-Modell gerade mühsam entschärft haben.

## Was unverändert bleibt

Motor (Bewertung, Schatten-Berechnung), Liste, Karte, Filter,
Community-Meldungen, der „Angenehm-jetzt"-Wert. Dieses Konzept ist
**Anreicherung, kein Umbau**.

## Kohärenz-Leitplanke

Jedes Element gehört zu **einem** Moment: „jetzt mit dem Kind raus". Alles,
was zu diesem Moment gehört (wo, wann, wie angezogen, was mitnehmen), darf
rein. Alles, was Richtung allgemeine Eltern-App zeigt (Schlaf, Rezepte,
Entwicklung, Termine), bleibt bewusst draußen.

## Nicht-Ziele (bewusst weggelassen)

- Kein Umbau des Motors oder der Datenquellen.
- Keine neuen geschätzten Größen ohne belastbare Datenbasis (kein
  Boden-Eis-Modell, kein Windschutz-Modell).
- Keine Alters-Feinjustierung in v1 (später optional).
- Keine allgemeinen Eltern-Features.

## Fixierte Entscheidungen

1. Wetter- statt kalendergesteuerte Gesichter.
2. „Was anziehen" in v1 altersneutral.
3. Orts-Finder bleibt der Held; Helfer sind klein und eingewoben.
4. Aus „C" nur datenbasierte Punkte (Wind, Community-Meldungen).

## Offene Punkte / später

- Optionale Kind-Alters-Einstellung für genauere Anzieh-/UV-Tipps.
- Feinschliff der Regime-Schwellen (Übergänge weich statt hart).
- Ob „Was anziehen" ein Satz im Kopf oder eine kleine eigene Karte wird
  (Detail für den Bauplan/Design-Feinschliff).

## Erfolgskriterien

- Die App fühlt sich an einem kalten Tag genauso „für mich gemacht" an wie an
  einem heißen, ohne dass etwas Sommerliches deplatziert wirkt.
- Kein einziger neuer Wert, der sich sicher gibt, aber auf wackeligen Daten
  steht.
- Der Kern bleibt scannbar und fokussiert; kein Feature-Wildwuchs.
