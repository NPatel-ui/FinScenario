"""
FastAPI dependency for Supabase JWT authentication.

Verifies the JWT from the Authorization header using SUPABASE_JWT_SECRET,
extracts the `sub` claim as user_id, and raises 401 on any invalid/expired/missing token.
"""
import os
import logging
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt

logger = logging.getLogger(__name__)

SUPABASE_JWT_SECRET = os.environ.get("SUPABASE_JWT_SECRET", "")

# FastAPI security scheme — extracts Bearer token from Authorization header
_bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user_id(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
) -> str:
    """
    Verify the Supabase JWT and return the user_id (sub claim).
    Raises HTTP 401 if the token is missing, invalid, or expired.
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials

    if not SUPABASE_JWT_SECRET:
        logger.error("SUPABASE_JWT_SECRET is not configured in environment variables")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Server authentication is misconfigured",
        )

    try:
        payload = jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            options={"verify_aud": False},
        )
    except jwt.ExpiredSignatureError:
        logger.warning("JWT token has expired")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidSignatureError:
        # Supabase JWT secrets are often base64 encoded.
        import base64
        try:
            # Try to decode it as base64 first, then verify again
            # Pad it if necessary
            padded_secret = SUPABASE_JWT_SECRET + '=' * (-len(SUPABASE_JWT_SECRET) % 4)
            decoded_secret = base64.b64decode(padded_secret)
            payload = jwt.decode(
                token,
                decoded_secret,
                algorithms=["HS256"],
                options={"verify_aud": False},
            )
        except Exception as inner_e:
            logger.warning(f"Invalid JWT token signature (tried both plain and b64): {inner_e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid authentication token signature",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except jwt.InvalidTokenError as e:
        logger.warning(f"Invalid JWT token (likely malformed token): {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing subject claim",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user_id
