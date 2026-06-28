"""
Domain exceptions for the CRM system.
"""


class CRMApiError(Exception):
    """Base API error with HTTP status code."""

    status_code: int = 400
    error_code: str = "api_error"

    def __init__(self, message: str = "", details: dict | None = None):
        self.message = message or "An error occurred"
        self.details = details or {}
        super().__init__(self.message)


class NotFoundError(CRMApiError):
    status_code = 404
    error_code = "not_found"


class UnauthorizedError(CRMApiError):
    status_code = 401
    error_code = "unauthorized"


class ForbiddenError(CRMApiError):
    status_code = 403
    error_code = "forbidden"


class ValidationError(CRMApiError):
    status_code = 422
    error_code = "validation_error"


class ConflictError(CRMApiError):
    status_code = 409
    error_code = "conflict"


class RateLimitError(CRMApiError):
    status_code = 429
    error_code = "rate_limited"


# ── Domain-specific errors ──────────────────────────────────────────────────

class CustomerNotFound(NotFoundError):
    def __init__(self, customer_id: str):
        super().__init__(f"Customer {customer_id} not found", {"entity": "customer", "id": customer_id})


class LeadNotFound(NotFoundError):
    def __init__(self, lead_id: str):
        super().__init__(f"Lead {lead_id} not found", {"entity": "lead", "id": lead_id})


class DealNotFound(NotFoundError):
    def __init__(self, deal_id: str):
        super().__init__(f"Deal {deal_id} not found", {"entity": "deal", "id": deal_id})


class DuplicateCustomerError(ConflictError):
    def __init__(self, field_name: str, value: str):
        super().__init__(
            f"Customer with {field_name}={value} already exists",
            {"field": field_name, "value": value},
        )


class LeadAlreadyConvertedError(ConflictError):
    def __init__(self, lead_id: str):
        super().__init__(
            f"Lead {lead_id} is already converted to a deal",
            {"lead_id": lead_id},
        )


class InvalidStageError(ValidationError):
    def __init__(self, detail: str):
        super().__init__(f"Invalid stage: {detail}")


class SLAViolatedError(CRMApiError):
    status_code = 200  # Not an API error per se, but a business event
    error_code = "sla_violated"
