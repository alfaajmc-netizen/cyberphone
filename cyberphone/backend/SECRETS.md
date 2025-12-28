# Gestão de Segredos (Supabase & Keys)

Opções suportadas pelo projeto para carregar segredos (recomendado na ordem):

1) Variáveis de ambiente (recomendado para produção/CI/container)
   - Defina SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, S3_* etc. no ambiente (ex.: GitHub Secrets / Docker env).
   - O módulo `backend/src/utils/secrets.ts` lê process.env primeiro.

2) Ficheiro encriptado (útil para desenvolvimento local)
   - Crie um ficheiro JSON com as chaves (ex.: backend/secrets/example.secrets.json).
   - Defina a passphrase local: export SECRETS_PASSPHRASE="minha-pass"
   - Encripte o ficheiro:
     - cd backend
     - SECRETS_PASSPHRASE="minha-pass" npx ts-node scripts/encrypt-secrets.ts ./secrets/example.secrets.json ./secrets/secrets.enc
   - Commit do ficheiro `secrets.enc` é opcional (se encriptado e passphrase for guardada em CI).
   - Em runtime, certifique-se que SECRETS_PASSPHRASE está definida para o processo que executa o backend.

3) Ficheiro com path custom:
   - Pode apontar `SECRETS_FILE=/caminho/para/secrets.enc` para carregar de outra localização.

Uso no código:
- import { getSecret } from "../utils/secrets";
- const supabaseKey = getSecret("SUPABASE_SERVICE_ROLE_KEY");