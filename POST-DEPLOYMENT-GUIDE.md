# CodeCouncil AI - Post-Deployment Validation Guide

## ✅ Pre-Deployment Checklist

Antes de fazer o deployment, execute:

```bash
chmod +x pre-deployment-test.sh
./pre-deployment-test.sh
```

Este script valida:
- ✓ Estrutura do projeto completa
- ✓ Todos os 6 features empresariais
- ✓ 13 novas API routes
- ✓ Schema do banco de dados (8 modelos)
- ✓ Stack de monitoring (Prometheus + Grafana)
- ✓ Scripts de backup/restore
- ✓ Documentação completa

**Resultado esperado**: ✅ 50+ testes passando (100%)

---

## 🚀 5 Passos Críticos para Production

### Passo 1: Criar Produtos Stripe

Execute `./launch-setup.sh` e selecione a opção 1:

```bash
chmod +x launch-setup.sh
./launch-setup.sh
```

Siga as instruções para criar 4 produtos:

| Product | Monthly | Annual |
|---------|---------|--------|
| Startup Audit | $49/mês | $499/ano |
| Enterprise Deep Dive | $149/mês | $1,499/ano |

**Obtenha os Price IDs** (format: `price_xxxxx`) para cada plano.

### Passo 2: Atualizar .env

Após obter os Price IDs, update `backend/.env`:

```bash
# Stripe
STRIPE_SECRET_KEY=sk_live_xxxxx  # ou sk_test_xxxxx para testes
STRIPE_PRICE_STARTUP_MONTHLY=price_xxxxx
STRIPE_PRICE_STARTUP_ANNUAL=price_xxxxx
STRIPE_PRICE_ENTERPRISE_MONTHLY=price_xxxxx
STRIPE_PRICE_ENTERPRISE_ANNUAL=price_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Webhook URLs (após deployment)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
PAGERDUTY_INTEGRATION_KEY=xxxxx
```

### Passo 3: Promover Admin

Primeira opção (recomendado) - via SQL:

```bash
# Connect to production database
psql $DATABASE_URL

# Promote admin user
UPDATE "User" SET "isAdmin" = true WHERE email = 'seu-email@example.com';

# Verify
SELECT email, "isAdmin" FROM "User" WHERE "isAdmin" = true;
```

### Passo 4: Deploy em Plataforma

Escolha sua plataforma e siga as instruções no `launch-setup.sh`:

#### **Railway** (Recomendado - Mais fácil)

```bash
npm install -g @railway/cli
railway link
railway up
```

#### **Render**

```bash
# Conectar GitHub
# 1. Ir em render.com/dashboard
# 2. Selecionar repositório
# 3. Deploy automático
```

#### **AWS Elastic Beanstalk**

```bash
npm install -g @aws-amplify/cli
eb create codecouncil-ai
eb deploy
```

### Passo 5: Configurar Webhooks

#### **Stripe Webhooks**

1. Ir em Stripe Dashboard → Webhooks
2. Adicionar novo endpoint:
   - URL: `https://seu-dominio.com/webhooks/stripe`
   - Eventos: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `charge.failed`
3. Copiar Signing Secret para `.env` → `STRIPE_WEBHOOK_SECRET`

#### **Slack Alerts**

1. Criar app em https://api.slack.com/apps
2. Ativar Incoming Webhooks
3. Adicionar novo webhook para canal `#alerts`
4. Copiar URL para `.env` → `SLACK_WEBHOOK_URL`

#### **PagerDuty Alerts**

1. Ir em PagerDuty → Services
2. Criar novo service
3. Copiar Integration Key
4. Adicionar a `.env` → `PAGERDUTY_INTEGRATION_KEY`

---

## 📊 Post-Deployment Validation

Após fazer o deployment, execute:

```bash
chmod +x post-deployment-test.sh
./post-deployment-test.sh
```

Será pedido:
1. URL do backend (e.g., `https://api.codecouncil.com`)
2. JWT token de um usuário (obtenha fazendo login)

Este script testa:

### 1. **System Health**
```bash
GET /health → 200
```

### 2. **Authentication**
```bash
GET /auth/me → 200
```

### 3. **Gemini Analysis** (Rate Limited)
```bash
POST /gemini/analyze
Body: { "code": "...", "language": "javascript" }
Response: 200 ✓
```

