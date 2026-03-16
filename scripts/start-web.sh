#!/bin/sh
cd /app/apps/web
npx prisma migrate deploy
npx prisma db seed 2>/dev/null || true
cd /app
exec node apps/web/server.js
