#!/bin/bash
# End-to-end admin panel test for Payam-e-Adab upgrade verification
BASE="http://localhost:3000"
JAR="/tmp/pea-admin.jar"
rm -f "$JAR"

echo "=== 1. ADMIN LOGIN (darulhuda) ==="
resp=$(curl -s -c "$JAR" -X POST "$BASE/api/auth/login" -H "Content-Type: application/json" -d '{"email":"mdnematullah1343@gmail.com","password":"darulhuda"}')
echo "$resp" | head -c 200; echo
echo "role: $(echo "$resp" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("role","FAIL"))' 2>/dev/null)"

echo "=== 2. WRONG PASSWORD REJECTED ==="
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/auth/login" -H "Content-Type: application/json" -d '{"email":"mdnematullah1343@gmail.com","password":"wrong"}')
echo "wrong password -> $code (expect 401)"

echo "=== 3. ADMIN PAGES (with session) ==="
for p in "" admins analytics appearance comments deleted homepage likes logs scheduled settings submissions poems articles news books poets users newspaper words shers competitions events banners qafiya behrs; do
  code=$(curl -s -b "$JAR" -o /dev/null -w "%{http_code}" "$BASE/admin/$p")
  echo "/admin/$p -> $code"
done

echo "=== 4. ADMIN PAGES (no session = must redirect) ==="
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/admin/admins")
echo "/admin/admins no-session -> $code (expect 307)"

echo "=== 5. KEY APIs with session ==="
curl -s -b "$JAR" "$BASE/api/stats" | head -c 150; echo
echo "--- admins API ---"
curl -s -b "$JAR" "$BASE/api/admins" | head -c 300; echo
echo "--- comments API ---"
curl -s -b "$JAR" "$BASE/api/comments" | head -c 200; echo
echo "--- settings API (GET) ---"
curl -s -b "$JAR" "$BASE/api/settings" | head -c 200; echo

echo "=== 6. Unauthenticated admin API blocked ==="
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/admins")
echo "GET /api/admins no-auth -> $code (expect 401/403)"
