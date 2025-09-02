import asyncio
import websockets
from datetime import date

class MachineState:
    def __init__(self, temp=22):
        self.temp = temp
        self.water_ok = True
        self.grounds_ok = True
        self.cups_since_empty = 0
        self.cups_since_filled = 0
        self.water_flow = 0

    def __repr__(self):
        water_status = "OK" if self.water_ok else "Leer"
        grounds_status = "OK" if self.grounds_ok else "Voll"
        return (f"Temp: {self.temp}°C, Wasser: {water_status}, "
                f"Kaffeesatz: {grounds_status}, Wasserdurchfluss: {self.water_flow}ml/s, "
                f"Datum: {date.today().strftime('%d.%m.%Y')}")

class Step:
    def __init__(self, second: int, description: str):
        self.second = second
        self.description = description

    async def execute(self, state: MachineState, send):
        await send(f"{self.description} | {state}")
        await asyncio.sleep(1)

class HeatUp(Step):
    def __init__(self, second: int, temp: int):
        super().__init__(second, f"Aufheizen")
        self.target_temp = temp
    
    async def execute(self, state: MachineState, send):
        state.temp = self.target_temp
        state.water_flow = 5 if 31 <= self.second <= 49 else 0
        await super().execute(state, send)
        if self.second >= 49 or self.second < 31:
            state.water_flow = 0

class CoffeeGrind(Step): pass
class CoffeePress(Step): pass

class PowderMoister(Step):
    async def execute(self, state: MachineState, send):
        state.water_flow = 5
        await super().execute(state, send)
        state.water_flow = 0

class CoffeeBrewing(Step):
    def __init__(self, second: int, description: str, amount: int = 1):
        super().__init__(second, description)
        self.amount = amount
    
    async def execute(self, state: MachineState, send):
        if not state.water_ok:
            await send(">>> Nicht genug Wasser für den Kaffee! Bitte Wasser nachfüllen.")
            return False
        if not state.grounds_ok:
            await send(">>> Kaffeesatzbehälter voll! Bitte leeren.")
            return False

        state.water_flow = 5
        if state.cups_since_empty + self.amount >= 3:
            state.grounds_ok = False
            
        if state.cups_since_filled + self.amount >= 5:
            state.water_ok = False

        await send(f"{self.description} | {state}")
        await asyncio.sleep(1)
        state.water_flow = 0
        return True

class BrewingUnitToStartPosition(Step): pass

coffee_types = {
    "1": {"name": "Normal", "grinding_steps": 6, "press_steps": 5, "moisting_steps": 2, "brewing_steps": 14, "toStart_steps": 4},
    "2": {"name": "Espresso", "grinding_steps": 6, "press_steps": 5, "moisting_steps": 2, "brewing_steps": 14, "toStart_steps": 4}
}

state = MachineState()

async def handle_command(option, send):
    if option == "1":
        await send(">>> Maschine heizt auf...")
        heatingUp = [HeatUp(sec, temp) for sec, temp in enumerate([
            22, 27, 31, 34, 37, 40, 43, 45, 47, 49,
            50, 52, 54, 56, 58, 60, 62, 64, 66, 68,
            70, 72, 74, 76, 78, 80, 82, 84, 86, 87,
            88, 89, 90, 90, 91, 91, 92, 92, 92, 92,
            92, 93, 93, 93, 93, 93, 93, 93, 93, 93,
            94, 94, 94, 94, 94
        ])]
        for step in heatingUp:
            await step.execute(state, send)
        await send(">>> Maschine ist betriebsbereit!")
        return "ready"

    elif option == "2":
        await send("Bitte Anzahl eingeben: 1 oder 2")
        return "await_amount"

    elif option == "3":
        state.water_ok = True
        state.cups_since_filled = 0
        await send(">>> Wassertank aufgefüllt.")
        return "ready"

    elif option == "4":
        state.grounds_ok = True
        state.cups_since_empty = 0
        await send(">>> Kaffeesatzbehälter geleert.")
        return "ready"

    elif option == "5":
        await send(">>> Maschine ausgeschaltet.")
        return "ready"

    else:
        await send("Ungültige Eingabe!")
        return "ready"

