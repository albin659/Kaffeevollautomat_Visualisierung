import asyncio
import websockets
from datetime import date, datetime
from motor.motor_asyncio import AsyncIOMotorClient
import os

DATABASE_URL = "mongodb://localhost:27017"
client = AsyncIOMotorClient(DATABASE_URL)
database = client.Kaffeemaschine
status_collection = database.Status

async def get_current_status():
    try:
        current_status = await status_collection.find_one()
        if current_status:
            status_copy = current_status.copy()
            if '_id' in status_copy:
                del status_copy['_id']
            return status_copy
    except Exception as e:
        print(f"Fehler beim Laden aus MongoDB: {e}")

async def status_to_csv(status):
    if not status:
        return "22,1,1,0,01.01.2024,Warten,False"
    
    water_flag = 1 if status.get('water_ok', True) else 0
    grounds_flag = 1 if status.get('grounds_ok', True) else 0
    temp = status.get('temperature', 22)
    water_flow = status.get('water_flow', 0)
    current_date = date.today().strftime('%d.%m.%Y')
    current_step = status.get('current_step', 'Warten')
    powered_on = status.get('powered_on', False)
    
    return f"{temp},{water_flag},{grounds_flag},{water_flow},{current_date},{current_step},{powered_on}"

async def send_current_status(websocket):
    try:
        current_status = await get_current_status()
        if current_status:
            csv_data = await status_to_csv(current_status)
            current_step = current_status.get('current_step', 'Leerlauf')
            message = f"{current_step},{csv_data}"
            await websocket.send(message)
        else:
            fallback_csv = "22,1,1,0,13.11.2025,Warten,False"
            await websocket.send(fallback_csv)
    except Exception as e:
        print(f"Fehler beim Senden des Status: {e}")

async def update_status_in_db(status_data):
    try:
        status_data['last_updated'] = datetime.now()
        
        await status_collection.delete_many({})
        result = await status_collection.insert_one(status_data)
        
        return True
    except Exception as e:
        print(f"Fehler beim Aktualisieren der MongoDB: {e}")
        return False

async def update_step_in_db(step_name: str, water_flow: int = 0, **additional_updates):
    current_status = await get_current_status()
    if not current_status:
        return False
    
    current_status['current_step'] = step_name
    current_status['water_flow'] = water_flow
    current_status.update(additional_updates)
    
    return await update_status_in_db(current_status)

async def wait_for_input_with_timeout(websocket, timeout=120):
    remaining_time = timeout
    
    while remaining_time > 0:
        try:
            message = await asyncio.wait_for(websocket.recv(), timeout=1)
            return message
        except asyncio.TimeoutError:
            remaining_time -= 1
            await update_step_in_db("Warten", 0)
            await send_current_status(websocket)
    
    return "timeout"

async def simulate_heating(websocket):
    current_status = await get_current_status()
    if not current_status:
        return
    
    current_temp = current_status.get('temperature', 22)
    target_temp = 94
    total_seconds = 45
    
    if current_temp >= target_temp:
        await update_step_in_db("Warten", 0, temperature=target_temp, powered_on=True)
        await send_current_status(websocket)
        return
    
    temp_difference = target_temp - current_temp
    total_temp_difference = target_temp - 22 
    remaining_seconds = int((temp_difference / total_temp_difference) * total_seconds)
        
    await update_step_in_db("Aufheizen", 0, powered_on=True)
    
    for second in range(remaining_seconds + 1):
        current_status = await get_current_status()
        if not current_status:
            continue
            
        progress = second / remaining_seconds
        new_temp = current_temp + (temp_difference * progress)
        
        current_water_flow = 5 if second >= (remaining_seconds - 15) and second <= remaining_seconds else 0
        
        await update_step_in_db(
            "Aufheizen", 
            current_water_flow,
            temperature=round(new_temp, 1),
            powered_on=True
        )
        
        await send_current_status(websocket)
        await asyncio.sleep(1)
    
    await update_step_in_db("Warten", 0, temperature=target_temp, powered_on=True)
    await send_current_status(websocket)

async def simulate_cooling(websocket):
    current_status = await get_current_status()
    if not current_status:
        return
    
    start_temp = current_status.get('temperature', 94)
    target_temp = 22
    total_seconds = 180
    
    await update_step_in_db("Abkühlen", 0, powered_on=False)
    
    for second in range(total_seconds):
        try:
            message = await asyncio.wait_for(websocket.recv(), timeout=0.1)
            if message == "1":  
                await simulate_heating(websocket)
                return
        except asyncio.TimeoutError:
            pass 
        
        current_status = await get_current_status()
        if not current_status:
            continue
            
        current_temp = start_temp - ((start_temp - target_temp) * (second / total_seconds))
        
        await update_step_in_db(
            "Abkühlen",
            0,
            temperature=round(current_temp, 1),
            powered_on=False
        )
        
        await send_current_status(websocket)
        await asyncio.sleep(1)

async def simulate_coffee_step(websocket, step_name: str, duration: int, coffee_type: str = "", amount: int = 1):
    for second in range(duration):
        current_status = await get_current_status()
        if not current_status:
            continue
            
        water_flow = 5 if step_name in ["Anfeuchten", "Brühen"] else 0
        
        await update_step_in_db(
            step_name,
            water_flow,
            powered_on=True
        )
        
        await send_current_status(websocket)
        await asyncio.sleep(1)
        
        if not current_status.get('water_ok', True):
            await update_step_in_db("Wasser leer - Abbruch", 0, powered_on=True)
            await send_current_status(websocket)
            return False
        if not current_status.get('grounds_ok', True):
            await update_step_in_db("Kaffeesatz voll - Abbruch", 0, powered_on=True)
            await send_current_status(websocket)
            return False
    
    return True

