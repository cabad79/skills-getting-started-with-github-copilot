# TODO List - Implementación PersonalityMatch Cost-Optimized

Plan de implementación organizado para **2 horas diarias de trabajo**.

**Tiempo total estimado**: ~30 horas (15 días laborales)

---

## 📅 Semana 1: Setup y Configuración (10 horas)

### Día 1 (Lunes): Cuentas y Credenciales - 2 horas

#### ✅ Tarea 1.1: Crear cuenta Wompi (30 min)
**Prioridad**: 🔴 ALTA

**Pasos detallados:**
1. Ir a https://comercios.wompi.co/
2. Click en "Registrarse"
3. Llenar formulario:
   - Nombre completo
   - Email empresarial
   - Teléfono
   - Tipo de negocio: "Tecnología/SaaS"
   - País: Colombia
4. Verificar email
5. Completar información adicional:
   - Nombre del negocio: "PersonalityMatch"
   - NIT o cédula
   - Dirección
6. **Importante**: Activar modo Sandbox primero

**Resultado esperado:**
- Cuenta Wompi creada y verificada
- Acceso al dashboard

---

#### ✅ Tarea 1.2: Obtener credenciales Wompi (30 min)

**Pasos detallados:**
1. Login en https://comercios.wompi.co/
2. Ir a **Developers** → **API Keys**
3. Copiar credenciales Sandbox:
   ```
   Public Key: pub_test_xxxxx
   Private Key: prv_test_xxxxx
   ```
4. Ir a **Settings** → **Webhooks**
5. Copiar **Integrity Secret**: xxxxx
6. Guardar en archivo seguro (no commitear)

**Resultado esperado:**
- 3 credenciales guardadas
- Listas para usar en .env

---

#### ✅ Tarea 1.3: Crear cuenta Brevo (20 min)
**Prioridad**: 🔴 ALTA

**Pasos detallados:**
1. Ir a https://www.brevo.com/
2. Click "Sign up free"
3. Crear cuenta con email
4. Verificar email
5. Completar perfil básico
6. Ir a **Settings** → **SMTP & API**
7. Click "Generate a new SMTP key"
8. Copiar credenciales:
   ```
   Host: smtp-relay.sendinblue.com
   Port: 587
   User: tu_email@example.com
   Password: xxxxxxxxxxx
   ```

**Resultado esperado:**
- Cuenta Brevo free tier activada
- Credenciales SMTP listas
- 300 emails/día disponibles

---

#### ✅ Tarea 1.4: Configurar Google OAuth (40 min)
**Prioridad**: 🔴 ALTA

**Pasos detallados:**
1. Ir a https://console.cloud.google.com/
2. Crear nuevo proyecto "PersonalityMatch"
3. Habilitar **Google+ API**:
   - APIs & Services → Library
   - Buscar "Google+ API"
   - Click "Enable"
4. Crear credenciales OAuth 2.0:
   - APIs & Services → Credentials
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: "Web application"
   - Name: "PersonalityMatch Backend"
   - Authorized redirect URIs:
     ```
     http://localhost:3001/api/auth/google/callback
     https://api.tudominio.com/api/auth/google/callback
     ```
5. Copiar credenciales:
   ```
   Client ID: xxxxx.apps.googleusercontent.com
   Client Secret: xxxxx
   ```
6. Configurar OAuth consent screen:
   - User Type: External
   - App name: PersonalityMatch
   - User support email: tu_email
   - Developer contact: tu_email

**Resultado esperado:**
- Google OAuth configurado
- Client ID y Secret listos
- Redirect URIs configurados

---

### Día 2 (Martes): Configuración Local - 2 horas

#### ✅ Tarea 2.1: Clonar y configurar repositorio (30 min)

**Pasos detallados:**
```bash
# 1. Clonar repositorio
git clone <tu-repo-url>
cd skills-getting-started-with-github-copilot

# 2. Cambiar a rama cost-optimized
git checkout claude/cost-optimization-wompi-01CNCBqv2Saa6Ep1zKWrGEHw

# 3. Verificar archivos
ls -la

# 4. Revisar estructura
tree -L 2 backend/
```

**Resultado esperado:**
- Repositorio clonado
- Rama correcta checkout
- Estructura verificada

---

#### ✅ Tarea 2.2: Configurar archivo .env (45 min)

**Pasos detallados:**
```bash
# 1. Copiar template
cp .env.cost-optimized.example .env
cp .env.cost-optimized.example backend/.env

# 2. Abrir editor
nano backend/.env

# 3. Configurar todas las variables
```

**Variables a configurar:**
```bash
# Node
NODE_ENV=development

# Database
DB_TYPE=sqlite
SQLITE_PATH=./data/personalitymatch.db

# JWT (generar nuevo)
# Comando: openssl rand -base64 32
JWT_SECRET=TU_SECRET_GENERADO_AQUI
JWT_EXPIRES_IN=7d

# Google OAuth (del Día 1)
GOOGLE_CLIENT_ID=tu_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback

# Wompi (del Día 1)
WOMPI_PUBLIC_KEY=pub_test_xxxxx
WOMPI_PRIVATE_KEY=prv_test_xxxxx
WOMPI_INTEGRITY_SECRET=xxxxx
WOMPI_ENVIRONMENT=sandbox
WOMPI_CURRENCY=COP
UNLOCK_PRICE_USD=1.00
USD_TO_COP_RATE=4000

# Brevo Email (del Día 1)
SMTP_HOST=smtp-relay.sendinblue.com
SMTP_PORT=587
SMTP_USER=tu_email@example.com
SMTP_PASSWORD=tu_smtp_key
EMAIL_FROM=noreply@personalitymatch.com

# Redis (local)
REDIS_URL=redis://localhost:6379

# Frontend
FRONTEND_URL=http://localhost:5173

# Encryption (generar nuevo)
# Comando: openssl rand -hex 16
ENCRYPTION_KEY=TU_KEY_32_CARACTERES_HEX

# Uploads
MAX_VIDEO_SIZE=50000000
UPLOAD_DIR=./uploads

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

**Resultado esperado:**
- Archivo .env completo
- Todas las credenciales configuradas
- Secrets generados

---

#### ✅ Tarea 2.3: Instalar dependencias (30 min)

**Pasos detallados:**
```bash
# 1. Backend
cd backend
npm install

