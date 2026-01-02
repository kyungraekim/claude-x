<!-- name: debug -->
<!-- triggers: /debug, debugging, troubleshoot, error, fix -->
<!-- environment: generic -->
<!-- description: Debugging workflows and troubleshooting guide -->

# Debugging and Troubleshooting Guide

You are helping the user **debug** and troubleshoot issues.

## Environment

- **Platform**: {{PLATFORM}}
- **Working Directory**: {{WORKING_DIR}}

## General Debugging Workflow

### 1. Identify the Problem

Ask clarifying questions:
- What were you trying to do?
- What did you expect to happen?
- What actually happened?
- When did the problem start?
- Has this worked before?

### 2. Gather Information

Collect relevant data:

```bash
# Check error logs
tail -n 100 error.log

# Check system resources
top
free -h
df -h

# Check process status
ps aux | grep <process-name>

# Check environment
env | grep <RELEVANT_VAR>
```

### 3. Reproduce the Issue

Try to reproduce the problem:
- Use minimal example
- Isolate variables
- Document exact steps

### 4. Form Hypothesis

Based on information, form hypothesis about cause:
- Configuration issue?
- Resource problem (memory, disk, GPU)?
- Dependency mismatch?
- Code bug?
- Environment difference?

### 5. Test and Fix

Test hypothesis:
- Make one change at a time
- Test after each change
- Document what works and what doesn't

## Common ML Training Issues

### Out of Memory (OOM)

**Symptoms:**
- CUDA OOM error
- Process killed (exit code 137)
- "RuntimeError: CUDA out of memory"

**Debugging:**

```bash
# Check GPU memory
nvidia-smi

# Check process memory usage
nvidia-smi pmon -s m
```

**Solutions:**

1. Reduce batch size
2. Use gradient accumulation
3. Enable mixed precision
4. Clear cache: `torch.cuda.empty_cache()`
5. Use smaller model
6. Free up GPU memory from other processes

### Slow Training

**Symptoms:**
- Training much slower than expected
- Low GPU utilization

**Debugging:**

```bash
# Check GPU utilization
nvidia-smi -l 1

# Check CPU usage
htop

# Check I/O wait
iotop
```

**Solutions:**

1. Increase DataLoader workers
2. Use pinned memory
3. Profile code to find bottlenecks
4. Check if CPU-bound (increase workers)
5. Check if I/O-bound (use faster storage)
6. Enable mixed precision

### NaN or Inf Loss

**Symptoms:**
- Loss becomes NaN or Inf
- Gradients explode

**Debugging:**

```python
# Check for NaN in tensors
torch.isnan(tensor).any()

# Check gradient norms
total_norm = torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=float('inf'))
print(f'Gradient norm: {total_norm}')
```

**Solutions:**

1. Lower learning rate
2. Use gradient clipping
3. Check input data for NaN/Inf
4. Use batch normalization
5. Initialize weights properly
6. Use mixed precision with loss scaling

### Import Errors

**Symptoms:**
- ModuleNotFoundError
- ImportError

**Debugging:**

```bash
# Check Python path
python -c "import sys; print('\n'.join(sys.path))"

# Check if package installed
pip list | grep <package-name>

# Check package version
python -c "import <package>; print(<package>.__version__)"
```

**Solutions:**

1. Install missing package: `pip install <package>`
2. Verify correct virtual environment activated
3. Check Python version compatibility
4. Reinstall package: `pip install --force-reinstall <package>`

### CUDA Errors

**Symptoms:**
- "CUDA error: device-side assert triggered"
- "CUDA runtime error"

**Debugging:**

```bash
# Check CUDA version
nvcc --version

# Check PyTorch CUDA
python -c "import torch; print(torch.version.cuda)"

# Run with CUDA error checking
CUDA_LAUNCH_BLOCKING=1 python train.py
```

**Solutions:**

1. Verify CUDA/PyTorch compatibility
2. Update GPU drivers
3. Check for out-of-bounds indices
4. Reduce precision (use float32 instead of float64)

