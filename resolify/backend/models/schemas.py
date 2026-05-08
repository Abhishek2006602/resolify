from pydantic import BaseModel
from typing import Optional, Any
from uuid import UUID
from datetime import datetime


class IntercomWebhookPayload(BaseModel):
    ticket_id: str
    customer_email: str
    message: str
    customer_name: Optional[str] = None
    client_id: Optional[str] = None


class EnrichedContext(BaseModel):
    plan: str
    mrr: int
    days_as_customer: int
    payment_status: str
    last_3_actions: list[str]
    account_health: str
    total_tickets_this_month: int
    company_name: str


class ClassificationResult(BaseModel):
    intent: str
    confidence: float
    tone: str
    escalate_immediately: bool
    escalate_reason: Optional[str] = None
    tokens_used: int = 0
    cost_units: int = 0      # hundredths-of-a-cent; divide by 100 for cents


class GeneratedResponse(BaseModel):
    response_text: str
    confidence: float
    tokens_used: int
    cost_units: int = 0
    model_used: str = "sonnet"


class ClientRecord(BaseModel):
    id: UUID
    name: str
    email: str
    plan: str = "starter"
    ticket_limit: int = 1000
    draft_mode: bool = True
    intercom_access_token: Optional[str] = None
    intercom_webhook_secret: Optional[str] = None
    stripe_key: Optional[str] = None
    hubspot_key: Optional[str] = None
    created_at: datetime


class TicketRecord(BaseModel):
    id: UUID
    customer_email: str
    message: str
    ticket_id: str
    status: str = "pending"
    created_at: datetime
    customer_name: Optional[str] = None
    customer_context: Optional[dict[str, Any]] = None
    intent: Optional[str] = None
    confidence: Optional[float] = None
    escalate_immediately: Optional[bool] = False
    ai_response: Optional[str] = None
    escalation_summary: Optional[str] = None
    processed_at: Optional[datetime] = None
    client_id: Optional[UUID] = None
    tokens_used: Optional[int] = 0
    api_cost_cents: Optional[int] = 0
    language: Optional[str] = "en"
    knowledge_gap: Optional[bool] = False
    rag_confidence: Optional[float] = 0.0
    model_used: Optional[str] = None
