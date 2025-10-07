#!/bin/bash

# LogLynx API Test Suite
# Tests all routes that the Android app will actually use

BASE_URL="https://log-lynxs-backend.vercel.app/api/v1"
TEST_TOKEN="test_firebase_token"  # Replace with real token for full testing

echo "🚴 Testing LogLynx API Routes"
echo "================================"
echo "Base URL: $BASE_URL"
echo ""

# Test 1: Health Check
echo "1. Health Check"
echo "GET /health"
curl -s "$BASE_URL/health" | jq '.' 2>/dev/null || curl -s "$BASE_URL/health"
echo -e "\n"

# Test 2: Auth - Firebase Exchange (POST)
echo "2. Auth - Firebase Exchange"
echo "POST /auth/firebase-exchange"
curl -X POST "$BASE_URL/auth/firebase-exchange" \
  -H "Content-Type: application/json" \
  -d '{"firebaseToken":"'$TEST_TOKEN'"}' | jq '.' 2>/dev/null || curl -X POST "$BASE_URL/auth/firebase-exchange" -H "Content-Type: application/json" -d '{"firebaseToken":"'$TEST_TOKEN'"}'
echo -e "\n"

# Test 3: Auth - Get Current User (GET)
echo "3. Auth - Get Current User"
echo "GET /auth/me"
curl -s "$BASE_URL/auth/me" \
  -H "Authorization: Bearer $TEST_TOKEN" | jq '.' 2>/dev/null || curl -s "$BASE_URL/auth/me" -H "Authorization: Bearer $TEST_TOKEN"
echo -e "\n"

# Test 4: Auth - Logout (POST)
echo "4. Auth - Logout"
echo "POST /auth/logout"
curl -X POST "$BASE_URL/auth/logout" \
  -H "Authorization: Bearer $TEST_TOKEN" | jq '.' 2>/dev/null || curl -X POST "$BASE_URL/auth/logout" -H "Authorization: Bearer $TEST_TOKEN"
echo -e "\n"

# Test 5: Users - Get Profile (GET)
echo "5. Users - Get Profile"
echo "GET /users/profile"
curl -s "$BASE_URL/users/profile" \
  -H "Authorization: Bearer $TEST_TOKEN" | jq '.' 2>/dev/null || curl -s "$BASE_URL/users/profile" -H "Authorization: Bearer $TEST_TOKEN"
echo -e "\n"

# Test 6: Users - Update Profile (PUT)
echo "6. Users - Update Profile"
echo "PUT /users/profile"
curl -X PUT "$BASE_URL/users/profile" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -d '{"displayName":"Test User","email":"test@example.com"}' | jq '.' 2>/dev/null || curl -X PUT "$BASE_URL/users/profile" -H "Content-Type: application/json" -H "Authorization: Bearer $TEST_TOKEN" -d '{"displayName":"Test User","email":"test@example.com"}'
echo -e "\n"

# Test 7: Users - Update Preferences (PUT)
echo "7. Users - Update Preferences"
echo "PUT /users/preferences"
curl -X PUT "$BASE_URL/users/preferences" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -d '{"notifications":true,"theme":"dark"}' | jq '.' 2>/dev/null || curl -X PUT "$BASE_URL/users/preferences" -H "Content-Type: application/json" -H "Authorization: Bearer $TEST_TOKEN" -d '{"notifications":true,"theme":"dark"}'
echo -e "\n"

# Test 8: Bikes - Get All Bikes (GET)
echo "8. Bikes - Get All Bikes"
echo "GET /bikes"
curl -s "$BASE_URL/bikes" \
  -H "Authorization: Bearer $TEST_TOKEN" | jq '.' 2>/dev/null || curl -s "$BASE_URL/bikes" -H "Authorization: Bearer $TEST_TOKEN"
echo -e "\n"

# Test 9: Bikes - Create New Bike (POST)
echo "9. Bikes - Create New Bike"
echo "POST /bikes"
curl -X POST "$BASE_URL/bikes" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -d '{"name":"Test Bike","type":"Road","year":2023,"status":"Excellent","totalMileage":0}' | jq '.' 2>/dev/null || curl -X POST "$BASE_URL/bikes" -H "Content-Type: application/json" -H "Authorization: Bearer $TEST_TOKEN" -d '{"name":"Test Bike","type":"Road","year":2023,"status":"Excellent","totalMileage":0}'
echo -e "\n"

# Test 10: Bikes - Get Bike by ID (GET)
echo "10. Bikes - Get Bike by ID"
echo "GET /bikes/{id}"
curl -s "$BASE_URL/bikes/test-bike-id" \
  -H "Authorization: Bearer $TEST_TOKEN" | jq '.' 2>/dev/null || curl -s "$BASE_URL/bikes/test-bike-id" -H "Authorization: Bearer $TEST_TOKEN"
