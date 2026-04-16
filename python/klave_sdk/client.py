from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import httpx

from .errors import KlaveError


@dataclass
class KlaveClient:
    api_key: str
    base_url: str = "https://api.klave.com"
    timeout: float = 15.0

    async def _request(self, method: str, path: str, json: dict[str, Any] | None = None) -> dict[str, Any]:
        headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.request(method, f"{self.base_url}{path}", headers=headers, json=json)
            except httpx.HTTPError as exc:
                raise KlaveError(str(exc), "NETWORK_ERROR", retryable=True) from exc

        if response.status_code >= 400:
            payload = response.json() if response.text else {}
            raise KlaveError(payload.get("message", "Request failed"), payload.get("code", "SERVICE_DEGRADED"), response.status_code)
        return response.json()

    async def create_agent_scope(self, **params: Any) -> dict[str, Any]:
        return await self._request("POST", "/v1/agent-scope/create", params)

    async def verify_scope(self, token: str) -> dict[str, Any]:
        return await self._request("POST", "/v1/agent-scope/verify", {"token": token})

    async def revoke_scope(self, token: str) -> dict[str, Any]:
        return await self._request("POST", "/v1/agent-scope/revoke", {"token": token})

    async def start_negotiation(self, *, scope_token: str, listing_id: str) -> dict[str, Any]:
        return await self._request("POST", "/v1/negotiation/start", {"scopeToken": scope_token, "listingId": listing_id})

    async def submit_offer(self, *, session_id: str, offer_cents: int) -> dict[str, Any]:
        return await self._request("POST", "/v1/negotiation/offer", {"sessionId": session_id, "offerCents": offer_cents})

    async def finalize(self, *, session_id: str) -> dict[str, Any]:
        return await self._request("POST", "/v1/negotiation/finalize", {"sessionId": session_id})

    async def negotiate(self, *, scope_token: str, listing_id: str) -> dict[str, Any]:
        return await self._request("POST", "/v1/negotiation/auto", {"scopeToken": scope_token, "listingId": listing_id})

    async def get_proof(self, *, session_id: str) -> dict[str, Any]:
        return await self._request("GET", f"/v1/negotiation/{session_id}/proof")

    async def verify_proof(self, *, proof: str, public_inputs: dict[str, Any], circuit_version: str) -> dict[str, Any]:
        if not circuit_version:
            raise KlaveError("circuit_version is required", "CIRCUIT_VERSION_MISMATCH")
        return await self._request(
            "POST",
            "/v1/verify",
            {"proof": proof, "publicInputs": public_inputs, "circuitVersion": circuit_version},
        )
