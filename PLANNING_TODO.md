# Plan de Implementación - PersonalityMatch Cost-Optimized

## 📅 Plan para 1 hora diaria (Días de Semana)

**Duración total**: 6 semanas (30 días laborales)
**Tiempo diario**: 1 hora
**Tiempo total**: ~30 horas

---

## 🗓️ Semana 1: Setup Inicial y Cuentas (5 días)

### Lunes - Día 1: Cuenta Wompi (1 hora)

**Objetivo**: Crear y verificar cuenta Wompi

**Actividades:**

#### 📋 Actividad 1.1: Registro Wompi (25 min)
1. Ir a https://comercios.wompi.co/
2. Click "Registrarse"
3. Completar formulario:
   - Email empresarial
   - Nombre completo
   - Teléfono con +57
   - Tipo negocio: "Tecnología/SaaS"
4. Verificar email (revisar spam)
5. Completar perfil:
   - Nombre negocio: "PersonalityMatch"
   - NIT o cédula
   - Dirección en Colombia

**✅ Resultado**: Cuenta creada y verificada

#### 📋 Actividad 1.2: Obtener credenciales Sandbox (20 min)
1. Login en dashboard
2. **Developers** → **API Keys**
3. Copiar y guardar:
   ```
   Public Key: pub_test_xxxxx
   Private Key: prv_test_xxxxx
   ```
4. **Settings** → **Webhooks**
5. Copiar **Integrity Secret**
6. Guardar en documento seguro (LastPass/1Password)

**✅ Resultado**: 3 credenciales guardadas

#### 📋 Actividad 1.3: Familiarización con dashboard (15 min)
1. Explorar secciones:
   - Transacciones
   - Clientes
   - Configuración
2. Revisar documentación: https://docs.wompi.co/
3. Leer métodos de pago disponibles

**✅ Resultado**: Dashboard familiar, docs revisadas

---

### Martes - Día 2: Brevo y Google OAuth (1 hora)

**Objetivo**: Configurar email gratuito y autenticación Google

#### 📋 Actividad 2.1: Cuenta Brevo (20 min)
1. Ir a https://www.brevo.com/
2. "Sign up free"
3. Verificar email
4. Completar perfil básico
5. **Settings** → **SMTP & API**
6. "Generate new SMTP key"
7. Guardar credenciales:
   ```
   Host: smtp-relay.sendinblue.com
   Port: 587
   User: [tu email]
   Password: [SMTP key]
   ```

**✅ Resultado**: SMTP gratuito configurado (300 emails/día)

#### 📋 Actividad 2.2: Google OAuth Setup (40 min)
1. https://console.cloud.google.com/
2. Crear proyecto "PersonalityMatch"
3. **APIs & Services** → **Library**
4. Buscar y habilitar "Google+ API"
5. **Credentials** → "Create Credentials" → "OAuth client ID"
6. Application type: "Web application"
7. Authorized redirect URIs:
   ```
   http://localhost:3001/api/auth/google/callback
   ```
8. Copiar Client ID y Secret
9. **OAuth consent screen**:
   - User Type: External
   - App name: PersonalityMatch
   - Support email: tu email

**✅ Resultado**: Google OAuth listo para desarrollo

---

### Miércoles - Día 3: Configuración Local (1 hora)

**Objetivo**: Preparar entorno de desarrollo

#### 📋 Actividad 3.1: Clonar repositorio (10 min)
```bash
git clone <repo-url>
cd skills-getting-started-with-github-copilot
git checkout claude/cost-optimization-wompi-01CNCBqv2Saa6Ep1zKWrGEHw
ls -la
```

**✅ Resultado**: Código en local

#### 📋 Actividad 3.2: Instalar dependencias (20 min)
```bash
cd backend
npm install

# Verificar instalación
npm list sqlite3
npm list axios
npm list sequelize

# Si hay errores:
npm cache clean --force
npm install
```

**✅ Resultado**: node_modules creado, sin errores

#### 📋 Actividad 3.3: Configurar .env (30 min)
```bash
# Copiar template
cp .env.cost-optimized.example backend/.env

# Editar
nano backend/.env
```

**Configurar variables esenciales:**
```bash
NODE_ENV=development
DB_TYPE=sqlite
SQLITE_PATH=./data/personalitymatch.db

# Generar JWT_SECRET
openssl rand -base64 32
JWT_SECRET=<pegar-resultado>

# Generar ENCRYPTION_KEY
openssl rand -hex 16
ENCRYPTION_KEY=<pegar-resultado>

# Wompi (del Día 1)
WOMPI_PUBLIC_KEY=pub_test_xxxxx
WOMPI_PRIVATE_KEY=prv_test_xxxxx
WOMPI_INTEGRITY_SECRET=xxxxx
WOMPI_ENVIRONMENT=sandbox

# Brevo (del Día 2)
SMTP_HOST=smtp-relay.sendinblue.com
SMTP_PORT=587
SMTP_USER=tu_email
SMTP_PASSWORD=tu_smtp_key

# Google OAuth (del Día 2)
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxxx
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback

# URLs
FRONTEND_URL=http://localhost:5173
REDIS_URL=redis://localhost:6379
```

**✅ Resultado**: .env completo y listo

---

### Jueves - Día 4: Primera Ejecución (1 hora)

**Objetivo**: Arrancar backend por primera vez

#### 📋 Actividad 4.1: Inicializar base de datos (15 min)
```bash
cd backend

# Crear directorio
mkdir -p data

# Ejecutar migraciones
npm run migrate

# Responder 'yes'

# Verificar
ls -lh data/personalitymatch.db
sqlite3 data/personalitymatch.db ".tables"
```

