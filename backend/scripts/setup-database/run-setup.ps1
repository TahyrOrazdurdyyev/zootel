# Р’СЂРµРјРµРЅРЅРѕ СѓСЃС‚Р°РЅРѕРІРёРј РїРµСЂРµРјРµРЅРЅС‹Рµ РѕРєСЂСѓР¶РµРЅРёСЏ РґР»СЏ СЃРѕР·РґР°РЅРёСЏ Р‘Р”
$env:DB_HOST = 'localhost'
$env:DB_PORT = '5432'
$env:DB_USER = 'postgres'
$env:DB_PASSWORD = 'aydana1005'
$env:DB_NAME = 'zootel_dev'
$env:DB_SSL_MODE = 'disable'

Write-Host "РџСЂРѕР±СѓРµРј СЃРѕР·РґР°С‚СЊ Р‘Р” СЃ РїР°СЂРѕР»РµРј 'aydana1005'..." -ForegroundColor Cyan
go run . --create-db
