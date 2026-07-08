#!/usr/bin/env python3
"""Project Helix — Database Seed Script.

Uses SQLAlchemy ORM models to populate database with demo organisation, users, assets,
and a sample investigation.
"""
from __future__ import annotations

import asyncio
import sys
import uuid
from datetime import datetime, timezone

from sqlalchemy import select, text

from src.assets.models import Asset
from src.auth.models import Organization, User
from src.core.database import AsyncSessionLocal, Base, engine
from src.core.security import hash_password
from src.investigation.models import Comment, Investigation, Task

# Fixed IDs for deterministic seed data
ORG_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")
DEMO_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000010")
ADMIN_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000011")
INVESTIGATION_ID = uuid.UUID("00000000-0000-0000-0000-000000000100")


class Colors:
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    RED = "\033[91m"
    BLUE = "\033[94m"
    CYAN = "\033[96m"
    BOLD = "\033[1m"
    RESET = "\033[0m"


def header(msg: str) -> None:
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'=' * 60}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.BLUE}  {msg}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'=' * 60}{Colors.RESET}")


async def seed_data(reset: bool = False) -> int:
    header("Project Helix — Seeder starting...")

    # 1. Enable extensions and handle table creation
    async with engine.begin() as conn:
        print("Enabling database extensions...")
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"))

        if reset:
            print(f"{Colors.YELLOW}Dropping all existing tables...{Colors.RESET}")
            await conn.run_sync(Base.metadata.drop_all)
            print(f"{Colors.GREEN}Tables dropped.{Colors.RESET}")

        print("Creating database schema tables...")
        await conn.run_sync(Base.metadata.create_all)
        print(f"{Colors.GREEN}Schema tables verified/created.{Colors.RESET}")

    async with AsyncSessionLocal() as session:
        # 2. Check if organization already exists
        org_check = await session.execute(select(Organization).where(Organization.id == ORG_ID))
        org = org_check.scalar_one_or_none()

        if not org:
            print("Seeding organisation...")
            org = Organization(
                id=ORG_ID,
                name="Apex Precision Manufacturing Inc.",
                slug="apex-precision",
            )
            session.add(org)
            await session.flush()
            print(f"Organisation '{org.name}' created.")
        else:
            print("Organisation already exists. Skipping org seed.")

        # 3. Seed Users
        user_check = await session.execute(select(User).where(User.id == DEMO_USER_ID))
        demo_user = user_check.scalar_one_or_none()

        if not demo_user:
            print("Seeding users...")
            demo_user = User(
                id=DEMO_USER_ID,
                org_id=ORG_ID,
                email="demo@helix.ai",
                full_name="Jennifer Martinez",
                role="analyst",
                hashed_password=hash_password("helixdemo2024"),
                is_active=True,
            )
            admin_user = User(
                id=ADMIN_USER_ID,
                org_id=ORG_ID,
                email="admin@helix.ai",
                full_name="Dr. Sarah Chen",
                role="admin",
                hashed_password=hash_password("helixadmin2024"),
                is_active=True,
            )
            session.add(demo_user)
            session.add(admin_user)
            await session.flush()
            print("Demo and Admin users created.")
        else:
            print("Users already exist. Skipping user seed.")

        # 4. Seed Assets
        assets_check = await session.execute(select(Asset).where(Asset.org_id == ORG_ID))
        if not assets_check.scalars().first():
            print("Seeding assets...")
            assets = [
                Asset(
                    id=uuid.uuid4(),
                    org_id=ORG_ID,
                    asset_type="machine",
                    asset_code="FIL-022-A",
                    name="Sterile Filter Housing A (Grade A Zone)",
                    metadata_={"manufacturer": "Millipore", "pore_size_micron": 0.22},
                ),
                Asset(
                    id=uuid.uuid4(),
                    org_id=ORG_ID,
                    asset_type="sensor",
                    asset_code="EM-PART-01",
                    name="Air Particulate Counter Room 104",
                    metadata_={"model": "MetOne", "particle_sizes_measured": [0.5, 5.0]},
                ),
                Asset(
                    id=uuid.uuid4(),
                    org_id=ORG_ID,
                    asset_type="production_line",
                    asset_code="LINE-3",
                    name="Aseptic Vials Filling Line 3",
                    metadata_={"capacity_vials_per_hour": 10000},
                )
            ]
            session.add_all(assets)
            await session.flush()
            print(f"Seeded {len(assets)} assets.")

        # 5. Seed Investigation
        inv_check = await session.execute(select(Investigation).where(Investigation.id == INVESTIGATION_ID))
        investigation = inv_check.scalar_one_or_none()

        if not investigation:
            print("Seeding investigation...")
            investigation = Investigation(
                id=INVESTIGATION_ID,
                org_id=ORG_ID,
                title="Batch #2847 — Sterility Failure",
                description=(
                    "Sterility test failure detected during final QC. Batch #2847 of Injectable "
                    "Product X (50mL vials) failed USP <71> sterility testing conducted on "
                    "2024-11-15. Positive result for Gram-negative rod in 2 of 14 units tested. "
                    "Organism tentatively identified as Burkholderia cepacia complex. "
                    "Batch quarantined pending investigation."
                ),
                severity="critical",
                status="open",
                created_by=ADMIN_USER_ID,
            )
            session.add(investigation)
            await session.flush()

            # Seed Tasks
            tasks = [
                Task(
                    investigation_id=INVESTIGATION_ID,
                    org_id=ORG_ID,
                    title="Perform sterile filter integrity test (bubble point)",
                    description="Conduct filter integrity testing on sterile filter FIL-022-A used for Batch #2847.",
                    status="open",
                ),
                Task(
                    investigation_id=INVESTIGATION_ID,
                    org_id=ORG_ID,
                    title="Review environmental monitoring records for Filling Line 3",
                    description="Check active air, passive plates, and particulate counters for Filling Line 3 on 2024-11-15.",
                    status="open",
                )
            ]
            session.add_all(tasks)

            # Seed initial Comment
            comment = Comment(
                org_id=ORG_ID,
                entity_type="investigation",
                entity_id=INVESTIGATION_ID,
                content="Initial incident logged. Filter integrity test scheduled.",
                author_id=ADMIN_USER_ID,
            )
            session.add(comment)

            print(f"Investigation '{investigation.title}' and associated records created.")
        else:
            print("Investigation already exists. Skipping investigation seed.")

        await session.commit()

    header("Database Seeding Successful!")
    print(f"""
{Colors.GREEN}  Demo Credentials:{Colors.RESET}
  ┌───────────────────────────────────────────────┐
  │  Analyst:  demo@helix.ai  / helixdemo2024     │
  │  Admin:    admin@helix.ai / helixadmin2024    │
  └───────────────────────────────────────────────┘
  
  FastAPI Health check: http://localhost:8000/api/health
    """)
    return 0


def main() -> None:
    reset = "--reset" in sys.argv
    asyncio.run(seed_data(reset=reset))


if __name__ == "__main__":
    main()
