"""
Test script for the Intercom webhook endpoint.
Sends real Intercom-format payloads and simple test payloads.

Usage:
    python test_intercom_webhook.py
"""
import asyncio
import json
import hmac
import hashlib
import httpx

BACKEND_URL    = "https://resolify-backend.onrender.com"
WEBHOOK_SECRET = "resolify2026webhook"   # matches INTERCOM_WEBHOOK_SECRET in .env


def make_signature(body: bytes, secret: str) -> str:
    return "sha1=" + hmac.new(secret.encode(), body, hashlib.sha1).hexdigest()


REAL_INTERCOM_PAYLOAD = {
    "type": "notification_event",
    "topic": "conversation.user.created",
    "data": {
        "item": {
            "id": "test_conv_001",
            "source": {
                "body": "<p>Hi, I want to cancel my subscription. Can you help me?</p>",
                "author": {
                    "email": "testcustomer@example.com",
                    "name": "Test Customer",
                    "type": "user",
                },
            },
            "contacts": {"contacts": []},
        }
    },
}

REPLIED_PAYLOAD = {
    "type": "notification_event",
    "topic": "conversation.user.replied",
    "data": {
        "item": {
            "id": "test_conv_002",
            "source": {
                "body": "<p>Original message</p>",
                "author": {"email": "testcustomer@example.com", "name": "Test Customer", "type": "user"},
            },
            "conversation_parts": {
                "conversation_parts": [
                    {
                        "body": "<p>Actually, I have a <strong>billing question</strong> instead.</p>",
                        "author": {"email": "testcustomer@example.com", "name": "Test Customer", "type": "user"},
                    }
                ]
            },
        }
    },
}

TEST_FORMAT_PAYLOAD = {
    "ticket_id": "TEST-001",
    "customer_email": "testcustomer@example.com",
    "customer_name": "Test Customer",
    "message": "I need help resetting my password.",
}

PING_PAYLOAD = {"topic": "ping"}


async def send(name: str, payload: dict, sign: bool = False, expect_status: int = 200) -> None:
    body = json.dumps(payload).encode()
    headers: dict = {"Content-Type": "application/json"}
    if sign:
        headers["X-Hub-Signature"] = make_signature(body, WEBHOOK_SECRET)

    sep = "=" * 60
    print(f"\n{sep}")
    print(f"TEST: {name}")
    print(f"Signed: {sign}  |  Expected HTTP: {expect_status}")
    if len(body) < 400:
        print(f"Payload: {json.dumps(payload, indent=2)}")
    print(sep)

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(
                f"{BACKEND_URL}/api/webhook/intercom",
                content=body,
                headers=headers,
            )
            status_ok = "OK" if resp.status_code == expect_status else "FAIL"
            print(f"{status_ok} HTTP {resp.status_code}")
            try:
                print(json.dumps(resp.json(), indent=2))
            except Exception:
                print(resp.text[:500])
    except Exception as exc:
        print(f"Request failed: {exc}")


async def main() -> None:
    print("Resolify - Intercom Webhook Integration Test")
    print(f"Target: {BACKEND_URL}/api/webhook/intercom\n")

    # 1. Ping
    await send("Ping", PING_PAYLOAD)

    # 2. Simple test format (no signature)
    await send("Simple test format (unsigned)", TEST_FORMAT_PAYLOAD)

    # 3. Real Intercom format, unsigned (test / no-signature mode)
    await send("Real Intercom - conversation.user.created (unsigned)", REAL_INTERCOM_PAYLOAD)

    # 4. Real Intercom format, signed
    await send("Real Intercom - conversation.user.created (signed)", REAL_INTERCOM_PAYLOAD, sign=True)

    # 5. Real Intercom format - replied event
    await send("Real Intercom - conversation.user.replied (signed)", REPLIED_PAYLOAD, sign=True)

    # 6. Bad signature → expect 401
    body = json.dumps(REAL_INTERCOM_PAYLOAD).encode()
    headers = {
        "Content-Type": "application/json",
        "X-Hub-Signature": "sha1=deadbeef_this_is_wrong",
    }
    print(f"\n{'='*60}")
    print("TEST: Bad signature (expect 401)")
    print(f"{'='*60}")
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(
            f"{BACKEND_URL}/api/webhook/intercom",
            content=body,
            headers=headers,
        )
        mark = "OK" if resp.status_code == 401 else "FAIL"
        print(f"{mark} HTTP {resp.status_code}  (expected 401)")
        print(resp.text[:200])

    print("\nDone.")


if __name__ == "__main__":
    asyncio.run(main())