### 4. **Subscriptions**
```bash
GET /subscriptions/plans → 200
GET /subscriptions/current → 200
```

### 5. **Admin Dashboard** (Admin only)
```bash
GET /admin/stats → 200
GET /admin/audit-logs → 200
GET /admin/users/:id → 200
```

### 6. **Rate Limiting**
```bash
GET /rate-limit/usage → 200
```

### 7. **Metrics (Prometheus)**
```bash
GET /metrics → 200
```

---

## 🔍 Validação Manual Detalhada

### 1. Verificar Banco de Dados

```bash
# Conectar ao database
psql $DATABASE_URL

# Verificar schema
\dt  -- listar tabelas

# Verificar usuários
SELECT email, "isAdmin", "createdAt" FROM "User" LIMIT 5;

# Verificar customers Stripe
SELECT "userId", "stripeCustomerId", "currentPeriodStart", "currentPeriodEnd" FROM "StripeCustomer" LIMIT 5;

# Verificar audit logs
SELECT "action", "severity", "createdAt" FROM "AuditLog" ORDER BY "createdAt" DESC LIMIT 10;

# Verificar rate limiting
SELECT "userId", "requestsToday", "requestsThisMonth" FROM "RateLimitTracker" LIMIT 5;
```

### 2. Verificar Logs de Erro (Sentry)

1. Ir em Sentry Dashboard
2. Selecionar projeto CodeCouncil
3. Verificar Recent Issues
4. Status esperado: **0 errors** ou **<5 warnings**

### 3. Verificar Monitoring (Grafana)

1. Acessar `http://seu-dominio.com/grafana` (ou localhost:3000)
2. Login: `admin` / `admin`
3. Verificar dashboards:
   - **Request Rate**: deve estar verde (< 1000 req/min)
   - **Error Rate**: deve ser 0% ou < 1%
   - **Latency P95**: deve ser < 1000ms
   - **Database Connections**: deve ser < 20
   - **Memory Usage**: deve ser < 512MB
   - **CPU Usage**: deve ser < 50%

### 4. Verificar Webhooks (Stripe)

1. Ir em Stripe Dashboard → Webhooks
2. Clicar em endpoint → "Logs"
3. Deve ter **200** responses nos últimos eventos
4. Se houver **400-500**, verificar logs em Sentry

### 5. Testar Fluxo Completo

#### **Teste de Subscription** (20 min)

1. **Login**
   - Ir em seu-dominio.com
   - Login com Google
   - ✓ Deve redirecionar para dashboard

2. **Create Subscription**
   ```bash
   POST /subscriptions/create
   Body: {
     "priceId": "price_startup_monthly",
     "paymentMethodId": "pm_xxxxx"
   }
   Response: 201 + subscription ID
   ```
   - ✓ Deve criar subscription no Stripe
   - ✓ Deve atualizar DB
   - ✓ Deve enviar email de boas-vindas

3. **Verificar no Stripe**
   - Ir em Customers
   - Procurar por seu email
   - ✓ Deve ter 1 subscription active

4. **Webhook Trigger**
   - Aguardar 30-60 segundos
   - Verificar em Stripe Dashboard → Webhooks → Logs
   - ✓ Deve ter 1 `customer.subscription.created` (200)

5. **Verify Database Update**
   ```bash
   SELECT * FROM "StripeCustomer" WHERE email = 'seu-email@example.com';
   ```
   - ✓ `currentPeriodStart` deve estar preenchido
   - ✓ `currentPeriodEnd` deve ser em 30 dias
   - ✓ `stripeCustomerId` deve ser `cus_xxxxx`

#### **Teste de Rate Limiting** (5 min)

1. **Fazer 21 requests em 1 minuto**
   ```bash
   for i in {1..21}; do
     curl -H "Authorization: Bearer $JWT" \
       https://seu-dominio.com/gemini/analyze \
       -d '{"code":"test"}'
     sleep 0.5
   done
   ```
   
2. **Verificar resposta**
   - Primeiros 20 requests: **200**
   - Request 21: **429 (Too Many Requests)**

3. **Verificar Database**
   ```bash
   SELECT "requestsToday" FROM "RateLimitTracker" WHERE "userId" = YOUR_USER_ID;
   ```
   - ✓ Deve ser = 21

#### **Teste de Audit Logging** (5 min)