# Verificar instalación
npm list sqlite3
npm list axios
npm list sequelize

# 2. Frontend (opcional para pruebas)
cd ../frontend
npm install

# 3. Volver a raíz
cd ..
```

**Si hay errores:**
```bash
# Limpiar caché
npm cache clean --force

# Reinstalar
rm -rf node_modules package-lock.json
npm install
```

**Resultado esperado:**
- node_modules/ creado
- Todas las dependencias instaladas
- Sin errores de compilación

---

#### ✅ Tarea 2.4: Verificar Docker (15 min)

**Pasos detallados:**
```bash
# 1. Verificar Docker instalado
docker --version
docker-compose --version

# 2. Si no está instalado (Ubuntu/Debian):
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
rm get-docker.sh

# 3. Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 4. Verificar
docker-compose --version
```

**Resultado esperado:**
- Docker instalado y funcionando
- Docker Compose instalado
- Usuario puede ejecutar docker sin sudo

---

### Día 3 (Miércoles): Primera Ejecución Local - 2 horas

#### ✅ Tarea 3.1: Iniciar base de datos SQLite (20 min)

**Pasos detallados:**
```bash
cd backend

# 1. Crear directorio para datos
mkdir -p data

# 2. Ejecutar migraciones
npm run migrate

# Responder 'yes' cuando pregunte

# 3. Verificar que se creó la base de datos
ls -lh data/personalitymatch.db

# 4. Verificar tablas
sqlite3 data/personalitymatch.db ".tables"

# Deberías ver:
# matches  messages  payments  profiles  users
```

**Resultado esperado:**
- Base de datos SQLite creada
- Tablas inicializadas
- Esquema correcto

---

#### ✅ Tarea 3.2: Iniciar backend en desarrollo (30 min)

**Pasos detallados:**
```bash
cd backend

# 1. Iniciar en modo desarrollo
npm run dev

# Deberías ver:
# ✓ Database connection established
# 📁 Using SQLite database (Cost-Optimized Mode)
# ✓ Socket.io chat service initialized
# ✓ Server is running
# Server: http://0.0.0.0:3001

# 2. En otra terminal, probar health check
curl http://localhost:3001/health

# Respuesta esperada:
# {
#   "status": "ok",
#   "timestamp": "2025-12-01T...",
#   "uptime": 5.123,
#   "environment": "development"
# }
```

**Si hay errores:**
```bash
# Error: Cannot find module 'sqlite3'
npm install sqlite3 --build-from-source

# Error: Port 3001 in use
lsof -ti:3001 | xargs kill -9

# Error: Permission denied (uploads folder)
mkdir -p uploads
chmod 755 uploads
```

**Resultado esperado:**
- Backend corriendo en http://localhost:3001
- Health check responde OK
- Sin errores en logs

---

#### ✅ Tarea 3.3: Probar endpoints básicos (40 min)

**Pasos detallados:**

**1. Probar configuración Wompi:**
```bash
curl http://localhost:3001/api/payments/wompi/config
```

Respuesta esperada:
```json
{
  "public_key": "pub_test_xxxxx",
  "currency": "COP",
  "environment": "sandbox",
  "unlock_price_usd": 1.00,
  "exchange_rate": 4000
}
```

**2. Probar acceptance token:**
```bash
curl http://localhost:3001/api/payments/wompi/acceptance-token
```

Respuesta esperada:
```json
{
  "acceptance_token": "eyJhbGc...",
  "permalink": "https://wompi.co/...",
  "message": "User must accept terms before payment"
}
```

**3. Probar métodos de pago:**
```bash
curl http://localhost:3001/api/payments/wompi/methods
```

**4. Verificar Google OAuth:**
```bash
# Abrir en navegador:
http://localhost:3001/api/auth/google

# Debería redirigir a Google login
```

**Resultado esperado:**
- Todos los endpoints responden
- Wompi está conectado
- Google OAuth funciona

---

#### ✅ Tarea 3.4: Crear usuario de prueba (30 min)

**Pasos detallados:**

**Usando curl:**
```bash
# 1. Registrar usuario
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@personalitymatch.com",
    "password": "Test123456!",
    "age": 25,
    "gender": "male"
  }'

# Respuesta esperada:
# {
#   "message": "User registered successfully. Please verify OTP sent to your email.",
#   "user_id": "uuid-aqui",
#   "email": "test@personalitymatch.com",
#   "requires_otp": true
# }

# 2. Revisar logs del backend para ver el OTP
# (en desarrollo, el OTP se imprime en consola)

# 3. Verificar OTP
curl -X POST http://localhost:3001/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "uuid-del-paso-anterior",
    "otp": "123456"
  }'

# Respuesta esperada:
# {
#   "message": "Login successful",
#   "token": "eyJhbGc...",
#   "user": { ... }
# }

# 4. Guardar el token para usar después
export TOKEN="eyJhbGc..."
```

**Resultado esperado:**
- Usuario creado en SQLite
- OTP recibido (en logs o email)
- Token JWT obtenido
- Usuario puede autenticarse

---

### Día 4 (Jueves): Testing de Pagos Wompi - 2 horas

#### ✅ Tarea 4.1: Preparar datos de prueba (20 min)

**Crear archivo `test-payment.json`:**
```json
{
  "match_id": "11111111-1111-1111-1111-111111111111",
  "payment_method": {
    "type": "CARD",
    "token": "tok_test_12345"
  },
  "acceptance_token": "token_from_wompi",
  "phone_number": "+573001234567"
}
```

**Preparar match de prueba:**
```bash
# 1. Insertar match directamente en SQLite
sqlite3 backend/data/personalitymatch.db

# 2. En SQLite shell:
INSERT INTO matches (
  match_id,
  viewer_user_id,
  matched_user_id,
  similarity_score,
  status,
  is_unlocked
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  'tu-user-id-aqui',
  '22222222-2222-2222-2222-222222222222',
  0.85,
  'shown',
  0
);

