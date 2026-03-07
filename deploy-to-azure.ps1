# Azure Container Instances Deployment Script
# This script deploys the Housing Price Prediction API to Azure Container Instances

param(
    [string]$ResourceGroup = "housing-dataset-rg",
    [string]$RegistryName = "housingdatasetacr",
    [string]$ContainerName = "housing-price-api",
    [string]$Location = "eastus",
    [string]$ImageTag = "latest"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Azure Container Instances Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Step 1: Check if Azure CLI is installed
Write-Host "`n[1/7] Checking Azure CLI installation..." -ForegroundColor Yellow
try {
    $azVersion = az --version
    Write-Host "✓ Azure CLI is installed" -ForegroundColor Green
} catch {
    Write-Host "✗ Azure CLI is not installed" -ForegroundColor Red
    Write-Host "Please install Azure CLI from: https://aka.ms/installazurecliwindows" -ForegroundColor Red
    exit 1
}

# Step 2: Login to Azure
Write-Host "`n[2/7] Logging in to Azure..." -ForegroundColor Yellow
az login

# Step 3: Create Resource Group
Write-Host "`n[3/7] Creating Resource Group: $ResourceGroup in $Location..." -ForegroundColor Yellow
az group create --name $ResourceGroup --location $Location

# Step 4: Create Azure Container Registry
Write-Host "`n[4/7] Creating Azure Container Registry: $RegistryName..." -ForegroundColor Yellow
az acr create --resource-group $ResourceGroup --name $RegistryName --sku Basic

# Step 5: Build and Push Docker Image to ACR
Write-Host "`n[5/7] Building and pushing Docker image to ACR..." -ForegroundColor Yellow
$acrLoginServer = "$RegistryName.azurecr.io"
$imageName = "$acrLoginServer/housing-price-api:$ImageTag"

Write-Host "Image name: $imageName" -ForegroundColor Cyan
az acr build --registry $RegistryName --image "housing-price-api:$ImageTag" .

# Step 6: Get ACR username and password
Write-Host "`n[6/7] Retrieving ACR credentials..." -ForegroundColor Yellow
$acrPassword = az acr credential show --name $RegistryName --query passwords[0].value --output tsv
Write-Host "✓ ACR credentials retrieved" -ForegroundColor Green

# Step 7: Deploy to Azure Container Instances
Write-Host "`n[7/7] Deploying to Azure Container Instances..." -ForegroundColor Yellow
az container create `
    --resource-group $ResourceGroup `
    --name $ContainerName `
    --image $imageName `
    --cpu 1 `
    --memory 1.5 `
    --port 8000 `
    --registry-login-server $acrLoginServer `
    --registry-username $RegistryName `
    --registry-password $acrPassword `
    --environment-variables LOG_MESSAGE="Housing Price Prediction API"

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

# Display deployment details
Write-Host "`n📋 Deployment Details:" -ForegroundColor Cyan
Write-Host "Resource Group: $ResourceGroup"
Write-Host "Container Registry: $RegistryName"
Write-Host "Container Name: $ContainerName"
Write-Host "Location: $Location"

# Get the public IP address
Write-Host "`n⏳ Waiting for public IP assignment..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

$containerInfo = az container show --resource-group $ResourceGroup --name $ContainerName
$publicIp = az container show --resource-group $ResourceGroup --name $ContainerName --query ipAddress.ip --output tsv
$state = az container show --resource-group $ResourceGroup --name $ContainerName --query instanceView.state --output tsv

Write-Host "`n✓ Container Status: $state" -ForegroundColor Green
Write-Host "✓ Public IP Address: $publicIp" -ForegroundColor Green
Write-Host "`n🌐 API Endpoint: http://$publicIp`:8000" -ForegroundColor Cyan

Write-Host "`n📚 Available Endpoints:" -ForegroundColor Cyan
Write-Host "  - Health Check: http://$publicIp`:8000/"
Write-Host "  - API Docs: http://$publicIp`:8000/docs"
Write-Host "  - Predict (GET): http://$publicIp`:8000/predict?MedInc=5&AveRooms=5&AveOccup=3"
Write-Host "  - Predict (POST): http://$publicIp`:8000/predict"

Write-Host "`n💡 Tips:" -ForegroundColor Cyan
Write-Host "  - View logs: az container logs --resource-group $ResourceGroup --name $ContainerName"
Write-Host "  - Delete: az container delete --resource-group $ResourceGroup --name $ContainerName"
Write-Host "  - Stop: az container stop --resource-group $ResourceGroup --name $ContainerName"
Write-Host "  - Restart: az container restart --resource-group $ResourceGroup --name $ContainerName"
