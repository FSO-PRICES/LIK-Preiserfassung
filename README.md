# lik-studio
lik-studio

## Datenanalyse

* **Es gibt ein Feld bei den Preismeldungen, welche nicht in das System von Presta exportiert wird: Ein Feld welches angibt wer eine Preismeldung verifiziert hat.**
* **Zudem werden alle anderen Daten ausser der Preismeldung nicht exportiert.**
* Der Artikeltext entspricht in den bereitgestellten Daten dem Katalog Produkt Text.
* Für die bessere nachvollziehung der Abläufe würde eine **Kopie von Echten Daten helfen**.

## Datei Referenzen
- `BDA_LIK-Studio_Version_BFS.pdf` **Gesamte Applikation und Prozess Beschreibung** -> `Lambda-IT Team Folder\Solutions\LIK_Tablet_Erfassungsanwendungen\BDA_LIK-Studio_Version_BFS.pdf`
- `LIK_Backoffice Handbuch_BFS_V1.pdf` **Backoffice Erklärung** -> `Lambda-IT Team Folder\Solutions\LIK_Tablet_Erfassungsanwendungen\LIK_Backoffice Handbuch_BFS_V1.pdf`

## Abkürzungen:
* PE: Preiserheber
* PMS: Preismeldestelle
* PM: Preismeldung

## Notizen / Fragen / Referenzen

### PEs <-> PMS's

Die zuordnung von einem PE zu einer PMS ist meistens simpel, ein PE kann jedoch nur zu gewissen produkten in einer PMS zugewiesen werden.

* Eine PMS kann von mehreren PEs bearbeitet werden. Siehe Abschnitt 3.2.1.4 ZUWEISUNG VON PREISMELDUNGEN AN PREISERHEBER (s. 44) in `BDA_LIK-Studio_Version_BFS.pdf`
> * PE#1 muss in PMS#1 alle Preismeldungen erheben (einfachster und häufigster Fall).
> * PE#2 muss in PMS#1 nur die Wurstwaren und alle Spirituosen erheben und sonst keine Arbeit
verrichten (hoch spezialisierter und sehr seltener Fall).
>
>   Gemäss dem oberen Beispiel muss es möglich sein, dass die PMS#1 von mehreren Preiserhebern bearbeitet
>   werden kann. PE#2 erhebt nur die Wurstwaren und alle Spirituosen und PE#1 erhebt den ganzen Rest von PMS#1.

### Validierung

* Validierung einer Preiserhebung (Grobbeschreibung): Absch. "Validierung der gemachten Arbeit" Seite 32 in `BDA_LIK-Studio_Version_BFS.pdf`

### Import & Export

* Der Export und Import kann partiell sein. Siehe Absch. 4.1.1.3 SCHNITTSTELLENBESCHREIBUNG (s. 86) in `BDA_LIK-Studio_Version_BFS.pdf`
* Informationen zu den Import/Export/Warenkorb Daten: Struktur, Beschreibung der Felder, etc. -> Seite 36, 38 (Beispiel import), 39, 41 (Beispiel export), 42 in `BDA_LIK-Studio_Version_BFS.pdf`

**Import**
* Wann: 20. und 25. eines Monats
* Es muss explizit angegeben werden für welchen Zeitramen ein Preismeldungsimport von Presta gilt.
* Kann neue Daten enthalten, konflikte müssen hädisch gelöst werden.

**Export**
* Wann: 1. und dem 15. eines Monats
* Kann partiell oder auch gänzlich exportieren.

### Wichtige Beschreibung original backoffice code und sonstiges

* `LIK_Backoffice Handbuch_BFS_V1.pdf`
* Preismeldung Datenstruktur und Erklärung: Seite 128 in `BDA_LIK-Studio_Version_BFS.pdf`
* Testfälle/Daten welche man übernehmen könnte fürs Testing: Abschnitt 4.4.3 Seite 164 in `BDA_LIK-Studio_Version_BFS.pdf`
* User Stories Abschnitt 3.4 Seite 71-82 in `BDA_LIK-Studio_Version_BFS.pdf`
