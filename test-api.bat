@echo off
REM LogLynx API Test Suite for Windows
REM Tests all routes that the Android app will actually use

set BASE_URL=https://log-lynxs-backend.vercel.app/api/v1
set TEST_TOKEN=test_firebase_token

echo 🚴 Testing LogLynx API Routes
echo ================================
echo Base URL: %BASE_URL%
echo.

REM Test 1: Health Check
echo 1. Health Check
echo GET /health
curl -s "%BASE_URL%/health"
echo.
echo.

REM Test 2: Auth - Firebase Exchange
echo 2. Auth - Firebase Exchange
echo POST /auth/firebase-exchange
curl -X POST "%BASE_URL%/auth/firebase-exchange" -H "Content-Type: application/json" -d "{\"firebaseToken\":\"%TEST_TOKEN%\"}"
echo.
echo.

REM Test 3: Auth - Get Current User
echo 3. Auth - Get Current User
echo GET /auth/me
curl -s "%BASE_URL%/auth/me" -H "Authorization: Bearer %TEST_TOKEN%"
echo.
echo.

REM Test 4: Auth - Logout
echo 4. Auth - Logout
echo POST /auth/logout
curl -X POST "%BASE_URL%/auth/logout" -H "Authorization: Bearer %TEST_TOKEN%"
echo.
echo.

REM Test 5: Users - Get Profile
echo 5. Users - Get Profile
echo GET /users/profile
curl -s "%BASE_URL%/users/profile" -H "Authorization: Bearer %TEST_TOKEN%"
echo.
echo.

REM Test 6: Users - Update Profile
echo 6. Users - Update Profile
echo PUT /users/profile
curl -X PUT "%BASE_URL%/users/profile" -H "Content-Type: application/json" -H "Authorization: Bearer %TEST_TOKEN%" -d "{\"displayName\":\"Test User\",\"email\":\"test@example.com\"}"
echo.
echo.

REM Test 7: Bikes - Get All Bikes
echo 7. Bikes - Get All Bikes
echo GET /bikes
curl -s "%BASE_URL%/bikes" -H "Authorization: Bearer %TEST_TOKEN%"
echo.
echo.

REM Test 8: Bikes - Create New Bike
echo 8. Bikes - Create New Bike
echo POST /bikes
curl -X POST "%BASE_URL%/bikes" -H "Content-Type: application/json" -H "Authorization: Bearer %TEST_TOKEN%" -d "{\"name\":\"Test Bike\",\"type\":\"Road\",\"year\":2023,\"status\":\"Excellent\",\"totalMileage\":0}"
echo.
echo.

REM Test 9: Components - Get All Components
echo 9. Components - Get All Components
echo GET /components
curl -s "%BASE_URL%/components" -H "Authorization: Bearer %TEST_TOKEN%"
echo.
echo.

REM Test 10: Service Logs - Get All Service Logs
echo 10. Service Logs - Get All Service Logs
echo GET /service-logs
curl -s "%BASE_URL%/service-logs" -H "Authorization: Bearer %TEST_TOKEN%"
echo.
echo.

REM Test 11: Badges - Get All Badges
echo 11. Badges - Get All Badges
echo GET /badges
curl -s "%BASE_URL%/badges" -H "Authorization: Bearer %TEST_TOKEN%"
echo.
echo.

REM Test 12: Notifications - Get Notifications
echo 12. Notifications - Get Notifications
echo GET /notifications
curl -s "%BASE_URL%/notifications" -H "Authorization: Bearer %TEST_TOKEN%"
echo.
echo.

echo ================================
echo ✅ API Testing Complete!
echo.
echo Expected Results:
echo - Health: 200 OK
echo - Auth endpoints: 401 (Invalid Firebase token) or 200 (with real token)
echo - Protected endpoints: 401 (Invalid Firebase token) or 200 (with real token)
echo - All endpoints should return JSON, not 404
echo.
echo To test with real Firebase token, replace TEST_TOKEN variable
pause
