import asyncio
import websockets
from datetime import date

class MachineState:
    def __init__(self, temp=22):
        self.temp = temp
        self.water_ok = True
        self.grounds_ok = True
        self.cups_since_empty = 0
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
    async def execute(self, state: MachineState, send):
        if not state.water_ok:
            await send(">>> Nicht genug Wasser für den Kaffee! Bitte Wasser nachfüllen.")
            return False
        if not state.grounds_ok:
            await send(">>> Kaffeesatzbehälter voll! Bitte leeren.")
            return False

        state.water_flow = 5
        if state.cups_since_empty >= 22:
            state.grounds_ok = False

        await send(f"{self.description} | {state}")
        await asyncio.sleep(1)
        state.water_flow = 0
        return True

class BrewingUnitToStartPosition(Step): pass

grinding = [CoffeeGrind(i+1, "Mahlen") for i in range(6)]
press = [CoffeePress(i+1, "Pressen") for i in range(5)]
moisting = [PowderMoister(i+1, "Anfeuchten") for i in range(2)]
brewing = [CoffeeBrewing(i+1, "Brühen") for i in range(14)]
toStartPosition = [BrewingUnitToStartPosition(i+1, "Zur Startposition") for i in range(4)]

coffee_types = {
    "1": {"name": "Normal", "grinding": grinding, "press": press, "moisting": moisting, "brewing": brewing, "toStart": toStartPosition},
    "2": {"name": "Espresso", "grinding": grinding, "press": press, "moisting": moisting, "brewing": brewing, "toStart": toStartPosition}
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

    elif option == "2":
        await send("Wähle Kaffee: 1 = Normal, 2 = Espresso")

        return "await_choice"

    elif option == "3":
        state.water_ok = True
        await send(">>> Wassertank aufgefüllt.")

    elif option == "4":
        state.grounds_ok = True
        state.cups_since_empty = 0
        await send(">>> Kaffeesatzbehälter geleert.")

    elif option == "5":
        await send(">>> Maschine ausgeschaltet.")

    else:
        await send("Ungültige Eingabe!")

async def echo(websocket):
    awaiting_coffee_choice = False
    async def send(msg): await websocket.send(msg)

    async for message in websocket:
        if awaiting_coffee_choice:
            if message in coffee_types:
                recipe = coffee_types[message]
                if not state.water_ok:
                    await send(">>> Nicht genug Wasser! Bitte Wasser nachfüllen.")
                    continue
                if not state.grounds_ok:
                    await send(">>> Kaffeesatzbehälter voll! Bitte leeren.")
                    continue

                await send(f">>> Starte {recipe['name']}...")
                for step_list in ["grinding", "press", "moisting"]:
                    for step in recipe[step_list]:
                        await step.execute(state, send)

                for step in recipe["brewing"]:
                    ok = await step.execute(state, send)
                    state.cups_since_empty += 1
                    if not ok:
                        break

                for step in recipe["toStart"]:
                    await step.execute(state, send)

                await send(">>> Kaffee ist fertig!")
            else:
                await send("Ungültige Kaffee-Auswahl!")
            awaiting_coffee_choice = False
            continue

        res = await handle_command(message, send)
        if res == "await_choice":
            awaiting_coffee_choice = True

async def main():
    async with websockets.serve(echo, "localhost", 8765):
        print(">>> Server läuft auf ws://localhost:8765")
        await asyncio.Future()

if __name__ == "__main__":
    asyncio.run(main())