## Log Analysis

### Finding Error Patterns

```bash
# Find all errors
grep -i "error" logfile.log

# Find exceptions
grep -i "exception\|traceback" logfile.log

# Find warnings
grep -i "warning" logfile.log

# Context around errors (5 lines before/after)
grep -B 5 -A 5 -i "error" logfile.log
```

### Analyzing Metrics

```bash
# Extract loss values
grep "Loss:" logfile.log | awk '{print $2}'

# Plot with gnuplot (if available)
grep "Loss:" logfile.log | awk '{print NR, $2}' | gnuplot -e "set terminal dumb; plot '-' with lines"
```

## Environment Debugging

### Python Environment

```bash
# Check Python version
python --version

# Check virtual environment
which python

# List installed packages
pip list

# Check specific package
pip show <package-name>

# Verify package imports
python -c "import <package>"
```

### CUDA/GPU Environment

```bash
# Check NVIDIA driver
nvidia-smi

# Check CUDA version
nvcc --version
cat /usr/local/cuda/version.txt

# Check cuDNN version
cat /usr/local/cuda/include/cudnn_version.h | grep CUDNN_MAJOR -A 2

# Test CUDA with PyTorch
python -c "import torch; print(f'CUDA available: {torch.cuda.is_available()}'); print(f'CUDA device count: {torch.cuda.device_count()}')"
```

## Performance Profiling

### PyTorch Profiler

```python
from torch.profiler import profile, ProfilerActivity

with profile(activities=[ProfilerActivity.CPU, ProfilerActivity.CUDA]) as prof:
    # Your training code
    output = model(input)
    loss.backward()

print(prof.key_averages().table(sort_by="cuda_time_total"))
```

### Line Profiler

```bash
# Install
pip install line_profiler

# Add @profile decorator to functions
# Run profiler
kernprof -l -v train.py
```

## Checkpoint Debugging

### Verify Checkpoint

```python
# Load and inspect checkpoint
checkpoint = torch.load('checkpoint.pt', map_location='cpu')
print('Checkpoint keys:', checkpoint.keys())
print('Epoch:', checkpoint.get('epoch'))
print('Model keys:', checkpoint['model_state_dict'].keys())
```

### Fix Corrupted Checkpoint

```python
# Try loading with weights_only
checkpoint = torch.load('checkpoint.pt', weights_only=True)

# If corrupted, try older checkpoint
checkpoints = sorted(glob.glob('checkpoint_*.pt'))
for ckpt in reversed(checkpoints):
    try:
        checkpoint = torch.load(ckpt)
        print(f'Successfully loaded: {ckpt}')
        break
    except:
        print(f'Failed to load: {ckpt}')
```

## System-Level Debugging

### Check Disk Space

```bash
# Disk usage
df -h

# Find large files
du -sh * | sort -h

# Find largest directories
du -h --max-depth=1 | sort -h
```

### Check Memory

```bash
# Memory usage
free -h

# Per-process memory
ps aux --sort=-%mem | head

# Memory leaks (if available)
valgrind --leak-check=full python train.py
```

### Check Network

```bash
# Test connectivity
ping google.com

# Check DNS
nslookup google.com

# Test specific port
nc -zv hostname port

# Check network speed
wget --output-document=/dev/null http://speedtest.tele2.net/100MB.zip
```

## Best Practices

1. **Enable Logging**: Use proper logging levels
2. **Version Control**: Track code, configs, and environment
3. **Reproducibility**: Set random seeds, save configs
4. **Monitoring**: Track metrics, resource usage
5. **Documentation**: Document issues and solutions
6. **Incremental Testing**: Test small changes
7. **Backup**: Keep backup checkpoints

## Tools Available

- **bash**: Execute debugging commands
- **read**: Read log files, configs, code
- **write**: Create debug scripts, save fixes
- **grep**: Search logs for errors and patterns

Use these tools systematically to debug and resolve issues.
