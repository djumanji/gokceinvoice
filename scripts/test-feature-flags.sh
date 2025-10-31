#!/bin/bash

# Script to test PostHog feature flags
# This demonstrates how to check feature flags using the PostHog API

POSTHOG_KEY="phx_ystHoktO03XLgRleAUQ7G7EJCBUaWAu8xAzkMjNNqkjJeKf"
POSTHOG_HOST="https://app.posthog.com"

echo "🧪 Testing PostHog Feature Flags"
echo "================================="
echo

# Test distinct ID (simulating a user)
DISTINCT_ID="test-user-$(date +%s)"

echo "📋 Test Configuration:"
echo "  PostHog Host: $POSTHOG_HOST"
echo "  Project Key: ${POSTHOG_KEY:0:10}..."
echo "  Distinct ID: $DISTINCT_ID"
echo

# Feature flags to test
FLAGS=(
  "enable-real-time-messaging"
  "enable-ai-chatbot"
  "enable-new-dashboard"
  "enable-admin-panel"
  "enable-dark-mode"
)

echo "🚩 Testing Feature Flags:"
echo

for FLAG in "${FLAGS[@]}"; do
  echo -n "  ⏳ $FLAG ... "

  # Call PostHog decide API
  RESPONSE=$(curl -s -X POST "$POSTHOG_HOST/decide/?v=3" \
    -H "Content-Type: application/json" \
    -d "{
      \"api_key\": \"$POSTHOG_KEY\",
      \"distinct_id\": \"$DISTINCT_ID\",
      \"person_properties\": {
        \"email\": \"test@example.com\"
      }
    }")

  # Check if flag is enabled
  if echo "$RESPONSE" | grep -q "\"$FLAG\""; then
    echo "✅ ENABLED"
  else
    echo "❌ DISABLED (or not created yet)"
  fi
done

echo
echo "📊 Full Response Sample:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"

echo
echo "🎯 Next Steps:"
echo "  1. Go to https://app.posthog.com"
echo "  2. Navigate to 'Feature Flags'"
echo "  3. Create a flag with one of the keys above"
echo "  4. Run this script again to see it enabled"
echo "  5. Visit http://localhost:3000/feature-flag-demo to test in the app"
echo
