#!/bin/sh
cd /app/apps/web
npx prisma migrate deploy
cd /app
exec node apps/worker/dist/index.js
