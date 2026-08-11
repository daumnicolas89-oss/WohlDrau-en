# WohlDraußen

Zeigt in Echtzeit, wo es sich gerade lohnt, rauszugehen.

**Kernjob:** „Zeig mir jetzt den besten Ort, an den ich mit meinem Kind gehen
kann, ohne dass es in 15 Minuten schiefgeht.“ Zielgruppe sind Eltern mit
Kindern von etwa 1–8 Jahren. Jede Design- und Feature-Entscheidung richtet sich
danach aus.

## Schnellstart

```bash
npm install
npm run dev          # http://localhost:3000
```

Es sind keine API-Schlüssel nötig – OpenStreetMap und Open-Meteo laufen ohne
Registrierung. Ohne Datenbank landen Community-Meldungen im Arbeitsspeicher des
Servers (siehe [Community-Meldungen](#community-meldungen)).

| Befehl | Zweck |
| --- | --- |
| `npm run dev` | Entwicklungsserver |
| `npm run build` / `npm start` | Produktions-Build |
| `npm test` | Unit-Tests für Schatten-, Score- und Dedup-Logik |
| `npm run typecheck` | TypeScript ohne Emit |
| `npm run lint` | ESLint |
| `npm run icons` | PWA-Icons neu erzeugen |
| `npm run tokens` | Design-Tokens für Penpot & Co. exportieren |

## Projektstruktur

```
app/
  layout.tsx            Fonts, PWA-Metadaten, Service-Worker-Registrierung
  page.tsx              Home / Entdecken
  ort/[...id]/page.tsx  Detailseite (Catch-all, weil OSM-IDs "way/123" heißen)
  api/places/route.ts   Overpass-Abfrage, Normalisierung, Cache
  api/weather/route.ts  Open-Meteo
  api/status/route.ts   Community-Meldungen (GET/POST, Rate-Limit)
  manifest.ts           PWA-Manifest
components/
  map/                  Map, PlaceMarker, MapControls
  filters/              FilterSheet, FilterChips
  place/                PlaceCard, PlaceDetail, ShadeMeter, ScoreBreakdown,
                        ShadeTimeline, AttributeList, PlacesLoading
  status/               ReportStatusModal
  ui/                   Sheet (Vaul), Button, ScoreRing, InfoButton
lib/
  osm.ts                Overpass-Queries + Normalisierung + Dedup
  sun.ts                Sonnenstand & Schattenberechnung
  scoring.ts            „Angenehm jetzt“-Score
  select.ts             Filter + Sortierung
  weather.ts            Open-Meteo-Client
  status.ts             Meldungstypen, Gültigkeit, Frische
  supabase.ts           Persistenz der Meldungen (mit In-Memory-Fallback)
  wording.ts            Zahlen → Sätze (die einzige Quelle für Formulierungen)
  utils.ts              Geo, Formatierung, anonyme ID
types/index.ts          Datenmodell
hooks/                  useGeolocation, usePlaces, useWeather, useStatuses, useNow
store/useFilters.ts     Filterzustand (Zustand, in localStorage gesichert)
tests/                  Unit-Tests der Fachlogik
public/sw.js            Service Worker
```

## Kern-Logik: „Angenehm jetzt“

### 1. Schatten (`lib/sun.ts`)

Kein statischer Wert, sondern eine Berechnung aus dem tatsächlichen
Sonnenstand:

- **Sonnenstand** über [SunCalc](https://github.com/mourner/suncalc).
  Achtung: SunCalc 2.x liefert **Grad** und misst das Azimut **im
  Uhrzeigersinn ab Norden** – anders als 1.x.
- **Baumkronen**: Anzahl der in OSM erfassten Bäume im Umkreis, umgerechnet auf
  den Kronendeckungsgrad. Kronen schirmen am besten bei hoher Sonne ab.
- **Gebäudeschatten**: geometrisch. Jedes Gebäude in der Nähe wirft einen
  Schatten der Länge `Höhe / tan(Sonnenhöhe)` von der Sonne weg; getroffen wird
  der Ort, wenn er in diesem Streifen liegt. Auf großen Flächen wird der Effekt
  gedämpft – ein Haus verdunkelt keinen ganzen Park.
- **Bewölkung** aus dem Wetter-Feed.

Die Anteile werden multiplikativ zu `currentShadeScore` (0–100) kombiniert und
zu `schattig / teils / volle Sonne / keine direkte Sonne` verdichtet.

Da OSM keine Gebäudehöhen garantiert, wird mit ~11 m (≈ 3,5 Geschosse)
gerechnet. Die App weist die Verlässlichkeit pro Ort aus („gute Datenlage“ …
„grobe Schätzung“), statt Genauigkeit vorzutäuschen.

### 2. Score (`lib/scoring.ts`)

```
pleasantScore = shadeScore   * 0.45
              + amenityScore * 0.25
              + statusScore  * 0.20
              + distanceScore* 0.10
```

Alle vier Komponenten laufen von 0 bis 100 und werden als `breakdown` am Ort
mitgeliefert – der Score bleibt damit nachvollziehbar.

- **shadeScore** – `desiredShade()` bestimmt aus gefühlter Temperatur und
  UV-Index, wie viel Schatten gerade erwünscht ist. Bei 31 °C und UV 8 fast
  alles, bei 9 °C nahezu nichts – dort ist zu viel Schatten ein Malus, aber nur
  soweit er *vermeidbar* ist: Unter geschlossener Wolkendecke ist kein Ort
  sonniger als der andere, ein Malus dafür würde nur alle gleich abwerten.
- **amenityScore** – Toilette, Zaun und Wickeltisch dominieren, Wasser und
  Überdachung geben kleine Zuschläge.
- **statusScore** – 50 ist neutral; frische Meldungen heben oder senken den
  Wert, gewichtet nach Restgültigkeit.
- **distanceScore** – exponentieller Abfall, spürbar aber nie dominant.

Zusätzlich dämpft ein **Wetterfaktor** (Regenwahrscheinlichkeit, starker Wind)
das Gesamtergebnis. Er verschiebt die Gewichte nicht, sondern wirkt als
Multiplikator auf alle Orte gleich – Regen macht keinen Ort besser als den
anderen, aber jeden Ausflug schlechter.

### 3. Filter (`lib/select.ts`)

Harte Kriterien (Toilette, Wickeltisch, Zaun, Mindestschatten, Entfernung,
Ortsart) filtern; der Score sortiert den Rest. Aktive Filter erscheinen als
Chips über der Liste und lassen sich einzeln wegtippen.

Die Voreinstellung liegt bei **1,5 km** (rund 20 Minuten Fußweg). Das ist
bewusst eng: Weil Entfernung nur 10 % wiegt, würde ein gut ausgestatteter Platz
sonst eine 35-Minuten-Wanderung anführen. Innerhalb einer fußläufigen Spanne
darf die Ausstattung dagegen zu Recht entscheiden.

Weil OSM Zäune kaum erfasst (gemessen 2–3 % in Städten), zeigt das Filter-Sheet
neben jedem Kriterium, wie viele Orte im Umkreis es überhaupt erfüllen – eine
Datenlücke gehört sichtbar, nicht hinter eine leere Ergebnisliste.

## Datenquellen

| Quelle | Verwendung |
| --- | --- |
| [Overpass API](https://overpass-api.de/) (OpenStreetMap) | Spielplätze, Grünflächen, Toiletten, Trinkwasser, Bäume, Gebäude |
| [Open-Meteo](https://open-meteo.com/) | Temperatur, gefühlte Temperatur, Bewölkung, UV, Regen, Wind |
| Eigene Datenbank | Community-Meldungen |

Overpass-Antworten werden 24 Stunden serverseitig gecacht (auf ~1 km gerundeter
Schlüssel), Wetter 10 Minuten. Parallele Anfragen aus derselben Gegend teilen
sich einen Overpass-Call; fällt Overpass aus, wird notfalls die letzte Antwort
ausgeliefert.

Zusätzlich landet jede Antwort auf der Platte (`lib/placesCache.ts`, standardmäßig
unter `os.tmpdir()`, per `WD_CACHE_DIR` umstellbar). Ein Serverneustart kostet
den Overpass-Preis damit nicht erneut: gemessen 59 ms statt 15–34 s. Fällt
Overpass aus, werden im Notfall auch bis zu 30 Tage alte Daten ausgeliefert –
Lage und Ausstattung ändern sich kaum, und der Schatten wird ohnehin live
gerechnet.

Öffentliche Overpass-Instanzen antworten regelmäßig mit 429 („kein Slot frei“).
Das ist der Normalfall, kein Fehler: `runOverpass()` wartet kurz und fragt
denselben Server erneut, bevor es auf den Spiegel wechselt. Gemessen antwortet
Overpass bei 2,5 km Radius in wenigen Sekunden, bei größeren Flächen wächst die
Antwort schnell auf mehrere Megabyte – deshalb ist der Suchradius auf 3 km
gedeckelt und die größte Filterstufe liegt bei 2,5 km. Für „mit Kind kurz raus“
ist das ohnehin die relevante Spanne.

Der Detail-Link trägt den Suchradius der Liste mit (`?...&r=3100`). Die
Detailseite wiederholt damit exakt die Abfrage der Liste und trifft den Cache –
sie ist sofort da, statt eine zweite Overpass-Anfrage zu stellen.

### Was OSM nicht weiß

Die Tag-Abdeckung für Elternthemen ist dünn. Deshalb:

- **Toilette**: gilt als vorhanden, wenn ein `amenity=toilets` bis 150 m
  entfernt liegt – die Entfernung wird mit angezeigt.
- **Wickeltisch**: `changing_table`, meist am Toiletten-Objekt.
- **Eingezäunt**: `fenced=yes` oder ein passendes `barrier=*`.
- **Unbekannt** bleibt `undefined` und wird sichtbar als unbekannt dargestellt,
  nie als „nicht vorhanden“.
- Orte mit `access=private` oder `no` fallen raus.
- Derselbe Ort ist in OSM oft doppelt erfasst (als Punkt *und* als Fläche);
  `dedupe()` führt beides zusammen und behält den informativeren Eintrag.

## Community-Meldungen

Meldungen sind anonym, brauchen keine Anmeldung und tragen ein `expiresAt`
(3 Stunden, `STATUS_TTL_MS`). Rate-Limiting läuft zweistufig: Mindestabstand pro
IP und Stundendeckel pro anonymer ID (eine Zufalls-ID im localStorage, die
jederzeit gelöscht werden kann – kein Tracking).

Ohne Datenbank funktioniert alles, die Meldungen leben aber nur im Prozess –
auf Serverless-Hosting also bis zum nächsten Kaltstart. Für den Produktivbetrieb
Supabase konfigurieren:

```bash
cp .env.example .env.local
# NEXT_PUBLIC_SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY eintragen
```

Das Schema liegt in [`supabase/schema.sql`](supabase/schema.sql) (Tabelle
`place_status`). Sobald die Variablen gesetzt sind, schaltet `lib/supabase.ts`
automatisch um.

## PWA

Installierbar über Manifest und Service Worker. Der Service Worker ist bewusst
zurückhaltend: App-Shell und Kartenkacheln kommen aus dem Cache, **API-Daten
immer aus dem Netz**. Ein veralteter Schattenwert wäre schlimmer als gar keiner
– nur wenn das Netz ausfällt, greift die gespeicherte Kopie. Registriert wird er
ausschließlich im Produktions-Build.

## Verständlichkeit

Ein gestresster Elternteil soll in wenigen Sekunden erfassen, warum ein Ort
oben steht. Dafür gilt: **keine nackte Zahl ohne Satz daneben.**

`lib/wording.ts` ist die einzige Stelle, an der aus Werten Sprache wird –
`scoreWording`, `shadeReason`, `amenityBreakdownSentence`, `uvWording` und so
weiter. Wer eine Formulierung ändern will, ändert sie dort, und sie ist
überall gleich.

Konkret heißt das in der Oberfläche:

- Der „Angenehm jetzt“-Wert steht als Ring mit Zahl **und** als Wort
  („Besonders angenehm“, „Geht so“, „Eher unangenehm“). Ein „?“ erklärt, was
  hineinfließt.
- Schatten erscheint als Balken mit Farbe, als Aussage („Aktuell viel
  Schatten“) und mit Begründung („Viele Bäume ringsum halten die Sonne ab“).
- Die Aufschlüsselung ist eingeklappt. Aufgeklappt steht neben jeder Zahl ihr
  Gewicht und ein Satz: „Ausstattung, zählt 25 %, 30 – Wasser; zu Toilette und
  Zaun fehlt die Angabe.“
- Fehlende OSM-Angaben stehen als „Keine Angabe“ da, nie als stilles Nein.
- Im Wetterkopf trägt jeder Wert seine Bezeichnung: „Regenrisiko 0 %“ statt
  „0 %“, Sonnenstärke zusätzlich als Wort („mittel“).

## Barrierefreiheit

Die Palette ist auf Lesbarkeit in praller Sonne geprüft. `primary` (#2A9D8F)
trägt weiße Schrift nur mit 3.3:1 und ist deshalb Akzent-, keine Flächenfarbe;
Buttons nutzen `primary-dark` (4.6:1). Alle Text-/Hintergrundpaare erreichen
WCAG AA, Touch-Targets sind mindestens 44 × 44 px.

## Design-Tokens

`npm run tokens` erzeugt `design/tokens.json` im W3C-DTCG-Format – importierbar
in Penpot (Design Tokens) und andere Designtools. Quelle ist der `@theme`-Block
in `app/globals.css`, nicht eine gepflegte Kopie: Die Datei kann also nicht vom
Code abweichen. Wer umgekehrt in Penpot designt, exportiert dort die Tokens und
gleicht die Werte in `globals.css` ab.

## Bekannte Grenzen

- Gebäudehöhen sind geschätzt; die Gebäudeform wird auf ihren Mittelpunkt
  reduziert.
- Ohne Standortfreigabe zeigt die App den zuletzt bekannten Standort, sonst eine
  Beispielstadt (München), siehe `FALLBACK_COORDS` in `hooks/useGeolocation.ts`.
- Der In-Memory-Cache lebt pro Serverinstanz und stirbt beim Neustart; hinter
  mehreren Instanzen sinkt die Trefferquote entsprechend. Für den Produktivbetrieb
  wäre ein geteilter Cache (Redis o. Ä.) der nächste Schritt.
- Der Entfernungsfilter endet bei 2,5 km – siehe Overpass-Grenzen oben.
- Kein Dark Mode, keine Accounts, kein Routing – bewusst außerhalb des MVP.

## Lizenz & Attribution

Kartendaten und Orte stammen von OpenStreetMap-Mitwirkenden
([ODbL](https://www.openstreetmap.org/copyright)); der Hinweis ist in der
Kartenansicht sichtbar. Wetterdaten von Open-Meteo (CC BY 4.0).
