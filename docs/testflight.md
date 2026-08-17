# TestFlight: die App an andere Eltern geben

Alles, was App Store Connect für **externes** Testen abfragt — zum Kopieren.
Externe Tester brauchen kein Konto bei dir, nur die kostenlose TestFlight-App
und einen Link.

---

## Der Ablauf in fünf Schritten

1. **Build hochladen** — Xcode → Organizer → Distribute App → TestFlight & App
   Store → Upload. Danach 10–30 Minuten warten („Processing"), es kommt eine
   E-Mail.
2. **App Store Connect → deine App → Reiter TestFlight**
3. Links unter **Tester und Gruppen** eine **neue Gruppe** anlegen, z. B.
   `Eltern`. Wichtig: Häkchen bei **„Öffentlichen Link aktivieren"**.
4. **Test-Informationen** ausfüllen (Texte unten) und den Build der Gruppe
   zuordnen → **Zur Beta-Prüfung einreichen**.
5. Nach der Freigabe (meist innerhalb eines Tages) steht der **öffentliche
   Link** bereit. Den verschickst du.

Ein Build ist danach **90 Tage** testbar. Jeder neue Upload braucht eine
höhere Build-Nummer (1 → 2 → 3), aber **keine** erneute Beta-Prüfung, solange
sich nichts Grundlegendes ändert.

---

## Beta-App-Beschreibung

*(Sehen die Tester in TestFlight, bevor sie installieren.)*

```
PlatzDa zeigt dir, wo es mit Kind gerade schön draußen ist: Spielplätze,
Parks und Wäldchen in deiner Nähe, sortiert nach dem Schatten, der dort
gerade wirklich liegt, und dem Wetter dieser Stunde.

Kein Konto, keine Werbung, keine Kosten. Die App ist noch neu – deshalb
freue ich mich über jede Rückmeldung, auch über die unbequemen.
```

## Was getestet werden soll

*(Das Feld „What to Test". Der wichtigste Text – er entscheidet, ob du
brauchbare Rückmeldungen bekommst oder nur „ganz nett".)*

```
Am wichtigsten: Stimmt der Schatten?

Wenn ihr an einem Platz seid, vergleicht bitte kurz, was die App sagt
(z. B. „Aktuell viel Schatten, geschätzt 70 %") mit dem, was ihr seht.
Wenn es nicht passt, ist das der wertvollste Hinweis überhaupt.

Außerdem interessiert mich:
– Seht ihr auf Anhieb, wohin ihr gehen solltet?
– Ist die Zahl von 0 bis 100 nachvollziehbar?
– Fehlt euch etwas, das ihr vor dem Losgehen wissen wollt?
– Fühlt sich irgendwo etwas langsam oder umständlich an?

Rückmeldung geht direkt in TestFlight: Screenshot machen, dann auf
„Feedback senden“. Oder schreibt mir einfach.
```

## Feedback-E-Mail

```
kontakt@nicolas-daum.ai
```

## Kontaktangaben für die Beta-Prüfung

Apple fragt Vorname, Nachname, E-Mail und Telefonnummer ab. Das sind
Pflichtfelder, sie werden **nicht** an Tester weitergegeben.

---

## Hinweise für die Beta-Prüfung

*(Feld „App Review Information" im TestFlight-Bereich. Kürzer als bei der
Store-Einreichung – aber die Moderation muss drinstehen.)*

```
PlatzDa braucht kein Konto und keinen Login, ein Testzugang ist daher
nicht nötig.

Für die volle Funktion sollte der Standort erlaubt werden. Ohne Freigabe
zeigt die App eine Beispielstadt (München), sodass sich alles auch ohne
Standort prüfen lässt. Die App funktioniert weltweit, getestet u. a. mit
Koordinaten in Kalifornien.

Nutzergenerierte Inhalte: Eltern können zu einem Ort anonym melden, wie
es dort gerade ist (feste Kategorien plus optionaler Text, max. 140
Zeichen). Jeder Beitrag hat einen Melden-Knopf; eine Meldung blendet ihn
für die meldende Person sofort aus und blockiert die verfassende Person
auf deren Gerät, ab zwei unabhängigen Meldungen ist er für alle
ausgeblendet. Alle Beiträge werden nach drei Stunden automatisch
gelöscht.
```

---

## Die Nachricht an die Eltern

*(Zum Weiterschicken, wenn der Link da ist.)*

```
Hi! Ich habe eine App gebaut, die zeigt, wo es mit Kind gerade schön
draußen ist – Spielplätze und Parks in der Nähe, sortiert danach, wo
jetzt wirklich Schatten liegt.

Magst du sie ausprobieren? Zwei Schritte:
1. „TestFlight“ aus dem App Store laden (kostenlos, ist von Apple)
2. Diesen Link antippen: [LINK]

Kein Konto, keine Werbung, kostet nichts. Wenn dir was auffällt – vor
allem wenn der Schatten nicht stimmt – sag mir gern Bescheid.
```

---

## Was NICHT passiert

- Der Build geht **nicht** in den App Store.
- Die Beta-Prüfung ist **nicht** die große App-Prüfung – sie ist kürzer
  und weniger streng.
- Tester sehen **keine** Daten deines Entwickler-Kontos.
- Du kannst den öffentlichen Link jederzeit wieder abschalten.
