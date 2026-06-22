#!/bin/bash
pnpm run docker:up
sleep 10
docker exec aether-ollama ollama pull mistral
pnpm run db:migrate
pnpm run dev
