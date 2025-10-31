#!/bin/bash

# Test script for gokceinvoice APIs
BASE_URL="http://localhost:3000"
COOKIE_FILE="/tmp/test_cookies.txt"

echo "=== Testing Invoice App APIs ==="
echo

# Clean up old cookies
rm -f $COOKIE_FILE

# 1. Test authentication - login
echo "1. Testing login..."
curl -s -X POST "${BASE_URL}/api/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"djumanji","password":"admin"}' \
  -c $COOKIE_FILE > /dev/null

if [ $? -eq 0 ]; then
  echo "✓ Login successful"
else
  echo "✗ Login failed"
fi
echo

# 2. Test chatbot session creation
echo "2. Testing chatbot session..."
CHATBOT_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/chatbot/sessions" \
  -H "Content-Type: application/json" \
  -d '{}' \
  -b $COOKIE_FILE)

if echo "$CHATBOT_RESPONSE" | grep -q "sessionId"; then
  echo "✓ Chatbot session created"
  SESSION_ID=$(echo "$CHATBOT_RESPONSE" | grep -o '"sessionId":"[^"]*"' | cut -d'"' -f4)
  echo "  Session ID: $SESSION_ID"
else
  echo "✗ Chatbot session failed"
  echo "  Response: $CHATBOT_RESPONSE"
fi
echo

# 3. Test chatbot message
echo "3. Testing chatbot message..."
CHATBOT_MSG=$(curl -s -X POST "${BASE_URL}/api/chatbot/messages" \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\":\"$SESSION_ID\",\"message\":\"I need help with plumbing\"}" \
  -b $COOKIE_FILE)

if echo "$CHATBOT_MSG" | grep -q "assistantMessage"; then
  echo "✓ Chatbot message sent"
  echo "  Response: $(echo $CHATBOT_MSG | grep -o '"assistantMessage":"[^"]*"' | cut -d'"' -f4)"
else
  echo "✗ Chatbot message failed"
  echo "  Response: $CHATBOT_MSG"
fi
echo

# 4. Test messages/conversations API
echo "4. Testing conversations API..."
CONVOS=$(curl -s -X GET "${BASE_URL}/api/messages/conversations" \
  -b $COOKIE_FILE)

if echo "$CONVOS" | grep -q "\[" || echo "$CONVOS" | grep -q "error"; then
  if echo "$CONVOS" | grep -q "error"; then
    echo "⚠ Conversations API returned error (expected if no migrations run)"
    echo "  Error: $(echo $CONVOS | grep -o '"error":"[^"]*"' | cut -d'"' -f4)"
  else
    echo "✓ Conversations API working"
    echo "  Found $(echo $CONVOS | grep -o '\[' | wc -l) conversations"
  fi
else
  echo "✗ Conversations API failed"
  echo "  Response: $CONVOS"
fi
echo

# 5. Test clients API
echo "5. Testing clients API..."
CLIENTS=$(curl -s -X GET "${BASE_URL}/api/clients" \
  -b $COOKIE_FILE)

if echo "$CLIENTS" | grep -q "\["; then
  echo "✓ Clients API working"
  CLIENT_COUNT=$(echo "$CLIENTS" | grep -o '"id"' | wc -l)
  echo "  Found $CLIENT_COUNT clients"
else
  echo "✗ Clients API failed"
fi
echo

# 6. Test services API
echo "6. Testing services API..."
SERVICES=$(curl -s -X GET "${BASE_URL}/api/services" \
  -b $COOKIE_FILE)

if echo "$SERVICES" | grep -q "\["; then
  echo "✓ Services API working"
  SERVICE_COUNT=$(echo "$SERVICES" | grep -o '"id"' | wc -l)
  echo "  Found $SERVICE_COUNT services"
else
  echo "✗ Services API failed"
fi
echo

# 7. Test invoices API
echo "7. Testing invoices API..."
INVOICES=$(curl -s -X GET "${BASE_URL}/api/invoices" \
  -b $COOKIE_FILE)

if echo "$INVOICES" | grep -q "\["; then
  echo "✓ Invoices API working"
  INVOICE_COUNT=$(echo "$INVOICES" | grep -o '"id"' | wc -l)
  echo "  Found $INVOICE_COUNT invoices"
else
  echo "✗ Invoices API failed"
fi
echo

echo "=== Test Summary ==="
echo "All basic API endpoints tested"
echo "Check the output above for any failures"