# 3. Salir
.quit
```

**Resultado esperado:**
- Datos de prueba preparados
- Match creado en base de datos

---

#### ✅ Tarea 4.2: Probar pago con tarjeta de prueba (40 min)

**Pasos detallados:**

**1. Obtener acceptance token:**
```bash
curl http://localhost:3001/api/payments/wompi/acceptance-token
```

**2. Crear payment link (método fácil):**
```bash
curl -X POST http://localhost:3001/api/payments/wompi/create-link \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "match_id": "11111111-1111-1111-1111-111111111111"
  }'

# Respuesta:
# {
#   "payment_id": "uuid",
#   "payment_link": "https://checkout.wompi.co/l/xxxxx",
#   "reference": "PM-xxxxx-xxxxx-1234567890",
#   "amount_in_cents": 400000,
#   "currency": "COP"
# }
```

**3. Abrir payment_link en navegador**

**4. Usar tarjeta de prueba:**
```
Número: 4242 4242 4242 4242
CVV: 123
Expiry: 12/25
Nombre: Test User
```

**5. Completar pago**

**6. Verificar en backend logs:**
```bash
# Deberías ver:
# Wompi webhook received: transaction.updated
# Payment succeeded: uuid
```

**7. Verificar que el match se desbloqueó:**
```bash
curl -X GET "http://localhost:3001/api/matches/11111111-1111-1111-1111-111111111111" \
  -H "Authorization: Bearer $TOKEN"

# Verificar:
# "is_unlocked": true
# "chat_enabled": true
```

**Resultado esperado:**
- Pago procesado exitosamente
- Webhook recibido
- Match desbloqueado
- Chat habilitado

---

#### ✅ Tarea 4.3: Probar otros métodos de pago (30 min)

**Método Nequi (simulado):**
```bash
curl -X POST http://localhost:3001/api/payments/wompi/create-transaction \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "match_id": "nuevo-match-id",
    "payment_method": {
      "type": "NEQUI",
      "phone_number": "+573001234567"
    },
    "acceptance_token": "token_aqui"
  }'
```

**Método PSE (simulado):**
```bash
curl -X POST http://localhost:3001/api/payments/wompi/create-transaction \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "match_id": "nuevo-match-id",
    "payment_method": {
      "type": "PSE",
      "user_type": 0,
      "user_legal_id_type": "CC",
      "user_legal_id": "123456789",
      "financial_institution_code": "1234",
      "payment_description": "Test payment"
    },
    "acceptance_token": "token_aqui"
  }'
```

**Resultado esperado:**
- Todos los métodos de pago funcionan
- Transacciones se crean correctamente
- Webhooks recibidos

---

#### ✅ Tarea 4.4: Documentar resultados (30 min)

**Crear archivo `TESTING_LOG.md`:**
```markdown
# Log de Testing - PersonalityMatch

## Fecha: [Tu fecha]

### Pruebas Realizadas

#### ✅ Registro y Autenticación
- [x] Registro con email/password
- [x] OTP recibido y verificado
- [x] Token JWT obtenido
- [x] Google OAuth funcionando

#### ✅ Pagos Wompi
- [x] Tarjeta Visa aprobada
- [x] Webhook recibido
- [x] Match desbloqueado
- [x] Payment link funcional

#### ✅ Base de Datos
- [x] SQLite funcionando
- [x] Migraciones ejecutadas
- [x] Datos persistiendo

### Problemas Encontrados
[Listar cualquier problema]

### Notas
[Cualquier observación importante]
```

**Resultado esperado:**
- Documentación de pruebas
- Problemas identificados
- Notas para siguiente fase

---

### Día 5 (Viernes): Docker y Deployment Prep - 2 horas

#### ✅ Tarea 5.1: Probar Docker Compose local (45 min)

**Pasos detallados:**
```bash
# 1. Detener backend manual
# Ctrl+C en terminal del backend

# 2. Iniciar con Docker Compose
docker-compose -f docker-compose.cost-optimized.yml up -d

# 3. Ver logs
docker-compose logs -f backend

# 4. Verificar servicios
docker-compose ps

# Deberías ver:
# backend   running   0.0.0.0:3001->3001/tcp
# redis     running

# 5. Probar health check
curl http://localhost:3001/health

# 6. Ver logs en tiempo real
docker-compose logs -f
```

**Troubleshooting común:**
```bash
# Si hay error de permisos en volúmenes:
sudo chown -R $USER:$USER backend/data
sudo chown -R $USER:$USER backend/uploads

# Si el puerto está ocupado:
docker-compose down
lsof -ti:3001 | xargs kill -9
docker-compose up -d

# Ver uso de recursos:
docker stats
```

**Resultado esperado:**
- Docker Compose funcionando
- Backend en contenedor
- Redis conectado
- SQLite persistente en volumen

---

#### ✅ Tarea 5.2: Configurar backup automático (45 min)

**Crear script de backup:**
```bash
# 1. Crear directorio
mkdir -p backend/scripts

# 2. Crear script
nano backend/scripts/backup.sh
```

**Contenido del script:**
```bash
#!/bin/bash
###############################################################################
# Backup Script para SQLite
# Ejecuta backup diario a Backblaze B2
###############################################################################

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/personalitymatch/backups"
DB_PATH="/opt/personalitymatch/backend/data/personalitymatch.db"
BACKUP_FILE="$BACKUP_DIR/pm_backup_$DATE.db"

# Crear directorio si no existe
mkdir -p $BACKUP_DIR

# Backup de SQLite
echo "Creating backup: $BACKUP_FILE"
sqlite3 $DB_PATH ".backup '$BACKUP_FILE'"

# Comprimir
gzip $BACKUP_FILE

# Eliminar backups locales > 7 días
find $BACKUP_DIR -name "*.db.gz" -mtime +7 -delete

# TODO: Subir a Backblaze B2 (cuando se configure)
# b2 sync $BACKUP_DIR b2://personalitymatch-backups/

echo "Backup completed: $BACKUP_FILE.gz"
```

**Hacer ejecutable:**
```bash
chmod +x backend/scripts/backup.sh
```

**Probar backup:**
```bash
# Crear directorio temporal
mkdir -p backend/backups

