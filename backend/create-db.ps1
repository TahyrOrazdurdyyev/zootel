# РЎРєСЂРёРїС‚ РґР»СЏ СЃРѕР·РґР°РЅРёСЏ Р‘Р” Р±РµР· Р·РЅР°РЅРёСЏ РїР°СЂРѕР»СЏ
# РџСЂРѕР±СѓРµРј СЂР°Р·РЅС‹Рµ РІР°СЂРёР°РЅС‚С‹ РїРѕРґРєР»СЋС‡РµРЅРёСЏ

$passwords = @('aydana1005', 'postgres', '', 'admin', 'root')
$dbCreated = $false

foreach ($pass in $passwords) {
    Write-Host "
РџСЂРѕР±СѓРµРј РїР°СЂРѕР»СЊ: ''..." -ForegroundColor Yellow
    
    $env:PGPASSWORD = $pass
    $env:PGUSER = 'postgres'
    $env:PGHOST = 'localhost'
    $env:PGPORT = '5432'
    
    # РџСЂРѕР±СѓРµРј РїРѕРґРєР»СЋС‡РёС‚СЊСЃСЏ Рє postgres Р‘Р” Рё СЃРѕР·РґР°С‚СЊ zootel_dev
    $result = psql -U postgres -d postgres -c "SELECT 1" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "вњ… РџР°СЂРѕР»СЊ РЅР°Р№РґРµРЅ: ''" -ForegroundColor Green
        Write-Host "РЎРѕР·РґР°РµРј Р±Р°Р·Сѓ РґР°РЅРЅС‹С… zootel_dev..." -ForegroundColor Cyan
        
        # РџСЂРѕРІРµСЂСЏРµРј СЃСѓС‰РµСЃС‚РІСѓРµС‚ Р»Рё Р‘Р”
        $checkDb = psql -U postgres -d postgres -t -c "SELECT 1 FROM pg_database WHERE datname='zootel_dev'" 2>&1
        
        if ($checkDb -match '1') {
            Write-Host "Р‘Р°Р·Р° РґР°РЅРЅС‹С… zootel_dev СѓР¶Рµ СЃСѓС‰РµСЃС‚РІСѓРµС‚" -ForegroundColor Green
        } else {
            $createDb = psql -U postgres -d postgres -c "CREATE DATABASE zootel_dev" 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Host "вњ… Р‘Р°Р·Р° РґР°РЅРЅС‹С… zootel_dev СЃРѕР·РґР°РЅР°!" -ForegroundColor Green
            }
        }
        
        # РЎРѕР·РґР°РµРј СЂР°СЃС€РёСЂРµРЅРёСЏ
        psql -U postgres -d zootel_dev -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\"" 2>&1 | Out-Null
        psql -U postgres -d zootel_dev -c "CREATE EXTENSION IF NOT EXISTS \"pgcrypto\"" 2>&1 | Out-Null
        
        $dbCreated = $true
        break
    }
}

if (-not $dbCreated) {
    Write-Host "
вќЊ РќРµ СѓРґР°Р»РѕСЃСЊ РЅР°Р№С‚Рё РїСЂР°РІРёР»СЊРЅС‹Р№ РїР°СЂРѕР»СЊ" -ForegroundColor Red
    Write-Host "РќСѓР¶РЅРѕ СЃР±СЂРѕСЃРёС‚СЊ РїР°СЂРѕР»СЊ PostgreSQL РІСЂСѓС‡РЅСѓСЋ" -ForegroundColor Yellow
}
