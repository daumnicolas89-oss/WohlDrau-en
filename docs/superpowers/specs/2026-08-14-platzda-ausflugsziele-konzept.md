# PlatzDa — Ausflugsziele (Stufe 2, Konzept zur Entscheidung)

Stand: 14. August 2026

## Worum es geht

Heute ist PlatzDa ein **„jetzt, zu Fuß, mit dem Kind zum nächsten Spielplatz"**-Finder.
Die Idee: das Angebot um **Ausflugsziele** erweitern — Orte, wo man im Sommer
gezielt Schatten/Wasser findet und im Winter z. B. Sonne, Windschutz oder Schnee.
Damit würde aus dem Spielplatz-Finder ein **Ganzjahres-Rausgeh-Begleiter**.

## Der ehrliche Knackpunkt zuerst

Das ist **keine reine Anreicherung**, sondern berührt den Kern. Der Grund:

- Spielplätze sucht man **spontan und zu Fuß** (unsere jetzige Logik: Fußweg-Minuten, ~1–2 km).
- Ausflugsziele liegen meist **weiter weg** (5–30 km, mit Auto/ÖPNV) und werden **geplant**, oft am Wochenende.

Das sind **zwei verschiedene Nutzungssituationen**. Sie zu mischen, kann die App
mächtiger machen — oder ihren klaren Fokus verwässern („Ist das jetzt ein
Spontan-Tool oder ein Ausflugsplaner?"). Genau diese Frage sollten wir bewusst
entscheiden, bevor wir Code anfassen.

## Mögliche neue Ortstypen (familiennah)

| Typ | OSM-Grundlage | Saison-Stärke | Datenqualität |
|---|---|---|---|
| Große Parks / Grünanlagen | `leisure=park` | Sommer (Schatten), ganzjährig | gut (teils schon drin) |
| Wälder / Waldstücke | `natural=wood`, `landuse=forest` | Sommer (Schatten), Spazieren | gut, aber selten benannt |
| Seen / Badestellen / Ufer | `natural=water`, Badeplatz | Sommer (Wasser) | mittel |
| Aussichtspunkte | `tourism=viewpoint` | Übergang/Herbst | mittel |
| Rodelhügel | `piste:type` / Winter | Winter (Schnee) | dünn |

Schatten für große Flächen können wir bereits (Kronendeckung/Wald-Polygone).

## Wie zeigen wir sie? (Empfehlung)

**Nicht in einen Topf mit den Spielplätzen**, weil die Distanz-Maßstäbe völlig
verschieden sind (1 km vs. 20 km). Stattdessen ein **Umschalter/Filter oben**:
„In der Nähe" (Spielplätze, zu Fuß) ↔ „Ausflugsziele" (weiter, geplant). So
bleibt der schnelle Kern unangetastet, und die Ausflüge sind ein bewusst
gewählter zweiter Modus.

## Bewertung saisonal

Der Motor kippt schon wetterabhängig (Sommer: Schatten zählt; Kälte: Sonne/Wind).
Für Ausflugsziele käme dazu:
- **Sommer:** Schatten + Wasser (See/Planschen) hoch gewichtet.
- **Winter:** Sonne + Windschutz; „liegt Schnee?" als Kontext; Schatten egal.
- Manche Typen sind saisonal (Badestelle im Januar ausblenden).

## Risiken

- **Fokus-Verlust** (das größte): vom scharfen „jetzt"-Tool zum unklaren Allrounder.
- **Distanz/Fahrzeit:** echte Fahrzeit bräuchte eine Routing-API (Kosten, Komplexität). Start besser mit Luftlinie in km + größerem Suchradius.
- **Overpass-Last:** größerer Radius = deutlich mehr Daten, langsamer/teurer.
- **Dünne Daten:** Wald/See/Rodel sind in OSM oft unbenannt und ohne Ausstattung.

## Vorschlag: in Phasen, klein anfangen

- **Phase A (klein, kern-treu):** Im *bestehenden* Fußweg-Radius die Typen um nahe
  Parks/Wäldchen erweitern und klar labeln, im Sommer schattensortiert. Kaum
  Umbau (OSM-Query + Typ). Bleibt „zu Fuß, jetzt".
- **Phase B:** Saisonale Kriterien schärfen (Winter: Sonne/Wind/Schnee-Kontext).
- **Phase C (groß, echter Ausflug):** Zweiter Modus „Ausflugsziele" mit großem
  Radius + Distanz in km. Das ist der eigentliche Sprung — und die eigentliche
  strategische Entscheidung.

## Die eine Entscheidung, die alles steuert

**Wollen wir den „spontan, zu Fuß"-Kern wirklich Richtung „geplanter Ausflug mit
Auto" erweitern?**

- **Ja →** wir bauen auf Phase C hin (zweiter Modus, größerer Radius).
- **Nein / später →** wir bleiben beim Kern, machen aber Phase A/B (mehr nahe
  Naturorte, saisonal) — mehr Ganzjahres-Nutzen ohne Fokus-Verlust.

## Meine Empfehlung

**Erst den starken MVP mit echten Nutzern testen und (wenn du bereit bist)
deployen — dann entscheiden.** Die Ausflugsziele sind ein Szenario-Wechsel, den
echtes Nutzer-Feedback beantworten sollte, nicht eine Annahme. Wenn wir vorher
etwas bauen, dann **Phase A** (nahe Naturorte, kern-treu, kleiner Aufwand) —
das ist risikoarm und macht die App im Herbst/Winter sofort runder.