**✅ Resultado**: SQLite creado con todas las tablas

#### 📋 Actividad 4.2: Iniciar backend (15 min)
```bash
# Iniciar
npm run dev

# Verificar en logs:
# ✓ Database connection established
# 📁 Using SQLite database
# ✓ Server is running
```

**Si hay errores:**
- Puerto ocupado: `lsof -ti:3001 | xargs kill -9`
- Permisos: `chmod 755 data/`
- SQLite: `npm install sqlite3 --build-from-source`

**✅ Resultado**: Backend corriendo sin errores

#### 📋 Actividad 4.3: Probar endpoints (30 min)
```bash
# En otra terminal

# 1. Health check
curl http://localhost:3001/health

# 2. Wompi config
curl http://localhost:3001/api/payments/wompi/config

# 3. Acceptance token
curl http://localhost:3001/api/payments/wompi/acceptance-token

# 4. Google OAuth (en navegador)
http://localhost:3001/api/auth/google
```

**Verificar respuestas:**
- Health: `{"status":"ok"}`
- Wompi config: Debe mostrar tu public_key
- Acceptance token: Debe devolver token
- Google: Debe redirigir a login de Google

**✅ Resultado**: Todos los endpoints funcionan

---

### Viernes - Día 5: Testing Básico (1 hora)

**Objetivo**: Crear usuario y probar autenticación

#### 📋 Actividad 5.1: Registrar usuario (20 min)
```bash
# Registrar
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456!",
    "age": 25,
    "gender": "male"
  }'

# Copiar user_id de la respuesta
```

**✅ Resultado**: Usuario creado, OTP enviado (check logs)

#### 📋 Actividad 5.2: Verificar OTP (15 min)
```bash
# Ver OTP en logs del backend
# En desarrollo, el OTP se imprime en consola

# Verificar
curl -X POST http://localhost:3001/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "<user-id-anterior>",
    "otp": "<codigo-de-logs>"
  }'

# Guardar el token JWT de la respuesta
export TOKEN="eyJhbGc..."
```

**✅ Resultado**: Login exitoso, token obtenido

#### 📋 Actividad 5.3: Probar endpoints autenticados (25 min)
```bash
# 1. Get user profile
curl http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer $TOKEN"

# 2. Get Wompi methods
curl http://localhost:3001/api/payments/wompi/methods

# 3. Verificar en SQLite
sqlite3 backend/data/personalitymatch.db
SELECT * FROM users;
.quit
```

**✅ Resultado**: Usuario en DB, autenticación funcionando

---

## 🗓️ Semana 2: Docker y Testing de Pagos (5 días)

### Lunes - Día 6: Docker Setup (1 hora)

**Objetivo**: Correr aplicación con Docker Compose

#### 📋 Actividad 6.1: Verificar Docker (15 min)
```bash
# Verificar instalación
docker --version
docker-compose --version

# Si no está instalado (Ubuntu):
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

**✅ Resultado**: Docker funcionando

#### 📋 Actividad 6.2: Copiar .env para Docker (10 min)
```bash
# Copiar .env a raíz del proyecto
cp backend/.env ./.env

# Verificar
cat .env | grep WOMPI
```

**✅ Resultado**: .env en lugar correcto

#### 📋 Actividad 6.3: Iniciar con Docker (35 min)
```bash
# Detener backend manual (Ctrl+C)

# Iniciar Docker Compose
docker-compose -f docker-compose.cost-optimized.yml up -d

# Ver logs
docker-compose logs -f backend

# Verificar servicios
docker-compose ps

# Health check
curl http://localhost:3001/health

# Ver recursos
docker stats
```

**✅ Resultado**: Backend en Docker, funcionando

---

### Martes - Día 7: Test de Pago #1 (1 hora)

**Objetivo**: Realizar primer pago de prueba

#### 📋 Actividad 7.1: Preparar match de prueba (15 min)
```bash
# Conectar a SQLite
sqlite3 backend/data/personalitymatch.db

# Insertar match de prueba
INSERT INTO matches (
  match_id,
  viewer_user_id,
  matched_user_id,
  similarity_score,
  status,
  is_unlocked
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  '<tu-user-id>',
  '22222222-2222-2222-2222-222222222222',
  0.85,
  'shown',
  0
);

# Verificar
SELECT * FROM matches;
.quit
```

**✅ Resultado**: Match creado para testing

#### 📋 Actividad 7.2: Crear payment link (20 min)
```bash
# Asegurarse de tener token
export TOKEN="<tu-jwt-token>"

# Crear link
curl -X POST http://localhost:3001/api/payments/wompi/create-link \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "match_id": "11111111-1111-1111-1111-111111111111"
  }'

# Copiar payment_link de la respuesta
```

**✅ Resultado**: Payment link generado

#### 📋 Actividad 7.3: Realizar pago de prueba (25 min)
1. Abrir payment_link en navegador
2. En checkout de Wompi, usar tarjeta de prueba:
   ```
   Número: 4242 4242 4242 4242
   CVV: 123
   Expiry: 12/25
   Nombre: Test User
   ```
3. Completar pago
4. Ver logs en backend:
   ```bash
   docker-compose logs -f backend | grep wompi
   ```
5. Verificar match desbloqueado:
   ```bash
   curl http://localhost:3001/api/matches/11111111-1111-1111-1111-111111111111 \
     -H "Authorization: Bearer $TOKEN"

   # Verificar: "is_unlocked": true
   ```

**✅ Resultado**: Pago exitoso, webhook recibido, match desbloqueado

---

### Miércoles - Día 8: Test de Pago #2 (1 hora)

**Objetivo**: Probar otros métodos de pago

#### 📋 Actividad 8.1: Pago con Nequi simulado (20 min)
```bash
# Obtener acceptance token
ACCEPTANCE=$(curl -s http://localhost:3001/api/payments/wompi/acceptance-token | jq -r '.acceptance_token')

# Crear transacción Nequi
curl -X POST http://localhost:3001/api/payments/wompi/create-transaction \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"match_id\": \"22222222-2222-2222-2222-222222222222\",
    \"payment_method\": {
      \"type\": \"NEQUI\",
      \"phone_number\": \"+573001234567\"
    },
    \"acceptance_token\": \"$ACCEPTANCE\"
  }"
