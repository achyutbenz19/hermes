from components.manager import ConversationManager
import asyncio

if __name__ == "__main__":
    manager = ConversationManager()
    asyncio.run(manager.main())