# Ejecutar backup (ajustar rutas para local)
DB_PATH="backend/data/personalitymatch.db"
BACKUP_DIR="backend/backups"
BACKUP_FILE="$BACKUP_DIR/test_backup_$(date +%Y%m%d).db"

sqlite3 $DB_PATH ".backup '$BACKUP_FILE'"

# Verificar
ls -lh backend/backups/
```

**Resultado esperado:**
- Script de backup creado
- Backup manual funciona
- Archivo comprimido correctamente

---

#### ✅ Tarea 5.3: Preparar deployment checklist (30 min)

**Crear archivo `DEPLOYMENT_CHECKLIST.md`:**
```markdown
# Checklist de Deployment - PersonalityMatch Cost-Optimized

## Pre-Deployment

### Cuentas y Credenciales
- [ ] Cuenta Wompi verificada (modo producción activado)
- [ ] Cuenta Brevo activa
- [ ] Google OAuth configurado (prod redirect URLs)
- [ ] Dominio comprado y DNS configurado

### VPS
- [ ] VPS contratado (Hetzner CPX11 o similar)
- [ ] IP pública asignada
- [ ] SSH key configurado
- [ ] Firewall configurado (UFW)

### Código
- [ ] Branch cost-optimized actualizado
- [ ] .env configurado para producción
- [ ] Variables sensibles en secretos (no en .env)
- [ ] Tests pasando

## Durante Deployment

### Paso 1: Configurar VPS
```bash
./backend/deploy-vps.sh <vps-ip> <dominio>
```

- [ ] Script ejecutado sin errores
- [ ] Docker instalado
- [ ] NGINX configurado
- [ ] UFW activo
- [ ] Fail2ban instalado

### Paso 2: Configurar .env en VPS
```bash
ssh root@<vps-ip>
nano /opt/personalitymatch/backend/.env
```

- [ ] Todas las variables configuradas
- [ ] Wompi en modo production
- [ ] FRONTEND_URL correcto
- [ ] JWT_SECRET único y fuerte
- [ ] ENCRYPTION_KEY único

### Paso 3: Iniciar Aplicación
```bash
systemctl start personalitymatch
systemctl status personalitymatch
```

- [ ] Servicio iniciado
- [ ] Sin errores en logs
- [ ] Health check OK

### Paso 4: Configurar SSL
```bash
certbot --nginx -d api.tudominio.com
```

- [ ] Certificado SSL instalado
- [ ] HTTPS funcionando
- [ ] Redirect HTTP → HTTPS activo

### Paso 5: Configurar Webhooks
- [ ] Webhook Wompi configurado:
      URL: https://api.tudominio.com/api/payments/wompi/webhook
- [ ] Webhook probado y funcionando

## Post-Deployment

### Verificaciones
- [ ] Health check: https://api.tudominio.com/health
- [ ] Registro de usuario funciona
- [ ] Login con Google funciona
- [ ] Pago de prueba exitoso
- [ ] Webhook recibido correctamente
- [ ] Chat funciona

### Monitoreo
- [ ] UptimeRobot configurado
- [ ] Alertas por email configuradas
- [ ] Logs revisados sin errores

### Backups
- [ ] Cron job de backup configurado
- [ ] Primer backup ejecutado
- [ ] Backup restaurable verificado

### Documentación
- [ ] README actualizado con URL de producción
- [ ] Credenciales guardadas en lugar seguro
- [ ] Proceso de deployment documentado
```

**Resultado esperado:**
- Checklist completo
- Listo para deployment
- Todos los pasos claros

---

## 📅 Semana 2: VPS Setup y Deployment (10 horas)

### Día 6 (Lunes): Contratar y Configurar VPS - 2 horas

#### ✅ Tarea 6.1: Contratar VPS Hetzner (30 min)

**Pasos detallados:**
1. Ir a https://www.hetzner.com/cloud
2. Click "Sign Up"
3. Crear cuenta
4. Verificar email
5. Agregar método de pago
6. Crear nuevo proyecto "PersonalityMatch"
7. Click "Add Server"
8. Seleccionar:
   - Location: Nuremberg, Germany (o más cercano)
   - Image: Ubuntu 22.04
   - Type: CPX11 (2 vCPU, 4GB RAM)
   - Networking: IPv4 + IPv6
   - SSH Key: Agregar tu clave pública
   - Name: personalitymatch-prod
9. Click "Create & Buy now"
10. Copiar IP pública asignada

**Alternativa DigitalOcean:**
1. Ir a https://www.digitalocean.com/
2. Crear Droplet
3. $6/month Basic plan
4. Ubuntu 22.04
5. Regular Intel (2 vCPU, 2GB RAM)

**Resultado esperado:**
- VPS creado y running
- IP pública asignada
- SSH access configurado

---

#### ✅ Tarea 6.2: Configurar dominio (30 min)

**Opción A: Comprar dominio nuevo**
1. Ir a https://www.namecheap.com/
2. Buscar dominio disponible
3. Comprar dominio .com (~$10/año)
4. Configurar DNS:
   - Type: A
   - Host: api
   - Value: <IP-de-tu-VPS>
   - TTL: 300

**Opción B: Usar subdominio existente**
1. Ir a tu proveedor DNS
2. Agregar registro A:
   ```
   api.tudominio.com → <IP-VPS>
   ```

**Verificar DNS:**
```bash
# Esperar 5-10 minutos
nslookup api.tudominio.com

# Debería resolver a tu IP VPS
```

**Resultado esperado:**
- Dominio configurado
- DNS apuntando a VPS
- Resolución funcionando

---

#### ✅ Tarea 6.3: Ejecutar script de deployment (40 min)

**Pasos detallados:**
```bash
# 1. Desde tu máquina local
cd backend

# 2. Asegurar permisos
chmod +x deploy-vps.sh

# 3. Ejecutar deployment
./deploy-vps.sh <tu-vps-ip> api.tudominio.com

# Ejemplo:
# ./deploy-vps.sh 159.69.123.45 api.personalitymatch.com

# 4. El script va a:
# - Instalar Docker
# - Instalar NGINX
# - Configurar firewall
# - Instalar Certbot
# - Copiar archivos
# - Configurar systemd

