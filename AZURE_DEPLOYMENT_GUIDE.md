# Deploying to Azure Container Instances (ACI)

This guide will walk you through deploying your Housing Price Prediction API to Azure Container Instances in a few simple steps.

## Prerequisites

### 1. Create an Azure Account (Free Tier)
- Go to https://azure.microsoft.com/free/
- Sign up with a Microsoft account or create one
- You'll get $200 free credits for 30 days + 12 months of free services (including ACI)
- **No credit card required initially** (you need it only to unlock the account)

### 2. Install Azure CLI
Azure CLI is the command-line tool to manage Azure resources.

**On Windows (PowerShell):**
```powershell
# Download and install
Invoke-WebRequest -Uri https://aka.ms/installazurecliwindows -OutFile AzureCLI.msi
Start-Process msiexec.exe -ArgumentList '/i AzureCLI.msi /quiet'

# Verify installation
az --version
```

Or download manually: https://aka.ms/installazurecliwindows

### 3. Have Docker Desktop Running
- Ensure Docker Desktop is installed and running on your machine
- The deployment script will build and push your image to Azure Container Registry

---

## Deployment Steps

### Step 1: Navigate to Your Project Directory
```powershell
cd "d:\housing dataset"
```

### Step 2: Run the Deployment Script

Execute the automated deployment script:
```powershell
.\deploy-to-azure.ps1
```

**The script will:**
1. Check Azure CLI installation
2. Prompt you to login to Azure (opens browser)
3. Create a Resource Group
4. Create an Azure Container Registry
5. Build and push your Docker image
6. Deploy to Azure Container Instances
7. Display your public IP and API endpoint

### Step 3: Access Your API

Once deployed, you'll see:
```
🌐 API Endpoint: http://<YOUR-IP>:8000
```

Available endpoints:
- **Health Check**: `http://<YOUR-IP>:8000/`
- **Interactive API Docs**: `http://<YOUR-IP>:8000/docs`
- **Make Predictions (GET)**: 
  ```
  http://<YOUR-IP>:8000/predict?MedInc=5&AveRooms=5&AveOccup=3
  ```
- **Make Predictions (POST)**:
  ```json
  POST http://<YOUR-IP>:8000/predict
  {
    "MedInc": 5.0,
    "AveRooms": 5.0,
    "AveOccup": 3.0
  }
  ```

---

## Customization

### Modify Deployment Parameters

You can customize the deployment by passing parameters:

```powershell
.\deploy-to-azure.ps1 -ResourceGroup "my-housing-rg" `
                      -RegistryName "myhousandcr" `
                      -ContainerName "my-price-api" `
                      -Location "westus" `
                      -ImageTag "v1.0"
```

**Available Parameters:**
- `-ResourceGroup`: Azure Resource Group name (default: `housing-dataset-rg`)
- `-RegistryName`: Azure Container Registry name (default: `housingdatasetacr`)
- `-ContainerName`: Container instance name (default: `housing-price-api`)
- `-Location`: Azure region (default: `eastus`)
- `-ImageTag`: Docker image tag (default: `latest`)

### Change Resource Allocation

Edit the deployment script to adjust CPU and memory:
```powershell
--cpu 1              # Change CPU cores (0.5, 1, 2, 4)
--memory 1.5         # Change memory in GB (0.5-4 GB range)
```

---

## Cost Estimation

**Azure Container Instances Free Tier:**
- ✓ First 750 CPU-hours per month: FREE
- ✓ First 7,200 GB-seconds per month: FREE
- ✓ Generous enough for small-to-medium workloads

**After free tier:**
- CPU: $0.0000382 per CPU hour
- Memory: $0.0000050 per GB hour

For continuous 1 CPU, 1.5 GB instance:
- Monthly cost (paid): ~$27
- *Stays within free tier for typical use cases*

---

## Managing Your Deployment

### View Logs
```powershell
az container logs --resource-group housing-dataset-rg --name housing-price-api
```

### Check Container Status
```powershell
az container show --resource-group housing-dataset-rg --name housing-price-api
```

### Stop the Container
```powershell
az container stop --resource-group housing-dataset-rg --name housing-price-api
```

### Restart the Container
```powershell
az container restart --resource-group housing-dataset-rg --name housing-price-api
```

### Delete Everything
```powershell
az group delete --name housing-dataset-rg --yes
```

---

## Troubleshooting

### Container shows "Creating" status
- Wait 1-2 minutes for the container to fully initialize
- Check logs: `az container logs --resource-group housing-dataset-rg --name housing-price-api`

### Model file not found error
- Ensure `model/linear_regression_model.pkl` exists locally before deployment
- The Dockerfile copies the model directory (`COPY ./model /code/model`)

### Connection timeout
- Verify the public IP is assigned: `az container show --resource-group housing-dataset-rg --name housing-price-api --query ipAddress.ip`
- Check firewall allows outbound connections on port 8000

### Docker image build fails
- Ensure all dependencies in `requirements.txt` are compatible
- Check if `model/linear_regression_model.pkl` file exists
- Verify Dockerfile syntax is correct

---

## Next Steps

1. **Monitor**: Set up Azure Monitor or Application Insights
2. **Custom Domain**: Attach a custom domain name using Azure Front Door or Traffic Manager
3. **Autoscaling**: Use Azure Container Instances with event-driven autoscaling
4. **CI/CD**: Set up GitHub Actions to auto-deploy on code changes

---

## Additional Resources

- [Azure Container Instances Documentation](https://learn.microsoft.com/azure/container-instances/)
- [Azure CLI Reference](https://learn.microsoft.com/cli/azure/)
- [Container Registry Documentation](https://learn.microsoft.com/azure/container-registry/)
- [Pricing Calculator](https://azure.microsoft.com/pricing/calculator/)

---

## Support

For issues with:
- **Azure**: https://support.azure.com
- **Docker**: https://docs.docker.com/support/
- **FastAPI**: https://fastapi.tiangolo.com/

