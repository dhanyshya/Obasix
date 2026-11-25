from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


class Out(BaseModel):
    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True)


class Me(Out):
    ok: Literal[True] = True
    email: str
    name: str
    role: str
    source: Literal["config", "granted"]
    permissions: list[str]


class StockRow(Out):
    product_id: str = Field(serialization_alias="productId")
    name: str
    sku: str
    on_hand: int | None = Field(serialization_alias="onHand")
    state: Literal["in-stock", "low", "made-to-order", "untracked"]
    updated_by: str | None = Field(serialization_alias="updatedBy")
    updated_at: str | None = Field(serialization_alias="updatedAt")


class StockPage(Out):
    ok: Literal[True] = True
    items: list[StockRow]
    page: int
    page_size: int = Field(serialization_alias="pageSize")
    total: int


class AuditEntry(Out):
    id: int
    at: datetime
    actor_email: str = Field(serialization_alias="actorEmail")
    actor_role: str = Field(serialization_alias="actorRole")
    action: str
    target_type: str = Field(serialization_alias="targetType")
    target_id: str = Field(serialization_alias="targetId")
    detail: dict[str, Any]
    request_id: str = Field(serialization_alias="requestId")
    ip: str


class AuditPage(Out):
    ok: Literal[True] = True
    items: list[AuditEntry]
    page: int
    page_size: int = Field(serialization_alias="pageSize")
    total: int


class StaffMember(Out):
    email: str
    role: str
    source: Literal["config", "granted"]
    granted_by: str | None = Field(None, serialization_alias="grantedBy")
    granted_at: datetime | None = Field(None, serialization_alias="grantedAt")


class StaffList(Out):
    ok: Literal[True] = True
    items: list[StaffMember]


class GrantIn(BaseModel):
    email: str = Field(min_length=3, max_length=120, pattern=r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
    role: Literal["admin", "staff"]


class Done(Out):
    ok: Literal[True] = True
