# ProofDesk - curl Examples

Replace `http://localhost:4000` with your deployed Render URL when testing
the live service.

## 1. Health check

```bash
curl -s http://localhost:4000/health | jq
```

## 2. Verify a target (REST)

```bash
curl -s -X POST http://localhost:4000/api/v1/verify \
  -H "Content-Type: application/json" \
  -d '{
    "target_address": "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984",
    "chain_id": 1
  }' | jq
```

## 3. Verify a target with a transaction payload

```bash
curl -s -X POST http://localhost:4000/api/v1/verify \
  -H "Content-Type: application/json" \
  -d '{
    "target_address": "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984",
    "chain_id": 1,
    "transaction_payload": "0xa9059cbb000000000000000000000000..."
  }' | jq
```

## 4. Discover available MCP tools

```bash
curl -s http://localhost:4000/mcp/tools | jq
```

## 5. Invoke via the MCP envelope

```bash
curl -s -X POST http://localhost:4000/mcp/invoke \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "proofdesk_verify_target",
    "input": {
      "target_address": "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984",
      "chain_id": 1
    }
  }' | jq
```

## 6. Fetch the ASP manifest (agent discovery)

```bash
curl -s http://localhost:4000/asp-manifest.json | jq
```

## 7. Look up a previously issued receipt (requires MONGODB_URI set)

```bash
curl -s http://localhost:4000/api/v1/receipts/pd_REPLACE_WITH_RECEIPT_ID | jq
```

## 8. Invalid request example (shows validation error shape)

```bash
curl -s -X POST http://localhost:4000/api/v1/verify \
  -H "Content-Type: application/json" \
  -d '{ "target_address": "not-an-address", "chain_id": 1 }' | jq
```
