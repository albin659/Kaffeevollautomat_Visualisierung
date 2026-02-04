import asyncio
import websockets
from datetime import date, datetime
from motor.motor_asyncio import AsyncIOMotorClient
import json

DATABASE_URL = "mongodb://localhost:27017"
client = AsyncIOMotorClient(DATABASE_URL)
database = client.Kaffeemaschine
status_collection = database.Status
coffee_history_collection = database.CoffeeHistory
status_history_collection = database.StatusHistory

connected_clients = set()
machine_state = {
    "current_state": "ready",
    "current_amount": 1,
    "is_processing": False,
    "last_activity": datetime.now(),
    "current_task": None
}

# Aktuelle Werte aus Datenbank auslesen
async def get_current_status():
    try:
        current_status = await status_collection.find_one()
        if current_status:
            status_copy = current_status.copy()
            if '_id' in status_copy:
                status_copy['_id'] = str(status_copy['_id'])
            return status_copy
    except Exception as e:
        return None

async def get_coffee_history():
    try:
        history = await coffee_history_collection.find().to_list(length=100)
        
        for item in history:
            if '_id' in item:
                item['_id'] = str(item['_id'])
            if 'createdDate' in item and isinstance(item['createdDate'], datetime):
                item['createdDate'] = item['createdDate'].isoformat()
        
        return history
    except Exception as e:
        return []
    
async def get_status_history(limit: int = 100):
    try:
        history = await status_history_collection.find().sort('timestamp', -1).to_list(length=limit)
        
        for item in history:
            if '_id' in item:
                item['_id'] = str(item['_id'])
            if 'timestamp' in item and isinstance(item['timestamp'], datetime):
                item['timestamp'] = item['timestamp'].isoformat()
            if 'last_updated' in item and isinstance(item['last_updated'], datetime):
                item['last_updated'] = item['last_updated'].isoformat()
            if 'current_date' in item and isinstance(item['current_date'], datetime):
                item['current_date'] = item['current_date'].strftime('%d.%m.%Y')
        
        return history
    except Exception as e:
        print(f"Error getting status history: {e}")
        return []

# Step updaten
async def update_step(step_name: str, water_flow: int = 0, **additional_updates):
    current_status = await get_current_status()
    if not current_status:
        return False
    
    current_status['current_step'] = step_name
    current_status['water_flow'] = water_flow
    current_status.update(additional_updates)
    
    success = await update_status_in_db(current_status)
    if success:
        await broadcast_status()
    return success

# Daten in Datenbank einspeichern
async def update_status_in_db(status_data):
    try:
        if status_data:
            status_data['last_updated'] = datetime.now()
            await save_status_to_history(status_data)
        
        await status_collection.delete_many({})
        await status_collection.insert_one(status_data)
        return True
    except Exception as e:
        print(f"Error updating status in DB: {e}")
        return False

async def save_status_to_history(status_data):
    try:
        status_copy = status_data.copy()
        if '_id' in status_copy:
            del status_copy['_id']
        
        status_copy['timestamp'] = datetime.now()
        
        await status_history_collection.insert_one(status_copy)
        
        # Alte Einträge löschen, falls Datenbank zu voll wird
        # await status_history_collection.delete_many({
        #     'timestamp': {'$lt': datetime.now() - timedelta(days=30)}
        # })
        
        return True
    except Exception as e:
        print(f"Error saving status to history: {e}")
        return False

async def save_coffee_to_history(coffee_data):
    try:
        if 'createdDate' in coffee_data and isinstance(coffee_data['createdDate'], str):
            try:
                coffee_data['createdDate'] = datetime.fromisoformat(coffee_data['createdDate'].replace('Z', '+00:00'))
            except:
                coffee_data['createdDate'] = datetime.now()
        else:
            coffee_data['createdDate'] = datetime.now()
            
        await coffee_history_collection.insert_one(coffee_data)
        return True
    except Exception as e:
        print(f"Error saving coffee to history: {e}")
        return False