```

**✅ Resultado**: Transacción Nequi creada

#### 📋 Actividad 8.2: Verificar transacciones (20 min)
```bash
# Listar pagos en DB
sqlite3 backend/data/personalitymatch.db
SELECT payment_id, status, amount_cents, currency, created_at
FROM payments
ORDER BY created_at DESC
LIMIT 5;
.quit

# Ver historial de pagos
curl http://localhost:3001/api/payments/history \
  -H "Authorization: Bearer $TOKEN"
```

**✅ Resultado**: Historial de pagos visible

#### 📋 Actividad 8.3: Documentar resultados (20 min)

Crear `TEST_RESULTS.md`:
```markdown
# Resultados de Testing

## Fecha: [hoy]

### ✅ Tests Completados

#### Autenticación
- [x] Registro con email/password
- [x] OTP funcionando
- [x] Login con JWT

#### Wompi Pagos
- [x] Payment link generado
- [x] Pago con tarjeta aprobado
- [x] Webhook recibido
- [x] Match desbloqueado
- [x] Nequi simulado

#### Base de Datos
- [x] SQLite funcionando
- [x] Datos persistiendo
- [x] Relaciones correctas

### 📊 Estadísticas
- Usuarios creados: 1
- Pagos procesados: 2
- Matches creados: 2
- Webhooks recibidos: 1

### 🐛 Problemas Encontrados
[Listar aquí]

### 📝 Notas
[Observaciones]
```

**✅ Resultado**: Testing documentado

---

### Jueves - Día 9: Backup Script (1 hora)

**Objetivo**: Configurar sistema de backups

#### 📋 Actividad 9.1: Crear script de backup (30 min)
```bash
mkdir -p backend/scripts
nano backend/scripts/backup.sh
```

**Contenido:**
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backend/backups"
DB_PATH="./backend/data/personalitymatch.db"
BACKUP_FILE="$BACKUP_DIR/backup_$DATE.db"

mkdir -p $BACKUP_DIR

echo "Creating backup: $BACKUP_FILE"
sqlite3 $DB_PATH ".backup '$BACKUP_FILE'"

gzip $BACKUP_FILE

find $BACKUP_DIR -name "*.db.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_FILE.gz"
```

```bash
# Hacer ejecutable
chmod +x backend/scripts/backup.sh
```

**✅ Resultado**: Script creado

#### 📋 Actividad 9.2: Probar backup (15 min)
```bash
# Ejecutar backup
./backend/scripts/backup.sh

# Verificar
ls -lh backend/backups/

# Probar restauración
LATEST=$(ls -t backend/backups/*.db.gz | head -1)
gunzip -c $LATEST > /tmp/restored.db

# Verificar integridad
sqlite3 /tmp/restored.db "PRAGMA integrity_check;"

# Limpiar
rm /tmp/restored.db
```

**✅ Resultado**: Backup funcionando, restauración OK

#### 📋 Actividad 9.3: Documentar proceso (15 min)

Actualizar `PRODUCTION_INFO.md`:
```markdown
## Backups

### Script
- Ubicación: `backend/scripts/backup.sh`
- Ejecución manual: `./backend/scripts/backup.sh`
- Destino: `backend/backups/`
- Retención: 7 días locales
- Compresión: gzip

### Restauración
```bash
# Listar backups
ls -lht backend/backups/

# Restaurar
gunzip -c backup_YYYYMMDD.db.gz > restored.db
```

**✅ Resultado**: Proceso documentado

---

### Viernes - Día 10: Preparación VPS (1 hora)

**Objetivo**: Investigar y preparar deployment

#### 📋 Actividad 10.1: Investigar proveedores VPS (20 min)

**Comparar opciones:**

| Provider | Plan | CPU | RAM | Disco | Precio |
|----------|------|-----|-----|-------|--------|
| Hetzner | CPX11 | 2 vCPU | 4GB | 80GB | $5/mo |
| DigitalOcean | Basic | 1 vCPU | 1GB | 25GB | $6/mo |
| Vultr | Cloud | 1 vCPU | 1GB | 25GB | $6/mo |

**Decisión**: Hetzner CPX11 (mejor relación precio/rendimiento)

**✅ Resultado**: Proveedor seleccionado

#### 📋 Actividad 10.2: Revisar script de deployment (20 min)
```bash
# Leer script
cat backend/deploy-vps.sh

# Identificar secciones:
# 1. Verificación SSH
# 2. Instalación Docker
# 3. Configuración NGINX
# 4. Setup seguridad (UFW, fail2ban)
# 5. Copia de archivos
# 6. Configuración systemd
```

**Anotar requisitos previos:**
- IP del VPS
- Dominio configurado
- SSH key agregado al VPS

**✅ Resultado**: Script entendido

#### 📋 Actividad 10.3: Crear deployment checklist (20 min)

**Crear `PRE_DEPLOYMENT.md`:**
```markdown
# Pre-Deployment Checklist

