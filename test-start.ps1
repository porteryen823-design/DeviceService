# test-start.ps1

# 設定 API URL
$apiUrl = "http://localhost:5557/start"

# 建立 JSON 資料
$body = @{
    proxyid = "7"
    Controller_type = "E82"
    proxy_ip = "192.168.1.1"
    proxy_port = "8080"
    remark = "TSC1"
} | ConvertTo-Json -Depth 3

# 顯示送出資料
Write-Host "Sending POST to $apiUrl with body:"
Write-Host $body

# 發送 POST 請求
$response = Invoke-WebRequest -Uri $apiUrl `
    -Method POST `
    -Body $body `
    -ContentType "application/json"

# 顯示回應結果
Write-Host "`nResponse Status Code: $($response.StatusCode)"
Write-Host "Response Body:"
Write-Host $response.Content