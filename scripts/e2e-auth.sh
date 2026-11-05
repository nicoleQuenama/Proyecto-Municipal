#!/bin/sh
# Prueba de punta a punta del login y los usuarios contra el servidor de desarrollo (pnpm dev) y la base de datos (pnpm db:up + pnpm db:seed).
# Uso, desde la raíz del proyecto:  sh scripts/e2e-auth.sh
B=http://localhost:3000
H='-H x-portal-request:1 -H content-type:application/json'
PSQL="docker exec -i portal-db-postgres-1 psql -U postgres -d portal -At"
ok=0; bad=0
check() { # etiqueta, esperado, obtenido
  if [ "$2" = "$3" ]; then ok=$((ok+1)); echo "ok   $1 -> $3"; else bad=$((bad+1)); echo "FALLO $1: esperaba [$2] y llegó [$3]"; fi
}
code() { curl -s -o /dev/null -w "%{http_code}" "$@"; }
field() { sed -n "s/.*\"$1\":\"\([^\"]*\)\".*/\1/p"; }

rm -f /tmp/sa.jar /tmp/dv.jar /tmp/ds.jar
# Estado de partida: sin las cuentas de una corrida anterior y con dev disponible.
$PSQL -c "delete from app.users where email in ('ana@x.com','beto@x.com'); update app.users set deleted_at = null where email='dev@portal.dev'" >/dev/null

check "login con contraseña mala" 401 "$(code $H -X POST $B/api/auth/login -d '{"email":"superadmin@portal.dev","password":"mala"}')"
check "login con correo inexistente" 401 "$(code $H -X POST $B/api/auth/login -d '{"email":"nadie@x.com","password":"SuperAdmin2026!"}')"
check "login sin la cabecera del portal" 403 "$(code -X POST $B/api/auth/login -H content-type:application/json -d '{"email":"superadmin@portal.dev","password":"SuperAdmin2026!"}')"
check "login superadmin" 200 "$(code $H -c /tmp/sa.jar -X POST $B/api/auth/login -d '{"email":"SuperAdmin@Portal.dev","password":"SuperAdmin2026!"}')"
check "me del superadmin" superadmin "$(curl -s $H -b /tmp/sa.jar $B/api/auth/me | field role)"
check "me sin sesión" null "$(curl -s $H $B/api/auth/me | sed -n 's/.*"user":\(null\).*/\1/p')"

check "superadmin crea un diseñador" 201 "$(code $H -b /tmp/sa.jar -X POST $B/api/auth/users -d '{"name":"Ana Prueba","username":"ana","email":"ana@x.com","role":"designer","password":"Ana2026!x"}')"
check "correo repetido" 400 "$(code $H -b /tmp/sa.jar -X POST $B/api/auth/users -d '{"name":"Otra","username":"otra","email":"ANA@x.com","role":"designer","password":"Ana2026!x"}')"
check "usuario repetido" 400 "$(code $H -b /tmp/sa.jar -X POST $B/api/auth/users -d '{"name":"Otra","username":"ANA","email":"otra@x.com","role":"designer","password":"Ana2026!x"}')"
check "contraseña floja" 400 "$(code $H -b /tmp/sa.jar -X POST $B/api/auth/users -d '{"name":"Otra","username":"otra","email":"otra@x.com","role":"designer","password":"abc"}')"
ANA=$(curl -s $H -b /tmp/sa.jar $B/api/auth/users | sed 's/},{/}\n{/g' | grep '"ana@x.com"' | field id)
check "ana quedó guardada en la base de datos" 1 "$($PSQL -c "select count(*) from app.users where email='ana@x.com'")"
check "ana tiene fila de acceso" 1 "$($PSQL -c "select count(*) from app.project_members m join app.users u on u.id=m.user_id where u.email='ana@x.com'")"

check "ana inicia sesión" 200 "$(code $H -c /tmp/ds.jar -X POST $B/api/auth/login -d '{"email":"ana@x.com","password":"Ana2026!x"}')"
check "ana no puede crear un desarrollador" 403 "$(code $H -b /tmp/ds.jar -X POST $B/api/auth/users -d '{"name":"X","username":"xxx","email":"x@x.com","role":"dev","password":"Ana2026!x"}')"

