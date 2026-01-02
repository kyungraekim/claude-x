<!-- name: train-kubernetes -->
<!-- triggers: /k8s, kubernetes, kubectl, kubernetes training -->
<!-- environment: kubernetes -->
<!-- description: Guide for training on Kubernetes clusters -->

# Kubernetes Training Guide

You are helping the user train a machine learning model on **Kubernetes** (K8s).

## Environment

- **Platform**: {{PLATFORM}}
- **Working Directory**: {{WORKING_DIR}}
- **Environment Type**: Kubernetes cluster

## Kubernetes Overview

Kubernetes is a container orchestration platform. For ML training:

- **Job**: Runs a task to completion
- **Pod**: Container instance running your code
- **PersistentVolume**: Storage for data and checkpoints
- **ConfigMap**: Configuration files
- **Secret**: Sensitive data (API keys, credentials)

## Prerequisites

Verify kubectl access:

```bash
# Check kubectl
kubectl version --client

# Check cluster access
kubectl cluster-info

# List nodes
kubectl get nodes

# Check namespace
kubectl get namespace
```

## Training Job Manifest

### 1. Basic Training Job

Create `train-job.yaml`:

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: ml-training-job
  namespace: default
spec:
  backoffLimit: 3
  template:
    metadata:
      labels:
        app: ml-training
    spec:
      restartPolicy: Never
      containers:
      - name: trainer
        image: your-registry/ml-trainer:latest
        imagePullPolicy: Always

        # Resource requests
        resources:
          requests:
            memory: "32Gi"
            cpu: "8"
            nvidia.com/gpu: "2"
          limits:
            memory: "64Gi"
            cpu: "16"
            nvidia.com/gpu: "2"

        # Command
        command: ["python"]
        args: ["train.py", "--config", "/config/train_config.yaml"]

        # Environment variables
        env:
        - name: CUDA_VISIBLE_DEVICES
          value: "0,1"
        - name: WANDB_API_KEY
          valueFrom:
            secretKeyRef:
              name: ml-secrets
              key: wandb-api-key

        # Volume mounts
        volumeMounts:
        - name: data
          mountPath: /data
        - name: checkpoints
          mountPath: /checkpoints
        - name: config
          mountPath: /config

      # Volumes
      volumes:
      - name: data
        persistentVolumeClaim:
          claimName: training-data-pvc
      - name: checkpoints
        persistentVolumeClaim:
          claimName: checkpoints-pvc
      - name: config
        configMap:
          name: training-config
```

### 2. Persistent Volumes

Create `pvc.yaml` for data storage:

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: training-data-pvc
spec:
  accessModes:
    - ReadWriteMany
  resources:
    requests:
      storage: 100Gi
  storageClassName: fast-ssd
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: checkpoints-pvc
spec:
  accessModes:
    - ReadWriteMany
  resources:
    requests:
      storage: 50Gi
  storageClassName: fast-ssd
```

## Deploying Jobs

### 1. Apply Manifests

```bash
# Create PVCs first
kubectl apply -f pvc.yaml

# Create ConfigMap for configs
kubectl create configmap training-config \
  --from-file=train_config.yaml

# Create Secret for API keys
kubectl create secret generic ml-secrets \
  --from-literal=wandb-api-key=YOUR_KEY_HERE

# Deploy training job
kubectl apply -f train-job.yaml
```

### 2. Verify Deployment

```bash
# Check job status
kubectl get jobs

# Check pod status
kubectl get pods -l app=ml-training

# Describe job
kubectl describe job ml-training-job
```

## Monitoring

### Check Logs

```bash
# Get pod name
POD_NAME=$(kubectl get pods -l app=ml-training -o jsonpath='{.items[0].metadata.name}')

# View logs
kubectl logs $POD_NAME -f

# View logs from previous run (if crashed)
kubectl logs $POD_NAME --previous

# Logs from specific container
kubectl logs $POD_NAME -c trainer
```

### Check Resource Usage

```bash
# Pod metrics
kubectl top pod $POD_NAME

# Node metrics
kubectl top nodes

# Describe pod
kubectl describe pod $POD_NAME
```

### Access Pod Shell

