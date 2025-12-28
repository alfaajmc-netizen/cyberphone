# CyBerPhone — MVP Scaffold

Descrição curta:
CyBerPhone é uma rede social com monetização (lives pagas, lojas, afiliados, anúncios, IA para filtros).

Monorepo com dois sub‑projetos:
- backend/ — API REST + WebSocket (Express + TypeScript + Prisma + Socket.io)
- frontend/ — Next.js + Tailwind + Zustand

Pré-requisitos
- Node 18+
- Docker & Docker Compose
- (Opcional) Cloudflare R2 credentials para uploads diretos

Como rodar localmente (quickstart)
1. Copiar variáveis de ambiente:
   - backend/.env.example -> backend/.env
   - frontend/.env.example -> frontend/.env
2. Subir infra (Postgres) via docker compose:
   - docker compose up -d
3. Instalar dependências e gerar DB:
   - cd backend && npm install
   - npx prisma generate
   - npx prisma migrate dev --name init
4. Rodar backend:
   - npm run dev (na pasta backend)
5. Rodar frontend:
   - cd frontend && npm install && npm run dev

Arquitetura (resumo)
- Auth: JWT + refresh
- Realtime: Socket.io (chat, signaling)
- Storages: signed URLs para Cloudflare R2
- Payments: adapters (Unitel Money, eKwanza, Cryptomus) — endpoints mock no MVP

Próximos passos (entregues por iterações)
1. Scaffold (feito) + Auth + Posts + Uploads
2. Lives (signaling) + chat nas lives
3. Loja + afiliados + pagamentos (adapters)
4. Anúncios + monetização de vídeos curtos
5. IA filters (integração com Replicate / OpenAI)
6. UI/UX — páginas do criador, admin, analytics

Contato: alfaajmc-netizen — vamos iterar.
