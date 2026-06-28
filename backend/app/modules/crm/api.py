"""
CRM Module — API Router
Customers, Leads, Deals endpoints.
"""
import uuid
from datetime import datetime
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import select, func, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import CustomerNotFound, LeadNotFound, NotFoundError
from app.deps import CurrentUser, DBSession, Pagination, require_permission
from app.modules.crm.models import (
    Customer, Contact, Lead, Deal, Pipeline, DealStage,
    CustomerStatus, LeadSource, LeadStatus, LeadPriority, DealStatus,
)
from app.modules.crm.schemas import (
    CustomerResponse, CustomerCreate, CustomerUpdate, CustomerList,
    LeadResponse, LeadCreate, LeadList,
    DealResponse, DealCreate, DealStageChange,
)

router = APIRouter(prefix="/crm")


# ============================================================================
# CUSTOMERS
# ============================================================================

@router.get("/customers", response_model=CustomerList, dependencies=[Depends(require_permission("crm.customers.read"))])
async def list_customers(
    db: DBSession,
    pagination: Pagination,
    search: Optional[str] = Query(None, description="Search by name, INN, phone"),
    customer_status: Optional[CustomerStatus] = Query(None, alias="status"),
    manager_id: Optional[uuid.UUID] = Query(None),
):
    """List customers with pagination, search and filtering."""
    query = select(Customer).where(Customer.deleted_at.is_(None))

    if search:
        query = query.where(
            Customer.name.ilike(f"%{search}%") |
            Customer.inn.ilike(f"%{search}%")
        )
    if customer_status:
        query = query.where(Customer.status == customer_status)
    if manager_id:
        query = query.where(Customer.responsible_manager_id == manager_id)

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar()

    # Paginate
    query = query.order_by(Customer.created_at.desc()).offset(pagination.offset).limit(pagination.limit)
    result = await db.execute(query)
    customers = result.scalars().all()

    return CustomerList(data=customers, total=total, page=pagination.page, per_page=pagination.per_page)


@router.post("/customers", response_model=CustomerResponse, status_code=201, dependencies=[Depends(require_permission("crm.customers.create"))])
async def create_customer(
    data: CustomerCreate,
    db: DBSession,
    user: CurrentUser,
):
    """Create a new customer."""
    customer = Customer(
        type=data.type,
        name=data.name,
        full_legal_name=data.full_legal_name,
        inn=data.inn,
        industry=data.industry,
        website=data.website,
        source=data.source,
        status=CustomerStatus.active,
        responsible_manager_id=data.responsible_manager_id or user["id"],
        tags=data.tags or [],
        metadata_=data.metadata or {},
        created_by=user["id"],
    )
    db.add(customer)
    await db.flush()

    # Create primary contact if provided
    if data.contacts:
        for i, c in enumerate(data.contacts):
            contact = Contact(
                customer_id=customer.id,
                first_name=c.first_name,
                last_name=c.last_name,
                phone=c.phone,
                email=c.email,
                position=c.position,
                is_primary=(i == 0),
            )
            db.add(contact)

    await db.refresh(customer)
    return customer


@router.get("/customers/{customer_id}", response_model=CustomerResponse, dependencies=[Depends(require_permission("crm.customers.read"))])
async def get_customer(customer_id: uuid.UUID, db: DBSession):
    """Get a customer by ID."""
    customer = await db.get(Customer, customer_id)
    if not customer or customer.deleted_at:
        raise CustomerNotFound(str(customer_id))
    return customer


@router.put("/customers/{customer_id}", response_model=CustomerResponse, dependencies=[Depends(require_permission("crm.customers.update"))])
async def update_customer(
    customer_id: uuid.UUID,
    data: CustomerUpdate,
    db: DBSession,
):
    """Update a customer."""
    customer = await db.get(Customer, customer_id)
    if not customer or customer.deleted_at:
        raise CustomerNotFound(str(customer_id))

    update_data = data.model_dump(exclude_unset=True)
    if "metadata" in update_data:
        update_data["metadata_"] = update_data.pop("metadata")

    for field, value in update_data.items():
        setattr(customer, field, value)

    await db.flush()
    await db.refresh(customer)
    return customer


@router.delete("/customers/{customer_id}", status_code=204, dependencies=[Depends(require_permission("crm.customers.delete"))])
async def delete_customer(customer_id: uuid.UUID, db: DBSession):
    """Soft-delete a customer."""
    customer = await db.get(Customer, customer_id)
    if not customer or customer.deleted_at:
        raise CustomerNotFound(str(customer_id))

    customer.deleted_at = datetime.utcnow()
    await db.flush()


# ============================================================================
# LEADS
# ============================================================================

