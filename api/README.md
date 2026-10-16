# api.77delta.com

Endpoint del formulario de contacto de 77delta.com. Node 22 sin framework, `nodemailer` para el SMTP.

- `POST /contacto` con JSON `{nombre, empresa, email, sector, mensaje, web}` (`web` es el honeypot, debe ir vacío).
- `POST /verifix` con JSON `{email, empresa, tipo (gestoria|empresa), idioma (es|en|ca), ya_me_ha_pasado, programa, web}`: lista de espera de Verifix. Si el email ya existe en Supabase (paso 2 de la landing), actualiza esa fila en vez de duplicarla. Guarda en `LEADS_FILE`, inserta en Supabase `verifix_lista_espera` (fallo blando, usa `HQ_SUPABASE_URL` y `HQ_SUPABASE_SERVICE`) y avisa a `MAIL_TO`. Límite propio de 5 envíos por IP cada 10 min. La IP se guarda solo como hash (`VERIFIX_IP_SALT`, opcional). Migración: `api/sql/verifix_lista_espera.sql`. Tests: `node --test api/verifix.test.mjs`.
- `GET /health` devuelve `{ok, smtp}`.
- Cada lead se guarda en `LEADS_FILE` y, si hay SMTP, se envía a `MAIL_TO` con `Reply-To` del remitente.

- `POST /docureal` con JSON `{email, empresa, tipo (agencia|administrador|aseguradora|otro), idioma (es|en|ca), candidaturas_mes, ya_me_paso, preferencia_precio, comentario, origen, web}`: demo de DocuReal. Calco de `/verifix`: upsert por email (el paso 2 reenvía con `comentario`), `LEADS_FILE`, Supabase `docureal_lista_espera` (fallo blando), correo a `MAIL_TO`, límite propio de 5 por IP cada 10 min, IP solo como hash. Migración: `api/sql/docureal_lista_espera.sql`. Tests: `node --test api/docureal.test.mjs`.

Variables: `SMTP_HOST`, `SMTP_PORT` (465), `SMTP_SECURE` (true), `SMTP_USER`, `SMTP_PASS`, `MAIL_TO`, `MAIL_FROM`, `CORS_ORIGINS` (si se define en Coolify, debe incluir `https://verifix.77delta.com` y `https://docureal.77delta.com`).
Desplegado con Coolify (VPS6) desde esta carpeta.

## Despliegue

Vive en Coolify (VPS6, proyecto «77delta», app `api-77delta`). El repo es público, así que Coolify lo clona sin llave.

- **Los pushes no despliegan solos.** Hay que lanzar el deploy: `GET /api/v1/deploy?uuid=<uuid de la app>&force=true` con el token de Coolify, o el botón Deploy en el panel.
- **SMTP por el puerto 587 con STARTTLS.** El 465 está bloqueado en salida en ese servidor, y con él el envío se queda colgado hasta agotar el tiempo.
- **El correo sale en segundo plano.** La respuesta al visitante no espera al SMTP: primero se guarda el lead, luego se envía.
- **`/data` no es un volumen persistente todavía.** Cada redeploy vacía `leads.jsonl`. El correo es el canal bueno; el fichero es solo respaldo. Para hacerlo persistente: en la app, Persistent Storage, volumen nuevo montado en `/data`.

Migración pendiente para Bernat (idioma `ca`): ejecutar en Supabase el bloque final de `api/sql/verifix_lista_espera.sql` (drop y add de `verifix_lista_espera_idioma_check`, idempotente) y redesplegar api-77delta. Hasta aplicarla, un alta con `ca` falla en Supabase (fallo blando, queda en `LEADS_FILE` y correo).
