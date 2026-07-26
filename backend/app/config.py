from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # MySQL
    MYSQL_HOST: str = "mysql"
    MYSQL_PORT: int = 3306
    MYSQL_USER: str = "restaurant_user"
    MYSQL_PASSWORD: str = "restaurant_pass"
    MYSQL_DATABASE: str = "restaurant_db"

    # Redis
    REDIS_HOST: str = "redis"
    REDIS_PORT: int = 6379

    # JWT
    JWT_SECRET_KEY: str = "change_this_secret"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # Groq
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.3-70b-versatile"

    # Default admin
    DEFAULT_ADMIN_EMAIL: str = "admin@restaurant.com"
    DEFAULT_ADMIN_PASSWORD: str = "Admin@123"
    DEFAULT_ADMIN_NAME: str = "Restaurant Admin"

    @property
    def DATABASE_URL(self) -> str:
        return (
            f"mysql+pymysql://{self.MYSQL_USER}:{self.MYSQL_PASSWORD}"
            f"@{self.MYSQL_HOST}:{self.MYSQL_PORT}/{self.MYSQL_DATABASE}"
        )

    class Config:
        env_file = ".env"


settings = Settings()
