from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


BASE_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    APP_NAME: str = "TempleOS"
    APP_ENV: str = "development"

    DATABASE_URL: str

    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    CORS_ORIGINS: str = (
        "http://localhost:3000,"
        "http://localhost:5173"
    )

    # --------------------------------------------------------
    # Razorpay
    # --------------------------------------------------------

    RAZORPAY_KEY_ID: str = ""
    RAZORPAY_KEY_SECRET: str = ""
    RAZORPAY_WEBHOOK_SECRET: str = ""

    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @property
    def cors_origins_list(self) -> list[str]:
        return [
            origin.strip()
            for origin in self.CORS_ORIGINS.split(",")
            if origin.strip()
        ]

    def validate_production(self) -> None:
        """
        Validate settings that must be secure in production.

        Development environments may use local/test credentials,
        but production must never use the development JWT secret.
        """
        if self.APP_ENV.lower() != "production":
            return

        if not self.JWT_SECRET:
            raise RuntimeError(
                "JWT_SECRET must be configured in production"
            )

        if self.JWT_SECRET == "development-secret-change-me":
            raise RuntimeError(
                "The development JWT_SECRET cannot be used in production"
            )

        if len(self.JWT_SECRET) < 32:
            raise RuntimeError(
                "JWT_SECRET must contain at least 32 characters in production"
            )

        if not self.DATABASE_URL:
            raise RuntimeError(
                "DATABASE_URL must be configured in production"
            )

        if "*" in self.cors_origins_list:
            raise RuntimeError(
                "Wildcard CORS origins are not allowed in production"
            )

        if not self.RAZORPAY_KEY_ID:
            raise RuntimeError(
                "RAZORPAY_KEY_ID must be configured in production"
            )

        if not self.RAZORPAY_KEY_SECRET:
            raise RuntimeError(
                "RAZORPAY_KEY_SECRET must be configured in production"
            )

        if not self.RAZORPAY_WEBHOOK_SECRET:
            raise RuntimeError(
                "RAZORPAY_WEBHOOK_SECRET must be configured in production"
            )


settings = Settings()