# String to JSON
async def status_to_json(status):
    if not status:
        return {
            "type": "status",
            "data": {
                "temperature": 22,
                "water_ok": True,
                "grounds_ok": True,
                "water_flow": 0,
                "current_date": date.today().strftime('%d.%m.%Y'),
                "current_step": "Waiting",
                "powered_on": False,
                "cups_since_empty": 0,
                "cups_since_filled": 0,
                "last_updated": datetime.now().isoformat()
            }
        }
    
    status_copy = status.copy()
    if 'last_updated' in status_copy and isinstance(status_copy['last_updated'], datetime):
        status_copy['last_updated'] = status_copy['last_updated'].isoformat()
    
    if 'current_date' not in status_copy:
        status_copy['current_date'] = date.today().strftime('%d.%m.%Y')
    
    return {
        "type": "status",
        "data": status_copy
    }

# Nachricht an Frontend schicken
async def broadcast_status():
    if not connected_clients:
        return
    
    try:
        current_status = await get_current_status()
        json_data = await status_to_json(current_status)
        message = json.dumps(json_data, default=str)
        
        disconnected = set()
        for websocket in connected_clients:
            try:
                await websocket.send(message)
            except:
                disconnected.add(websocket)
        
        connected_clients.difference_update(disconnected)
    except Exception as e:
        print(f"Error broadcasting status: {e}")

async def send_current_status(websocket):
    try:
        current_status = await get_current_status()
        json_data = await status_to_json(current_status)
        message = json.dumps(json_data, default=str)
        await websocket.send(message)
    except Exception as e:
        print(f"Error sending current status: {e}")

async def send_coffee_history_to_all():
    if not connected_clients:
        return
    
    try:
        history = await get_coffee_history()
        
        response = {
            "type": "coffee_history",
            "data": history
        }
        message = json.dumps(response, default=str)
        
        disconnected = set()
        for websocket in connected_clients:
            try:
                await websocket.send(message)
            except:
                disconnected.add(websocket)
        
        connected_clients.difference_update(disconnected)
    except Exception as e:
        print(f"Error sending coffee history: {e}")

# Funktionen die im Hintergrund laufen
async def continuous_waiting_broadcast():
    while True:
        await asyncio.sleep(1)
        
        current_status = await get_current_status()
        if current_status and current_status.get('current_step') == 'Waiting':
            await broadcast_status()

async def check_auto_standby():
    while True:
        await asyncio.sleep(10)
        
        if machine_state["is_processing"]:
            continue
            
        time_since_activity = (datetime.now() - machine_state["last_activity"]).total_seconds()
        
        if time_since_activity > 60 and machine_state["current_state"] == "ready":
            current_status = await get_current_status()
            if current_status and current_status.get('powered_on', False):
                await update_step("Waiting", 0, powered_on=True)
        
        if time_since_activity > 120:
            current_status = await get_current_status()
            if current_status and current_status.get('powered_on', False):
                asyncio.create_task(simulate_cooling())

# Wird am Start der Simulationsfunktionen ausgeführt
async def prepare_machine_task():
    if machine_state["current_task"] and not machine_state["current_task"].done():
        machine_state["current_task"].cancel()
        try:
            await machine_state["current_task"]
        except asyncio.CancelledError:
            pass
    
    machine_state["current_task"] = asyncio.current_task()
    machine_state["is_processing"] = True
    machine_state["last_activity"] = datetime.now()

# Wird am Ende der Simulationsfunktionen ausgeführt
async def cleanup_machine_task():
    machine_state["is_processing"] = False
    if machine_state["current_task"] == asyncio.current_task():
        machine_state["current_task"] = None

