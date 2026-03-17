# Kaffeemaschine – Visualisierung & Backend

Dieses Projekt simuliert die Daten einer Kaffeemaschine und stellt sie über eine Visualisierung dar.  
Die Kommunikation zwischen Backend und Frontend erfolgt über **WebSockets**.  
Da die reale Anbindung zur physischen Maschine noch nicht umgesetzt wurde, werden aktuell **Demo-Daten aus einer MongoDB-Datenbank** verwendet.

Das Projekt dient als Grundlage für die spätere Integration der echten Maschine.

---

## Architekturüberblick

```
┌──────────────────────────┐
│   Physische Maschine     │
│                          │
└────────────┬─────────────┘
             │
             │ Anbindung
             ▼
┌──────────────────────────┐
│        Backend           │
│  → Python + WebSockets   │
│  → MongoDB (Demo-Daten)  │
└────────────┬─────────────┘
             │
             │ Live-Daten über WebSockets
             ▼
┌──────────────────────────┐
│        Frontend          │
│  → Visualisierung        |
|  → Dashboard             │
└──────────────────────────┘
```

---

## Verwendete Technologien

 - Backend:   Python
 - Frontend:  React
 - Datenbank: MongoDB

## Voraussetzungen

- **Python 3.9+**
- **MongoDB Server** (lokal oder in Docker)
- Benötigte Python-Pakete:
  ```bash
  pip install motor websockets
  ```

---

## Datenbankstruktur

- **Datenbankname:** `Kaffeemaschine`
- **Collections (Tabellen):**
    - `Status`
    - `CoffeeHistory`
    - `StatusHistory`

### Beispiel-Datensatz:
```json
{
  "_id": "69a960d7ac6667b7ceebe8cb",
  "temperature": 94,
  "water_ok": true,
  "grounds_ok": true,
  "cups_since_empty": 0,
  "cups_since_filled": 0,
  "water_flow": 0,
  "powered_on": true,
  "current_step": "Waiting",
  "last_updated": 2026-03-05T11:55:26.811+00:00
}
```

---

## Backend – Übersicht

Das Backend (siehe `BackendWithWebSocketAndDatabase.py`) stellt die Verbindung zur Datenbank her, simuliert die Kaffeemaschine anhand der Demo-Daten und sendet die Zustände in Echtzeit über WebSockets an die Visualisierung.

### Starten des Servers:
```bash
python .\BackendWithWebSocketAndDatabaseInAndOut.py
```

---

## Verbindung zur MongoDB

Das Backend nutzt `motor` (eine asynchrone MongoDB-Bibliothek):

```python
from motor.motor_asyncio import AsyncIOMotorClient

DATABASE_URL = "mongodb://localhost:27017"
client = AsyncIOMotorClient(DATABASE_URL)
database = client.Kaffeemaschine
```

Wenn die echte Maschine später Daten liefert, kann sie **denselben Aufbau** verwenden, um Daten in dieselben Collections zu schreiben.

---

## Funktionsübersicht

| Funktion | Beschreibung |
|-----------|--------------|
| Werte aus der Datenbank auslesen |
| `get_current_status()` | Liest den aktuellen Maschinenstatus aus der MongoDB-Datenbank aus und konvertiert `_id` und `last_updated` in lesbare Formate |
| `get_coffee_history()` | Lädt die gesamte Kaffee-Historie aus der Datenbank und konvertiert MongoDB-spezifische Felder |
| Statuswerte verändern |
| `update_step()` | Aktualisiert den aktuellen Schritt der Maschine (z.B. "HeatUp", "Brew") inklusive Wasserfluss und anderen Werten |
| Datenbankwerte aktualisieren |
| `update_status_in_db()` | Speichert den aktuellen Status in der Haupt-Collection und fügt automatisch einen Zeitstempel hinzu |
| `save_status_to_history()` | Archiviert den Status in der Verlaufs-Collection für spätere Analysen |
| `save_coffee_to_history()` | Speichert einen Kaffeebezug in der Historie (wird vom Frontend gesendet) |
| Konvertieren |
| `status_to_json()` | Konvertiert den Maschinenstatus in ein JSON-Format für WebSocket-Übertragungen |
| WebSocket Nachrichten senden |
| `broadcast_status()` | Sendet den aktuellen Status an alle verbundenen WebSocket-Clients |
| `send_current_status()` | Sendet den Status nur an einen bestimmten WebSocket-Client (bei Verbindungsaufbau) |
| `send_coffee_history_to_all()` | Sendet die gesamte Kaffee-Historie an alle verbundenen Clients |
| Hintergrundfunktionen |
| `continuous_waiting_broadcast()` | Hintergrund-Task, der jede Sekunde den Status broadcastet, wenn die Maschine im "Waiting"-Zustand ist |
| `check_auto_standby()` | Hintergrund-Task, der alle 10 Sekunden prüft, ob die Maschine nach 2 Minuten Inaktivität automatisch abkühlen soll |
| Simulations Funktionen vorbereiten und aufräumen |
| `prepare_machine_task()` | Bereitet die Maschine auf eine Simulation vor: markiert sie als "processing" und speichert den aktuellen Task |
| `cleanup_machine_task()` | Räumt nach einer Simulation auf: setzt "processing" zurück und löscht den Task |
| Simulationen |
| `simulate_heating()` | Simuliert das Aufheizen der Maschine von Raumtemperatur (22°C) auf 94°C in 45 Sekunden |
| `simulate_cooling()` | Simuliert das Abkühlen der Maschine von 94°C auf 22°C in 180 Sekunden |
| `simulate_coffee_brewing()` | Simuliert den gesamten Kaffeezubereitungsprozess (Mahlen, Pressen, Brühen etc.) basierend auf Kaffee-Typ und Menge |
| Initialswerte setzen |
| `initialize_status_once()` | Erstellt den initialen Maschinenstatus in der Datenbank beim Programmstart |
| Hauptfunktionen|
| `handler()` | WebSocket-Hauptfunktion: verarbeitet eingehende Nachrichten vom Frontend (Brew, HeatUp, etc.) |
| `main()` | Hauptfunktion: verbindet mit MongoDB, startet Hintergrund-Tasks und den WebSocket-Server |

