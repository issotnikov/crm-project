"""
Documents Module — API Router.
Stubs for document generation and management.
"""
from fastapi import APIRouter

router = APIRouter(prefix="/documents")


@router.get("/")
async def list_documents(page: int = 1, per_page: int = 20):
    """List documents."""
    return {"data": [], "total": 0, "page": page, "per_page": per_page}


@router.post("/generate", status_code=202)
async def generate_document(request: dict):
    """
    Generate a document (КП, contract, invoice) from a template.
    Returns 202 Accepted — generation runs async in Celery.
    """
    return {
        "document_id": "doc-uuid",
        "status": "generating",
        "message": "Document generation started. You will be notified when it's ready.",
    }


@router.get("/templates")
async def list_templates():
    """List available document templates."""
    return {
        "data": [
            {"id": "c0000000-0000-0000-0000-000000000001", "name": "Коммерческое предложение (стандарт)", "type": "quote"},
            {"id": "c0000000-0000-0000-0000-000000000002", "name": "Договор оказания услуг", "type": "contract"},
            {"id": "c0000000-0000-0000-0000-000000000003", "name": "Счёт на оплату", "type": "invoice_doc"},
            {"id": "c0000000-0000-0000-0000-000000000004", "name": "Акт выполненных работ", "type": "act"},
        ]
    }


@router.get("/{document_id}/download")
async def download_document(document_id: str):
    """Download a document (returns presigned S3 URL)."""
    return {"download_url": "https://minio.local/crm-data/documents/..."}
