"""
CRM Module — Pydantic Schemas (DTOs).
"""
import uuid
from datetime import datetime, date
from typing import Optional, Any

from pydantic import BaseModel, Field, EmailStr, ConfigDict

from app.modules.crm.models import CustomerType, CustomerStatus, LeadSource, LeadStatus, LeadPriority, DealStatus


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# CUSTOMER
# ============================================================================

class ContactCreate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    position: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None


class CustomerBase(BaseModel):
    type: CustomerType = CustomerType.company
    name: str = Field(..., min_length=1, max_length=500)
    full_legal_name: Optional[str] = None
    inn: Optional[str] = Field(None, max_length=12)
    industry: Optional[str] = None
    website: Optional[str] = None
    tags: Optional[list[str]] = None
    metadata: Optional[dict[str, Any]] = None


class CustomerCreate(CustomerBase):
    source: LeadSource = LeadSource.manual
    responsible_manager_id: Optional[uuid.UUID] = None
    contacts: Optional[list[ContactCreate]] = None


class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    full_legal_name: Optional[str] = None
    inn: Optional[str] = None
    industry: Optional[str] = None
    status: Optional[CustomerStatus] = None
    responsible_manager_id: Optional[uuid.UUID] = None
    tags: Optional[list[str]] = None
    metadata: Optional[dict[str, Any]] = None


class CustomerResponse(ORMModel):
    id: uuid.UUID
    type: CustomerType
    name: str
    full_legal_name: Optional[str]
    inn: Optional[str]
    industry: Optional[str]
    status: CustomerStatus
    source: LeadSource
    responsible_manager_id: Optional[uuid.UUID]
    tags: list[str]
    total_revenue: float
    deals_count: int
    created_at: datetime
    updated_at: datetime


class CustomerList(BaseModel):
    data: list[CustomerResponse]
    total: int
    page: int
    per_page: int


# ============================================================================
# LEAD
# ============================================================================

class LeadBase(BaseModel):
    customer_id: uuid.UUID
    title: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = None
    source: LeadSource
    priority: LeadPriority = LeadPriority.medium


class LeadCreate(LeadBase):
    assigned_to: Optional[uuid.UUID] = None


class LeadResponse(ORMModel):
    id: uuid.UUID
    customer_id: uuid.UUID
    title: str
    description: Optional[str]
    source: LeadSource
    status: LeadStatus
    priority: LeadPriority
    assigned_to: Optional[uuid.UUID]
    deal_id: Optional[uuid.UUID]
    score: int
    created_at: datetime
    updated_at: datetime


class LeadList(BaseModel):
    data: list[LeadResponse]
    total: int
    page: int
    per_page: int


# ============================================================================
# DEAL
# ============================================================================

class DealCreate(BaseModel):
    customer_id: Optional[uuid.UUID] = None
    title: str = Field(..., min_length=1, max_length=500)
    amount: float = Field(0, ge=0)
    stage_id: uuid.UUID
    expected_close_date: Optional[date] = None
    assigned_to: Optional[uuid.UUID] = None


class DealResponse(ORMModel):
    id: uuid.UUID
    customer_id: uuid.UUID
    lead_id: Optional[uuid.UUID]
    title: str
    amount: float
    currency: str
    stage_id: uuid.UUID
    status: DealStatus
    probability: int
    expected_close_date: Optional[date]
    assigned_to: Optional[uuid.UUID]
    created_at: datetime
    updated_at: datetime


class DealStageChange(BaseModel):
    stage_id: uuid.UUID