# 5. Al final verás:
# ✓ VPS initial setup complete
# ✓ Application files copied
# ✓ Setup complete!
```

**Si hay errores SSH:**
```bash
# Verificar SSH
ssh root@<vps-ip>

# Si falla, agregar key:
ssh-copy-id root@<vps-ip>
```

**Resultado esperado:**
- Script ejecutado exitosamente
- VPS configurado
- Aplicación copiada
- Servicios instalados

---

#### ✅ Tarea 6.4: Configurar .env en VPS (20 min)

**Pasos detallados:**
```bash
# 1. SSH al VPS
ssh root@<vps-ip>

# 2. Ir al directorio
cd /opt/personalitymatch/backend

# 3. Crear .env
nano .env

# 4. Copiar contenido de tu .env local
# IMPORTANTE: Cambiar a producción:
# - NODE_ENV=production
# - WOMPI_ENVIRONMENT=production
# - FRONTEND_URL=https://tudominio.com
# - Usar credenciales de producción

# 5. Guardar (Ctrl+X, Y, Enter)

# 6. Verificar permisos
chmod 600 .env
ls -la .env

# 7. Verificar contenido (sin mostrar secrets)
cat .env | grep -v "SECRET\|KEY\|PASSWORD"
```

**Resultado esperado:**
- .env configurado en VPS
- Variables de producción
- Permisos correctos

---

### Día 7 (Martes): Iniciar Producción - 2 horas

#### ✅ Tarea 7.1: Iniciar aplicación (30 min)

**En VPS:**
```bash
# 1. Iniciar servicio
systemctl start personalitymatch

# 2. Ver status
systemctl status personalitymatch

# Debería mostrar:
# Active: active (running)

# 3. Ver logs
tail -f /opt/personalitymatch/logs/app.log

# 4. Probar health check
curl http://localhost:3001/health

# Debería responder OK
```

**Si hay errores:**
```bash
# Ver logs completos
journalctl -u personalitymatch -f

# Reiniciar servicio
systemctl restart personalitymatch

# Ver procesos
ps aux | grep node
```

**Resultado esperado:**
- Aplicación corriendo
- Health check OK
- Sin errores en logs

---

#### ✅ Tarea 7.2: Configurar SSL (Let's Encrypt) (40 min)

**En VPS:**
```bash
# 1. Ejecutar Certbot
certbot --nginx -d api.tudominio.com

# 2. Responder preguntas:
# Email: tu_email@example.com
# Terms: Agree (A)
# Redirect HTTP → HTTPS: Yes (2)

# 3. Verificar certificado
certbot certificates

# 4. Probar HTTPS
curl https://api.tudominio.com/health

# 5. Habilitar auto-renewal
systemctl enable certbot.timer
systemctl start certbot.timer
```

**Verificar renovación automática:**
```bash
# Dry run
certbot renew --dry-run

# Debería ver: "Congratulations, all simulated renewals succeeded"
```

**Resultado esperado:**
- SSL certificado instalado
- HTTPS funcionando
- Auto-renewal configurado
- Redirect HTTP → HTTPS activo

---

#### ✅ Tarea 7.3: Configurar webhook Wompi (30 min)

**Pasos:**
1. Login en https://comercios.wompi.co/
2. Ir a **Settings** → **Webhooks**
3. Agregar nuevo webhook:
   - URL: `https://api.tudominio.com/api/payments/wompi/webhook`
   - Events: `transaction.updated`
   - Active: Yes
4. Guardar

**Probar webhook:**
```bash
# En VPS, ver logs
tail -f /opt/personalitymatch/logs/app.log

# En Wompi dashboard, usar "Test Webhook"
```

**Resultado esperado:**
- Webhook configurado
- URL pública accesible
- Test webhook recibido en logs

---

#### ✅ Tarea 7.4: Primera prueba end-to-end (20 min)

**Desde tu máquina:**
```bash
# 1. Registrar usuario
curl -X POST https://api.tudominio.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "prod-test@example.com",
    "password": "Test123456!",
    "age": 25
  }'

# 2. Verificar OTP (revisar email Brevo)

# 3. Login
curl -X POST https://api.tudominio.com/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "uuid-del-registro",
    "otp": "codigo-del-email"
  }'

# 4. Verificar Wompi config
curl https://api.tudominio.com/api/payments/wompi/config
```

**Resultado esperado:**
- Registro funcionando
- Email OTP llegando
- Login exitoso
- Wompi conectado

---

### Día 8 (Miércoles): Monitoreo y Backups - 2 horas

#### ✅ Tarea 8.1: Configurar UptimeRobot (30 min)

**Pasos:**
1. Ir a https://uptimerobot.com/
2. Sign Up (gratis)
3. Verificar email
4. Click "Add New Monitor"
5. Configurar:
   - Monitor Type: HTTPS
   - Friendly Name: PersonalityMatch API
   - URL: `https://api.tudominio.com/health`
   - Monitoring Interval: 5 minutes
6. Alert Contacts:
   - Email: tu_email
7. Save Monitor

**Crear segundo monitor:**
- URL: `https://api.tudominio.com/api/payments/wompi/config`
- Name: Wompi Integration

**Resultado esperado:**
- 2 monitores activos
- Alertas por email configuradas
- Dashboard funcionando

---

#### ✅ Tarea 8.2: Configurar backup automático (45 min)

**En VPS:**
```bash
# 1. Copiar script de backup
nano /opt/personalitymatch/scripts/backup.sh

# (Pegar contenido del script del Día 5)

# 2. Hacer ejecutable
chmod +x /opt/personalitymatch/scripts/backup.sh

# 3. Probar backup manual
/opt/personalitymatch/scripts/backup.sh

# Verificar
ls -lh /opt/personalitymatch/backups/

# 4. Configurar cron job
crontab -e

# Agregar línea:
0 3 * * * /opt/personalitymatch/scripts/backup.sh >> /opt/personalitymatch/logs/backup.log 2>&1

# Guardar y salir

# 5. Verificar cron
crontab -l
```

