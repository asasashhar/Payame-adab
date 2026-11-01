#!/bin/bash
# Comprehensive acceptance test for Payam-e-Adab upgrade (spec section 14)
BASE="http://localhost:3000"
JAR="/tmp/pea-admin.jar"
PASS=0; FAIL=0
ok()  { PASS=$((PASS+1)); echo "  PASS: $1"; }
bad() { FAIL=$((FAIL+1)); echo "  FAIL: $1"; }
check() { # check <desc> <expected> <actual>
  if [ "$2" = "$3" ]; then ok "$1"; else bad "$1 (expected $2, got $3)"; fi
}

echo "=== A. COMMENTS: admin listing + moderation flow ==="
r=$(curl -s -b "$JAR" "$BASE/api/comments?admin=1&status=all")
n=$(echo "$r" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d.get('items',[])))" 2>/dev/null)
check "admin comments listing" "1" "$n"
pend=$(echo "$r" | python3 -c "import sys,json; print(json.load(sys.stdin)['counts']['PENDING'])" 2>/dev/null)
check "pending comment count" "1" "$pend"
# approve the pending comment
cid=$(echo "$r" | python3 -c "import sys,json; d=json.load(sys.stdin)['items']; print(d[0]['id'] if d else '')" 2>/dev/null)
if [ -n "$cid" ]; then
  code=$(curl -s -b "$JAR" -o /dev/null -w "%{http_code}" -X PATCH "$BASE/api/comments" -H "Content-Type: application/json" -d "{\"id\":\"$cid\",\"status\":\"APPROVED\"}")
  check "approve comment" "200" "$code"
  rid=$(echo "$r" | python3 -c "import sys,json; d=json.load(sys.stdin)['items'][0]; print(d['resourceId'])" 2>/dev/null)
  rtype=$(echo "$r" | python3 -c "import sys,json; d=json.load(sys.stdin)['items'][0]; print(d['resourceType'])" 2>/dev/null)
  pub=$(curl -s "$BASE/api/comments?resourceType=$rtype&resourceId=$rid")
  pn=$(echo "$pub" | python3 -c "import sys,json; print(len(json.load(sys.stdin).get('items',[])))" 2>/dev/null)
  check "approved comment visible publicly" "1" "$pn"
fi

echo "=== B. POST public comment (pre-moderated) ==="
poemid=$(curl -s "$BASE/api/poems" | python3 -c "import sys,json; d=json.load(sys.stdin); items=d.get('poems',d); print(items[0]['id'])" 2>/dev/null)
echo "  first published poem: $poemid"
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/comments" -H "Content-Type: application/json" -d "{\"resourceType\":\"poem\",\"resourceId\":\"$poemid\",\"body\":\"بہت خوبصورت کلام ہے، مبارک ہو\",\"guestName\":\" тест قاری\"}")
check "guest comment submit -> 201" "201" "$code"
r=$(curl -s -b "$JAR" "$BASE/api/comments?admin=1&status=PENDING")
pn=$(echo "$r" | python3 -c "import sys,json; print(len(json.load(sys.stdin).get('items',[])))" 2>/dev/null)
check "new comment in PENDING (not public)" "1" "$pn"

echo "=== C. LIKES: toggle flow ==="
vid="test-visitor-$$"
r=$(curl -s -X POST "$BASE/api/likes" -H "Content-Type: application/json" -H "X-Visitor-Id: $vid" -d "{\"resourceType\":\"poem\",\"resourceId\":\"$poemid\"}")
echo "  like response: $(echo $r | head -c 120)"
liked=$(echo "$r" | python3 -c "import sys,json; print(json.load(sys.stdin).get('liked', json.load(sys.stdin).get('count','?')))" 2>/dev/null)
r2=$(curl -s "$BASE/api/likes?resourceType=poem&resourceId=$poemid&visitorId=$vid")
echo "  likes status: $(echo $r2 | head -c 150)"
code=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH "$BASE/api/likes" -H "Content-Type: application/json" -H "X-Visitor-Id: $vid" -d "{\"resourceType\":\"poem\",\"resourceId\":\"$poemid\"}")
echo "  unlike -> $code"

echo "=== D. VIEW TRACKING ==="
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/view" -H "Content-Type: application/json" -H "X-Visitor-Id: $vid" -d "{\"path\":\"/poetry/$poemid\",\"resourceType\":\"poem\",\"resourceId\":\"$poemid\"}")
check "page view recorded" "200" "$code"

echo "=== E. ANALYTICS API ==="
r=$(curl -s -b "$JAR" "$BASE/api/analytics?range=7d")
echo "  analytics: $(echo $r | head -c 220)"
days=$(echo "$r" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d.get('daily',d.get('series',[]))) if isinstance(d,dict) else '?')" 2>/dev/null)
[ -n "$days" ] && [ "$days" != "0" ] && ok "analytics has daily series" || bad "analytics daily series"

echo "=== F. ADMINS: add 4th, cap at 5 ==="
r=$(curl -s -b "$JAR" -X POST "$BASE/api/admins" -H "Content-Type: application/json" -d '{"email":"admin4@payameadab.com","name":"چوتھا ایڈمن"}')
echo "  add 4th: $(echo $r | head -c 150)"
r=$(curl -s -b "$JAR" -X POST "$BASE/api/admins" -H "Content-Type: application/json" -d '{"email":"admin5@payameadab.com","name":"پانچواں ایڈمن"}')
echo "  add 5th: $(echo $r | head -c 150)"
r=$(curl -s -b "$JAR" -X POST "$BASE/api/admins" -H "Content-Type: application/json" -d '{"email":"admin6@payameadab.com","name":"چھٹا"}')
code6=$(echo "$r" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('error','NO-ERROR')[:40])" 2>/dev/null)
echo "  6th admin blocked: $code6"
[ -n "$code6" ] && [ "$code6" != "NO-ERROR" ] && ok "5-admin cap enforced" || bad "5-admin cap NOT enforced"

echo "=== G. SETTINGS persistence (font + watermark) ==="
code=$(curl -s -b "$JAR" -o /dev/null -w "%{http_code}" -X PUT "$BASE/api/settings" -H "Content-Type: application/json" -d '{"headingFont":"mehr-nastaliq-web","bodyFont":"noto-nastaliq-urdu","watermarkOpacity":"0.07"}')
check "save settings" "200" "$code"
v=$(curl -s "$BASE/api/settings" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('headingFont','?'))" 2>/dev/null)
check "headingFont persisted" "mehr-nastaliq-web" "$v"

echo "=== H. RESTORE/DELETE endpoints ==="
code=$(curl -s -b "$JAR" -o /dev/null -w "%{http_code}" "$BASE/api/restore")
echo "  restore API: $code"

echo ""
echo "=========================================="
echo "RESULTS: $PASS passed, $FAIL failed"