## Antes de ejecutar deploy-vps.sh

### Requisitos
- [ ] Cuenta Hetzner creada
- [ ] VPS contratado (CPX11)
- [ ] IP pública anotada: _______________
- [ ] SSH key configurado
- [ ] SSH access verificado: `ssh root@<ip>`

### Dominio
- [ ] Dominio comprado (o subdominio disponible)
- [ ] DNS A record configurado:
      `api.tudominio.com → <vps-ip>`
- [ ] DNS propagado (verificar con `nslookup`)

### Credenciales de Producción
- [ ] Wompi en modo producción
- [ ] Nuevas keys de Wompi prod
- [ ] Google OAuth redirect URLs actualizados
- [ ] Brevo funcionando

### Código
- [ ] Tests pasando localmente
- [ ] .env de producción preparado
- [ ] Backup de DB local realizado

### Siguiente Paso
Ejecutar: `./backend/deploy-vps.sh <ip> <dominio>`
```

**✅ Resultado**: Checklist listo para semana 3

---

## 🗓️ Semana 3: VPS Deployment (5 días)

### Lunes - Día 11: Contratar VPS (1 hora)

**Objetivo**: Tener VPS funcionando con acceso SSH

#### 📋 Actividad 11.1: Crear cuenta Hetzner (15 min)
1. Ir a https://www.hetzner.com/cloud
2. Click "Sign Up"
3. Completar registro
4. Verificar email
5. Agregar método de pago

**✅ Resultado**: Cuenta Hetzner activa

#### 📋 Actividad 11.2: Crear VPS (20 min)
1. Login en Hetzner Cloud Console
2. "New Project" → "PersonalityMatch"
3. "Add Server"
4. Configuración:
   - Location: Nuremberg (o el más cercano)
   - Image: Ubuntu 22.04
   - Type: CPX11 (€4.49/mo)
   - Networking: IPv4 + IPv6
   - SSH Key: Agregar tu clave pública
   - Name: personalitymatch-prod
5. "Create & Buy now"
6. Copiar IP pública

**✅ Resultado**: VPS creado, IP asignada

#### 📋 Actividad 11.3: Verificar acceso SSH (10 min)
```bash
# Probar SSH
ssh root@<tu-vps-ip>

# Si funciona, estás dentro del VPS
# Salir: exit

# Si no funciona, agregar key:
ssh-copy-id root@<tu-vps-ip>
```

**✅ Resultado**: SSH funcionando

#### 📋 Actividad 11.4: Anotar información (15 min)

**Actualizar `PRODUCTION_INFO.md`:**
```markdown
## VPS Información

- **Provider**: Hetzner Cloud
- **Plan**: CPX11 (2 vCPU, 4GB RAM, 80GB SSD)
- **IP Pública**: <tu-ip>
- **OS**: Ubuntu 22.04 LTS
- **Location**: Nuremberg, Germany
- **SSH**: `ssh root@<tu-ip>`
- **Costo**: €4.49/mes (~$5 USD)
- **Fecha creación**: [hoy]
```

**✅ Resultado**: Info documentada

---

### Martes - Día 12: Configurar Dominio (1 hora)

**Objetivo**: Dominio apuntando a VPS

#### 📋 Actividad 12.1: Decisión de dominio (15 min)

**Opción A**: Comprar dominio nuevo
- Namecheap.com
- Cloudflare Registrar
- ~$10/año

**Opción B**: Usar subdominio existente
- api.tudominio-existente.com

**Decisión**: _________________

**✅ Resultado**: Opción seleccionada

#### 📋 Actividad 12.2: Configurar DNS (25 min)

**Para Namecheap:**
1. Login en Namecheap
2. Manage domain
3. Advanced DNS
4. Add Record:
   - Type: A Record
   - Host: api
   - Value: <tu-vps-ip>
   - TTL: 300 (5 min)
5. Save

**Para Cloudflare:**
1. Login en Cloudflare
2. Select domain
3. DNS Settings
4. Add record:
   - Type: A
   - Name: api
   - IPv4 address: <tu-vps-ip>
   - Proxy: Off (importante!)
   - TTL: Auto
5. Save

**✅ Resultado**: DNS configurado

#### 📋 Actividad 12.3: Verificar propagación (20 min)
```bash
# Esperar 5-10 minutos

# Verificar DNS
nslookup api.tudominio.com

# Debería mostrar tu VPS IP

# Verificar desde otro servicio
# https://dnschecker.org/
# Buscar: api.tudominio.com

# Hacer ping
ping api.tudominio.com

# Si responde con tu VPS IP, está listo
```

**✅ Resultado**: DNS propagado y funcionando

---

### Miércoles - Día 13: Ejecutar Deployment (1 hora)

**Objetivo**: Desplegar aplicación en VPS

#### 📋 Actividad 13.1: Preparar .env de producción (15 min)
```bash
# Copiar template
cp backend/.env backend/.env.production

# Editar para producción
nano backend/.env.production
```

**Cambios importantes:**
```bash
# CAMBIAR A PRODUCCIÓN
NODE_ENV=production
WOMPI_ENVIRONMENT=production

# USAR KEYS DE PRODUCCIÓN
WOMPI_PUBLIC_KEY=pub_prod_xxxxx
WOMPI_PRIVATE_KEY=prv_prod_xxxxx
WOMPI_INTEGRITY_SECRET=prod_secret

# URLs DE PRODUCCIÓN
FRONTEND_URL=https://tudominio.com
GOOGLE_CALLBACK_URL=https://api.tudominio.com/api/auth/google/callback