## Globale Variablen

| Variable | Beschreibung |
|----------|--------------|
| `connected_clients` | Set mit allen aktiven WebSocket-Verbindungen |
| `machine_state` | Dictionary mit aktuellem Zustand: `input_state` (ready/await_amount/await_coffee_choice), `current_amount`, `is_processing`, `last_activity`, `current_task` |
| `coffee_types` | Dictionary mit Konfigurationen für verschiedene Kaffeesorten (Normal, Espresso) mit Schritt-Dauern |

## Datenbank-Collections

| Collection | Zweck |
|------------|-------|
| `Status` | Aktueller Maschinenstatus (nur 1 Eintrag) |
| `CoffeeHistory` | Historie aller getrunkenen Kaffees |
| `StatusHistory` | Archivierte Status-Updates |

Jeder Schritt wird zeitverzögert (mit `asyncio.sleep(1)`) simuliert, um den echten Ablauf nachzuahmen.

---

## Kommunikation über WebSocket

- Der WebSocket-Server läuft auf:  
  **`ws://localhost:8765`**
- Die Visualisierung (Frontend) verbindet sich mit diesem Server.
- Gesendete Nachrichten enthalten den aktuellen Zustand in folgendem Format:

### Beispiel:
```
"type": "status",
"data": {
  "temperature": 22,
  "water_ok": True,
  "grounds_ok": True,
  "water_flow": 0,
  "current_step": "Waiting",
  "powered_on": False,
  "cups_since_empty": 0,
  "cups_since_filled": 0,
  "last_updated": datetime.now().isoformat()
}
```

---

---

## Frontend – Übersicht

Das Frontend (im Ordner `frontend/`) ist eine React-Anwendung mit TypeScript und stellt die Visualisierung der Kaffeemaschine bereit. Es verbindet sich automatisch mit dem WebSocket-Server des Backends und zeigt alle Maschinendaten in Echtzeit an.

### Starten des Frontends:
```bash
cd frontend
npm install
npm start
```

Die Anwendung ist danach unter **`http://localhost:3000`** erreichbar.

---

## Verwendete Bibliotheken (Frontend)

| Bibliothek | Zweck |
|------------|-------|
| `react` + `react-dom` | UI-Framework |
| `react-router-dom` | Seitennavigation (Routing) |
| `typescript` | Typsicherheit |
| `bootstrap` + `react-bootstrap` | Basis-Styling & Komponenten |
| `@mui/icons-material` | Icons |
| `react-icons` | Weitere Icons (z.B. Kaffeesymbol, Temperatur) |
| `chart.js` + `react-chartjs-2` | Temperaturverlauf-Diagramm |
| `recharts` | Weitere Diagramme in der Analytics-Ansicht |
| `react-csv-downloader` | CSV-Export der Kaffee-Historie |

---

## Verbindung zum Backend (WebSocket)

Das Frontend verbindet sich automatisch beim Start mit dem WebSocket-Server:
```typescript
const WS_URL = "ws://localhost:8765";
const ws = new WebSocket(WS_URL);
```

