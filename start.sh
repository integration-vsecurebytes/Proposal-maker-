#!/bin/bash

# Start script for Proposal Generator
echo "🚀 Starting Proposal Generator..."
echo ""
echo "📦 API Server will start on: http://localhost:3001"
echo "🌐 Web Frontend will start on: http://localhost:4000"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Run both services using Turborepo
pnpm dev