# GENERAR NUEVOS SECRETS (nunca reusar de dev)
JWT_SECRET=<nuevo-secret-de-32-caracteres>
ENCRYPTION_KEY=<nuevo-key-hex-de-32-chars>
```

**✅ Resultado**: .env de producción listo

#### 📋 Actividad 13.2: Ejecutar deployment script (35 min)
```bash
cd backend

# Ejecutar
./deploy-vps.sh <vps-ip> api.tudominio.com

# Ejemplo real:
# ./deploy-vps.sh 159.69.123.45 api.personalitymatch.com

# El script va a:
# ✓ Verificar SSH
# ✓ Instalar Docker
# ✓ Instalar NGINX
# ✓ Configurar firewall UFW
# ✓ Instalar Certbot
# ✓ Copiar archivos al VPS
# ✓ Crear servicio systemd

# Duración: ~5-10 minutos
```

**Si hay errores:**
- SSH timeout: Verificar IP y firewall
- Permission denied: Verificar SSH key
- Port 22 blocked: Contactar proveedor VPS

**✅ Resultado**: Deployment completado

#### 📋 Actividad 13.3: Copiar .env al VPS (10 min)
```bash
# SSH al VPS
ssh root@<vps-ip>

# Ir al directorio
cd /opt/personalitymatch/backend

# Crear .env
nano .env

# Pegar contenido de .env.production
# (copiar/pegar desde tu local)

# Guardar: Ctrl+X, Y, Enter

# Verificar permisos
chmod 600 .env

# Salir del VPS
exit
```

**✅ Resultado**: .env configurado en producción

---

### Jueves - Día 14: Iniciar Producción (1 hora)

**Objetivo**: Aplicación corriendo en HTTPS

#### 📋 Actividad 14.1: Iniciar aplicación (20 min)
```bash
# SSH al VPS
ssh root@<vps-ip>

# Iniciar servicio
systemctl start personalitymatch

# Ver status
systemctl status personalitymatch

# Debería mostrar:
# Active: active (running)

# Ver logs
tail -f /opt/personalitymatch/logs/app.log

# Probar localmente en VPS
curl http://localhost:3001/health

# Si responde OK, está funcionando
```

**✅ Resultado**: Aplicación corriendo

#### 📋 Actividad 14.2: Configurar SSL (30 min)
```bash
# Ejecutar Certbot
certbot --nginx -d api.tudominio.com

# Responder:
# Email: tu_email@example.com
# Terms: A (Agree)
# Newsletter: N (No)
# Redirect HTTP→HTTPS: 2 (Yes)

# Esperar... se instala certificado

# Verificar
curl https://api.tudominio.com/health

# Debería responder OK por HTTPS
```

**Si hay errores:**
- DNS not resolved: Esperar más tiempo, DNS aún propagando
- Rate limit: Has intentado muchas veces, esperar 1 hora

**✅ Resultado**: HTTPS funcionando

#### 📋 Actividad 14.3: Configurar auto-renewal SSL (10 min)
```bash
# Habilitar timer de renovación
systemctl enable certbot.timer
systemctl start certbot.timer

# Verificar timer
systemctl status certbot.timer

# Test de renovación (dry-run)
certbot renew --dry-run

# Debería ver: "Congratulations, all simulated renewals succeeded"

# Salir del VPS
exit
```

**✅ Resultado**: SSL auto-renew configurado

---

### Viernes - Día 15: Verificación y Webhook (1 hora)

**Objetivo**: Sistema completamente funcional

#### 📋 Actividad 15.1: Smoke tests (25 min)

**Desde tu máquina local:**
```bash
API_URL="https://api.tudominio.com"

# 1. Health check
curl $API_URL/health

# 2. Wompi config
curl $API_URL/api/payments/wompi/config

# 3. Acceptance token
curl $API_URL/api/payments/wompi/acceptance-token

# 4. Google OAuth (navegador)
open $API_URL/api/auth/google

# 5. Registrar usuario real
curl -X POST $API_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "prod-test@example.com",
    "password": "Secure123!",
    "age": 27
  }'

# Revisar email para OTP
```

**✅ Resultado**: Todos los endpoints funcionan en prod

#### 📋 Actividad 15.2: Configurar webhook Wompi (20 min)
1. Login en https://comercios.wompi.co/
2. Cambiar a modo "Producción" (toggle arriba)
3. **Settings** → **Webhooks**
4. "Add Webhook"
5. URL: `https://api.tudominio.com/api/payments/wompi/webhook`
6. Events: Seleccionar `transaction.updated`
7. Active: Yes
8. Save

**Probar webhook:**
- En Wompi dashboard, usar "Test Webhook"
- Ver logs del VPS:
  ```bash
  ssh root@<vps-ip>
  tail -f /opt/personalitymatch/logs/app.log | grep wompi
  ```

**✅ Resultado**: Webhook configurado y probado

#### 📋 Actividad 15.3: Actualizar Google OAuth (15 min)
1. Ir a https://console.cloud.google.com/
2. Seleccionar proyecto PersonalityMatch
3. **APIs & Services** → **Credentials**
4. Editar OAuth 2.0 Client
5. Agregar a "Authorized redirect URIs":
   ```
   https://api.tudominio.com/api/auth/google/callback
   ```
6. Save

**Probar:**
```bash
# En navegador
https://api.tudominio.com/api/auth/google

# Debería redirigir a Google y luego a frontend
```

**✅ Resultado**: OAuth funcionando en producción

---

## 🗓️ Semana 4: Monitoreo y Frontend (5 días)

