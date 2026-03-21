#!/bin/sh
cd /app/apps/web
prisma generate
prisma migrate deploy
cd /app
exec node apps/worker/dist/index.js
