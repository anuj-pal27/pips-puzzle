"""
Django settings for the Pip's Puzzles backend.

Everything that changes between your laptop and a real server comes from environment
variables, read from backend/.env (copy .env.example to .env to start).
"""

import os
from datetime import timedelta
from pathlib import Path

import dj_database_url
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")


def env_bool(name: str, default: bool) -> bool:
    return os.environ.get(name, "1" if default else "0").strip().lower() in {"1", "true", "yes", "on"}


def env_list(name: str, default: str = "") -> list[str]:
    return [item.strip() for item in os.environ.get(name, default).split(",") if item.strip()]


# --- Core -----------------------------------------------------------------------------------

DEBUG = env_bool("DJANGO_DEBUG", True)

SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "")
if not SECRET_KEY:
    if not DEBUG:
        raise RuntimeError("Set DJANGO_SECRET_KEY in the environment before running with DJANGO_DEBUG=0.")
    SECRET_KEY = "dev-only-insecure-key-do-not-use-in-production"

# Add your laptop's Wi-Fi address here (e.g. 192.168.1.5) so your phone can reach the server.
ALLOWED_HOSTS = env_list("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1")
# On Render, the service's own address (e.g. pips-puzzles-api.onrender.com) is set for us.
RENDER_HOST = os.environ.get("RENDER_EXTERNAL_HOSTNAME")
if RENDER_HOST:
    ALLOWED_HOSTS.append(RENDER_HOST)

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # third party
    "rest_framework",
    "corsheaders",
    # ours
    "accounts",
    "content",
    "progress",
    "analytics",
    "dashboard",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",  # serves the dashboard's CSS, JS and pictures in production
    "django.contrib.sessions.middleware.SessionMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

# --- Database -------------------------------------------------------------------------------
# PostgreSQL via DATABASE_URL, e.g. postgres://pips:pips@localhost:5432/pips_puzzles
# Without DATABASE_URL it falls back to a local SQLite file, handy for a first quick run.

DATABASES = {
    "default": dj_database_url.config(
        default=f"sqlite:///{BASE_DIR / 'db.sqlite3'}",
        conn_max_age=600,
        conn_health_checks=True,
    )
}

AUTH_USER_MODEL = "accounts.User"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "Asia/Kolkata"
USE_I18N = True
USE_TZ = True

# --- Files ----------------------------------------------------------------------------------

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
# The app's own pictures (friends, snacks, puzzle art), so the dashboard can show them as they look in the game.
GAME_ART_DIR = BASE_DIR.parent / "app" / "assets" / "images" / "game"
STATICFILES_DIRS = [("game", GAME_ART_DIR)] if GAME_ART_DIR.is_dir() else []
# A missing game picture shouldn't break a dashboard page: fall back to the plain file name.
WHITENOISE_MANIFEST_STRICT = False

# Uploaded puzzle pictures. On your laptop they're saved in backend/media/. On a server, files saved
# there vanish on every deploy, so set MEDIA_S3_* to keep them in S3-compatible storage instead
# (Supabase Storage, Cloudflare R2, AWS S3). See README, "Deploy the backend".
MEDIA_URL = "media/"
MEDIA_ROOT = BASE_DIR / "media"
MEDIA_S3_BUCKET = os.environ.get("MEDIA_S3_BUCKET", "")

STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {
        "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"
        if DEBUG
        else "whitenoise.storage.CompressedManifestStaticFilesStorage"
    },
}
if MEDIA_S3_BUCKET:
    missing = [k for k in ("MEDIA_S3_ENDPOINT", "MEDIA_S3_ACCESS_KEY_ID", "MEDIA_S3_SECRET_ACCESS_KEY", "MEDIA_PUBLIC_HOST") if not os.environ.get(k)]
    if missing:
        raise RuntimeError(f"MEDIA_S3_BUCKET is set, so these are needed too: {', '.join(missing)}")
    STORAGES["default"] = {
        "BACKEND": "storages.backends.s3.S3Storage",
        "OPTIONS": {
            "bucket_name": MEDIA_S3_BUCKET,
            "endpoint_url": os.environ["MEDIA_S3_ENDPOINT"],  # Supabase: https://<project-ref>.storage.supabase.co/storage/v1/s3
            "region_name": os.environ.get("MEDIA_S3_REGION", "us-east-1"),
            "access_key": os.environ["MEDIA_S3_ACCESS_KEY_ID"],
            "secret_key": os.environ["MEDIA_S3_SECRET_ACCESS_KEY"],
            "addressing_style": "path",  # Supabase needs path-style addresses
            "signature_version": "s3v4",
            "file_overwrite": False,
            "default_acl": None,
            "querystring_auth": False,  # the bucket is public: plain links that phones can cache
            # Public address of the bucket, without https:// (Supabase: <project-ref>.supabase.co/storage/v1/object/public/<bucket>)
            "custom_domain": os.environ["MEDIA_PUBLIC_HOST"],
        },
    }

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# The staff dashboard (/dashboard/) signs in through the admin's login page.
LOGIN_URL = "admin:login"

# --- API ------------------------------------------------------------------------------------

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": ["rest_framework_simplejwt.authentication.JWTAuthentication"],
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.IsAuthenticated"],
    "DEFAULT_THROTTLE_CLASSES": ["rest_framework.throttling.AnonRateThrottle"],
    "DEFAULT_THROTTLE_RATES": {"anon": "60/minute", "events": "120/minute"},
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=30),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=30),
}

# The phone app doesn't need CORS; this is only for the Expo web preview (npx expo start --web).
CORS_ALLOWED_ORIGINS = env_list("CORS_ALLOWED_ORIGINS", "http://localhost:8081,http://127.0.0.1:8081")

# Shown on the public privacy policy page (/privacy/), which the app and the store listings link to.
PRIVACY_OWNER = os.environ.get("PRIVACY_OWNER", "Anuj Pal")
PRIVACY_EMAIL = os.environ.get("PRIVACY_EMAIL", "anujpal27669@gmail.com")

# --- Production hardening (applies when DJANGO_DEBUG=0) --------------------------------------

if not DEBUG:
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
    SECURE_SSL_REDIRECT = env_bool("DJANGO_SECURE_SSL_REDIRECT", True)
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = 60 * 60 * 24 * 30
    SECURE_CONTENT_TYPE_NOSNIFF = True
    CSRF_TRUSTED_ORIGINS = env_list("DJANGO_CSRF_TRUSTED_ORIGINS")
    if RENDER_HOST:
        CSRF_TRUSTED_ORIGINS.append(f"https://{RENDER_HOST}")  # so the admin and dashboard forms work

# Errors go to the console, which is what the host's log viewer shows.
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {"console": {"class": "logging.StreamHandler"}},
    "root": {"handlers": ["console"], "level": "WARNING"},
    # Bots knock with made-up host names all day; Django already turns them away.
    "loggers": {"django.security.DisallowedHost": {"handlers": [], "propagate": False}},
}
