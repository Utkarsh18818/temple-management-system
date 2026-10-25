"""Optional migration check against an isolated local PostgreSQL instance."""
import importlib.util
import os
from pathlib import Path

import pytest
from alembic.migration import MigrationContext
from alembic.operations import Operations
from sqlalchemy import create_engine, inspect
from sqlalchemy.engine import make_url


@pytest.mark.skipif(not os.getenv("PAN_MIGRATION_TEST_URL"), reason="Requires isolated local PostgreSQL")
def test_pan_migration_preserves_legacy_records():
    url = make_url(os.environ["PAN_MIGRATION_TEST_URL"])
    assert url.host in {"localhost", "127.0.0.1"}, "Never run this test on a remote database"
    engine = create_engine(url)
    migration_path = Path(__file__).parents[1] / "alembic/versions/91ab27c40d12_add_devotee_pan.py"
    spec = importlib.util.spec_from_file_location("pan_migration", migration_path)
    migration = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(migration)
    with engine.connect() as connection:
        transaction = connection.begin()
        try:
            connection.exec_driver_sql("CREATE SCHEMA pan_migration_test")
            connection.exec_driver_sql("SET LOCAL search_path TO pan_migration_test")
            connection.exec_driver_sql("CREATE TABLE devotees (id integer PRIMARY KEY, name text)")
            connection.exec_driver_sql("CREATE TABLE donations (id integer PRIMARY KEY, pan_number varchar(20))")
            connection.exec_driver_sql("INSERT INTO devotees VALUES (1, 'Legacy devotee')")
            connection.exec_driver_sql("INSERT INTO donations VALUES (1, NULL)")
            with Operations.context(MigrationContext.configure(connection)):
                migration.upgrade()
                assert connection.exec_driver_sql("SELECT name, pan_masked, pan_encrypted FROM devotees WHERE id=1").one() == ("Legacy devotee", None, None)
                assert connection.exec_driver_sql("SELECT pan_number, pan_encrypted FROM donations WHERE id=1").one() == (None, None)
                connection.exec_driver_sql("INSERT INTO devotees (id, name) VALUES (2, 'Old application writer')")
                assert all(col["nullable"] for col in inspect(connection).get_columns("devotees") if col["name"].startswith("pan_"))
                migration.downgrade()
                assert connection.exec_driver_sql("SELECT name FROM devotees WHERE id=1").scalar() == "Legacy devotee"
                migration.upgrade()
        finally:
            transaction.rollback()
    engine.dispose()
