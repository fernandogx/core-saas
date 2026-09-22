cd C:\Projetos\core-saas\core-saas-api

@"
# ============================================
# APLICAÇÃO
# ============================================
NODE_ENV=development
PORT=3001

# ============================================
# BANCO DE DADOS
# ============================================
DATABASE_URL="postgresql://core_saas:core_saas_password@localhost:5435/core_saas?schema=public"

# ============================================
# REDIS (BullMQ)
# ============================================
REDIS_HOST=localhost
REDIS_PORT=6379

# ============================================
# JWT
# ============================================
JWT_SECRET=core-saas-super-secret-key-change-in-production
JWT_EXPIRES_IN=24h

# ============================================
# ASAAS (Gateway de Pagamento)
# ============================================
ASAAS_ENVIRONMENT=sandbox
ASAAS_API_URL=https://api-sandbox.asaas.com/v3
ASAAS_API_KEY=SUA_CHAVE_DO_ASAAS_SANDBOX_AQUI
"@ | Out-File -FilePath ".env" -Encoding UTF8