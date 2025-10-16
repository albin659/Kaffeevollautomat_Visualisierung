import asyncio
import websockets
from datetime import date
from motor.motor_asyncio import AsyncIOMotorClient
import os

DATABASE_URL = "mongodb://localhost:27017"
client = AsyncIOMotorClient(DATABASE_URL)
database = client.Kaffeemaschine

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

coffee_types = {
    "1": {"name": "Normal"},
    "2": {"name": "Espresso"}
}

state = MachineState()

async def get_heating_data():
    collection = database.Aufheizen
    data = await collection.find().sort("_id", 1).to_list(length=None)
    return data

async def get_heating_data_from_current_temp(current_temp):
    collection = database.Aufheizen
    data = await collection.find({"temperature": {"$gte": current_temp}}).sort("temperature", 1).to_list(length=None)
    return data

async def get_cooling_data():
    collection = database.Abkühlen
    data = await collection.find().sort("_id", 1).to_list(length=None)
    return data

async def get_cooling_data_from_current_temp(current_temp):
    collection = database.Abkühlen
    data = await collection.find({"temperature": {"$lte": current_temp}}).sort("temperature", -1).to_list(length=None)
    return data

async def get_coffee_data(coffee_type: str, amount: int):
    if amount == 1:
        collection_name = "Einen_Kaffee_Brühen"
    else:  
        collection_name = "Zwei_Kaffee_Brühen"
    
    collection = database[collection_name]
    data = await collection.find().sort("_id", 1).to_list(length=None)
    return data

async def heat_up_machine_from_db(send):
    heating_data = await get_heating_data_from_current_temp(state.temp)
    
    for entry in heating_data:
        state.temp = entry['temperature']
        state.water_flow = entry['water_flow']
        state.water_ok = entry['water_ok']
        state.grounds_ok = entry['grounds_ok']
        
        await send(f"Aufheizen,{state.to_csv()}")
        await asyncio.sleep(1)
    
    state.water_flow = 0

async def cool_down_machine_from_db(send, websocket=None):
    cooling_data = await get_cooling_data_from_current_temp(state.temp)
    
    if not cooling_data:
        cooling_data = await get_cooling_data()
    
    cooling_interrupted = False
    
    for entry in cooling_data:
        if websocket:
            try:
                message = await asyncio.wait_for(websocket.recv(), timeout=0.1)
                if message == "1":  
                    cooling_interrupted = True
                    break
            except asyncio.TimeoutError:
                pass
        
        state.temp = entry['temperature']
        state.water_flow = entry['water_flow']
        state.water_ok = entry['water_ok']
        state.grounds_ok = entry['grounds_ok']
        
        await send(f"Abkühlen,{state.to_csv()}")
        await asyncio.sleep(1)
    
    if not cooling_interrupted:
        state.powered_on = False
        await send(f"Ausgeschaltet,{state.to_csv()}")
    else:
        await heat_up_machine_from_db(send)

async def make_coffee_from_db(coffee_type: str, amount: int, send):
    coffee_data = await get_coffee_data(coffee_type, amount)
    
    brew_successful = True
    
    for entry in coffee_data:
        state.temp = entry['temperature']
        state.water_flow = entry['water_flow']
        state.water_ok = entry['water_ok']
        state.grounds_ok = entry['grounds_ok']
        
        if not state.water_ok:
            await send(f"Wasser leer,{state.to_csv()}")
            print("Wasser leer - Brühen abgebrochen")
            brew_successful = False
            break
        if not state.grounds_ok:
            await send(f"Kaffeesatz voll,{state.to_csv()}")
            print("Kaffeesatz voll - Brühen abgebrochen")
            brew_successful = False
            break
        
        await send(f"{entry['step_type']},{state.to_csv()}")
        await asyncio.sleep(1)
    
    if brew_successful:        
        state.cups_since_empty += amount
        state.cups_since_filled += amount
            
        if state.cups_since_empty >= 3:
            state.grounds_ok = False
            print("Kaffeesatz voll - bitte leeren")
        if state.cups_since_filled >= 5:
            state.water_ok = False
            print("Wasser leer - bitte auffüllen")
    
    return brew_successful

async def wait_for_input_with_timeout(websocket, send, timeout=120):
    remaining_time = timeout
    
    while remaining_time > 0:
        try:
            message = await asyncio.wait_for(websocket.recv(), timeout=1)
            return message
        except asyncio.TimeoutError:
            remaining_time -= 1
            await send(f"Warten,{state.to_csv()}")
    
    await send(f"Timeout,{state.to_csv()}")
    return "timeout"

async def handle_command(option, send, websocket=None):
    if option == "1":
        if not state.powered_on:
            state.powered_on = True
            await asyncio.sleep(2)
        
        await heat_up_machine_from_db(send)
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
        print("Wasser aufgefüllt")
        return "ready"

    elif option == "4":
        if not state.powered_on:
            return "ready"
        state.grounds_ok = True
        state.cups_since_empty = 0
        await send(f"Kaffeesatz geleert,{state.to_csv()}")
        print("Kaffeesatz geleert")
        return "ready"

    elif option == "5":
        await cool_down_machine_from_db(send, websocket)
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
                    await cool_down_machine_from_db(send, websocket)
                    current_state = "ready"
                    continue
            else:
                message = await websocket.recv()
                            
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
                    
                    await make_coffee_from_db(message, current_amount, send)
                    current_state = "ready"
                else:
                    result = await handle_command(message, send, websocket)
                    if result:
                        current_state = result
                continue

            if current_state == "ready":
                result = await handle_command(message, send, websocket)
                if result:
                    current_state = result
                    
        except websockets.exceptions.ConnectionClosed:
            print("Connection closed")
            break
        except Exception as e:
            print(f"Unexpected error: {e}")
            break

async def main():
    try:
        await database.command('ping')
        print("MongoDB Verbindung erfolgreich")
        
    except Exception as e:
        print(f"MongoDB Verbindung fehlgeschlagen: {e}")
        return
    
    async with websockets.serve(echo, "localhost", 8765):
        print(">>> Server läuft auf ws://localhost:8765")
        await asyncio.Future()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nServer shutdown requested...")
    except Exception as e:
        print(f"Server error: {e}")