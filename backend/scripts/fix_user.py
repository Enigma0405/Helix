import asyncio
import sys

# Windows AsyncIO Loop Policy Fix for Psycopg3
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from sqlalchemy import select
from src.database.core import AsyncSessionLocal
from src.auth.models import User, Organization
from src.shared.security import hash_password

async def fix_user():
    async with AsyncSessionLocal() as db:
        # We need the org
        res = await db.execute(select(Organization).where(Organization.slug == 'aetheris'))
        org = res.scalar_one_or_none()
        
        if not org:
            print("Org not found!")
            return
            
        res = await db.execute(select(User).where(User.email == 'demo@helix.ai'))
        user = res.scalar_one_or_none()
        
        if user:
            print("Updating existing user")
            user.hashed_password = hash_password("Password123")
        else:
            print("Creating new user")
            user = User(
                email="demo@helix.ai",
                hashed_password=hash_password("Password123"),
                full_name="Demo User",
                role="admin",
                org_id=org.id
            )
            db.add(user)
            
        await db.commit()
        print("Success")

if __name__ == "__main__":
    asyncio.run(fix_user())
