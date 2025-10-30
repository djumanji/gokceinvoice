#!/bin/bash
# Quick setup script for HuggingFace MCP

echo "🤗 HuggingFace MCP Setup"
echo "========================"
echo ""

# Check if HF_TOKEN is set
if [ -z "$HF_TOKEN" ]; then
  echo "⚠️  HF_TOKEN environment variable not set"
  echo ""
  echo "Please:"
  echo "1. Get your token from: https://huggingface.co/settings/tokens"
  echo "2. Set it as environment variable:"
  echo "   export HF_TOKEN='hf_your_token_here'"
  echo ""
  read -p "Do you have a token? (y/n) " -n 1 -r
  echo ""
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Please get a token first and run this script again."
    exit 1
  fi
fi

# Check if packages are installed
if ! npm list huggingface-mcp-server &> /dev/null; then
  echo "📦 Installing HuggingFace MCP packages..."
  npm install --save-dev huggingface-mcp-server @huggingface/mcp-client
  npm install @huggingface/inference
fi

# Create MCP config directory
echo "📝 Creating MCP configuration..."
MCP_CONFIG_DIR="$HOME/.config/cursor"
mkdir -p "$MCP_CONFIG_DIR"

# Create config file
MCP_CONFIG="$MCP_CONFIG_DIR/mcp.json"

if [ -f "$MCP_CONFIG" ]; then
  echo "⚠️  MCP config already exists at: $MCP_CONFIG"
  read -p "Do you want to update it? (y/n) " -n 1 -r
  echo ""
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Skipping config update."
    exit 0
  fi
fi

# Create config
cat > "$MCP_CONFIG" << EOF
{
  "mcpServers": {
    "huggingface": {
      "command": "npx",
      "args": [
        "-y",
        "huggingface-mcp-server"
      ],
      "env": {
        "HF_TOKEN": "${HF_TOKEN}"
      }
    }
  }
}
EOF

echo "✅ MCP configuration created at: $MCP_CONFIG"
echo ""
echo "Next steps:"
echo "1. Restart Cursor completely"
echo "2. Test HuggingFace MCP by asking Cursor about HuggingFace models"
echo ""
echo "Example: 'Generate embeddings using HuggingFace sentence-transformers'"
echo ""
echo "🎉 Setup complete!"


