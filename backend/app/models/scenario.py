from enum import Enum
from typing import Optional, Literal, Any, Dict, List
from pydantic import BaseModel, Field
from datetime import datetime

class ScenarioType(str, Enum):
    RENT_VS_BUY = "rent_vs_buy"
    LEASE_VS_BUY_CAR = "lease_vs_buy_car"
    DEBT_VS_INVEST = "debt_vs_invest"
    CUSTOM = "custom"

class ScenarioInput(BaseModel):
    field_name: str
    value: Any
    source: Literal["user_provided", "live_data", "default_estimate"]
    as_of_date: Optional[str] = None
    citation: Optional[str] = None

class ScenarioResult(BaseModel):
    summary: str                     
    numeric_breakdown: Dict[str, Any] 
    assumptions_used: List[ScenarioInput]
    computed_at: datetime

class Message(BaseModel):
    role: Literal["user", "assistant"]
    content: str

class Scenario(BaseModel):
    id: str
    user_id: str
    type: ScenarioType
    title: Optional[str] = None
    inputs: List[ScenarioInput] = Field(default_factory=list)
    result: Optional[ScenarioResult] = None
    conversation: List[Message] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
