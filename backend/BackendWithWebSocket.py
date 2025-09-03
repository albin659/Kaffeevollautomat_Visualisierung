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
        self.powered_on = True

    def to_csv(self):
        water_flag = 1 if self.water_ok else 0
        grounds_flag = 1 if self.grounds_ok else 0
        return f"{self.temp},{water_flag},{grounds_flag},{self.water_flow},{date.today().strftime('%d.%m.%Y')}"

class Step:
    def __init__(self, second: int, description: str):
        self.second = second
        self.description = description

    async def execute(self, state: MachineState, send):
        await send(f"{self.description},{state.to_csv()}")
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

class CoolDown(Step):
    def __init__(self, second: int, temp: int):
        super().__init__(second, f"Abkühlen")
        self.target_temp = temp
    
    async def execute(self, state: MachineState, send):
        state.temp = self.target_temp
        await super().execute(state, send)

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
            await send(f"Wasser leer,{state.to_csv()}")
            return False
        if not state.grounds_ok:
            await send(f"Kaffeesatz voll,{state.to_csv()}")
            return False

        state.water_flow = 5
        if state.cups_since_empty + self.amount >= 3:
            state.grounds_ok = False
            
        if state.cups_since_filled + self.amount >= 5:
            state.water_ok = False

        await send(f"{self.description},{state.to_csv()}")
        await asyncio.sleep(1)
        state.water_flow = 0
        return True

class BrewingUnitToStartPosition(Step): pass

coffee_types = {
    "1": {"name": "Normal", "grinding_steps": 6, "press_steps": 5, "moisting_steps": 2, "brewing_steps": 14, "toStart_steps": 4},
    "2": {"name": "Espresso", "grinding_steps": 6, "press_steps": 5, "moisting_steps": 2, "brewing_steps": 14, "toStart_steps": 4}
}

state = MachineState()

async def wait_for_input_with_timeout(websocket, send, timeout=1):
    countdown_started = False
    countdown_seconds = 120
    remaining_time = countdown_seconds
    
    while True:
        try:
            if countdown_started:
                message = await asyncio.wait_for(websocket.recv(), timeout=1)
                countdown_started = False
                return message
            else:
                message = await asyncio.wait_for(websocket.recv(), timeout=timeout)
                return message
                
        except asyncio.TimeoutError:
            if not countdown_started:
                countdown_started = True
                remaining_time = countdown_seconds
                await send(f"Warten,{state.to_csv()}")
            else:
                remaining_time -= 1
                if remaining_time > 0:
                    await send(f"Warten,{state.to_csv()}")
                else:
                    await send(f"Timeout,{state.to_csv()}")
                    return "timeout"

async def heat_up_machine(send):
    start_temp = state.temp
    target_temp = 94
    total_seconds = 45
    temp_difference = target_temp - start_temp
    
    for second in range(total_seconds):
        current_temp = start_temp + (temp_difference * (second / total_seconds))
        state.temp = round(current_temp, 1)
        
        state.water_flow = 5 if 31 <= second <= 45 else 0
        
        await send(f"Aufheizen,{state.to_csv()}")
        await asyncio.sleep(1)
    
    state.water_flow = 0

async def cool_down_machine(send):
    start_temp = state.temp
    target_temp = 22
    total_seconds = 180
    temp_difference = start_temp - target_temp
    
    for second in range(total_seconds):
        current_temp = start_temp - (temp_difference * (second / total_seconds))
        state.temp = round(current_temp, 1)
        await send(f"Abkühlen,{state.to_csv()}")
        await asyncio.sleep(1)
    
    state.powered_on = False
    await send(f"Ausgeschaltet,{state.to_csv()}")

async def handle_command(option, send):
    if option == "1":
        if not state.powered_on:
            state.powered_on = True
            await asyncio.sleep(2)
        
        await heat_up_machine(send)
        return "ready"

    elif option == "2":
        if not state.powered_on:
            return "ready"
        return "await_amount"

    elif option == "3":
        if not state.powered_on:
            return "ready"
        state.water_ok = True
        state.cups_since_filled = 0
        await send(f"Wasser aufgefüllt,{state.to_csv()}")
        return "ready"

    elif option == "4":
        if not state.powered_on:
            return "ready"
        state.grounds_ok = True
        state.cups_since_empty = 0
        await send(f"Kaffeesatz geleert,{state.to_csv()}")
        return "ready"

    elif option == "5":
        await cool_down_machine(send)
        return "ready"

    else:
        return "ready"

async def echo(websocket):
    current_state = "ready"  
    current_amount = 1
    
    async def send(msg): 
        await websocket.send(msg)

    while True:
        try:
            if current_state in ["ready", "await_amount", "await_coffee_choice"]:
                message = await wait_for_input_with_timeout(websocket, send)
                
                if message == "timeout":
                    await cool_down_machine(send)
                    current_state = "ready"
                    continue
            else:
                message = await websocket.recv()
                
            print(f"Received: {message}, Current state: {current_state}")  
            
            if current_state == "await_amount":
                if message in ["1", "2"]:
                    current_amount = int(message)
                    current_state = "await_coffee_choice"
                else:
                    current_state = "ready"
                continue

            if current_state == "await_coffee_choice":
                if message in coffee_types:
                    if not state.powered_on:
                        current_state = "ready"
                        continue
                        
                    recipe = coffee_types[message]

                    grinding = [CoffeeGrind(i+1, "Mahlen") for i in range(recipe['grinding_steps'])]
                    press = [CoffeePress(i+1, "Pressen") for i in range(recipe['press_steps'])]
                    moisting = [PowderMoister(i+1, "Anfeuchten") for i in range(recipe['moisting_steps'])]
                    brewing = [CoffeeBrewing(i+1, "Brühen", current_amount) for i in range(recipe['brewing_steps'] * current_amount)]
                    toStartPosition = [BrewingUnitToStartPosition(i+1, "Zur Startposition") for i in range(recipe['toStart_steps'])]

                    for step in grinding:
                        await step.execute(state, send)
                    for step in press:
                        await step.execute(state, send)
                    
                    if not state.water_ok:
                        current_state = "ready"
                        continue
                    if not state.grounds_ok:
                        current_state = "ready"
                        continue
                    
                    for step in moisting:
                        await step.execute(state, send)

                    brew_successful = True
                    for step in brewing:
                        ok = await step.execute(state, send)
                        if not ok:
                            brew_successful = False
                            break

                    if brew_successful:
                        for step in toStartPosition:
                            await step.execute(state, send)
                        
                        state.cups_since_empty += current_amount
                        state.cups_since_filled += current_amount
                    
                    current_state = "ready"
                        
                else:
                    result = await handle_command(message, send)
                    if result:
                        current_state = result
                continue

            if current_state == "ready":
                result = await handle_command(message, send)
                if result:
                    current_state = result
                    
        except websockets.exceptions.ConnectionClosed:
            print("Connection closed")
            break

async def main():
    async with websockets.serve(echo, "localhost", 8765):
        print(">>> Server läuft auf ws://localhost:8765")
        await asyncio.Future()

if __name__ == "__main__":
    asyncio.run(main())