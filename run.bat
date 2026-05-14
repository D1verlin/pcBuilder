@echo off
chcp 65001 >nul
start "PcBuilder Backend" cmd /c "dotnet run --project PcBuilder.Presentation/PcBuilder.Presentation.csproj"
start "PcBuilder Frontend" cmd /c "cd PcBuilder.Client && npm run dev"
echo - Frontend: http://localhost:5173
echo - Swagger: http://localhost:5213/swagger
pause
