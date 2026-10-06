# Password hashing helpers (bcrypt)
import hmac
import bcrypt


def hash_password(password: str) -> str:
    """Return a bcrypt hash of the password, safe to store in the database"""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def is_hashed(stored: str) -> bool:
    """True if the stored value is a bcrypt hash (vs. a legacy plain-text password)"""
    return isinstance(stored, str) and stored.startswith(("$2a$", "$2b$", "$2y$"))


def verify_password(password: str, stored: str) -> bool:
    """Check a password against a stored bcrypt hash (or legacy plain-text value)"""
    if not stored:
        return False
    if is_hashed(stored):
        return bcrypt.checkpw(password.encode("utf-8"), stored.encode("utf-8"))
    # Legacy plain-text record: constant-time compare; caller should re-hash on success
    return hmac.compare_digest(password.encode("utf-8"), stored.encode("utf-8"))