@router.get("/leads", response_model=LeadList, dependencies=[Depends(require_permission("crm.leads.read"))])
async def list_leads(
    db: DBSession,
    pagination: Pagination,
    lead_status: Optional[LeadStatus] = Query(None, alias="status"),
    source: Optional[LeadSource] = Query(None),
    assigned_to: Optional[uuid.UUID] = Query(None),
):
    """List leads with filters."""
    query = select(Lead)

    if lead_status:
        query = query.where(Lead.status == lead_status)
    if source:
        query = query.where(Lead.source == source)
    if assigned_to:
        query = query.where(Lead.assigned_to == assigned_to)

    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar()

    query = query.order_by(Lead.created_at.desc()).offset(pagination.offset).limit(pagination.limit)
    result = await db.execute(query)
    leads = result.scalars().all()

    return LeadList(data=leads, total=total, page=pagination.page, per_page=pagination.per_page)


@router.post("/leads", response_model=LeadResponse, status_code=201, dependencies=[Depends(require_permission("crm.leads.create"))])
async def create_lead(
    data: LeadCreate,
    db: DBSession,
    user: CurrentUser,
):
    """Create a lead manually."""
    lead = Lead(
        customer_id=data.customer_id,
        title=data.title,
        description=data.description,
        source=data.source,
        priority=data.priority,
        assigned_to=data.assigned_to or user["id"],
    )
    db.add(lead)
    await db.flush()
    await db.refresh(lead)
    return lead


@router.get("/leads/{lead_id}", response_model=LeadResponse, dependencies=[Depends(require_permission("crm.leads.read"))])
async def get_lead(lead_id: uuid.UUID, db: DBSession):
    """Get a lead by ID."""
    lead = await db.get(Lead, lead_id)
    if not lead:
        raise LeadNotFound(str(lead_id))
    return lead


@router.post("/leads/{lead_id}/convert", response_model=DealResponse, status_code=201, dependencies=[Depends(require_permission("crm.leads.convert"))])
async def convert_lead(
    lead_id: uuid.UUID,
    deal_data: DealCreate,
    db: DBSession,
):
    """Convert a lead to a deal."""
    lead = await db.get(Lead, lead_id)
    if not lead:
        raise LeadNotFound(str(lead_id))
    if lead.status == LeadStatus.converted:
        from app.core.exceptions import LeadAlreadyConvertedError
        raise LeadAlreadyConvertedError(str(lead_id))

    # Create deal
    deal = Deal(
        customer_id=lead.customer_id,
        lead_id=lead.id,
        title=deal_data.title or lead.title,
        amount=deal_data.amount or 0,
        stage_id=deal_data.stage_id,
        status=DealStatus.open,
        assigned_to=lead.assigned_to,
    )
    db.add(deal)

    # Update lead
    lead.status = LeadStatus.converted
    lead.deal_id = deal.id
    lead.converted_at = datetime.utcnow()

    await db.flush()
    await db.refresh(deal)
    return deal


# ============================================================================
# DEALS
# ============================================================================

@router.get("/deals", dependencies=[Depends(require_permission("crm.deals.read"))])
async def list_deals(
    db: DBSession,
    pagination: Pagination,
    deal_status: Optional[DealStatus] = Query(None, alias="status"),
    stage_id: Optional[uuid.UUID] = Query(None),
):
    """List deals."""
    query = select(Deal)

    if deal_status:
        query = query.where(Deal.status == deal_status)
    if stage_id:
        query = query.where(Deal.stage_id == stage_id)

    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar()

    query = query.order_by(Deal.updated_at.desc()).offset(pagination.offset).limit(pagination.limit)
    result = await db.execute(query)
    deals = result.scalars().all()

    return {"data": deals, "total": total, "page": pagination.page, "per_page": pagination.per_page}


@router.patch("/deals/{deal_id}/stage", dependencies=[Depends(require_permission("crm.deals.update"))])
async def change_deal_stage(
    deal_id: uuid.UUID,
    data: DealStageChange,
    db: DBSession,
):
    """Change deal stage (for Kanban drag-and-drop)."""
    deal = await db.get(Deal, deal_id)
    if not deal:
        raise NotFoundError(f"Deal {deal_id} not found")

    old_stage_id = deal.stage_id
    deal.stage_id = data.stage_id

    # Update probability from stage
    stage = await db.get(DealStage, data.stage_id)
    if stage:
        deal.probability = stage.probability
        if stage.is_won_stage:
            deal.status = DealStatus.won
            deal.actual_close_date = datetime.utcnow().date()
        elif stage.is_lost_stage:
            deal.status = DealStatus.lost
            deal.actual_close_date = datetime.utcnow().date()

    await db.flush()
    return {"deal_id": str(deal_id), "old_stage_id": str(old_stage_id), "new_stage_id": str(data.stage_id)}


# ============================================================================
# PIPELINES & STAGES
# ============================================================================

@router.get("/pipelines", dependencies=[Depends(require_permission("crm.deals.read"))])
async def list_pipelines(db: DBSession):
    """List all pipelines with their stages."""
    query = select(Pipeline).options(
        # In production: use selectinload for stages
    )
    result = await db.execute(query)
    pipelines = result.scalars().all()
    return {"data": pipelines}
