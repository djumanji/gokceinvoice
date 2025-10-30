#!/bin/bash
# Quick setup script for PostHog MCP

echo "📊 PostHog MCP Setup"
echo "===================="
echo ""

# Try to find PostHog keys in the codebase
PROJECT_KEY=""
PERSONAL_KEY=""

# Check environment variables first
if [ -n "$POSTHOG_PERSONAL_API_KEY" ]; then
  PERSONAL_KEY="$POSTHOG_PERSONAL_API_KEY"
elif [ -n "$POSTHOG_API_KEY" ]; then
  # Check if it's a personal key (phx_) or project key (phc_)
  if [[ "$POSTHOG_API_KEY" =~ ^phx_ ]]; then
    PERSONAL_KEY="$POSTHOG_API_KEY"
  elif [[ "$POSTHOG_API_KEY" =~ ^phc_ ]]; then
    PROJECT_KEY="$POSTHOG_API_KEY"
  fi
fi

# Check .env file if not found in environment
if [ -z "$PERSONAL_KEY" ] && [ -f ".env" ]; then
  # Look for VITE_POSTHOG_KEY (project key) or POSTHOG_PERSONAL_API_KEY
  ENV_KEY=$(grep -E "^(POSTHOG_PERSONAL_API_KEY|VITE_POSTHOG_KEY|POSTHOG_API_KEY)=" .env | head -1 | cut -d '=' -f2 | tr -d '"' | tr -d "'")
  if [ -n "$ENV_KEY" ]; then
    if [[ "$ENV_KEY" =~ ^phx_ ]]; then
      PERSONAL_KEY="$ENV_KEY"
    elif [[ "$ENV_KEY" =~ ^phc_ ]]; then
      PROJECT_KEY="$ENV_KEY"
    fi
  fi
fi

# Check documentation files for keys
if [ -z "$PERSONAL_KEY" ] && [ -z "$PROJECT_KEY" ]; then
  # Look in docs for PostHog setup documentation
  DOC_KEY=$(grep -hE "ph[xc]_[a-zA-Z0-9]+" docs/analytics/POSTHOG_SETUP.md docs/setup/POSTHOG_MCP_SETUP.md 2>/dev/null | grep -oE "ph[xc]_[a-zA-Z0-9]+" | head -1)
  if [ -n "$DOC_KEY" ]; then
    if [[ "$DOC_KEY" =~ ^phx_ ]]; then
      PERSONAL_KEY="$DOC_KEY"
    elif [[ "$DOC_KEY" =~ ^phc_ ]]; then
      PROJECT_KEY="$DOC_KEY"
    fi
  fi
fi

# Check client/src/lib/posthog.ts for hardcoded keys
if [ -z "$PERSONAL_KEY" ] && [ -z "$PROJECT_KEY" ]; then
  CLIENT_KEY=$(grep -oE "ph[xc]_[a-zA-Z0-9]+" client/src/lib/posthog.ts 2>/dev/null | head -1)
  if [ -n "$CLIENT_KEY" ]; then
    if [[ "$CLIENT_KEY" =~ ^phx_ ]]; then
      PERSONAL_KEY="$CLIENT_KEY"
    elif [[ "$CLIENT_KEY" =~ ^phc_ ]]; then
      PROJECT_KEY="$CLIENT_KEY"
    fi
  fi
fi

# Display what we found
if [ -n "$PERSONAL_KEY" ]; then
  echo "✅ Found PostHog Personal API Key in codebase!"
  echo "   Key: ${PERSONAL_KEY:0:15}..."
  echo ""
  POSTHOG_PERSONAL_API_KEY="$PERSONAL_KEY"
  export POSTHOG_PERSONAL_API_KEY
elif [ -n "$PROJECT_KEY" ]; then
  echo "⚠️  Found PostHog Project API Key (phc_...) in codebase"
  echo "   However, MCP requires a Personal API Key (phx_...)"
  echo ""
  echo "The Project API Key is for client-side tracking, but MCP needs a Personal API Key."
  echo ""
  echo "To get your Personal API Key:"
  echo "1. Go to: https://app.posthog.com/organization/settings"
  echo "2. Navigate to 'Personal API Keys' section"
  echo "3. Click 'Create Personal API Key'"
  echo "4. Copy the key (it starts with phx_)"
  echo ""
  read -p "Do you have a Personal API Key to enter? (y/n) " -n 1 -r
  echo ""
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Please get a Personal API Key first and run this script again."
    exit 1
  fi
  read -p "Enter your PostHog Personal API Key (phx_...): " POSTHOG_PERSONAL_API_KEY
  export POSTHOG_PERSONAL_API_KEY
else
  echo "⚠️  No PostHog API keys found in codebase"
  echo ""
  echo "Please:"
  echo "1. Get your Personal API Key from: https://app.posthog.com/organization/settings"
  echo "   Or visit: https://app.posthog.com/personal-api-key"
  echo "2. Enter it below:"
  echo ""
  read -p "Enter your PostHog Personal API Key (phx_...): " POSTHOG_PERSONAL_API_KEY
  export POSTHOG_PERSONAL_API_KEY
fi