async def echo(websocket):
    current_state = "ready"  # ready, await_amount, await_coffee_choice
    current_amount = 1
    async def send(msg): await websocket.send(msg)

    async for message in websocket:
        print(f"Received: {message}, Current state: {current_state}")  # Debug output
        
        if current_state == "await_amount":
            if message in ["1", "2"]:
                current_amount = int(message)
                await send("Wähle Kaffee: 1 = Normal, 2 = Espresso")
                current_state = "await_coffee_choice"
            else:
                await send("Ungültige Anzahl! Bitte 1 oder 2 eingeben.")
                current_state = "ready"  # Zurück zum Hauptmenü bei ungültiger Eingabe
            continue

        if current_state == "await_coffee_choice":
            if message in coffee_types:
                recipe = coffee_types[message]

                await send(f">>> Starte {recipe['name']} ({current_amount}x)...")
                
                # Erstelle die Schritte mit der entsprechenden Anzahl
                grinding = [CoffeeGrind(i+1, "Mahlen") for i in range(recipe['grinding_steps'])]
                press = [CoffeePress(i+1, "Pressen") for i in range(recipe['press_steps'])]
                moisting = [PowderMoister(i+1, "Anfeuchten") for i in range(recipe['moisting_steps'])]
                brewing = [CoffeeBrewing(i+1, "Brühen", current_amount) for i in range(recipe['brewing_steps'] * current_amount)]
                toStartPosition = [BrewingUnitToStartPosition(i+1, "Zur Startposition") for i in range(recipe['toStart_steps'])]

                for step in grinding:
                    await step.execute(state, send)
                for step in press:
                    await step.execute(state, send)
                
                # Prüfe vor dem Anfeuchten, ob noch alles OK ist
                if not state.water_ok:
                    await send(">>> Nicht genug Wasser für den Kaffee! Bitte Wasser nachfüllen.")
                    current_state = "ready"
                    continue
                if not state.grounds_ok:
                    await send(">>> Kaffeesatzbehälter voll! Bitte leeren.")
                    current_state = "ready"
                    continue
                
                for step in moisting:
                    await step.execute(state, send)

                # Brühvorgang mit Statusprüfung
                brew_successful = True
                for step in brewing:
                    ok = await step.execute(state, send)
                    if not ok:
                        brew_successful = False
                        break

                # Nur wenn Brühen erfolgreich war, weiter machen
                if brew_successful:
                    for step in toStartPosition:
                        await step.execute(state, send)
                    
                    state.cups_since_empty += current_amount
                    state.cups_since_filled += current_amount
                    
                    # Statusprüfung NACH dem Kaffee
                    if not state.water_ok:
                        await send(">>> WARNUNG: Wassertank ist jetzt leer! Bitte nachfüllen.")
                    if not state.grounds_ok:
                        await send(">>> WARNUNG: Kaffeesatzbehälter ist jetzt voll! Bitte leeren.")
                    
                    await send(">>> Kaffee ist fertig!")
                else:
                    await send(">>> Kaffeezubereitung abgebrochen!")
                
                # Zurück zum Hauptmenü
                current_state = "ready"
                    
            else:
                # Wenn eine andere Eingabe kommt (z.B. "3" oder "4"), behandle sie als normalen Befehl
                result = await handle_command(message, send)
                if result:
                    current_state = result
            continue

        # Normale Befehle verarbeiten
        if current_state == "ready":
            result = await handle_command(message, send)
            if result:
                current_state = result

async def main():
    async with websockets.serve(echo, "localhost", 8765):
        print(">>> Server läuft auf ws://localhost:8765")
        await asyncio.Future()

if __name__ == "__main__":
    asyncio.run(main())