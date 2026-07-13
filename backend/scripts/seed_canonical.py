import asyncio
import json
import uuid
import sys
from pathlib import Path
from datetime import datetime

# Windows AsyncIO Loop Policy Fix for Psycopg3
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from sqlalchemy import select
from src.database.core import engine, AsyncSessionLocal, create_all_tables
from src.knowledge.models import Equipment, SOP, KnowledgeRelationship
from src.auth.models import Organization

async def seed_canonical_knowledge():
    await create_all_tables()
    
    async with AsyncSessionLocal() as db:
        # Get demo tenant
        result = await db.execute(select(Organization).where(Organization.name == "Aetheris BioPharma"))
        org = result.scalar_one_or_none()
        if not org:
            org = Organization(name="Aetheris BioPharma", slug="aetheris")
            db.add(org)
            await db.commit()
            await db.refresh(org)
            
        org_id = org.id
        base_dir = Path("data/organization_memory")
        
        # 1. Seed Equipment
        eq_dir = base_dir / "equipment"
        if eq_dir.exists():
            for f in eq_dir.glob("*.json"):
                data = json.loads(f.read_text())
                # Check if exists
                res = await db.execute(select(Equipment).where(Equipment.entity_id == data["entity_id"]))
                if not res.scalar_one_or_none():
                    cal_due = datetime.strptime(data["calibration_due"], "%Y-%m-%d") if "calibration_due" in data else None
                    eq = Equipment(
                        org_id=org_id,
                        entity_id=data["entity_id"],
                        name=data["name"],
                        type=data["type"],
                        manufacturer=data.get("manufacturer"),
                        calibration_due=cal_due,
                        status=data.get("status", "Active"),
                        department=data.get("department")
                    )
                    db.add(eq)
        
        # 2. Seed SOPs
        sop_dir = base_dir / "sops"
        if sop_dir.exists():
            for f in sop_dir.glob("*.json"):
                data = json.loads(f.read_text())
                res = await db.execute(select(SOP).where(SOP.entity_id == data["entity_id"]))
                if not res.scalar_one_or_none():
                    eff_date = datetime.strptime(data["effective_date"], "%Y-%m-%d") if "effective_date" in data else None
                    sop = SOP(
                        org_id=org_id,
                        entity_id=data["entity_id"],
                        title=data["title"],
                        version=data["version"],
                        effective_date=eff_date,
                        department=data.get("department"),
                        thresholds=data.get("thresholds")
                    )
                    db.add(sop)
                    
        # 3. Seed Relationships
        rel_dir = base_dir / "relationships"
        if rel_dir.exists():
            for f in rel_dir.glob("*.json"):
                rels = json.loads(f.read_text())
                for data in rels:
                    # simplistic check
                    res = await db.execute(select(KnowledgeRelationship).where(
                        KnowledgeRelationship.source_entity == data["source_entity"],
                        KnowledgeRelationship.target_entity == data["target_entity"]
                    ))
                    if not res.scalar_one_or_none():
                        kr = KnowledgeRelationship(
                            org_id=org_id,
                            source_entity=data["source_entity"],
                            relationship=data["relationship"],
                            target_entity=data["target_entity"],
                            confidence=data.get("confidence", 1.0),
                            origin_document=data.get("origin_document"),
                            section=data.get("section")
                        )
                        db.add(kr)
                        
        await db.commit()
        print("Canonical Knowledge successfully seeded into PostgreSQL.")

if __name__ == "__main__":
    asyncio.run(seed_canonical_knowledge())
