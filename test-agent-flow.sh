#!/bin/bash

# Test Agent Flow
echo "🧪 Testing Agent Flow..."

# 1. Check if backend compiles
echo "Checking backend compilation..."
cd backend
npx tsc --noEmit
if [ $? -eq 0 ]; then
    echo "✅ Backend compiles successfully"
else
    echo "❌ Backend compilation failed"
    exit 1
fi

# 2. Check if new files exist
echo "Checking file existence..."
if [ -f "src/services/agentService.ts" ] && [ -f "src/routes/agents.ts" ] && [ -f "src/tools/base.ts" ]; then
    echo "✅ New agent files exist"
else
    echo "❌ Missing agent files"
    exit 1
fi

echo "🎉 Verification Script Passed (Static Checks)"
