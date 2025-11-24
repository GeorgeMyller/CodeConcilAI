# 🚀 CodeCouncil AI - Launch Checklist

Guia passo-a-passo para lançar o CodeCouncil AI em produção.

## ✅ Checklist Pré-Lançamento

### Fase 1: Configuração Inicial (15 minutos)
- [ ] **Stripe Setup**
  ```bash
  # 1. Criar 4 produtos no Stripe Dashboard
  # 2. Obter Price IDs
  # 3. Copiar credenciais (Public Key, Secret Key, Webhook Secret)
  ```
  - [ ] Startup Monthly ($49/mo, 300 credits)
  - [ ] Startup Annual ($499/yr, 350 credits)
  - [ ] Enterprise Monthly ($149/mo, 1000 credits)
  - [ ] Enterprise Annual ($1499/yr, 1200 credits)

- [ ] **Google OAuth Setup**
  ```bash
  # 1. Ir para Google Cloud Console
  # 2. Criar OAuth 2.0 credentials
  # 3. Copiar Client ID e Client Secret
  ```

- [ ] **Banco de Dados**
  ```bash
  # 1. Criar PostgreSQL (local, Railway, ou Render)
  # 2. Obter connection string
  # 3. Salvar em variável de ambiente
  ```

### Fase 2: Configuração de Ambiente (10 minutos)
```bash
# 1. Executar script pré-lançamento
./pre-launch.sh

# 2. Responder às perguntas interativas:
#    - Stripe credentials
#    - Database URL
#    - Admin email
#    - Plataforma de deploy

# 3. Script atualiza automaticamente:
#    - backend/.env.local
#    - Database migrations
#    - Seed data
```

### Fase 3: Inicialização de Dados (5 minutos)
```bash
cd backend

# 1. Instalar dependências
npm install

# 2. Executar migrações
npm run db:migrate

# 3. Seed initial data
npm run db:seed
```

### Fase 4: Teste Local (10 minutos)
```bash
# 1. Terminal 1 - Backend
cd backend
npm run dev

# 2. Terminal 2 - Frontend
cd codecouncil-ai
npm run dev

# 3. Terminal 3 - Monitoramento
cd backend
docker-compose -f docker-compose.monitoring.yml up

# 4. Terminal 4 - Testes
./test-deployment.sh
```

### Fase 5: Deploy (Varia por plataforma)

#### **Opção 1: Railway (Recomendado)**
```bash
# 1. Instalar Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Criar projeto
railway init

# 4. Configurar variáveis de ambiente
railway variables set STRIPE_SECRET_KEY=sk_...
railway variables set DATABASE_URL=postgresql://...
# ... (repetir para todas as variáveis)

# 5. Deploy
railway up
```

#### **Opção 2: Render**
```bash
# 1. Conectar repositório GitHub
# 2. Criar novo Web Service
# 3. Configurar variáveis de ambiente
# 4. Deploy automático ativado
```

#### **Opção 3: Heroku**
```bash
# 1. Instalar Heroku CLI
npm install -g heroku

# 2. Login
heroku login

# 3. Criar app
heroku create codecouncil-ai

# 4. Adicionar PostgreSQL
heroku addons:create heroku-postgresql:hobby-dev

# 5. Deploy
git push heroku main
```

#### **Opção 4: Docker Local**
```bash
# 1. Construir images
docker-compose build

# 2. Iniciar serviços
docker-compose up -d

# 3. Migrations
docker-compose exec backend npm run db:migrate
```

### Fase 6: Validação Pós-Deploy (5 minutos)
```bash
# 1. Testar endpoints
./test-deployment.sh

# 2. Verificar monitoria
# Acessar: http://localhost:3001/grafana (admin/admin)

# 3. Checar logs
docker-compose logs -f backend
```

### Fase 7: Configurar Webhooks (5 minutos)

#### **Stripe Webhook**
```bash
# 1. Stripe Dashboard → Developers → Webhooks
# 2. Endpoint URL: https://seu-app.com/api/webhooks/stripe
# 3. Eventos: customer.subscription.created, customer.subscription.updated, charge.failed
# 4. Copiar Signing Secret → STRIPE_WEBHOOK_SECRET
```