echo -e "\n"

# Test 11: Components - Get All Components (GET)
echo "11. Components - Get All Components"
echo "GET /components"
curl -s "$BASE_URL/components" \
  -H "Authorization: Bearer $TEST_TOKEN" | jq '.' 2>/dev/null || curl -s "$BASE_URL/components" -H "Authorization: Bearer $TEST_TOKEN"
echo -e "\n"

# Test 12: Components - Create Component (POST)
echo "12. Components - Create Component"
echo "POST /components"
curl -X POST "$BASE_URL/components" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -d '{"kind":"chain","brand":"Shimano","model":"Dura-Ace","spec":{"speed":"11"}}' | jq '.' 2>/dev/null || curl -X POST "$BASE_URL/components" -H "Content-Type: application/json" -H "Authorization: Bearer $TEST_TOKEN" -d '{"kind":"chain","brand":"Shimano","model":"Dura-Ace","spec":{"speed":"11"}}'
echo -e "\n"

# Test 13: Service Logs - Get All Service Logs (GET)
echo "13. Service Logs - Get All Service Logs"
echo "GET /service-logs"
curl -s "$BASE_URL/service-logs" \
  -H "Authorization: Bearer $TEST_TOKEN" | jq '.' 2>/dev/null || curl -s "$BASE_URL/service-logs" -H "Authorization: Bearer $TEST_TOKEN"
echo -e "\n"

# Test 14: Service Logs - Create Service Log (POST)
echo "14. Service Logs - Create Service Log"
echo "POST /service-logs"
curl -X POST "$BASE_URL/service-logs" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -d '{"bikeId":"test-bike-id","performedAt":"2025-10-07T16:00:00Z","title":"Chain Replacement","notes":"Replaced worn chain","cost":25.99,"mileageAtService":1000,"items":["chain","lube"]}' | jq '.' 2>/dev/null || curl -X POST "$BASE_URL/service-logs" -H "Content-Type: application/json" -H "Authorization: Bearer $TEST_TOKEN" -d '{"bikeId":"test-bike-id","performedAt":"2025-10-07T16:00:00Z","title":"Chain Replacement","notes":"Replaced worn chain","cost":25.99,"mileageAtService":1000,"items":["chain","lube"]}'
echo -e "\n"

# Test 15: Badges - Get All Badges (GET)
echo "15. Badges - Get All Badges"
echo "GET /badges"
curl -s "$BASE_URL/badges" \
  -H "Authorization: Bearer $TEST_TOKEN" | jq '.' 2>/dev/null || curl -s "$BASE_URL/badges" -H "Authorization: Bearer $TEST_TOKEN"
echo -e "\n"

# Test 16: Notifications - Get Notifications (GET)
echo "16. Notifications - Get Notifications"
echo "GET /notifications"
curl -s "$BASE_URL/notifications" \
  -H "Authorization: Bearer $TEST_TOKEN" | jq '.' 2>/dev/null || curl -s "$BASE_URL/notifications" -H "Authorization: Bearer $TEST_TOKEN"
echo -e "\n"

# Test 17: QR Codes - Generate QR Code (POST)
echo "17. QR Codes - Generate QR Code"
echo "POST /qr-codes/generate"
curl -X POST "$BASE_URL/qr-codes/generate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -d '{"type":"bike","id":"test-bike-id"}' | jq '.' 2>/dev/null || curl -X POST "$BASE_URL/qr-codes/generate" -H "Content-Type: application/json" -H "Authorization: Bearer $TEST_TOKEN" -d '{"type":"bike","id":"test-bike-id"}'
echo -e "\n"

# Test 18: Strava - Connect (GET)
echo "18. Strava - Connect"
echo "GET /strava/connect"
curl -s "$BASE_URL/strava/connect" \
  -H "Authorization: Bearer $TEST_TOKEN" | jq '.' 2>/dev/null || curl -s "$BASE_URL/strava/connect" -H "Authorization: Bearer $TEST_TOKEN"
echo -e "\n"

echo "================================"
echo "✅ API Testing Complete!"
echo ""
echo "Expected Results:"
echo "- Health: 200 OK"
echo "- Auth endpoints: 401 (Invalid Firebase token) or 200 (with real token)"
echo "- Protected endpoints: 401 (Invalid Firebase token) or 200 (with real token)"
echo "- All endpoints should return JSON, not 404"
echo ""
echo "To test with real Firebase token, replace TEST_TOKEN variable"
