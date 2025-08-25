import asyncio
import websockets

async def listen(websocket):
    """Empfängt Nachrichten vom Server und druckt sie."""
    try:
        async for message in websocket:
            print(f"[Server] {message}")
    except websockets.exceptions.ConnectionClosed:
        print("Verbindung geschlossen.")

async def send(websocket):
    """Liest Eingaben von der Konsole und sendet sie an den Server."""
    loop = asyncio.get_event_loop()
    while True:
        msg = await loop.run_in_executor(None, input, "> ")
        if msg.lower() in ["quit", "exit"]:
            print("Beende Client...")
            await websocket.close()
            break
        await websocket.send(msg)

async def main():
    async with websockets.connect("ws://localhost:8765") as websocket:
        print("Verbunden mit Server (ws://localhost:8765)")
        await asyncio.gather(
            listen(websocket),
            send(websocket),
        )

if __name__ == "__main__":
    asyncio.run(main())