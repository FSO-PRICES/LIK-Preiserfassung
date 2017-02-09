# lik-studio
lik-studio

## Install (Ubuntu 16.04)

Passwords and user information are saved in the KeePass **LIK-BFS** group.

* NodeJs:
  1. any-user> curl -sL https://deb.nodesource.com/setup\_6.x -o nodesource_setup.sh
  2. root> bash nodesource_setup.sh
  3. root> apt-get install nodejs
  4. root> apt-get install build-essential

* CouchDb
  1. root> apt-get update
  2. root> apt-get upgrade
  3. root> apt-get install software-properties-common # Probably already installed
  4. root> apt-get update
  5. root> apt-get install couchdb
  6. root> chown -R couchdb:couchdb /usr/bin/couchdb /etc/couchdb /usr/share/couchdb
  7. root> chmod -R 0770 /usr/bin/couchdb /etc/couchdb /usr/share/couchdb
  8. root> systemctl restart couchdb
  9. Modify bind address
  10. Add cors

* NPM http-server
  1. root> npm install -g http-server
  2. root> mkdir /srv/www
  3. root> adduser npm-http-server
  4. root> chown -R npm-http-server:npm-http-server /srv/www
  5. root> chmod 755 /srv/www
  6. [optional] root> iptables -t nat -I PREROUTING -p tcp --dport 80 -j REDIRECT --to-port 8080 # To use the default port.
  7. Add [http-server service](install/lik-http.service) to `/etc/systemd/system/lik-http.service`
  8. root> systemctl enable lik-http.service
  9. root> systemctl start lik-http.service
  10. root> systemctl status lik-http.service

After everything has been installed and configured:
  1. Secure the couchdb admin interface **futon** `http://13.94.141.213:5984/_utils/index.html` using the `Fix this` link on the bottom right.

## Access

* http-server: http://13.94.141.213
* Couchdb: http://13.94.141.213:5984/_utils/index.html

## Management

* Enable service (unmask seems not to work):
  ```
  systemctl enable lik-http.service
  systemctl start lik-http.service
  ```
* Disable service (mask seems not to work):
  ```
  systemctl stop lik-http.service
  systemctl disable lik-http.service
  ```

* Logging
  - http-server: root> journalctl -f -u lik-http.service
  - couchdb: root> journalctl -f -u couchdb.service

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
* PAG: PreisAbweichungsGruppen
* TD: Tablet-Device
* HF: Help files (Die PDF zur Unterstützung der PEs)

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

## Frontend Funktionsübersicht

### Status updates

**Nach Backoffice Sync**

> `LIK_Studio_Android 2.0.0\LIK_Studio_Preiserfasser\src\ch\gfk\likstudio\preiserfasser\hauptprozess\jobs\mainmenu\Upload.java`<br>
> Line 177



## Backend Funktionsübersicht

* Beim Löschen von referenzierten Einträgen wird eine Fehlermeldung angezeigt und erklärt dass der Eintrag verwendet wird.

### PM

* Auflistung mit fortgeschrittenem Filter.
  * Export & Sortierung, Paging
* Archivieren
* Archiv herunterladen (Jahr/Monat Schlüssel)

### PE

* Auflistung mit suchfeld.
  * Erstellen, Export & Sortierung, Paging
* Aktionen in der Liste für jeden PE
  * Ansicht, Editieren, Löschen
  * Arbeitszustellung editieren

**PE zu PMS Zuweisung** (über PE Auflistung erreichbar)

* Auflistung mit suchfeld.
  * Erstellen, Export & Sortierung, Paging
* Aktionen in der Liste für jede Zuweisung

### PMS

* Auflistung mit suchfeld.
  * Erstellen, Export & Sortierung, Paging
* Nach der einfachen eingabemaske beim Erstellen sind zusätzliche Informationen administrierbar.
* Aktionen in der Liste für jede PMS
  * Ansicht, Editieren, Löschen
  * Papierliste herunterladen, Preismeldestelle wie Vorperiode abbuchen, Zurücksetzen

### TD

* Auflistung mit suchfeld.
  * Erstellen, Export & Sortierung, Paging
* Aktionen in der Liste für jeden PE
  * Ansicht, Editieren, Löschen

### HF

* Auflistung
  * Hochladen
* Aktionen in der Liste für jede HF
  * Löschen, Herunterladen

### Cockpit

* Logout
* Phasen Übersicht
* Panic Reset Button
* Bezugszeitpunkt erfassen

### PAG

* Auflistung mit suchfeld.
  * Erstellen, Sortierung, Paging
* Nach der einfachen eingabemaske beim Erstellen sind zusätzliche Informationen administrierbar.
* Aktionen in der Liste für jede PMS
  * Ansicht, Editieren, Löschen
  * Papierliste herunterladen, Preismeldestelle wie Vorperiode abbuchen, Zurücksetzen
