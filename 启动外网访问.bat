@echo off
chcp 65001 >nul
title TMS供应链管理系统 - 外网访问启动器
echo ============================================
echo   TMS供应链管理系统 - 外网访问
echo ============================================
echo.

echo [1/2] 启动本地服务器...
start /b node "%~dp0tms-server.js"
timeout /t 2 /nobreak >nul

echo [2/2] 启动公网隧道...
echo.
echo 正在获取外网地址，请稍候...
echo.

ssh -o StrictHostKeyChecking=no -o ServerAliveInterval=30 -R 80:localhost:8765 serveo.net