check "superadmin pone vetos y vencimiento a ana" 200 "$(code $H -b /tmp/sa.jar -X PATCH $B/api/auth/users -d "{\"id\":\"$ANA\",\"access\":{\"scope\":null,\"denied\":[\"editCode\",\"deploy\"],\"expiresAt\":\"2099-01-01T00:00:00.000Z\"}}")"
check "los vetos están en la base de datos" "{editCode,deploy}" "$($PSQL -c "select m.denied from app.project_members m join app.users u on u.id=m.user_id where u.email='ana@x.com'")"
check "me de ana trae sus vetos" 2 "$(curl -s $H -b /tmp/ds.jar $B/api/auth/me | grep -o 'editCode\|deploy' | wc -l | tr -d ' ')"
check "asignar una página que existe" 200 "$(code $H -b /tmp/sa.jar -X PATCH $B/api/auth/users -d "{\"id\":\"$ANA\",\"access\":{\"scope\":{\"pageIds\":[\"inicio\"],\"blockIds\":[]},\"denied\":[],\"expiresAt\":null}}")"
check "el alcance quedó guardado en la base de datos" 1 "$($PSQL -c "select count(*) from app.member_scope_pages s join app.users u on u.id=s.user_id where u.email='ana@x.com' and s.page_id='inicio'")"
check "ana ve su alcance al entrar" 1 "$(curl -s $H -b /tmp/ds.jar $B/api/auth/me | grep -o '"pageIds":\["inicio"\]' | wc -l | tr -d ' ')"
check "asignar una página que no existe se rechaza" 400 "$(code $H -b /tmp/sa.jar -X PATCH $B/api/auth/users -d "{\"id\":\"$ANA\",\"access\":{\"scope\":{\"pageIds\":[\"no-existe\"],\"blockIds\":[]},\"denied\":[],\"expiresAt\":null}}")"
check "acceso vencido: ana no entra" 403 "$($PSQL -c "update app.project_members set expires_at = now() - interval '1 day' where user_id = '$ANA'" >/dev/null; code $H -X POST $B/api/auth/login -d '{"email":"ana@x.com","password":"Ana2026!x"}')"
$PSQL -c "update app.project_members set expires_at = null where user_id = '$ANA'" >/dev/null

check "ana cambia su contraseña" 200 "$(code $H -b /tmp/ds.jar -c /tmp/ds.jar -X POST $B/api/auth/change-password -d '{"currentPassword":"Ana2026!x","newPassword":"Nueva2026!ab"}')"
check "su sesión sigue viva (se renovó)" ana "$(curl -s $H -b /tmp/ds.jar $B/api/auth/me | field username)"
check "contraseña actual equivocada" 400 "$(code $H -b /tmp/ds.jar -X POST $B/api/auth/change-password -d '{"currentPassword":"mala","newPassword":"Otra2026!abc"}')"
check "la contraseña vieja ya no sirve" 401 "$(code $H -X POST $B/api/auth/login -d '{"email":"ana@x.com","password":"Ana2026!x"}')"
check "la nueva sí" 200 "$(code $H -c /tmp/dv.jar -X POST $B/api/auth/login -d '{"email":"ana@x.com","password":"Nueva2026!ab"}')"

# Una segunda sesión de ana se cierra cuando ella cambia la contraseña desde otra.
check "otra sesión de ana abierta" 200 "$(code $H -b /tmp/dv.jar $B/api/auth/me)"
curl -s $H -b /tmp/ds.jar -X POST $B/api/auth/change-password -c /tmp/ds.jar -d '{"currentPassword":"Nueva2026!ab","newPassword":"Final2026!abc"}' >/dev/null
check "la sesión anterior dejó de valer" null "$(curl -s $H -b /tmp/dv.jar $B/api/auth/me | sed -n 's/.*"user":\(null\).*/\1/p')"

