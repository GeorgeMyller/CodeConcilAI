# 🚀 CodeCouncil AI - Getting Started Guide

Este é o guia passo-a-passo para colocar o CodeCouncil AI em produção.

## 📍 Você está aqui: PRÉ-LANÇAMENTO COMPLETO ✅

Todas as 6 funcionalidades empresariais foram implementadas e verificadas. Agora é hora de configurar tudo e fazer o deploy.

---

## ⏱️ Tempo Estimado

- **Pré-lançamento**: 45 minutos
- **Deploy**: 15-30 minutos (depende da plataforma)
- **Testes finais**: 10 minutos
- **Total**: 1-2 horas até estar live

---

## Step 1️⃣: Coletar Credenciais (15 minutos)

### 1.1 Stripe Setup

**O que você precisa fazer**:

1. Ir para [Stripe Dashboard](https://dashboard.stripe.com)
2. Criar 4 produtos com os seguintes preços:

```
STARTUP MONTHLY
├── Produto: "CodeCouncil AI Startup"
├── Preço: $49/mês
├── Ciclo: Mensal
└── Copiar Price ID: price_startup_monthly

STARTUP ANNUAL  
├── Produto: "CodeCouncil AI Startup"
├── Preço: $499/ano
├── Ciclo: Anual
└── Copiar Price ID: price_startup_annual

ENTERPRISE MONTHLY
├── Produto: "CodeCouncil AI Enterprise"
├── Preço: $149/mês
├── Ciclo: Mensal
└── Copiar Price ID: price_enterprise_monthly

ENTERPRISE ANNUAL
├── Produto: "CodeCouncil AI Enterprise"
├── Preço: $1499/ano
├── Ciclo: Anual
└── Copiar Price ID: price_enterprise_annual
```

3. Copiar suas chaves:
   - `pk_test_...` (Public Key)
   - `sk_test_...` (Secret Key)

4. Criar Webhook:
   - Endpoint: `https://seu-app.com/api/webhooks/stripe`
   - Eventos: `customer.subscription.created`, `customer.subscription.updated`, `charge.failed`
   - Copiar Secret: `whsec_...`

**✓ Salvar em arquivo temporário** (você vai usar no passo 2)

### 1.2 Google OAuth Setup

1. Ir para [Google Cloud Console](https://console.cloud.google.com)
2. Criar novo projeto
3. Ativar Google+ API
4. Criar OAuth 2.0 Credentials (Web application)
5. Adicionar redirect URI:
   ```
   http://localhost:3000/api/auth/callback/google
   https://seu-app.com/api/auth/callback/google
   ```
6. Copiar:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`

**✓ Salvar em arquivo temporário**

### 1.3 Database Setup

Escolha uma das opções:

**Option A: Local PostgreSQL**
```bash
# Instalar PostgreSQL (se não tiver)
brew install postgresql

# Iniciar serviço
brew services start postgresql

# Criar banco de dados
createdb codecouncil_ai

# CONNECTION STRING:
postgresql://localhost/codecouncil_ai
```

**Option B: Railway PostgreSQL**
```bash
# 1. Criar conta em railway.app
# 2. Create PostgreSQL plugin
# 3. Copiar DATABASE_URL
```

**Option C: Render PostgreSQL**
```bash
# 1. Criar conta em render.com
# 2. Create PostgreSQL
# 3. Copiar DATABASE_URL
```

**✓ Salvar DATABASE_URL**

---

## Step 2️⃣: Executar Pre-Launch Configuration (10 minutos)

```bash
# Navegar para raiz do projeto
cd /Volumes/SSD-EXTERNO/2025/CodeConcilAI

# Executar script interativo
./pre-launch.sh
```

O script vai perguntar por:

1. **Stripe Secret Key**: Cole `sk_test_...`
2. **Stripe Public Key**: Cole `pk_test_...`
3. **Stripe Webhook Secret**: Cole `whsec_...`
4. **Stripe Price IDs**: Cole os 4 IDs que você copiou
5. **Google Client ID**: Cole seu Client ID
6. **Google Client Secret**: Cole seu Client Secret
7. **Database URL**: Cole seu DATABASE_URL
8. **Admin Email**: Seu email para ser admin
9. **Platform Choice**: Escolha entre Railway, Render, Heroku, AWS, ou Docker

**O script vai**:
- ✅ Atualizar `backend/.env.local` automaticamente
- ✅ Validar as credenciais
- ✅ Configurar arquivo de ambiente
- ✅ Fornecer próximos passos específicos da plataforma

---

## Step 3️⃣: Inicializar Database (5 minutos)

```bash
# Ir para backend
cd backend

# Instalar dependências (se não tiver)
npm install

# Executar migrations
npm run db:migrate

# Seed demo data (opcional)
npm run db:seed

# Voltar à raiz
cd ..
```

**✓ Database pronto!**

---

## Step 4️⃣: Testar Localmente (10 minutos)

**Terminal 1 - Backend**:
```bash
cd backend
npm run dev
# Deve exibir: ✓ Server running on http://localhost:5000
```

**Terminal 2 - Frontend**:
```bash
cd codecouncil-ai
npm run dev
# Deve exibir: ✓ Local: http://localhost:3000
```

**Terminal 3 - Testes**:
```bash
./test-deployment.sh
# Deve exibir: ✅ All checks passed!
```

**Verificar**:
- [ ] Backend respondendo: `curl http://localhost:5000/health`
- [ ] Frontend carregando: Abrir `http://localhost:3000`
- [ ] Login funcionando: Clicar em "Sign in with Google"
- [ ] Planos visíveis: Deve mostrar 4 planos de subscription

---

## Step 5️⃣: Deploy (15-30 minutos)

Escolha sua plataforma:

### 🚂 Railway (Recomendado)

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login

# Inicializar
railway init

# Deploy
railway up

# Configurar variáveis de ambiente (via dashboard ou CLI)
railway variables set STRIPE_SECRET_KEY=sk_test_...
railway variables set DATABASE_URL=postgresql://...
railway variables set GOOGLE_CLIENT_ID=...
railway variables set GOOGLE_CLIENT_SECRET=...

# Migrations na produção
railway run npm run db:migrate
```

### ⚪ Render

```bash
# 1. Conectar GitHub repo em render.com
# 2. Criar novo "Web Service"
# 3. Configurar variáveis de ambiente:
#    - STRIPE_SECRET_KEY
#    - STRIPE_PUBLIC_KEY
#    - GOOGLE_CLIENT_ID
#    - GOOGLE_CLIENT_SECRET
#    - DATABASE_URL
# 4. Deploy automático ativado
```

### 🦗 Heroku

```bash
# Instalar Heroku CLI
npm install -g heroku

# Login
heroku login

# Criar app
heroku create codecouncil-ai

# Adicionar PostgreSQL
heroku addons:create heroku-postgresql:hobby-dev

# Variáveis de ambiente
heroku config:set STRIPE_SECRET_KEY=sk_test_...
heroku config:set DATABASE_URL=postgresql://...
heroku config:set GOOGLE_CLIENT_ID=...
heroku config:set GOOGLE_CLIENT_SECRET=...

# Deploy
git push heroku main

# Migrations
heroku run npm run db:migrate
```

### 🐳 Docker Local

```bash
# Build
docker-compose build

# Start
docker-compose up -d

# Migrations
docker-compose exec backend npm run db:migrate

# Acessar
# Frontend: http://localhost:3000
# Backend: http://localhost:5000
# Grafana: http://localhost:3001
```

---

## Step 6️⃣: Verificar Deployment (5 minutos)

Depois de fazer deploy:

```bash
# Verificar endpoints
curl https://seu-app.com/health
curl https://seu-app.com/api/subscriptions/plans

# Verificar banco de dados
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM \"User\";"

# Verificar logs
# Railway: railway logs
# Render: Logs tab no dashboard
# Heroku: heroku logs --tail
```

**✓ Tudo funcionando?** Passe para Step 7

---

## Step 7️⃣: Configurar Webhooks (5 minutos)

### Stripe Webhook

1. Ir para Stripe Dashboard → Developers → Webhooks
2. Endpoint URL: `https://seu-app.com/api/webhooks/stripe`
3. Eventos a receber:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `charge.failed`
4. Copiar Signing Secret → Atualizar `STRIPE_WEBHOOK_SECRET`

### Slack/PagerDuty Alerts (Opcional)

1. Editar `monitoring/alertmanager.yml`:
   ```yaml
   receivers:
   - name: slack
     slack_configs:
     - api_url: https://hooks.slack.com/services/YOUR/WEBHOOK/URL
       channel: '#alerts'
   ```

2. Redeploy:
   ```bash
   docker-compose -f docker-compose.monitoring.yml up -d
   ```

---

## Step 8️⃣: Promover Admin (2 minutos)

Conectar ao banco e executar:

```sql
UPDATE "User" SET "isAdmin" = true 
WHERE email = 'seu-email@dominio.com';
```

**Opções de conexão**:

```bash
# Local
psql codecouncil_ai

# Remote (via connection string)
psql "$DATABASE_URL"

# Via CLI da plataforma
# Railway: railway postgres
# Render: Em "Database" clique "Connect"
# Heroku: heroku pg:psql
```

**✓ Agora você é admin!**

---

## Step 9️⃣: Teste Final (15 minutos)

### 🧪 Checklist de Teste

- [ ] **Login**: Google OAuth funciona
- [ ] **Subscription**: Planos aparecem
- [ ] **Checkout**: Stripe modal abre (em sandbox)
- [ ] **Admin Dashboard**: Consegue acessar como admin
- [ ] **Rate Limiting**: Headers aparecem
- [ ] **Monitoring**: Grafana mostra métricas
- [ ] **Análise**: Consegue analisar repositório
- [ ] **Export**: Exporta em JSON/CSV
- [ ] **Email**: Confirmação de pagamento é enviada

### 📊 Métricas para Validar

```
Latency (P95):        < 1s ✓
Error Rate:           < 0.1% ✓
Stripe Webhook:       100% success ✓
Database Connections: < 80% utilized ✓
Memory Usage:         < 512MB ✓
Uptime:               > 99.5% ✓
```

---

## 🎉 Step 10️⃣: LAUNCH! 🚀

Tudo verificado?

```bash
# Backup final do banco
./backend/scripts/backup-db.sh

# Tag versão
git tag -a v1.0.0 -m "Production Launch"
git push origin v1.0.0

# Monitor
# Railway: railway logs --follow
# Render: Watch logs tab
# Heroku: heroku logs --tail

# Celebrar! 🎉
```

---

## 📞 Troubleshooting

### Problema: Backend não inicia

```bash
# Verificar Node.js version
node --version  # Deve ser >= 18

# Limpar e reinstalar
rm -rf backend/node_modules
npm install

# Verificar database
psql "$DATABASE_URL" -c "SELECT 1"
```

### Problema: Database migration falha

```bash
# Ver status
npm run db:status

# Reset (⚠️ CUIDADO: Deleta dados)
npm run db:reset

# Ou deploy manual
npx prisma migrate deploy
```

### Problema: OAuth com Google não funciona

```bash
# Verificar redirect URI no Google Cloud Console
# Deve ser: https://seu-app.com/api/auth/callback/google

# Verificar .env.local
echo $GOOGLE_CLIENT_ID
echo $GOOGLE_CLIENT_SECRET
```

### Problema: Stripe não conecta

```bash
# Testar credenciais
curl -H "Authorization: Bearer sk_test_..." \
  https://api.stripe.com/v1/customers

# Verificar webhook
# Stripe Dashboard → Events → Check webhook delivery
```

### Problema: Monitoring não funciona

```bash
# Verificar Prometheus
curl http://localhost:9090/api/v1/query?query=up

# Verificar Grafana
curl http://localhost:3001/api/health

# Reset
docker-compose -f docker-compose.monitoring.yml down -v
docker-compose -f docker-compose.monitoring.yml up
```

---

## 📚 Documentação Completa

Para mais informações, consulte:

- **[ENTERPRISE.md](./ENTERPRISE.md)** - 99 páginas com guia completo de todas as features
- **[QUICKSTART.md](./QUICKSTART.md)** - Referência rápida (5 comandos essenciais)
- **[LAUNCH_CHECKLIST.md](./LAUNCH_CHECKLIST.md)** - Checklist detalhado
- **[LAUNCH_STATUS_REPORT.md](./LAUNCH_STATUS_REPORT.md)** - Status completo de implementação

---

## 🎯 Próximos Passos Depois do Launch

1. **Monitor Metrics**: Acompanhe Grafana diariamente
2. **Collect Feedback**: Receba feedback de usuários
3. **Scale Planning**: Prepare para crescimento
4. **Backup Routine**: Verifique backups diários
5. **Security Updates**: Mantenha dependências atualizadas

---

**Status**: ✅ Pronto para Launch
**Última Atualização**: $(date)
**Versão**: 1.0.0

🚀 Boa sorte com o lançamento!