#### **Monitoring Webhooks**
```bash
# 1. Configurar Slack Webhook
# AlertManager → monitoring/alertmanager.yml
# slack_api_url: https://hooks.slack.com/services/...

# 2. Ou PagerDuty
# pagerduty_service_key: service_key_...
```

### Fase 8: Promover Admin (2 minutos)
```bash
# 1. Após usuário fazer primeiro login
# 2. Conectar ao PostgreSQL
psql "$DATABASE_URL"

# 3. Executar comando
UPDATE "User" SET "isAdmin" = true WHERE email = 'admin@seu-dominio.com';

# 4. Verificar
SELECT email, "isAdmin" FROM "User" WHERE "isAdmin" = true;
```

### Fase 9: Testes Finais (15 minutos)
- [ ] **Autenticação**
  - [ ] Login com Google funciona
  - [ ] JWT gerado corretamente
  - [ ] Refresh token funciona

- [ ] **Funcionalidades**
  - [ ] Análise de repositório funciona
  - [ ] Exportar JSON funciona
  - [ ] Exportar CSV funciona

- [ ] **Billing**
  - [ ] Planos aparecem corretamente
  - [ ] Checkout Stripe abre
  - [ ] Webhook de pagamento recebido

- [ ] **Admin Dashboard**
  - [ ] Acessar com admin user funciona
  - [ ] Estatísticas mostram dados
  - [ ] Audit logs registram eventos

- [ ] **Rate Limiting**
  - [ ] Limite por tier respeitado
  - [ ] Headers de rate limit corretos

- [ ] **Monitoramento**
  - [ ] Prometheus scraping dados
  - [ ] Grafana dashboards mostram métricas
  - [ ] Alertas disparam corretamente

### Fase 10: Lançamento 🎉

```bash
# 1. Backup do banco de dados
./backend/scripts/backup-db.sh

# 2. Documentar versão
git tag -a v1.0.0 -m "Initial production launch"
git push origin v1.0.0

# 3. Notificar usuários
# Email via SendGrid enviado automaticamente

# 4. Monitorar
watch -n 5 'curl -s http://seu-app.com/health'
```

## 📊 Métricas de Sucesso

Antes de considerar o lançamento bem-sucedido, validate:

```
✓ 51/51 testes de verificação passando
✓ Uptime > 99.5% nos primeiros 24h
✓ Latência P95 < 1s
✓ Taxa de erro < 0.1%
✓ Webhook Stripe processando 100% das transações
✓ Todos os 6 recursos empresariais funcionando
✓ Admin dashboard acessível apenas para admins
✓ Backups diários sendo executados
```

## 🚨 Troubleshooting

### Backend não inicia
```bash
# Verificar Node.js version
node --version  # Deve ser >= 18

# Limpar node_modules
rm -rf backend/node_modules
npm install

# Verificar database
psql "$DATABASE_URL" -c "SELECT 1"
```

### Database migration falha
```bash
# Resetar schema (⚠️ CUIDADO: Deleta dados)
cd backend
npm run db:reset

# Ou executar manualmente
npx prisma migrate deploy
```

### Stripe não funciona
```bash
# Verificar credenciais
echo $STRIPE_SECRET_KEY

# Testar webhook localmente
curl -X POST http://localhost:5000/api/webhooks/stripe \
  -H "stripe-signature: test" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### OAuth com Google falha
```bash
# Verificar redirect URI
# Google Cloud Console → OAuth → Authorized redirect URIs
# Deve incluir: https://seu-app.com/api/auth/callback/google

# Logs
tail -f backend/logs/error.log
```

### Monitoramento não funciona
```bash
# Verificar Prometheus
curl http://localhost:9090/api/v1/query?query=up

# Verificar Grafana
curl http://localhost:3001/api/health

# Resetar volumes
docker-compose -f docker-compose.monitoring.yml down -v
docker-compose -f docker-compose.monitoring.yml up
```

## 📞 Suporte

Para problemas, consulte:

- **Documentação Completa**: [ENTERPRISE.md](./ENTERPRISE.md)
- **Verificação**: Executar `./verify.sh`
- **Deployment**: [PRODUCTION.md](./PRODUCTION.md)
- **API**: Consultar routes em `backend/src/routes/`

---

**Tempo total estimado**: 45-60 minutos para lançamento completo.

**Tempo para testes**: 15-20 minutos adicionais.

**Status**: ✅ Sistema pronto para produção
