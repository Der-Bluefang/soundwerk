# Soundwerk

Ein schnelles, responsives **Soundboard mit Baustein-Composer**. Es besteht nur aus statischen Dateien und ist damit direkt für GitHub Pages geeignet. Nach dem ersten Aufruf kann es als PWA installiert und offline weitergenutzt werden.

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

### RE3-Soundset

Das Standard-Soundset enthält den RE3-Pack mit Willkommensgong, Begrüßungen und den vorgesehenen Haltestellen. Es wird aus [`data/sounds.json`](data/sounds.json) geladen; die ausgelieferten Clips liegen unter `assets/audio/re3/`.

Die ursprüngliche Aufnahme, Transkripte und Render-Arbeitsdateien verbleiben bewusst unter `incoming/` bzw. `work/` und werden nicht versioniert. Dieses Repository ist für die private Nutzung vorgesehen; die Zugriffsrechte für enthaltene Audiodateien liegen bei seinem Eigentümer.

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

Das Repository ist für private Nutzung vorgesehen. Vor einem GitHub-Pages-Deployment muss der Eigentümer ausdrücklich prüfen, ob die gewählte Pages-Zugriffskonfiguration die enthaltenen Audiodateien nur für berechtigte Personen bereitstellt. Eine normale GitHub-Pages-URL kann trotz privatem Repository öffentlich erreichbar sein.

GitHub Pages ist rein statisch: Die Webapp kann Sounds abspielen, Bausteine zusammenstellen und Favoriten lokal speichern. Das dauerhafte Hochladen oder Bearbeiten von Audio direkt im Browser benötigt dagegen ein separates Backend bzw. GitHub-Authentifizierung. Die Pflege erfolgt daher über die versionierten Repo-Dateien.

## Qualität prüfen

```bash
npm test
```

Die Tests prüfen Manifest-Validierung, Suche/Filter, Composer-Reihenfolge und die wesentlichen statischen PWA-Dateien.
