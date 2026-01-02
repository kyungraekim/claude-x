<!-- name: train-local -->
<!-- triggers: /train, train model, start training, local training -->
<!-- environment: local -->
<!-- description: Guide for local GPU training with Python -->

# Local Model Training Guide

You are helping the user train a machine learning model on their **local machine**.

## Environment

- **Platform**: {{PLATFORM}}
- **Working Directory**: {{WORKING_DIR}}
- **Environment Type**: Local (direct Python execution)

## Prerequisites Check

Before starting training, verify:

1. **GPU Availability**
   ```bash
   # Check for NVIDIA GPUs
   nvidia-smi
   ```

2. **Python Environment**
   ```bash
   # Check Python version
   python --version  # or python3 --version

   # Verify PyTorch GPU support (if using PyTorch)
   python -c "import torch; print(torch.cuda.is_available())"
   ```

3. **Required Libraries**
   - Ensure training framework is installed (PyTorch, TensorFlow, JAX, etc.)
   - Check for necessary dependencies

## Training Workflow

### 1. Set Up Virtual Environment (Recommended)

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Linux/macOS:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install requirements
pip install -r requirements.txt
```

### 2. GPU Configuration

For multi-GPU systems, specify which GPU(s) to use:

```bash
# Use specific GPU
CUDA_VISIBLE_DEVICES=0 python train.py

# Use multiple GPUs
CUDA_VISIBLE_DEVICES=0,1,2,3 python train.py
```

### 3. Start Training

Launch training in a persistent session to prevent interruption:

```bash
# Option 1: Using tmux (recommended)
tmux new -s training
python train.py
# Detach: Ctrl+B, then D
# Reattach: tmux attach -t training

# Option 2: Using screen
screen -S training
python train.py
# Detach: Ctrl+A, then D
# Reattach: screen -r training

# Option 3: Using nohup
nohup python train.py > training.log 2>&1 &
```

### 4. Monitor Training

Monitor training progress:

```bash
# Check GPU usage
nvidia-smi -l 1  # Update every 1 second

# Check GPU memory and utilization
nvidia-smi --query-gpu=index,memory.used,memory.total,utilization.gpu --format=csv -l 1

# Tail training logs
tail -f training.log

# Check process status
ps aux | grep train.py
```

### 5. Resource Monitoring

```bash
# CPU and memory usage
htop

# Disk I/O
iotop

# Check disk space
df -h
```

## Best Practices

### Checkpointing

Always implement checkpointing to save training progress:

```python
# PyTorch example
torch.save({
    'epoch': epoch,
    'model_state_dict': model.state_dict(),
    'optimizer_state_dict': optimizer.state_dict(),
    'loss': loss,
}, f'checkpoint_epoch_{epoch}.pt')
```

### Logging

Log important metrics:

```python
# TensorBoard
from torch.utils.tensorboard import SummaryWriter
writer = SummaryWriter('runs/experiment_1')
writer.add_scalar('Loss/train', loss, epoch)

# Weights & Biases
import wandb
wandb.init(project="my-project")
wandb.log({"loss": loss, "accuracy": acc})
```

### Error Handling

Wrap training in try-except to save state on errors:

```python
try:
    for epoch in range(num_epochs):
        # Training code
        pass
except KeyboardInterrupt:
    print("Training interrupted, saving checkpoint...")
    save_checkpoint(model, epoch)
except Exception as e:
    print(f"Error occurred: {e}")
    save_checkpoint(model, epoch)
    raise
```

## Common Issues

### Out of Memory (OOM)

If training crashes with CUDA OOM:

1. Reduce batch size
2. Use gradient accumulation
3. Enable mixed precision training (AMP)
4. Clear cache: `torch.cuda.empty_cache()`

### Slow Training

To speed up training:

1. Use DataLoader with `num_workers > 0`
2. Enable pin_memory for DataLoader
3. Use mixed precision (FP16/BF16)
4. Profile code to find bottlenecks

### Process Management

```bash
# Kill hanging process
pkill -f train.py

# Kill specific process by PID
kill -9 <PID>

# Find GPU process
nvidia-smi | grep python
```

## Resuming Training

To resume from checkpoint:

```python
checkpoint = torch.load('checkpoint_epoch_10.pt')
model.load_state_dict(checkpoint['model_state_dict'])
optimizer.load_state_dict(checkpoint['optimizer_state_dict'])
start_epoch = checkpoint['epoch'] + 1
```

## Tools Available

You have access to the following tools:

- **bash**: Execute shell commands
- **read**: Read files (training scripts, configs, logs)
- **write**: Create/modify files
- **grep**: Search for patterns in code

Use these tools to help the user set up, start, monitor, and debug their training.
