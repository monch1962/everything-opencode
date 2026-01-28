# Kubernetes Deployment for Everything OpenCode

This directory contains Kubernetes manifests for deploying the Everything OpenCode application.

## Structure

```
k8s/
├── base/                    # Base configuration
│   ├── deployment.yaml     # Main application deployment
│   ├── pinescript-debug.yaml # PineScript debug server
│   ├── command-runners.yaml # Command runners (JavaScript, Python)
│   ├── configmap.yaml      # Configuration
│   ├── ingress.yaml        # Ingress configuration
│   └── kustomization.yaml  # Kustomize base configuration
├── overlays/
│   ├── dev/               # Development environment
│   ├── staging/           # Staging environment
│   └── prod/              # Production environment
└── README.md              # This file
```

## Prerequisites

1. **Kubernetes Cluster** (v1.24+)
2. **kubectl** configured to access your cluster
3. **Kustomize** (v4.5+)
4. **Ingress Controller** (nginx recommended)
5. **Cert-Manager** (for TLS certificates)
6. **Metrics Server** (for HPA)

## Quick Start

### 1. Build and Push Docker Image

```bash
# Build the image
docker build -t everything-opencode:latest .

# Tag for your registry
docker tag everything-opencode:latest your-registry/everything-opencode:latest

# Push to registry
docker push your-registry/everything-opencode:latest
```

### 2. Update Image References

Update the image references in `k8s/base/kustomization.yaml`:

```yaml
images:
  - name: everything-opencode
    newName: your-registry/everything-opencode
    newTag: latest
```

### 3. Deploy to Development

```bash
# Apply development configuration
kubectl apply -k k8s/overlays/dev

# Check deployment status
kubectl get pods -n everything-opencode-dev
kubectl get svc -n everything-opencode-dev
kubectl get ingress -n everything-opencode-dev
```

### 4. Deploy to Production

```bash
# Create namespace
kubectl create namespace everything-opencode

# Create secrets (replace with your values)
kubectl create secret generic everything-opencode-secrets \
  --namespace everything-opencode \
  --from-literal=DB_PASSWORD=your-db-password \
  --from-literal=JWT_SECRET=your-jwt-secret \
  --from-literal=SESSION_SECRET=your-session-secret

# Apply production configuration
kubectl apply -k k8s/overlays/prod
```

## Environment Configuration

### Development (`overlays/dev/`)

- Single replica deployments
- Lower resource limits
- Debug mode enabled
- Higher rate limits
- Development database/Redis

### Staging (`overlays/staging/`)

- 2 replicas for main app
- Moderate resource limits
- Debug mode enabled
- Staging database/Redis

### Production (`overlays/prod/`)

- 3+ replicas with HPA
- Higher resource limits
- Debug mode disabled
- Production database/Redis
- TLS certificates
- CORS restrictions

## Configuration

### ConfigMap

The main configuration is in `k8s/base/configmap.yaml`. Environment-specific overrides are in each overlay's `config-patch.yaml`.

Key configuration options:

| Variable          | Description               | Default      |
| ----------------- | ------------------------- | ------------ |
| `NODE_ENV`        | Node.js environment       | `production` |
| `LOG_LEVEL`       | Logging level             | `info`       |
| `DEBUG_ENABLED`   | Enable debug features     | `false`      |
| `DATABASE_URL`    | PostgreSQL connection URL | -            |
| `REDIS_URL`       | Redis connection URL      | -            |
| `API_RATE_LIMIT`  | API rate limit per window | `100`        |
| `API_RATE_WINDOW` | Rate limit window (ms)    | `900000`     |

### Secrets

Sensitive configuration should be stored in Kubernetes Secrets:

```bash
kubectl create secret generic everything-opencode-secrets \
  --namespace everything-opencode \
  --from-literal=DB_PASSWORD=your-password \
  --from-literal=JWT_SECRET=your-secret \
  --from-literal=OPENAI_API_KEY=your-key
```

## Monitoring

### Health Checks

Each deployment includes liveness and readiness probes:

- **Liveness Probe**: Checks if container is running
- **Readiness Probe**: Checks if container is ready to serve traffic

### Horizontal Pod Autoscaling (HPA)

Production environment includes HPA configurations that automatically scale based on:

- CPU utilization (target: 70%)
- Memory utilization (target: 80%)

### Resource Limits

Each container has resource requests and limits:

| Service          | CPU Request | CPU Limit | Memory Request | Memory Limit |
| ---------------- | ----------- | --------- | -------------- | ------------ |
| Main App         | 250m        | 500m      | 256Mi          | 512Mi        |
| PineScript Debug | 500m        | 1000m     | 512Mi          | 1Gi          |
| Command Runners  | 250m        | 500m      | 256Mi          | 512Mi        |

## Ingress Configuration

The ingress configuration provides routing for:

| Path            | Service             | Port | Description               |
| --------------- | ------------------- | ---- | ------------------------- |
| `/`             | everything-opencode | 80   | Main application          |
| `/debug`        | pinescript-debug    | 3005 | PineScript debug server   |
| `/api/commands` | command-runners     | 4000 | JavaScript command runner |
| `/api/python`   | command-runners     | 4001 | Python command runner     |

## Database and Cache

### PostgreSQL

The application requires PostgreSQL. You can deploy it using:

```bash
# Using Bitnami Helm chart
helm install postgres bitnami/postgresql \
  --namespace everything-opencode \
  --set auth.database=opencode \
  --set auth.username=opencode \
  --set auth.password=your-password
```

### Redis

The application requires Redis for caching and sessions:

```bash
# Using Bitnami Helm chart
helm install redis bitnami/redis \
  --namespace everything-opencode \
  --set auth.password=your-password
```

## Troubleshooting

### Common Issues

1. **Image Pull Errors**

   ```bash
   # Check image name and tag
   kubectl describe pod <pod-name> -n everything-opencode
   ```

2. **Database Connection Issues**

   ```bash
   # Check database pod status
   kubectl get pods -n everything-opencode | grep postgres

   # Check logs
   kubectl logs -f deployment/everything-opencode -n everything-opencode
   ```

3. **Ingress Not Working**

   ```bash
   # Check ingress controller
   kubectl get pods -n ingress-nginx

   # Check ingress status
   kubectl describe ingress everything-opencode -n everything-opencode
   ```

### Logs

```bash
# View application logs
kubectl logs -f deployment/everything-opencode -n everything-opencode

# View debug server logs
kubectl logs -f deployment/pinescript-debug -n everything-opencode

# View command runner logs
kubectl logs -f deployment/command-runners -n everything-opencode
```

## Cleanup

```bash
# Delete development environment
kubectl delete -k k8s/overlays/dev

# Delete production environment
kubectl delete -k k8s/overlays/prod

# Delete namespace
kubectl delete namespace everything-opencode
```

## Customization

### Adding New Services

1. Create a new deployment file in `k8s/base/`
2. Add to `k8s/base/kustomization.yaml` resources
3. Update ingress if needed
4. Add environment-specific patches in overlays

### Modifying Resources

Edit the appropriate patch files in the overlay directories:

- `deployment-patch.yaml`: Replica counts, resource limits
- `config-patch.yaml`: Environment variables
- `ingress-patch.yaml`: Routing rules

### Adding New Environments

1. Create a new directory under `k8s/overlays/`
2. Copy from an existing overlay
3. Modify `kustomization.yaml` and patch files
4. Update resource limits and configuration as needed