### Lunes - Día 16: UptimeRobot (1 hora)

**Objetivo**: Monitoreo activo 24/7

#### 📋 Actividad 16.1: Crear cuenta UptimeRobot (10 min)
1. Ir a https://uptimerobot.com/
2. Sign Up (gratis)
3. Verificar email
4. Login

**✅ Resultado**: Cuenta creada

#### 📋 Actividad 16.2: Configurar monitores (30 min)

**Monitor 1: Health Check**
1. "Add New Monitor"
2. Configurar:
   - Type: HTTPS
   - Name: PersonalityMatch API Health
   - URL: `https://api.tudominio.com/health`
   - Interval: 5 minutes
3. Alert Contacts → Add email
4. Save

**Monitor 2: Wompi Integration**
- URL: `https://api.tudominio.com/api/payments/wompi/config`
- Name: Wompi Connection

**Monitor 3: Database Check**
- URL: `https://api.tudominio.com/health`
- Name: Main Endpoint

**✅ Resultado**: 3 monitores activos

#### 📋 Actividad 16.3: Configurar alertas (20 min)
1. Settings → Alert Contacts
2. Agregar:
   - Email principal
   - Email secundario (opcional)
3. Configurar:
   - Alert when down: Immediately
   - Alert when up: After 5 minutes
4. Save

**Probar:**
- Detener servicio en VPS temporalmente
- Verificar que llegue alerta
- Reiniciar servicio
- Verificar alerta de recuperación

**✅ Resultado**: Alertas funcionando

---

### Martes - Día 17: Backups Automáticos (1 hora)

**Objetivo**: Backups diarios configurados

#### 📋 Actividad 17.1: Copiar script al VPS (15 min)
```bash
# SSH al VPS
ssh root@<vps-ip>

# Crear directorio scripts
mkdir -p /opt/personalitymatch/scripts

# Crear script
nano /opt/personalitymatch/scripts/backup.sh
```

**Contenido:**
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/personalitymatch/backups"
DB_PATH="/opt/personalitymatch/backend/data/personalitymatch.db"
BACKUP_FILE="$BACKUP_DIR/backup_$DATE.db"

mkdir -p $BACKUP_DIR

echo "[$(date)] Starting backup..."
sqlite3 $DB_PATH ".backup '$BACKUP_FILE'"

gzip $BACKUP_FILE

find $BACKUP_DIR -name "*.db.gz" -mtime +30 -delete

echo "[$(date)] Backup completed: $BACKUP_FILE.gz"
```

```bash
# Hacer ejecutable
chmod +x /opt/personalitymatch/scripts/backup.sh

# Probar
/opt/personalitymatch/scripts/backup.sh

# Verificar
ls -lh /opt/personalitymatch/backups/
```

**✅ Resultado**: Script funcionando en VPS

#### 📋 Actividad 17.2: Configurar cron job (20 min)
```bash
# Editar crontab
crontab -e

# Seleccionar editor (nano)

# Agregar al final:
# Backup diario a las 3 AM
0 3 * * * /opt/personalitymatch/scripts/backup.sh >> /opt/personalitymatch/logs/backup.log 2>&1

# Guardar y salir (Ctrl+X, Y, Enter)

# Verificar
crontab -l

# Ver servicio cron
systemctl status cron
```

**✅ Resultado**: Cron job configurado

#### 📋 Actividad 17.3: Probar restauración (25 min)
```bash
# Listar backups
ls -lht /opt/personalitymatch/backups/