Die gesamte WebSocket-Logik ist im `WebSocketContext` gekapselt und steht allen Komponenten über einen React-Context zur Verfügung.

### Empfangene Nachrichtentypen:

| Typ | Beschreibung |
|-----|--------------|
| `status` | Aktueller Maschinenstatus (Temperatur, Wasserfluss, Schritt etc.) |
| `history` | Vollständige Kaffee-Historie aus der Datenbank |

### Gesendete Nachrichten (Frontend → Backend):

| Nachricht | Beschreibung |
|-----------|--------------|
| `HeatUp` | Maschine einschalten & aufheizen |
| `CoolDown` | Maschine ausschalten & abkühlen |
| `History` | Kaffee-Historie beim Start anfragen |
| `Brew,<Typ>,<Menge>,<Stärke>` | Kaffeebezug starten (z.B. `Brew,Normal,150,3`) |

---

## Seitenübersicht

| Route | Komponente | Beschreibung |
|-------|------------|--------------|
| `/dashboard` | `Dashboard.tsx` | Maschinenstatus, Tages- & Gesamtstatistik, Ein-/Ausschalten |
| `/preparation` | `Preparation.tsx` | Kaffeesorte wählen (Normal/Espresso), Menge & Stärke einstellen und Bezug starten |
| `/analytic` | `Analytics.tsx` | Echtzeitanzeige von Temperatur, Wasserfluss, Maschinenzustand und Stärke |
| `/history` | `History.tsx` | Tabelle aller bisherigen Kaffeebezüge mit Datum, Typ und Stärke |
| `/report` | `Report.tsx` | Export der Kaffee-Historie als CSV-Datei |

---

## Globaler State (WebSocketContext)

Der `WebSocketContext` hält den gesamten Anwendungszustand und stellt ihn allen Komponenten zur Verfügung:

| Variable | Typ | Beschreibung |
|----------|-----|--------------|
| `isConnected` | `boolean` | WebSocket-Verbindung aktiv |
| `isOn` | `boolean` | Maschine eingeschaltet |
| `isReady` | `boolean` | Maschine auf Betriebstemperatur |
| `isBrewing` | `boolean` | Kaffeebezug läuft gerade |
| `isResting` | `boolean` | Maschine kühlt ab / Ruhezustand |
| `logs` | `string[]` | Rohdaten-Logs vom Backend (für Analytics) |
| `coffeeHistory` | `CoffeeEntry[]` | Liste aller Kaffeebezüge |
| `send(msg)` | `function` | Nachricht an das Backend senden |

---

## Mehrsprachigkeit

Die Anwendung unterstützt **Deutsch** und **Englisch**. Die Sprachumschaltung erfolgt über den `LanguageContext`. Alle angezeigten Texte sind in einer zentralen Übersetzungsdatei hinterlegt und werden über `texts.<key>` abgerufen.

Die aktuelle Sprache kann im `MenuBar` umgeschaltet werden (DE/EN-Flagge).

---


## Zusammenfassung

- Das Backend simuliert den **kompletten Kaffeeprozess** (Aufheizen, Brühen, Abkühlen usw.) und fügt die Daten in die Datenbank ein.
- Die Visualisierung zeigt **Daten aus MongoDB** an.
- Für die Anbindung sollen **reale Sensordaten in dieselben Collections** geschrieben werden.
- Der WebSocket-Server (`BackendWithWebSocketAndDatabaseInAndOut.py`) sorgt für die Kommunikation mit dem Frontend.
- Das Frontend ist eine **React + TypeScript** Anwendung und verbindet sich automatisch über WebSockets mit dem Backend.
- Die Benutzeroberfläche besteht aus fünf Seiten: **Dashboard**, **Preparation**, **Analytics**, **History** und **Report**.
- Der gesamte Maschinenstatus (Temperatur, Wasserfluss, Zustand etc.) wird **in Echtzeit** im Frontend angezeigt.
- Kaffeebezüge können direkt über das Frontend ausgelöst werden – Typ, Menge und Stärke sind dabei frei wählbar.
- Die **Kaffee-Historie** wird in der Datenbank gespeichert und kann im Frontend als **CSV exportiert** werden.
- Die Anwendung unterstützt **Deutsch und Englisch** und kann jederzeit umgeschaltet werden.
---

## Repository

GitHub-Link:  
👉 [https://github.com/albin659/Kaffeevollautomat_Visualisierung]

---

## Kontakt

Bei Fragen zur Datenstruktur oder zur Visualisierung bitte die Entwickler:innen der Visualisierungsklasse kontaktieren.
 - Albin Bajrami
 - David Fink
 - Lirik Dauti

---

© 2025 Kaffeevollautomat-Team
