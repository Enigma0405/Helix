import asyncio
import os
import sys

# Set Python path to backend
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

# Set Windows asyncio event loop policy for psycopg compatibility
if sys.platform == "win32":
    import asyncio
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

def get_env_value(key: str, default: str = "") -> str:
    if os.path.exists(".env"):
        with open(".env", "r") as f:
            for line in f:
                if "=" in line and not line.strip().startswith("#"):
                    k, v = line.split("=", 1)
                    if k.strip() == key:
                        return v.strip().strip("'").strip('"')
    return default

db_url = get_env_value("DATABASE_URL")
if not db_url:
    print("DATABASE_URL not found")
    sys.exit(1)

# Dynamically map standard sync postgres URIs to async psycopg v3 format
if db_url.startswith("postgresql://"):
    db_url = db_url.replace("postgresql://", "postgresql+psycopg://", 1)
elif db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql+psycopg://", 1)

os.environ["DATABASE_URL"] = db_url

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy import text

async def main():
    engine = create_async_engine(db_url)
    async_session = async_sessionmaker(engine, expire_on_commit=False)
    
    async with async_session() as session:
        # Check users in database
        result = await session.execute(text("SELECT id, email, hashed_password, role, is_active FROM users"))
        users = result.all()
        print(f"Total users found: {len(users)}")
        for u in users:
            print(f"User: id={u.id}, email={u.email}, hashed_password={u.hashed_password}, role={u.role}, is_active={u.is_active}")
            
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())
