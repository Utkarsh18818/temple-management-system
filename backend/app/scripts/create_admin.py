from getpass import getpass

from sqlalchemy import select

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models import Role, User


def create_super_admin():
    db = SessionLocal()

    try:
        role = db.scalar(
            select(Role).where(Role.name == "SUPER_ADMIN")
        )

        if not role:
            print("ERROR: SUPER_ADMIN role does not exist.")
            print("Run: python -m app.scripts.seed_roles")
            return

        print("\n=== TempleOS SUPER ADMIN SETUP ===\n")

        first_name = input("First name: ").strip()
        last_name = input("Last name (optional): ").strip() or None
        email = input("Email: ").strip().lower()
        phone = input("Phone (optional): ").strip() or None

        if not first_name:
            print("ERROR: First name is required.")
            return

        if not email and not phone:
            print("ERROR: Email or phone is required.")
            return

        if email:
            existing_email = db.scalar(
                select(User).where(User.email == email)
            )

            if existing_email:
                print("ERROR: A user with this email already exists.")
                return

        if phone:
            existing_phone = db.scalar(
                select(User).where(User.phone == phone)
            )

            if existing_phone:
                print("ERROR: A user with this phone already exists.")
                return

        password = getpass("Password: ")
        confirm_password = getpass("Confirm password: ")

        if not password:
            print("ERROR: Password cannot be empty.")
            return

        if password != confirm_password:
            print("ERROR: Passwords do not match.")
            return

        if len(password) < 8:
            print("ERROR: Password must contain at least 8 characters.")
            return

        admin = User(
            temple_id=None,
            role_id=role.id,
            email=email or None,
            phone=phone,
            password_hash=hash_password(password),
            first_name=first_name,
            last_name=last_name,
            is_active=True,
            is_verified=True,
        )

        db.add(admin)
        db.commit()
        db.refresh(admin)

        print("\nSUPER_ADMIN created successfully.")
        print(f"User ID: {admin.id}")
        print(f"Email: {admin.email}")
        print(f"Role: SUPER_ADMIN")
        print("\nYou can now use this account to authenticate with TempleOS.")

    except Exception as exc:
        db.rollback()
        print(f"\nERROR: {exc}")

    finally:
        db.close()


if __name__ == "__main__":
    create_super_admin()