**Probar restauración:**
```bash
# 1. Listar backups
ls -lh /opt/personalitymatch/backups/

# 2. Restaurar último backup
LATEST_BACKUP=$(ls -t /opt/personalitymatch/backups/*.db.gz | head -1)
gunzip -c $LATEST_BACKUP > /tmp/restored.db

# 3. Verificar integridad
sqlite3 /tmp/restored.db "PRAGMA integrity_check;"

# Debería devolver: "ok"

# 4. Limpiar
rm /tmp/restored.db
```

**Resultado esperado:**
- Script de backup funcionando
- Cron job configurado
- Backup diario a las 3 AM
- Restauración verificada

---

#### ✅ Tarea 8.3: Configurar log rotation (20 min)

**En VPS:**
```bash
# 1. Crear configuración logrotate
nano /etc/logrotate.d/personalitymatch
```

**Contenido:**
```
/opt/personalitymatch/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 root root
    sharedscripts
    postrotate
        systemctl reload personalitymatch > /dev/null 2>&1 || true
    endscript
}
```

**Probar:**
```bash
# Test logrotate
logrotate -d /etc/logrotate.d/personalitymatch

# Forzar rotación (test)
logrotate -f /etc/logrotate.d/personalitymatch

# Verificar
ls -lh /opt/personalitymatch/logs/
```

**Resultado esperado:**
- Logrotate configurado
- Logs rotan diariamente
- Compresión automática
- 14 días de retención

---

#### ✅ Tarea 8.4: Documentar URLs y accesos (25 min)

**Crear `PRODUCTION_INFO.md`:**
```markdown
# PersonalityMatch - Información de Producción

## URLs

### Backend API
- **URL**: https://api.tudominio.com
- **Health Check**: https://api.tudominio.com/health
- **Wompi Config**: https://api.tudominio.com/api/payments/wompi/config

### Frontend (cuando se despliegue)
- **URL**: https://tudominio.com

## VPS

- **Provider**: Hetzner Cloud
- **Plan**: CPX11 (2 vCPU, 4GB RAM)
- **IP**: <tu-ip>
- **OS**: Ubuntu 22.04 LTS
- **SSH**: `ssh root@<tu-ip>`

## Servicios

### Base de Datos
- **Tipo**: SQLite
- **Ubicación**: `/opt/personalitymatch/backend/data/personalitymatch.db`
- **Backups**: `/opt/personalitymatch/backups/`
- **Cron**: Diario 3:00 AM

### Application
- **Servicio**: systemd (personalitymatch.service)
- **Logs**: `/opt/personalitymatch/logs/`
- **Start**: `systemctl start personalitymatch`
- **Stop**: `systemctl stop personalitymatch`
- **Restart**: `systemctl restart personalitymatch`
- **Status**: `systemctl status personalitymatch`

### NGINX
- **Config**: `/etc/nginx/sites-available/personalitymatch`
- **SSL**: Let's Encrypt (auto-renew)
- **Logs**: `/var/log/nginx/`

## Monitoreo

### UptimeRobot
- **Dashboard**: https://uptimerobot.com/dashboard
- **Monitors**: 2 activos
- **Alertas**: Email a <tu-email>

## Credenciales

### Wompi
- **Environment**: production
- **Dashboard**: https://comercios.wompi.co/

### Brevo
- **Dashboard**: https://app.brevo.com/

### Google OAuth
- **Console**: https://console.cloud.google.com/

### Hetzner
- **Panel**: https://console.hetzner.cloud/

## Comandos Útiles

### Ver logs en tiempo real
```bash
tail -f /opt/personalitymatch/logs/app.log
```

### Ver estado del servicio
```bash
systemctl status personalitymatch
```

### Reiniciar aplicación
```bash
systemctl restart personalitymatch
```

### Ver uso de recursos
```bash
htop
df -h
free -h
```

### Backup manual
```bash
/opt/personalitymatch/scripts/backup.sh
```

### Ver últimos backups
```bash
ls -lht /opt/personalitymatch/backups/ | head -5
```

## Costos Mensuales

- VPS Hetzner: €4.49 (~$5.00 USD)
- Dominio: ~$1.00 USD
- Backup B2: ~$0.50 USD
- Wompi fees: ~$12.00 USD (100 transacciones)
- **Total**: ~$18.50 USD/mes

## Soporte

- **Email**: tu_email@example.com
- **Documentación**: ./docs/
- **Issues**: GitHub Issues
```

**Resultado esperado:**
- Documentación completa
- Todos los accesos registrados
- Comandos útiles documentados

---

### Día 9 (Jueves): Testing en Producción - 2 horas

#### ✅ Tarea 9.1: Smoke tests completos (60 min)

**Test Suite Completo:**

```bash
# Crear archivo test-production.sh
nano test-production.sh
```

**Contenido:**
```bash
#!/bin/bash

API_URL="https://api.tudominio.com"
COLOR_GREEN='\033[0;32m'
COLOR_RED='\033[0;31m'
NC='\033[0m'

echo "======================================"
echo "PersonalityMatch Production Tests"
echo "======================================"
echo ""

# Test 1: Health Check
echo "Test 1: Health Check"
HEALTH=$(curl -s $API_URL/health | jq -r '.status')
if [ "$HEALTH" = "ok" ]; then
    echo -e "${COLOR_GREEN}✓ PASSED${NC}"
else
    echo -e "${COLOR_RED}✗ FAILED${NC}"
fi
echo ""

# Test 2: Wompi Config
echo "Test 2: Wompi Configuration"
WOMPI=$(curl -s $API_URL/api/payments/wompi/config | jq -r '.public_key')
if [ ! -z "$WOMPI" ]; then
    echo -e "${COLOR_GREEN}✓ PASSED${NC}"
else
    echo -e "${COLOR_RED}✗ FAILED${NC}"
fi
echo ""

# Test 3: Acceptance Token
echo "Test 3: Wompi Acceptance Token"
TOKEN=$(curl -s $API_URL/api/payments/wompi/acceptance-token | jq -r '.acceptance_token')
if [ ! -z "$TOKEN" ]; then
    echo -e "${COLOR_GREEN}✓ PASSED${NC}"
else
    echo -e "${COLOR_RED}✗ FAILED${NC}"
fi
echo ""

# Test 4: Payment Methods
echo "Test 4: Payment Methods Available"
METHODS=$(curl -s $API_URL/api/payments/wompi/methods | jq -r '.available_methods[0]')
if [ ! -z "$METHODS" ]; then
    echo -e "${COLOR_GREEN}✓ PASSED${NC}"
else
    echo -e "${COLOR_RED}✗ FAILED${NC}"
fi
echo ""

# Test 5: Google OAuth
echo "Test 5: Google OAuth Redirect"
OAUTH=$(curl -sI $API_URL/api/auth/google | grep "Location" | grep "google")
if [ ! -z "$OAUTH" ]; then
    echo -e "${COLOR_GREEN}✓ PASSED${NC}"
else
    echo -e "${COLOR_RED}✗ FAILED${NC}"
fi
echo ""

echo "======================================"
echo "Tests completed"
echo "======================================"
```