# Restablecer contraseña con enlace (el correo no se envía sin RESEND_API_KEY: se emite el token directo en la base).
$PSQL -c "insert into app.password_reset_tokens (organization_id, user_id, token_hash, expires_at) select organization_id, id, sha256('token-de-prueba'::bytea), now() + interval '30 minutes' from app.users where email='ana@x.com'" >/dev/null
check "enlace de restablecimiento: contraseña floja" 400 "$(code $H -X POST $B/api/auth/confirm-reset -d '{"token":"token-de-prueba","password":"abc"}')"
check "enlace de restablecimiento válido" 200 "$(code $H -X POST $B/api/auth/confirm-reset -d '{"token":"token-de-prueba","password":"Restablecida2026!"}')"
check "el enlace no se reutiliza" 400 "$(code $H -X POST $B/api/auth/confirm-reset -d '{"token":"token-de-prueba","password":"Restablecida2026!"}')"
check "entra con la contraseña restablecida" 200 "$(code $H -X POST $B/api/auth/login -d '{"email":"ana@x.com","password":"Restablecida2026!"}')"
check "olvidé mi contraseña responde igual con datos falsos" 202 "$(code $H -X POST $B/api/auth/forgot-password -d '{"username":"nadie","email":"nadie@x.com"}')"
check "olvidé mi contraseña con datos reales" 202 "$(code $H -X POST $B/api/auth/forgot-password -d '{"username":"ana","email":"ana@x.com"}')"
check "…y dejó un enlace en la base de datos" 1 "$($PSQL -c "select count(*) from app.password_reset_tokens t join app.users u on u.id=t.user_id where u.email='ana@x.com' and t.used_at is null and t.expires_at > now()")"

# Quién gestiona a quién.
check "dev entra" 200 "$(code $H -c /tmp/dv.jar -X POST $B/api/auth/login -d '{"email":"dev@portal.dev","password":"Dev2026!"}')"
check "dev no ve a ana (no la invitó)" 0 "$(curl -s $H -b /tmp/dv.jar $B/api/auth/users | grep -c 'ana@x.com')"
check "dev no puede eliminar a ana" 403 "$(code $H -b /tmp/dv.jar -X DELETE "$B/api/auth/users?id=$ANA")"
check "dev invita a un diseñador" 201 "$(code $H -b /tmp/dv.jar -X POST $B/api/auth/users -d '{"name":"Beto","username":"beto","email":"beto@x.com","role":"designer","password":"Beto2026!x"}')"
check "beto nace solo mirando y con una semana" 1 "$($PSQL -c "select count(*) from app.project_members m join app.users u on u.id=m.user_id where u.email='beto@x.com' and m.scope_limited and cardinality(m.denied) = 7 and m.expires_at < now() + interval '8 days'")"
check "superadmin no se elimina a sí mismo" 400 "$(code $H -b /tmp/sa.jar -X DELETE "$B/api/auth/users?id=$(curl -s $H -b /tmp/sa.jar $B/api/auth/me | field id)")"

# Eliminar a quien invitó quita también a quienes invitó.
check "superadmin elimina a dev (y a quien dev invitó)" 200 "$(code $H -b /tmp/sa.jar -X DELETE "$B/api/auth/users?id=$(curl -s $H -b /tmp/sa.jar $B/api/auth/users | sed 's/},{/}\n{/g' | grep '"dev@portal.dev"' | field id)")"
check "beto desapareció con dev" 0 "$($PSQL -c "select count(*) from app.users where email='beto@x.com' and deleted_at is null")"
check "dev ya no entra" 401 "$(code $H -X POST $B/api/auth/login -d '{"email":"dev@portal.dev","password":"Dev2026!"}')"
check "su sesión abierta dejó de valer" null "$(curl -s $H -b /tmp/dv.jar $B/api/auth/me | sed -n 's/.*"user":\(null\).*/\1/p')"
check "el historial se conserva (borrado lógico)" 1 "$($PSQL -c "select count(*) from app.users where email='dev@portal.dev' and deleted_at is not null")"

check "logout" 200 "$(code $H -b /tmp/sa.jar -c /tmp/sa.jar -X POST $B/api/auth/logout)"
check "tras salir no hay sesión" null "$(curl -s $H -b /tmp/sa.jar $B/api/auth/me | sed -n 's/.*"user":\(null\).*/\1/p')"

echo "----"; echo "pasaron: $ok  fallaron: $bad"
