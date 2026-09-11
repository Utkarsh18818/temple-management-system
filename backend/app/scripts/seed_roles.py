from sqlalchemy import select

from app.core.database import SessionLocal
from app.models import Role


ROLES = [
    {
        "name": "SUPER_ADMIN",
        "description": "System-wide administrator with access to all temples.",
    },
    {
        "name": "TEMPLE_ADMIN",
        "description": "Administrator responsible for a specific temple.",
    },
    {
        "name": "STAFF",
        "description": "Temple staff member with operational access.",
    },
    {
        "name": "PANDIT",
        "description": "Pandit responsible for religious services and sevas.",
    },
    {
        "name": "VOLUNTEER",
        "description": "Temple volunteer with limited operational access.",
    },
]


def seed_roles():
    db = SessionLocal()

    try:
        for role_data in ROLES:
            existing_role = db.scalar(
                select(Role).where(
                    Role.name == role_data["name"]
                )
            )

            if existing_role:
                print(f"Role already exists: {role_data['name']}")
                continue

            role = Role(
                name=role_data["name"],
                description=role_data["description"],
            )

            db.add(role)
            print(f"Created role: {role_data['name']}")

        db.commit()

        print("\nRole seeding completed successfully.")

    finally:
        db.close()


if __name__ == "__main__":
    seed_roles()