**Ejecutar tests:**
```bash
chmod +x test-production.sh
./test-production.sh
```

**Test manual de registro:**
```bash
# Registrar usuario real
curl -X POST $API_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "real-test@example.com",
    "password": "SecurePass123!",
    "age": 28
  }'

# Revisar email para OTP
# Verificar OTP
# Hacer login completo
```

**Resultado esperado:**
- Todos los tests pasan
- Registro funcionando
- Email OTP llegando
- Sin errores

---

#### ✅ Tarea 9.2: Test de pago real (40 min)

**Importante**: Usar tarjeta de prueba, no real

**Pasos:**
1. Registrar usuario de prueba
2. Obtener token JWT
3. Crear payment link:
```bash
curl -X POST $API_URL/api/payments/wompi/create-link \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"match_id": "test-match-id"}'
```
4. Abrir payment_link en navegador
5. Usar tarjeta de prueba Wompi:
   - Número: 4242 4242 4242 4242
   - CVV: 123
   - Fecha: Cualquier futura
6. Completar pago
7. Verificar webhook en logs:
```bash
ssh root@<vps-ip>
tail -f /opt/personalitymatch/logs/app.log | grep wompi
```

**Verificar transacción:**
```bash
curl -X GET "$API_URL/api/payments/wompi/transaction/<transaction-id>" \
  -H "Authorization: Bearer $TOKEN"
```

**Resultado esperado:**
- Pago procesado
- Webhook recibido
- Transacción guardada
- Estado APPROVED

---

#### ✅ Tarea 9.3: Documentar issues y fixes (20 min)

**Crear `PRODUCTION_ISSUES.md`:**
```markdown
# Issues Encontrados en Producción

## Issue #1: [Título]
**Fecha**: [fecha]
**Severidad**: Alta/Media/Baja
**Descripción**:
[Descripción del problema]

**Reproducción**:
1. Paso 1
2. Paso 2
3. ...

**Fix**:
[Cómo se solucionó]

**Prevención**:
[Cómo prevenir en futuro]

---

[Repetir para cada issue]
```

**Resultado esperado:**
- Documentación de problemas
- Soluciones documentadas
- Lecciones aprendidas

---

### Día 10 (Viernes): Frontend y Optimización - 2 horas

#### ✅ Tarea 10.1: Desplegar frontend a Vercel (45 min)

**Preparar frontend:**
```bash
cd frontend

# 1. Actualizar configuración API
nano src/config.js
```

**Crear `src/config.js`:**
```javascript
export const API_URL = process.env.NODE_ENV === 'production'
  ? 'https://api.tudominio.com'
  : 'http://localhost:3001';

export const config = {
  apiUrl: API_URL,
  wompiPublicKey: 'pub_prod_xxxxx', // Tu key de producción
  googleOAuthClientId: 'tu-client-id.apps.googleusercontent.com'
};
```

**Desplegar a Vercel:**
```bash
# 1. Instalar Vercel CLI
npm install -g vercel

# 2. Login
vercel login

# 3. Deploy
vercel

# Responder preguntas:
# - Set up and deploy? Y
# - Which scope? [Tu cuenta]
# - Link to existing project? N
# - Project name? personalitymatch
# - Directory? ./
# - Override settings? N

# 4. Deploy a producción
vercel --prod

# Te dará una URL: https://personalitymatch-xxxxx.vercel.app
```

**Configurar dominio custom:**
```bash
# En Vercel dashboard:
# Settings → Domains → Add
# Dominio: tudominio.com
# Seguir instrucciones DNS
```

**Resultado esperado:**
- Frontend desplegado
- URL de Vercel funcionando
- API conectada
- Dominio custom (opcional)

---

#### ✅ Tarea 10.2: Optimizar rendimiento VPS (45 min)

**En VPS:**

**1. Configurar swap (memoria virtual):**
```bash
# Crear swap de 2GB
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile

# Hacer permanente
echo '/swapfile none swap sw 0 0' >> /etc/fstab

# Verificar
free -h
```

**2. Optimizar SQLite:**
```bash
# Conectar a DB
sqlite3 /opt/personalitymatch/backend/data/personalitymatch.db

# Ejecutar optimizaciones
PRAGMA optimize;
PRAGMA wal_checkpoint(TRUNCATE);
VACUUM;
ANALYZE;

# Salir
.quit
```

**3. Configurar límites del sistema:**
```bash
# Editar limits
nano /etc/security/limits.conf

# Agregar al final:
* soft nofile 65536
* hard nofile 65536
root soft nofile 65536
root hard nofile 65536
```

**4. Optimizar NGINX:**
```bash
nano /etc/nginx/nginx.conf

# Ajustar en sección http:
worker_processes auto;
worker_connections 1024;

# Agregar:
client_max_body_size 50M;
keepalive_timeout 65;
gzip on;
gzip_types text/plain text/css application/json application/javascript;
```

**Reiniciar servicios:**
```bash
systemctl restart nginx
systemctl restart personalitymatch
```

**Resultado esperado:**
- Swap configurado
- SQLite optimizado
- NGINX optimizado
- Mejor rendimiento

---

#### ✅ Tarea 10.3: Configurar monitoring avanzado (30 min)

**Instalar htop y iotop:**
```bash
apt-get install -y htop iotop
```

