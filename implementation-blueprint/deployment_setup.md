# Deployment Setup

1. pnpm install
2. npx prisma migrate dev
3. npx prisma db seed
4. npm install -g @mermaid-js/mermaid-cli@10
5. pnpm --filter web dev
6. pnpm --filter worker dev

Diagram conversion:
mmdc -i ./tmp/ui_navigation_diagram.mmd -o ./tmp/ui_navigation_diagram.png