1. **Fazer login como admin**
2. **Visitar endpoints admin**
   - GET /admin/stats
   - GET /admin/audit-logs
   - GET /admin/users/:id

3. **Verificar audit logs**
   ```bash
   SELECT * FROM "AuditLog" ORDER BY "createdAt" DESC LIMIT 5;
   ```
   - ✓ Deve ter 3+ novos logs

#### **Teste de Backup** (10 min)

1. **Verificar script de backup**
   ```bash
   cd backend
   bash scripts/backup-db.sh
   ```
   - ✓ Deve criar arquivo `.sql.gz` em `./backups/`

2. **Verificar cron job** (em produção)
   ```bash
   crontab -l | grep backup-db
   ```
   - ✓ Deve estar agendado (ex: daily às 2 AM)

---

## ⚠️ Troubleshooting

### ❌ Erro: "401 Unauthorized"

**Causa**: JWT token inválido ou expirado

**Solução**:
1. Fazer login novamente
2. Copiar novo token do localStorage
3. Usar no header: `Authorization: Bearer <token>`

---

### ❌ Erro: "429 Too Many Requests"

**Causa**: Rate limit atingido

**Solução**:
1. Aguardar 24 horas (limit é diário)
2. Ou fazer upgrade de subscription (aumenta limit)
3. Verificar tier atual em `/subscriptions/current`

---

### ❌ Erro: "500 Internal Server Error"

**Causa**: Erro no backend

**Solução**:
1. Verificar logs: `docker logs backend` (ou plataforma de deployment)
2. Verificar Sentry: vai ter detalhe completo
3. Verificar `.env`: variáveis podem estar faltando

---

### ❌ Webhook não recebeu eventos

**Causa**: URL webhook incorreta ou endpoint não configurado

**Solução**:
1. Verificar em Stripe Dashboard → Webhooks → Endpoint:
   - URL deve ser `https://seu-dominio.com/webhooks/stripe`
   - Deve estar "Active"
2. Verificar logs: `docker logs backend` para POST /webhooks/stripe
3. Fazer re-send manual em Stripe Dashboard

---

### ❌ Grafana mostra "No data"

**Causa**: Prometheus não está conectando ao backend

**Solução**:
1. Verificar health endpoint: `curl https://seu-dominio.com/health`
2. Verificar metrics endpoint: `curl https://seu-dominio.com/metrics`
3. Verificar config Prometheus: `monitoring/prometheus.yml`

---

## 📋 Final Checklist

Antes de considerar o deployment completo, verifique:

- [ ] Pre-deployment test: ✅ 50+/50+ testes passando
- [ ] Passo 1: Stripe products criados ✅
- [ ] Passo 2: .env atualizado com credentials ✅
- [ ] Passo 3: Admin user promovido ✅
- [ ] Passo 4: Deployment executado com sucesso ✅
- [ ] Passo 5: Webhooks configurados ✅
- [ ] Health endpoint respondendo ✅
- [ ] Database conectado e schema aplicado ✅
- [ ] Sentry recebendo erros ✅
- [ ] Grafana mostrando métricas ✅
- [ ] Stripe webhook logs com (200) ✅
- [ ] Teste de subscription completo ✅
- [ ] Rate limiting funcionando ✅
- [ ] Audit logs sendo gravados ✅
- [ ] Backup script testado ✅

---

## 🎉 Success!

Se todos os itens do checklist estão ✅, seu CodeCouncil AI está:

- ✅ Pronto para production
- ✅ Com billing 100% operacional
- ✅ Monitorado e alertado
- ✅ Com backups automáticos
- ✅ Com rate limiting por usuário
- ✅ Com audit trail completo
- ✅ Com dashboard admin

**Próximos passos**:
1. Compartilhar URL com beta users
2. Monitorar Sentry diariamente
3. Verificar Grafana para performance
4. Revisar audit logs
5. Fazer testes de load
6. Preparar comunicado de lançamento

---

## 📞 Suporte

Se algo não funcionar:

1. Verificar logs em `backend/logs/` (ou docker logs)
2. Verificar Sentry errors: `https://sentry.io`
3. Verificar Grafana: `https://seu-dominio.com/grafana`
4. Rodar post-deployment-test.sh novamente
5. Verificar documentação em `/docs` ou `PRODUCTION.md`

Boa sorte! 🚀