async def simulate_coffee_brewing(websocket, coffee_type: str, amount: int):
    current_status = await get_current_status()
    if not current_status:
        return False    
    if not current_status.get('water_ok', True):
        await update_step_in_db("Wasser leer", 0, powered_on=True)
        await send_current_status(websocket)
        return False
    if not current_status.get('grounds_ok', True):
        await update_step_in_db("Kaffeesatz voll", 0, powered_on=True)
        await send_current_status(websocket)
        return False
    
    coffee_info = coffee_types.get(coffee_type, {})
    steps = [
        ("Mahlen", coffee_info.get('grinding_steps', 6)),
        ("Pressen", coffee_info.get('press_steps', 5)),
        ("Anfeuchten", coffee_info.get('moisting_steps', 2)),
        ("Brühen", coffee_info.get('brewing_steps', 14) * amount),
        ("Zur Startposition", coffee_info.get('toStart_steps', 4))
    ]
    
    for step_name, step_duration in steps:
        await update_step_in_db(step_name, 0, powered_on=True)
        
        success = await simulate_coffee_step(websocket, step_name, step_duration, coffee_type, amount)
        if not success:
            return False
    
    current_status = await get_current_status()
    
    if current_status:
        cups_since_empty = current_status.get('cups_since_empty', 0) + amount
        cups_since_filled = current_status.get('cups_since_filled', 0) + amount
        
        await update_step_in_db(
            "Kaffee bereit",
            0,
            cups_since_empty=cups_since_empty,
            cups_since_filled=cups_since_filled,
            grounds_ok=cups_since_empty < 3,
            water_ok=cups_since_filled < 5,
            powered_on=True
        )
        await send_current_status(websocket)
    
    return True

async def initialize_status_in_db():
    initial_status = {
        "temperature": 22,
        "water_ok": True,
        "grounds_ok": True,
        "cups_since_empty": 0,
        "cups_since_filled": 0,
        "water_flow": 0,
        "powered_on": False, 
        "current_step": "Warten",
        "last_updated": datetime.now()
    }
    
    await update_status_in_db(initial_status)

coffee_types = {
    "1": {"name": "Normal", "grinding_steps": 6, "press_steps": 5, "moisting_steps": 2, "brewing_steps": 14, "toStart_steps": 4},
    "2": {"name": "Espresso", "grinding_steps": 6, "press_steps": 5, "moisting_steps": 2, "brewing_steps": 14, "toStart_steps": 4}
}

async def handle_command(websocket, option):
    current_status = await get_current_status()
    if not current_status:
        return "ready"
    
    if option == "1":        
        await simulate_heating(websocket)
        return "ready"

    elif option == "2":
        await send_current_status(websocket)
        return "await_amount"

    elif option == "3":
        await update_step_in_db("Wasser auffüllen", 0, water_ok=True, cups_since_filled=0, powered_on=True)
        await send_current_status(websocket)
        return "ready"

    elif option == "4":
        await update_step_in_db("Kaffeesatz leeren", 0, grounds_ok=True, cups_since_empty=0, powered_on=True)
        await send_current_status(websocket)
        return "ready"

    elif option == "5":
        await simulate_cooling(websocket)
        return "ready"

    else:
        await update_step_in_db("Bereit", 0, powered_on=True)
        await send_current_status(websocket)
        return "ready"

async def echo(websocket):
    current_state = "ready"
    current_amount = 1
    
    await initialize_status_in_db()
    await send_current_status(websocket)
    
    while True:
        try:
            if current_state in ["ready", "await_amount", "await_coffee_choice"]:
                message = await wait_for_input_with_timeout(websocket)
                
                if message == "timeout":
                    await simulate_cooling(websocket)
                    current_state = "ready"
                    continue
            else:
                message = await websocket.recv()
            
            if current_state == "await_amount":
                if message in ["1", "2"]:
                    current_amount = int(message)
                    current_state = "await_coffee_choice"
                    await send_current_status(websocket)
                else:
                    current_state = "ready"
                continue

            if current_state == "await_coffee_choice":
                if message in coffee_types:
                    current_status = await get_current_status()
                    if not current_status or not current_status.get('powered_on', True):
                        current_state = "ready"
                        continue
                    
                    success = await simulate_coffee_brewing(websocket, message, current_amount)
                    current_state = "ready"
                else:
                    current_state = await handle_command(websocket, message)
                continue

            if current_state == "ready":
                current_state = await handle_command(websocket, message)
                    
        except websockets.exceptions.ConnectionClosed:
            await update_step_in_db("Verbindung getrennt", 0)
            print("Verbindung geschlossen")
            break
        except Exception as e:
            await update_step_in_db(f"Fehler: {str(e)}", 0)
            print(f"Unerwarteter Fehler: {e}")
            break

async def main():
    try:
        await database.command('ping')
        print("MongoDB Verbindung erfolgreich")
        
        await initialize_status_in_db()
        
    except Exception as e:
        print(f"MongoDB Verbindung fehlgeschlagen: {e}")
        return
    
    async with websockets.serve(echo, "localhost", 8765):
        print(">>> WebSocket Server läuft auf ws://localhost:8765")
        await asyncio.Future()

if __name__ == "__main__":
    asyncio.run(main())