# Simulationsbereich
async def simulate_heating():
    await prepare_machine_task()
    
    try:
        current_status = await get_current_status()
        if not current_status:
            return
        
        current_temp = current_status.get('temperature', 22)
        target_temp = 94
        
        if current_temp >= target_temp:
            await update_step("Waiting", 0, temperature=target_temp, powered_on=True)
            return
        
        total_temp_diff = target_temp - 22
        current_temp_diff = target_temp - current_temp
        progress = (total_temp_diff - current_temp_diff) / total_temp_diff
        total_seconds = 45
        remaining_seconds = int((1 - progress) * total_seconds)
        
        await update_step("HeatUp", 0, powered_on=True)
        
        for second in range(remaining_seconds + 1):
            if machine_state["current_task"] != asyncio.current_task():
                return
                
            progress = second / remaining_seconds
            new_temp = current_temp + (current_temp_diff * progress)
            
            current_water_flow = 5 if second >= (remaining_seconds - 15) and second <= remaining_seconds else 0
            
            await update_step(
                "HeatUp",
                current_water_flow,
                temperature=round(new_temp, 1),
                powered_on=True
            )
            await asyncio.sleep(1)
        
        await update_step("Waiting", 0, temperature=target_temp, powered_on=True)
        
    except asyncio.CancelledError:
        await update_step("Waiting", 0, powered_on=True)
    except Exception as e:
        print(f"Error in simulate_heating: {e}")
    finally:
        await cleanup_machine_task()

async def simulate_cooling():
    await prepare_machine_task()
    
    try:
        current_status = await get_current_status()
        if not current_status:
            return
        
        current_temp = current_status.get('temperature', 94) 
        target_temp = 22
        
        if current_temp <= target_temp:
            await update_step("Waiting", 0, temperature=target_temp, powered_on=False)
            return
        
        total_temp_diff = 94 - target_temp  
        current_temp_diff = current_temp - target_temp 
        progress = (total_temp_diff - current_temp_diff) / total_temp_diff
        total_seconds = 180  
        remaining_seconds = int((1 - progress) * total_seconds)
        
        await update_step("CoolDown", 0, powered_on=False)
        
        for second in range(remaining_seconds + 1):
            if machine_state["current_task"] != asyncio.current_task():
                return
                
            progress = second / remaining_seconds
            new_temp = current_temp - (current_temp_diff * progress)  
            
            await update_step(
                "CoolDown",
                0,
                temperature=round(new_temp, 1),
                powered_on=False
            )
            await asyncio.sleep(1)
            
        await update_step("Waiting", 0, temperature=target_temp, powered_on=False)
        
    except asyncio.CancelledError:
        await update_step("Waiting", 0, powered_on=False)
    except Exception as e:
        print(f"Error in simulate_cooling: {e}")
    finally:
        await cleanup_machine_task()

async def simulate_coffee_brewing(coffee_type: str, amount: int):
    await prepare_machine_task()
    
    try:
        current_status = await get_current_status()
        if not current_status:
            return False
        
        if not current_status.get('water_ok', True):
            await update_step("Water empty", 0, powered_on=True)
            return False
        
        if not current_status.get('grounds_ok', True):
            await update_step("Grounds full", 0, powered_on=True)
            return False
        
        coffee_info = coffee_types.get(coffee_type, {})
        steps = [
            ("Grind", coffee_info.get('grinding_steps', 6)),
            ("Press", coffee_info.get('press_steps', 5)),
            ("Moisten", coffee_info.get('moisting_steps', 2)),
            ("Brew", coffee_info.get('brewing_steps', 14) * amount),
            ("ToStartposition", coffee_info.get('toStart_steps', 4))
        ]
        
        for step_name, step_duration in steps:
            for second in range(step_duration):
                if machine_state["current_task"] != asyncio.current_task():
                    return False
                    
                water_flow = 5 if step_name in ["Moisten", "Brew"] else 0
                await update_step(step_name, water_flow, powered_on=True)
                await asyncio.sleep(1)
        
        current_status = await get_current_status()
        if current_status:
            cups_since_empty = current_status.get('cups_since_empty', 0) + amount
            cups_since_filled = current_status.get('cups_since_filled', 0) + amount
            
            await update_step(
                "Waiting",
                0,
                cups_since_empty=cups_since_empty,
                cups_since_filled=cups_since_filled,
                grounds_ok=cups_since_empty < 3,
                water_ok=cups_since_filled < 5,
                powered_on=True
            )
            
        return True
        
    except asyncio.CancelledError:
        await update_step("Waiting", 0, powered_on=True)
        return False
    except Exception as e:
        print(f"Error in simulate_coffee_brewing: {e}")
        return False
    finally:
        await cleanup_machine_task()