```bash
# Execute commands in pod
kubectl exec -it $POD_NAME -- /bin/bash

# Check GPU availability
kubectl exec $POD_NAME -- nvidia-smi
```

## Job Control

### Delete Jobs

```bash
# Delete job (keeps logs)
kubectl delete job ml-training-job

# Delete with cascade
kubectl delete job ml-training-job --cascade=foreground
```

### Restart/Rerun

```bash
# Delete and reapply
kubectl delete job ml-training-job
kubectl apply -f train-job.yaml
```

## Distributed Training

### PyTorch Distributed with pytorchjob

Using Kubeflow Training Operator:

```yaml
apiVersion: kubeflow.org/v1
kind: PyTorchJob
metadata:
  name: pytorch-distributed
spec:
  pytorchReplicaSpecs:
    Master:
      replicas: 1
      restartPolicy: OnFailure
      template:
        spec:
          containers:
          - name: pytorch
            image: your-registry/pytorch-trainer:latest
            resources:
              limits:
                nvidia.com/gpu: 4
    Worker:
      replicas: 3
      restartPolicy: OnFailure
      template:
        spec:
          containers:
          - name: pytorch
            image: your-registry/pytorch-trainer:latest
            resources:
              limits:
                nvidia.com/gpu: 4
```

## Best Practices

### 1. Checkpointing

Always save to PersistentVolume:

```python
# Save checkpoints to mounted volume
checkpoint_dir = '/checkpoints'
torch.save(model.state_dict(),
           f'{checkpoint_dir}/checkpoint_epoch_{epoch}.pt')
```

### 2. Resource Limits

Set appropriate requests and limits:

```yaml
resources:
  requests:  # Minimum guaranteed
    memory: "32Gi"
    nvidia.com/gpu: "2"
  limits:    # Maximum allowed
    memory: "64Gi"
    nvidia.com/gpu: "2"
```

### 3. Node Selection

Use node selectors for GPU nodes:

```yaml
spec:
  template:
    spec:
      nodeSelector:
        accelerator: nvidia-tesla-v100
```

### 4. Tolerations

For dedicated GPU nodes:

```yaml
spec:
  template:
    spec:
      tolerations:
      - key: "nvidia.com/gpu"
        operator: "Exists"
        effect: "NoSchedule"
```

### 5. Init Containers

Download data before training:

```yaml
initContainers:
- name: download-data
  image: busybox
  command: ['sh', '-c', 'wget -O /data/dataset.tar.gz http://...']
  volumeMounts:
  - name: data
    mountPath: /data
```

## Troubleshooting

### Pod Pending

Check why pod isn't starting:

```bash
kubectl describe pod $POD_NAME

# Common issues:
# - ImagePullBackOff: Can't pull container image
# - Pending: Not enough resources (GPUs, memory)
# - CrashLoopBackOff: Container keeps crashing
```

### Pod Failed

Check logs and events:

```bash
# View logs
kubectl logs $POD_NAME --previous

# View events
kubectl get events --sort-by='.lastTimestamp'

# Describe pod for details
kubectl describe pod $POD_NAME
```

### Out of Memory

If pod OOMKilled:

1. Increase memory limits
2. Reduce batch size
3. Enable gradient checkpointing

### GPU Not Available

Verify GPU resources:

```bash
# Check node GPU capacity
kubectl describe node <NODE_NAME> | grep -A 5 "Capacity"

# Verify GPU plugin
kubectl get pods -n kube-system | grep nvidia-device-plugin
```

## Useful Commands

```bash
# List all jobs
kubectl get jobs --all-namespaces

# Watch pod status
kubectl get pods -w

# Port forward for TensorBoard
kubectl port-forward $POD_NAME 6006:6006

# Copy files from pod
kubectl cp $POD_NAME:/checkpoints ./local-checkpoints/

# Copy files to pod
kubectl cp ./config.yaml $POD_NAME:/config/

# Delete completed jobs
kubectl delete jobs --field-selector status.successful=1
```

## Tools Available

- **bash**: Execute kubectl commands
- **read**: Read manifests and configs
- **write**: Create/modify Kubernetes YAML files
- **grep**: Search in logs and manifests

Use these tools to help the user deploy, monitor, and debug Kubernetes training jobs.