**Crear script de monitoring:**
```bash
nano /opt/personalitymatch/scripts/monitor.sh
```

**Contenido:**
```bash
#!/bin/bash

echo "===================="
echo "System Monitor"
echo "===================="
date
echo ""

echo "=== CPU & Memory ==="
top -bn1 | head -5
echo ""

echo "=== Disk Usage ==="
df -h | grep -v tmpfs
echo ""

echo "=== Database Size ==="
du -sh /opt/personalitymatch/backend/data/
echo ""

echo "=== App Status ==="
systemctl status personalitymatch --no-pager | head -3
echo ""

echo "=== Recent Errors ==="
tail -20 /opt/personalitymatch/logs/error.log 2>/dev/null || echo "No errors"
echo ""
```

**Hacer ejecutable y ejecutar:**
```bash
chmod +x /opt/personalitymatch/scripts/monitor.sh
/opt/personalitymatch/scripts/monitor.sh
```

**Resultado esperado:**
- Herramientas de monitoring instaladas
- Script de monitoring funcional
- Métricas visibles

---

## 📅 Semana 3: Optimización y Mantenimiento (10 horas)

### Día 11-15: Tareas de Mantenimiento Continuo

#### Día 11: Monitoreo y Ajustes (2 horas)
- Revisar logs diarios
- Analizar métricas de UptimeRobot
- Optimizar queries lentas
- Ajustar configuración según carga

#### Día 12: Documentación de Usuario (2 horas)
- Crear guía de usuario final
- Documentar flujos de pago
- Screenshots del proceso
- FAQ para usuarios

#### Día 13: Testing de Carga (2 horas)
- Instalar herramientas (Apache Bench, wrk)
- Hacer load testing
- Identificar cuellos de botella
- Documentar resultados

#### Día 14: Seguridad Adicional (2 horas)
- Configurar fail2ban avanzado
- Revisar logs de seguridad
- Actualizar dependencias
- Escaneo de vulnerabilidades

#### Día 15: Plan de Escalamiento (2 horas)
- Documentar cuándo escalar
- Plan de migración a PostgreSQL
- Plan de multi-servidor
- Estrategia de caché

---

## 📊 Resumen del Plan

### Tiempo Total por Semana

**Semana 1**: 10 horas
- Setup cuentas: 2h
- Config local: 2h
- Primera ejecución: 2h
- Testing pagos: 2h
- Docker prep: 2h

**Semana 2**: 10 horas
- VPS setup: 2h
- Deployment: 2h
- Monitoreo: 2h
- Testing prod: 2h
- Frontend: 2h

**Semana 3**: 10 horas
- Mantenimiento: 10h

**Total**: ~30 horas = 15 días @ 2h/día

---

## ✅ Checklist General de Progreso

### Semana 1: Preparación
- [ ] Cuenta Wompi creada
- [ ] Cuenta Brevo creada
- [ ] Google OAuth configurado
- [ ] Repo clonado y configurado
- [ ] .env configurado
- [ ] Dependencias instaladas
- [ ] Docker funcionando
- [ ] SQLite inicializado
- [ ] Backend corriendo localmente
- [ ] Tests básicos pasando
- [ ] Pago de prueba exitoso
- [ ] Docker Compose funcionando
- [ ] Backup script creado

### Semana 2: Deployment
- [ ] VPS contratado
- [ ] Dominio configurado
- [ ] Deploy script ejecutado
- [ ] .env configurado en VPS
- [ ] Aplicación iniciada
- [ ] SSL configurado
- [ ] Webhook Wompi configurado
- [ ] Test end-to-end exitoso
- [ ] UptimeRobot configurado
- [ ] Backup automático activo
- [ ] Log rotation configurado
- [ ] Smoke tests pasando
- [ ] Pago real de prueba exitoso
- [ ] Frontend desplegado
- [ ] VPS optimizado

### Semana 3: Optimización
- [ ] Monitoring activo
- [ ] Logs limpios
- [ ] Documentación completa
- [ ] Load testing realizado
- [ ] Seguridad reforzada
- [ ] Plan de escalamiento listo

---

## 🚨 Troubleshooting Rápido

### Backend no inicia
```bash
# Ver logs detallados
journalctl -u personalitymatch -f

# Verificar .env
cat /opt/personalitymatch/backend/.env | grep -v SECRET

# Verificar permisos
ls -la /opt/personalitymatch/backend/data/
chmod 755 /opt/personalitymatch/backend/data/
```

### Pago falla
```bash
# Verificar logs
tail -f /opt/personalitymatch/logs/app.log | grep wompi

# Test webhook manualmente
curl -X POST https://api.tudominio.com/api/payments/wompi/webhook \
  -H "Content-Type: application/json" \
  -d '{"event":"transaction.updated"}'
```

### SSL no funciona
```bash
# Renovar certificado
certbot renew --force-renewal

# Verificar NGINX
nginx -t
systemctl restart nginx
```

### Out of memory
```bash
# Ver memoria
free -h

# Reiniciar aplicación
systemctl restart personalitymatch

# Considerar upgrade VPS
```

---

## 📞 Contactos de Soporte

**Wompi**
- Email: soporte@wompi.co
- Tel: +57 1 508 8888

**Hetzner**
- Support: https://docs.hetzner.com/
- Email: support@hetzner.com

**Brevo**
- Support: https://help.brevo.com/

---

## 🎯 Objetivos de Éxito

Al completar este plan, tendrás:

✅ **Producción funcionando**
- API en HTTPS
- Pagos Wompi funcionando
- Frontend desplegado
- SSL configurado

✅ **Costos bajo control**
- $18.50/mes confirmado
- Monitoreo de gastos
- Sin sorpresas

✅ **Operación estable**
- Backups automáticos
- Monitoring activo
- Logs configurados
- Documentación completa

✅ **Preparado para escalar**
- Plan de crecimiento
- Métricas claras
- Proceso documentado

---

**¡Éxito con tu implementación!** 🚀

Si tienes preguntas o encuentras problemas, revisa:
- README.COST-OPTIMIZED.md
- docs/WOMPI_INTEGRATION.md
- DEPLOYMENT.md