# Descomprimir último
LATEST=$(ls -t /opt/personalitymatch/backups/*.db.gz | head -1)
gunzip -c $LATEST > /tmp/test_restore.db

# Verificar integridad
sqlite3 /tmp/test_restore.db "PRAGMA integrity_check;"

# Debería decir: "ok"

# Ver datos
sqlite3 /tmp/test_restore.db
.tables
SELECT COUNT(*) FROM users;
.quit

# Limpiar
rm /tmp/test_restore.db

# Salir del VPS
exit
```

**✅ Resultado**: Restauración verificada

---

### Miércoles - Día 18: Test de Pago en Prod (1 hora)

**Objetivo**: Pago end-to-end en producción

#### 📋 Actividad 18.1: Registrar usuario de prueba (15 min)
```bash
API_URL="https://api.tudominio.com"

# Registrar
curl -X POST $API_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "payment-test@example.com",
    "password": "SecureTest123!",
    "age": 30
  }'

# Copiar user_id

# Revisar email real para OTP
# (Brevo debería enviar email)

# Verificar OTP
curl -X POST $API_URL/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "<user-id>",
    "otp": "<codigo-del-email>"
  }'

# Guardar token
export TOKEN="<jwt-token>"
```

**✅ Resultado**: Usuario registrado en producción

#### 📋 Actividad 18.2: Crear match de prueba (15 min)
```bash
# SSH al VPS
ssh root@<vps-ip>

# Insertar match
sqlite3 /opt/personalitymatch/backend/data/personalitymatch.db

INSERT INTO matches (
  match_id,
  viewer_user_id,
  matched_user_id,
  similarity_score,
  status,
  is_unlocked
) VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '<user-id-de-18.1>',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  0.92,
  'shown',
  0
);

SELECT * FROM matches WHERE match_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
.quit

exit
```

**✅ Resultado**: Match creado en producción

#### 📋 Actividad 18.3: Realizar pago real (30 min)
```bash
# Crear payment link
curl -X POST $API_URL/api/payments/wompi/create-link \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "match_id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
  }'

# Copiar payment_link
```

**En navegador:**
1. Abrir payment_link
2. Usar tarjeta de prueba Wompi:
   - Número: 4242 4242 4242 4242
   - CVV: 123
   - Fecha: 12/26
3. Completar pago
4. Observar redirect

**Verificar:**
```bash
# Ver logs del VPS
ssh root@<vps-ip>
tail -50 /opt/personalitymatch/logs/app.log | grep -i wompi

# Verificar match desbloqueado
curl $API_URL/api/matches/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa \
  -H "Authorization: Bearer $TOKEN" | jq

# Verificar: "is_unlocked": true
```

**✅ Resultado**: Pago completado en producción!

---

### Jueves - Día 19: Deploy Frontend (1 hora)

**Objetivo**: Frontend en Vercel

#### 📋 Actividad 19.1: Preparar frontend (20 min)
```bash
cd frontend

# Crear config para producción
nano src/config.js
```

**Contenido:**
```javascript
export const API_URL = process.env.NODE_ENV === 'production'
  ? 'https://api.tudominio.com'
  : 'http://localhost:3001';

export const WOMPI_PUBLIC_KEY = process.env.NODE_ENV === 'production'
  ? 'pub_prod_xxxxx' // Tu key de producción
  : 'pub_test_xxxxx';

export const config = {
  apiUrl: API_URL,
  wompiPublicKey: WOMPI_PUBLIC_KEY,
  googleClientId: 'xxxxx.apps.googleusercontent.com'
};
```

**Actualizar imports en App.jsx:**
```javascript
import { config } from './config';

// Usar config.apiUrl en lugar de hardcoded URLs
```

**✅ Resultado**: Frontend configurado para producción

#### 📋 Actividad 19.2: Deploy a Vercel (30 min)
```bash
# Instalar Vercel CLI
npm install -g vercel

# Login
vercel login
# Seguir proceso de autenticación

# Deploy (primer intento)
vercel

# Responder:
# Set up and deploy? Y
# Scope? [Tu cuenta]
# Link to existing project? N
# Project name? personalitymatch
# Directory? ./
# Override settings? N

# Te da URL preview: https://personalitymatch-xxxxx.vercel.app

# Verificar que funciona (abrir en navegador)

# Deploy a producción
vercel --prod

# URL final: https://personalitymatch.vercel.app
```

**✅ Resultado**: Frontend desplegado

#### 📋 Actividad 19.3: Actualizar CORS en backend (10 min)
```bash
# SSH al VPS
ssh root@<vps-ip>

# Editar .env
nano /opt/personalitymatch/backend/.env

# Actualizar FRONTEND_URL
FRONTEND_URL=https://personalitymatch.vercel.app

# Guardar

# Reiniciar servicio
systemctl restart personalitymatch

# Verificar
systemctl status personalitymatch

exit
```

**✅ Resultado**: CORS configurado para Vercel

---

### Viernes - Día 20: Testing End-to-End (1 hora)

**Objetivo**: Flujo completo funcionando

#### 📋 Actividad 20.1: Test de registro completo (20 min)
1. Abrir frontend: https://personalitymatch.vercel.app
2. Click "Registrarse"
3. Completar formulario
4. Verificar OTP (email real)
5. Login exitoso
6. Ver dashboard

**✅ Resultado**: Registro funcionando

#### 📋 Actividad 20.2: Test de pago completo (25 min)
1. En frontend, navegar a matches
2. Ver match disponible
3. Click "Unlock Profile"
4. Completar pago con Wompi
5. Verificar que perfil se desbloquea
6. Ver información de contacto

**✅ Resultado**: Flujo de pago funcionando

#### 📋 Actividad 20.3: Documentar producción (15 min)

**Crear `PRODUCTION_LIVE.md`:**
```markdown
# 🎉 PersonalityMatch - LIVE EN PRODUCCIÓN

## Fecha: [hoy]

### 🌐 URLs

- **Frontend**: https://personalitymatch.vercel.app
- **Backend API**: https://api.tudominio.com
- **Health Check**: https://api.tudominio.com/health

### ✅ Status

- [x] Backend desplegado en VPS
- [x] HTTPS configurado (Let's Encrypt)
- [x] Frontend en Vercel
- [x] Wompi en modo producción
- [x] Webhooks funcionando
- [x] Emails enviando (Brevo)
- [x] Google OAuth funcionando
- [x] Backups automáticos
- [x] Monitoreo activo (UptimeRobot)

### 📊 Estadísticas Iniciales

- Usuarios registrados: 2
- Pagos procesados: 1 ($1 USD)
- Matches creados: 1
- Uptime: 100%

### 💰 Costos Reales

- VPS Hetzner: $5/mes
- Dominio: $1/mes
- Frontend: $0/mes (Vercel free)
- Email: $0/mes (Brevo free)
- Backups: $0/mes (local)
- **Total**: $6/mes + fees de Wompi

### 📈 Próximos Pasos

Semana 5-6:
- Optimización de performance
- Más testing
- Documentación de usuario
- Marketing content

### 🎯 Meta

¡Sistema funcionando con 94% menos costo que AWS!
AWS: $104/mes → VPS: $6/mes
```

**✅ Resultado**: ¡Producción documentada y LIVE!

---

## 🗓️ Semana 5-6: Optimización y Crecimiento (10 días)

### Días 21-25: Optimización (5 horas)

#### Día 21: Análisis de Performance (1h)
- Instalar herramientas de profiling
- Identificar queries lentas
- Optimizar índices SQLite
- Documentar mejoras

#### Día 22: Caché y Optimización (1h)
- Configurar Redis para caché
- Implementar caché en endpoints frecuentes
- Medir mejoras
- Documentar configuración

#### Día 23: Monitoring Avanzado (1h)
- Configurar dashboards
- Alertas personalizadas
- Logs estructurados
- Documentar métricas

#### Día 24: SEO y Meta Tags (1h)
- Meta tags en frontend
- Open Graph tags
- Twitter cards
- Sitemap

#### Día 25: Documentación de Usuario (1h)
- Guía de inicio rápido
- Video tutorial (opcional)
- FAQ
- Troubleshooting para usuarios

---

### Días 26-30: Crecimiento (5 horas)

#### Día 26: Content Marketing (1h)
- Página "Cómo funciona"
- Blog post sobre Big Five
- Explicación de matching
- Screenshots

#### Día 27: Analytics (1h)
- Google Analytics setup
- Eventos de conversión
- Funnels
- Reportes

#### Día 28: A/B Testing Setup (1h)
- Herramientas de A/B testing
- Primera prueba (CTA buttons)
- Documentar proceso
- Análisis inicial

#### Día 29: Plan de Escalamiento (1h)
- Documentar cuándo migrar a PostgreSQL
- Plan para múltiples servidores
- Estrategia de CDN
- Costos proyectados

#### Día 30: Review y Retrospectiva (1h)
- Revisar todos los objetivos
- Documentar lecciones aprendidas
- Identificar mejoras
- Planificar próximos 30 días

---

## 📊 Resumen del Plan Completo

### Por Semana

| Semana | Foco | Horas | Días |
|--------|------|-------|------|
| 1 | Setup y Testing Local | 5h | 5 |
| 2 | Docker y Testing Pagos | 5h | 5 |
| 3 | VPS Deployment | 5h | 5 |
| 4 | Monitoreo y Frontend | 5h | 5 |
| 5-6 | Optimización | 10h | 10 |
| **Total** | | **30h** | **30 días** |

### Hitos Importantes

- ✅ **Día 5**: Backend funcionando localmente
- ✅ **Día 7**: Primer pago de prueba exitoso
- ✅ **Día 10**: Docker Compose funcionando
- ✅ **Día 13**: Deployment ejecutado
- ✅ **Día 15**: Sistema en producción con HTTPS
- ✅ **Día 18**: Primer pago real en producción
- ✅ **Día 20**: Frontend live, sistema completo
- ✅ **Día 30**: Sistema optimizado y escalable

---

## 🎯 Checklist de Progreso

### Semana 1 ✅
- [ ] Día 1: Cuenta Wompi
- [ ] Día 2: Brevo + Google OAuth
- [ ] Día 3: Config local
- [ ] Día 4: Backend corriendo
- [ ] Día 5: Usuario de prueba

### Semana 2 ✅
- [ ] Día 6: Docker funcionando
- [ ] Día 7: Pago de prueba #1
- [ ] Día 8: Pago de prueba #2
- [ ] Día 9: Backups configurados
- [ ] Día 10: Prep deployment

### Semana 3 ✅
- [ ] Día 11: VPS contratado
- [ ] Día 12: Dominio configurado
- [ ] Día 13: Deploy ejecutado
- [ ] Día 14: HTTPS funcionando
- [ ] Día 15: Webhook configurado

### Semana 4 ✅
- [ ] Día 16: UptimeRobot activo
- [ ] Día 17: Backups automáticos
- [ ] Día 18: Pago en producción
- [ ] Día 19: Frontend desplegado
- [ ] Día 20: Testing E2E completo

### Semanas 5-6 ✅
- [ ] Días 21-25: Optimizaciones
- [ ] Días 26-30: Crecimiento

---

## 🚨 Troubleshooting Rápido

### "No puedo SSH al VPS"
```bash
# Verificar IP
ping <vps-ip>

# Verificar puerto 22
nc -zv <vps-ip> 22

# Agregar SSH key
ssh-copy-id root@<vps-ip>
```

### "DNS no resuelve"
```bash
# Verificar propagación
nslookup api.tudominio.com

# Esperar 10-30 minutos
# Limpiar caché DNS local
sudo systemd-resolve --flush-caches
```

### "Pago falla en producción"
```bash
# Ver logs
ssh root@<vps-ip>
tail -100 /opt/personalitymatch/logs/app.log | grep wompi

# Verificar webhook en Wompi dashboard
# Verificar que WOMPI_ENVIRONMENT=production
```

### "Backend no inicia"
```bash
# Ver logs
ssh root@<vps-ip>
journalctl -u personalitymatch -n 50

# Reiniciar
systemctl restart personalitymatch

# Ver .env
cat /opt/personalitymatch/backend/.env | grep -v SECRET
```

---

## 📞 Recursos de Ayuda

### Documentación
- README.COST-OPTIMIZED.md
- docs/WOMPI_INTEGRATION.md
- DEPLOYMENT.md
- TODO.md (este archivo)

### Soporte Proveedores
- **Wompi**: soporte@wompi.co
- **Hetzner**: support@hetzner.com
- **Vercel**: https://vercel.com/support
- **Brevo**: https://help.brevo.com/

---

## 🎉 ¡Éxito!

Al completar este plan de 30 días, tendrás:

✅ Sistema funcionando en producción
✅ HTTPS configurado
✅ Pagos procesando con Wompi
✅ Monitoreo 24/7
✅ Backups automáticos
✅ Frontend desplegado
✅ Documentación completa
✅ **Costos de solo $6-18/mes** (vs $104/mes en AWS)

**¡Felicitaciones por tu implementación exitosa!** 🚀

---

**Última actualización**: Diciembre 2025
**Versión**: 1.0
**Autor**: PersonalityMatch Team
