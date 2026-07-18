# Soundwerk

Ein schnelles, responsives **Soundboard mit Baustein-Composer**. Es besteht nur aus statischen Dateien und ist damit direkt für GitHub Pages geeignet. Nach dem ersten Aufruf kann es als PWA installiert und offline weitergenutzt werden.

> Die vier mitgelieferten Demo-Töne sind künstlich erzeugte Platzhalter. Sie enthalten keine fremden Ansagen, Musik oder sonstiges Material Dritter.

## Funktionen

- Einzelne Sounds abspielen, durchsuchen und nach Kategorien filtern
- Favoriten pro Gerät lokal speichern
- Zifferntasten `1`–`9` für zugewiesene Sounds; `Esc` stoppt die Wiedergabe
- Bausteine zum **Composer** hinzufügen, umsortieren und nacheinander abspielen
- Globale Lautstärke
- Responsive Bedienung für Desktop, Tablet und Smartphone
- Offline-Grundfunktion nach dem ersten Laden (PWA/Service Worker)
- Keine Frameworks, keine Tracker, kein Backend

## Lokal starten

```bash
cd soundboard-web
python3 -m http.server 4173
```

Danach `http://localhost:4173` im Browser öffnen. Ein lokaler Server ist nötig, weil Browser JSON- und Service-Worker-Dateien nicht zuverlässig über `file://` laden.

### Privates Soundset lokal öffnen

Für Material, das **nicht veröffentlicht** werden soll, liegt ein lokales, von Git ignoriertes Soundset unter `data/sounds.re3.private.json`. Es wird ausschließlich mit folgendem Parameter geladen:

```text
http://localhost:4173/?soundset=re3
```

Die zugehörigen Audiodateien liegen unter `assets/audio/re3/` und werden durch `.gitignore` vom Commit ausgeschlossen. Ohne den Parameter startet weiterhin das veröffentlichbare Demo-Soundset.

## Inhalte bearbeiten

Die Soundliste liegt in [`data/sounds.json`](data/sounds.json). Jeder Eintrag benötigt mindestens:

```json
{
  "id": "eindeutiger-name",
  "title": "Sichtbarer Name",
  "category": "Kategorie",
  "file": "assets/audio/eindeutiger-name.mp3",
  "description": "Kurze Beschreibung",
  "shortcut": "5"
}
```

`id` und `file` müssen eindeutig sein. Audiodateien dürfen aus Sicherheitsgründen nur unter `assets/audio/` liegen.

### Audio für das Web aufbereiten

Das Werkzeug wandelt WAV, M4A, MP3 usw. in ein browserfreundliches MP3 um und normalisiert auf ungefähr -16 LUFS:

```bash
./tools/prepare-audio.sh /pfad/zur/quelle.wav mein-sound
```

Danach entsteht `assets/audio/mein-sound.mp3`. Ergänze anschließend den passenden Eintrag in `data/sounds.json` und teste lokal.

## GitHub Pages veröffentlichen

Für einen weltweit erreichbaren Link ist ein **öffentliches** Repository am unkompliziertesten. Prüfe vor dem Upload, dass du alle Rechte an den Audiodateien besitzt – öffentliches Hosting verteilt sie mit.

1. Mit dem vorgesehenen **Bluefang-GitHub-Konto** anmelden (nicht mit einem anderen bereits eingeloggten Konto).
2. Repository anlegen, Änderungen committen und pushen.
3. In GitHub: **Settings → Pages → Build and deployment → Deploy from a branch**.
4. Branch `main` und Ordner `/(root)` wählen.
5. GitHub zeigt anschließend die öffentliche Pages-URL an.

GitHub Pages ist bewusst rein statisch: Die Webapp kann Sounds abspielen, Bausteine zusammenstellen und Favoriten lokal speichern. Das dauerhafte Hochladen oder Bearbeiten von Audio direkt im Browser benötigt dagegen ein separates Backend bzw. GitHub-Authentifizierung. Für dieses Projekt erfolgt die dauerhafte Pflege daher sauber über die versionierten Repo-Dateien.

## Qualität prüfen

```bash
npm test
```

Die Tests prüfen Manifest-Validierung, Suche/Filter, Composer-Reihenfolge und die wesentlichen statischen PWA-Dateien.
