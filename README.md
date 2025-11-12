# ☕ Kaffeemaschine – Visualisierung & Backend

Dieses Projekt simuliert die Daten einer Kaffeemaschine und stellt sie über eine Visualisierung dar.  
Die Kommunikation zwischen Backend und Frontend erfolgt über **WebSockets**.  
Da die reale Anbindung zur physischen Maschine noch nicht umgesetzt wurde, werden aktuell **Demo-Daten aus einer MongoDB-Datenbank** verwendet.

Das Projekt dient als Grundlage für die spätere Integration der echten Maschine.

---

## 📦 Architekturüberblick

```
┌──────────────────────────┐
│   Physische Maschine     │
│ (wird später angebunden) │
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
│     Visualisierung       │
│  → Frontend / Dashboard  │
└──────────────────────────┘
```

---

## ⚙️ Voraussetzungen

- **Python 3.9+**
- **MongoDB Server** (lokal oder in Docker)
- Benötigte Python-Pakete:
  ```bash
  pip install motor websockets
  ```

---

## 💾 Datenbankstruktur

- **Datenbankname:** `Kaffeemaschine`
- **Collections (Tabellen):**
    - `Aufheizen`
    - `Abkühlen`
    - `Anfeuchten`
    - `Mahlen`
    - `Pressen`
    - `Einen_Espresso_Brühen`
    - `Einen_Normalen_Kaffee_Brühen`
    - `Zwei_Espresso_Brühen`
    - `Zwei_Normale_Kaffee_Brühen`
    - `Zur_Startposition`

### Beispiel-Datensatz:
```json
{
  "_id": { "$oid": "68e2bb808c4e5898c6afd05d" },
  "step_type": "Anfeuchten",
  "temperature": 94,
  "water_ok": true,
  "grounds_ok": true,
  "water_flow": 5
}
```

---

## 🧠 Backend – Übersicht

Das Backend (siehe `BackendWithWebSocketAndDatabase.py`) stellt die Verbindung zur Datenbank her, simuliert die Kaffeemaschine anhand der Demo-Daten und sendet die Zustände in Echtzeit über WebSockets an die Visualisierung.

### Starten des Servers:
```bash
python .\BackendWithWebSocketAndDatabase.py
```

Wenn alles korrekt ist, erscheint:
```
MongoDB Verbindung erfolgreich
>>> Server läuft auf ws://localhost:8765
```

---

## 🔗 Verbindung zur MongoDB

Das Backend nutzt `motor` (eine asynchrone MongoDB-Bibliothek):

```python
from motor.motor_asyncio import AsyncIOMotorClient

DATABASE_URL = "mongodb://localhost:27017"
client = AsyncIOMotorClient(DATABASE_URL)
database = client.Kaffeemaschine
```

Wenn die echte Maschine später Daten liefert, kann sie **denselben Aufbau** verwenden, um Daten in dieselben Collections zu schreiben.

---

## ☕ Wie die Simulation funktioniert

Die Klasse `MachineState` speichert den aktuellen Zustand der Kaffeemaschine (Temperatur, Wasserstand, Kaffeesatz usw.).  
Die Simulation läuft anhand von Prozess-Schritten, die jeweils Daten aus der MongoDB auslesen.

| Funktion | Beschreibung |
|-----------|--------------|
| `get_heating_data()` | Lädt Temperaturdaten zum Aufheizen |
| `get_cooling_data()` | Lädt Daten zum Abkühlen |
| `get_coffee_step_data(step, type, amount)` | Holt die Daten eines Prozess-Schritts (z. B. Brühen, Mahlen) |
| `make_coffee_from_db()` | Führt den gesamten Brühvorgang mit allen Schritten aus |
| `cool_down_machine_from_db()` | Kühlt die Maschine automatisch ab |

Jeder Schritt wird zeitverzögert (mit `asyncio.sleep(1)`) simuliert, um den echten Ablauf nachzuahmen.

---

## 📡 Kommunikation über WebSocket

- Der WebSocket-Server läuft auf:  
  **`ws://localhost:8765`**
- Die Visualisierung (Frontend) verbindet sich mit diesem Server.
- Gesendete Nachrichten enthalten den aktuellen Zustand in folgendem Format:

```
<Schritt>,<Temperatur>,<Wasser OK>,<Kaffeesatz OK>,<Wasserfluss>,<Datum>
```

### Beispiel:
```
Aufheizen,90,1,1,0,12.11.2025
Brühen,94,1,1,5,12.11.2025
Warten,94,1,1,0,12.11.2025
```

---

## Integration (Maschinenanbindung)

Damit diese Integration problemlos funktioniert:

1. **Verbindung zur gleichen MongoDB herstellen**
   ```python
   from pymongo import MongoClient
   client = MongoClient("mongodb://localhost:27017/")
   db = client["Kaffeemaschine"]
   ```

2. **Echte Messwerte in die bestehenden Collections schreiben**
   ```python
   db["Aufheizen"].insert_one({
       "step_type": "Aufheizen",
       "temperature": 85,
       "water_ok": True,
       "grounds_ok": True,
       "water_flow": 0
   })
   ```

3. **Visualisierung starten**  
   → Diese liest automatisch die aktualisierten (realen) Daten aus der Datenbank.

Damit funktioniert die Visualisierung **ohne Codeänderung am Frontend**.

---

## 🧹 Datenverwaltung in MongoDB

- **Alle Testdaten löschen:**
  ```python
  db["Aufheizen"].delete_many({})
  ```

- **Neue Schritte hinzufügen:**  
  Eine neue Collection anlegen (z. B. `Reinigen`) und entsprechende Daten einfügen.

- **Alle Daten prüfen:**
  ```python
  for doc in db["Aufheizen"].find():
      print(doc)
  ```


## 📘 Zusammenfassung

- Die Visualisierung zeigt **Daten aus MongoDB** an.
- Das Backend simuliert den **kompletten Kaffeeprozess** (Aufheizen, Brühen, Abkühlen usw.).
- Für die Anbindung sollen **reale Sensordaten in dieselben Collections** geschrieben werden.
- Der WebSocket-Server (`BackendWithWebSocketAndDatabase.py`) sorgt für die Kommunikation mit dem Frontend.

---

## 📁 Repository

GitHub-Link:  
👉 [https://github.com/albin659/Kaffeevollautomat_Visualisierung]

---

## 📞 Kontakt

Bei Fragen zur Datenstruktur oder zur Visualisierung bitte die Entwickler:innen der Visualisierungsklasse kontaktieren.
 - Albin Bajrami
 - David Fink
 - Lirik Dauti

---

© 2025 Kaffeevollautomat-Team