# Check if custom base URL is needed (for self-hosted instances)
if [ -z "$POSTHOG_BASE_URL" ]; then
  read -p "Are you using a self-hosted PostHog instance? (y/n) " -n 1 -r
  echo ""
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Enter your PostHog base URL (e.g., https://posthog.example.com): " POSTHOG_BASE_URL
    export POSTHOG_BASE_URL
  fi
fi

# Create MCP config directory
echo "📝 Creating MCP configuration..."
MCP_CONFIG_DIR="$HOME/.config/cursor"
mkdir -p "$MCP_CONFIG_DIR"

# Create config file
MCP_CONFIG="$MCP_CONFIG_DIR/mcp.json"

# Check if config already exists
if [ -f "$MCP_CONFIG" ]; then
  echo "⚠️  MCP config already exists at: $MCP_CONFIG"
  echo "Checking if PostHog is already configured..."
  
  # Check if posthog is already in config
  if grep -q '"posthog"' "$MCP_CONFIG"; then
    echo "⚠️  PostHog MCP is already configured"
    read -p "Do you want to update it? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      echo "Skipping config update."
      exit 0
    fi
    
    # Use Python or Node to update JSON if available
    if command -v python3 &> /dev/null; then
      echo "Updating existing config..."
      python3 << EOF
import json
import os
import sys

config_path = "$MCP_CONFIG"
try:
    with open(config_path, 'r') as f:
        config = json.load(f)
except:
    config = {}

if 'mcpServers' not in config:
    config['mcpServers'] = {}

posthog_config = {
    "command": "npx",
    "args": [
        "-y",
        "mcp-remote@latest",
        "https://mcp.posthog.com/mcp",
        "--header",
        "Authorization:\${POSTHOG_AUTH_HEADER}"
    ],
    "env": {
        "POSTHOG_AUTH_HEADER": "Bearer $POSTHOG_PERSONAL_API_KEY"
    }
}

if os.environ.get('POSTHOG_BASE_URL'):
    posthog_config['env']['POSTHOG_BASE_URL'] = os.environ.get('POSTHOG_BASE_URL')

config['mcpServers']['posthog'] = posthog_config

with open(config_path, 'w') as f:
    json.dump(config, f, indent=2)

print("✅ PostHog MCP configuration updated")
EOF
      exit 0
    else
      echo "⚠️  Python not found. Please manually update the config file."
      echo "Add this to your mcp.json:"
      echo ""
      cat << 'EOF'
    "posthog": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote@latest",
        "https://mcp.posthog.com/mcp",
        "--header",
        "Authorization:${POSTHOG_AUTH_HEADER}"
      ],
      "env": {
        "POSTHOG_AUTH_HEADER": "Bearer YOUR_PERSONAL_API_KEY_HERE"
      }
    }
EOF
      exit 0
    fi
  fi
fi

# Create new config or add to existing
if [ -f "$MCP_CONFIG" ]; then
  # Read existing config and merge
  if command -v python3 &> /dev/null; then
    python3 << EOF
import json
import os

config_path = "$MCP_CONFIG"
try:
    with open(config_path, 'r') as f:
        config = json.load(f)
except:
    config = {}

if 'mcpServers' not in config:
    config['mcpServers'] = {}

posthog_config = {
    "command": "npx",
    "args": [
        "-y",
        "mcp-remote@latest",
        "https://mcp.posthog.com/mcp",
        "--header",
        "Authorization:\${POSTHOG_AUTH_HEADER}"
    ],
    "env": {
        "POSTHOG_AUTH_HEADER": "Bearer $POSTHOG_PERSONAL_API_KEY"
    }
}

if os.environ.get('POSTHOG_BASE_URL'):
    posthog_config['env']['POSTHOG_BASE_URL'] = os.environ.get('POSTHOG_BASE_URL')

config['mcpServers']['posthog'] = posthog_config

with open(config_path, 'w') as f:
    json.dump(config, f, indent=2)

print("✅ PostHog MCP added to existing configuration")
EOF
  else
    echo "⚠️  Python not found. Please manually add PostHog config to your mcp.json"
    exit 1
  fi
else
  # Create new config
  cat > "$MCP_CONFIG" << EOF
{
  "mcpServers": {
    "posthog": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote@latest",
        "https://mcp.posthog.com/mcp",
        "--header",
        "Authorization:\${POSTHOG_AUTH_HEADER}"
      ],
      "env": {
        "POSTHOG_AUTH_HEADER": "Bearer ${POSTHOG_PERSONAL_API_KEY}"
EOF

  # Add base URL if provided
  if [ -n "$POSTHOG_BASE_URL" ]; then
    cat >> "$MCP_CONFIG" << EOF
        ,
        "POSTHOG_BASE_URL": "${POSTHOG_BASE_URL}"
EOF
  fi

  cat >> "$MCP_CONFIG" << EOF
      }
    }
  }
}
EOF
fi

echo "✅ MCP configuration created/updated at: $MCP_CONFIG"
echo ""
echo "📋 Configuration Summary:"
echo "   - PostHog MCP Server: https://mcp.posthog.com/mcp"
echo "   - Auth Header: Bearer ${POSTHOG_PERSONAL_API_KEY:0:10}..."
if [ -n "$POSTHOG_BASE_URL" ]; then
  echo "   - Custom Base URL: $POSTHOG_BASE_URL"
fi
echo ""
echo "Next steps:"
echo "1. Restart Cursor completely (quit and reopen)"
echo "2. Test PostHog MCP by asking Cursor about PostHog features"
echo ""
echo "Example prompts:"
echo "  - 'What feature flags do I have active in PostHog?'"
echo "  - 'Show me my most common errors from PostHog'"
echo "  - 'Create a new feature flag for homepage redesign'"
echo "  - 'What are my top events in PostHog?'"
echo ""
echo "🎉 Setup complete!"