coffee_types = {
    "Normal": {"grinding_steps": 6, "press_steps": 5, "moisting_steps": 2, "brewing_steps": 14, "toStart_steps": 4},
    "Espresso": {"grinding_steps": 6, "press_steps": 5, "moisting_steps": 2, "brewing_steps": 10, "toStart_steps": 4}
}

# Frontend Nachrichten verarbeiten
async def handle_command(option, websocket=None):
    machine_state["last_activity"] = datetime.now()
    
    if option == "HeatUp":
        asyncio.create_task(simulate_heating())
        return "ready"
    elif option == "Brew":
        await broadcast_status()
        return "await_amount"
    elif option == "WaterFillUp":
        await update_step("Waiting", 0, water_ok=True, cups_since_filled=0, powered_on=True)
        return "ready"
    elif option == "GroundClearing":
        await update_step("Waiting", 0, grounds_ok=True, cups_since_empty=0, powered_on=True)
        return "ready"
    elif option == "CoolDown":
        asyncio.create_task(simulate_cooling())
        return "ready"
    elif option == "History":
        await send_coffee_history_to_all()
        return "ready"
    else:
        current_status = await get_current_status()
        powered_on = current_status.get('powered_on', True) if current_status else True
        await update_step("Waiting", 0, powered_on=powered_on)
        return "ready"

# WebSocket Handler
async def echo(websocket):
    connected_clients.add(websocket)
    
    await send_current_status(websocket)
    
    try:
        async for message in websocket:
            machine_state["last_activity"] = datetime.now()
            
            if message.startswith('{'):
                try:
                    data = json.loads(message)
                    
                    if all(key in data for key in ['id', 'type', 'strength', 'createdDate']):
                        await save_coffee_to_history(data)
                    continue
                except json.JSONDecodeError:
                    pass
            
            if machine_state["current_state"] == "await_amount":
                if message in ["1", "2"]:
                    machine_state["current_amount"] = int(message)
                    machine_state["current_state"] = "await_coffee_choice"
                else:
                    machine_state["current_state"] = "ready"
                continue
                
            if machine_state["current_state"] == "await_coffee_choice":
                if message in coffee_types:
                    asyncio.create_task(
                        simulate_coffee_brewing(message, machine_state["current_amount"])
                    )
                    
                machine_state["current_state"] = "ready"
                continue
                
            if machine_state["current_state"] == "ready":
                machine_state["current_state"] = await handle_command(message, websocket)
    
    except websockets.exceptions.ConnectionClosed:
        pass
    finally:
        connected_clients.remove(websocket)

# Start Status setzen
async def initialize_status_once():
    initial_status = {
        "temperature": 22,
        "water_ok": True,
        "grounds_ok": True,
        "cups_since_empty": 0,
        "cups_since_filled": 0,
        "water_flow": 0,
        "powered_on": False,
        "current_step": "Waiting",
        "last_updated": datetime.now(),
        "current_date": date.today().strftime('%d.%m.%Y')
    }
    await update_status_in_db(initial_status)
    machine_state["last_activity"] = datetime.now()
    machine_state["is_processing"] = False
    machine_state["current_state"] = "ready"
    machine_state["current_task"] = None

# Main
async def main():
    try:
        await database.command('ping')
        await initialize_status_once()
        
        # Hintergrund Funktionen
        asyncio.create_task(check_auto_standby())
        asyncio.create_task(continuous_waiting_broadcast())
        
    except Exception as e:
        print(f"Error initializing: {e}")
        return
    
    async with websockets.serve(echo, "localhost", 8765):
        await asyncio.Future()

if __name__ == "__main__":
    asyncio.run(main())