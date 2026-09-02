from pydantic import BaseModel, ConfigDict, Field


class LoginRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    operator_id: str = Field(alias="operatorId")
    clearance: str
    role: str = ""


class OtpRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    operator_id: str = Field(alias="operatorId")
    otp: str


class EvacuateRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    operator_id: str = Field(alias="operatorId", default="OP-7734-X")
    note: str = ""