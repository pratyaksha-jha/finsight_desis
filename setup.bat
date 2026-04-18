@echo off
echo ===================================================
echo      FinSight - Master Installation Script
echo ===================================================
echo.

echo [1/4] Installing Frontend Dependencies (React)...
cd frontend
call npm install
cd ..
echo.

echo [2/4] Installing Node Backend Dependencies (Express)...
cd backend-node
call npm install
cd ..
echo.

echo [3/4] Installing Python Core Dependencies (FastAPI)...
cd backend-python
call pip install -r requirements.txt
cd ..
echo.

echo [4/4] Installing News Service Dependencies (AI/FinBERT)...
cd news-service
call pip install -r requirements.txt
cd ..
echo.

echo ===================================================
echo      ALL DEPENDENCIES INSTALLED SUCCESSFULLY!
echo ===================================================
pause

