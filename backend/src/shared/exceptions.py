"""Centralized exception handling for Helix Backend."""

from fastapi import HTTPException, status

class HelixException(Exception):
    """Base exception for all Helix custom errors."""
    pass

class ValidationException(HelixException):
    """Raised when incoming data fails business validation."""
    pass

class NotFoundException(HelixException):
    """Raised when an entity is not found."""
    pass

class UnauthorizedException(HelixException):
    """Raised for authentication or permission issues."""
    pass

def setup_exception_handlers(app):
    """Register custom exception handlers with FastAPI."""
    from fastapi import Request
    from fastapi.responses import JSONResponse

    @app.exception_handler(ValidationException)
    async def validation_exception_handler(request: Request, exc: ValidationException):
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"detail": str(exc)},
        )

    @app.exception_handler(NotFoundException)
    async def not_found_exception_handler(request: Request, exc: NotFoundException):
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"detail": str(exc)},
        )

    @app.exception_handler(UnauthorizedException)
    async def unauthorized_exception_handler(request: Request, exc: UnauthorizedException):
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"detail": str(exc)},
        )
