<!-- name: train-slurm -->
<!-- triggers: /slurm, slurm training, sbatch, cluster training -->
<!-- environment: slurm -->
<!-- description: Guide for training on Slurm clusters -->

# Slurm Cluster Training Guide

You are helping the user train a machine learning model on a **Slurm cluster**.

## Environment

- **Platform**: {{PLATFORM}}
- **Working Directory**: {{WORKING_DIR}}
- **Environment Type**: Slurm cluster

## Slurm Overview

Slurm (Simple Linux Utility for Resource Management) is a job scheduler used on HPC clusters.

Key concepts:
- **Job**: A script submitted to the cluster
- **Partition**: A logical set of nodes (e.g., gpu, cpu, debug)
- **Node**: A physical machine in the cluster
- **Task**: A process spawned by the job

## Prerequisites

Verify Slurm is available:

```bash
# Check Slurm commands
which sbatch
which squeue
which scancel

# Check available partitions
sinfo

# Check your current jobs
squeue -u $USER
```

## Job Submission

### 1. Create Slurm Script

Create a batch script (e.g., `train.slurm`):

```bash
#!/bin/bash
#SBATCH --job-name=ml-training
#SBATCH --output=logs/train_%j.out
#SBATCH --error=logs/train_%j.err
#SBATCH --nodes=1
#SBATCH --ntasks-per-node=1
#SBATCH --cpus-per-task=8
#SBATCH --gres=gpu:4
#SBATCH --mem=64G
#SBATCH --time=24:00:00
#SBATCH --partition=gpu

# Load modules (cluster-specific)
module load python/3.10
module load cuda/11.8
module load cudnn/8.6

# Activate virtual environment
source ~/venvs/myenv/bin/activate

# Set up environment
export CUDA_VISIBLE_DEVICES=0,1,2,3
export OMP_NUM_THREADS=$SLURM_CPUS_PER_TASK

# Change to working directory
cd $SLURM_SUBMIT_DIR

# Run training
python train.py --config config.yaml
```

### 2. Submit Job

```bash
# Submit the job
sbatch train.slurm

# Submit with dependencies
sbatch --dependency=afterok:12345 train.slurm
```

## Monitoring Jobs

### Check Job Status

```bash
# View your jobs
squeue -u $USER

# Detailed job info
scontrol show job <JOBID>

# Job accounting info
sacct -j <JOBID> --format=JobID,JobName,Partition,State,Elapsed,MaxRSS

# Watch job queue
watch -n 10 'squeue -u $USER'
```

### View Output

```bash
# Tail output log
tail -f logs/train_<JOBID>.out

# Check error log
tail -f logs/train_<JOBID>.err

# View completed job output
cat logs/train_<JOBID>.out
```

## Job Control

### Cancel Jobs

```bash
# Cancel specific job
scancel <JOBID>

# Cancel all your jobs
scancel -u $USER

# Cancel by name
scancel --name=ml-training
```

### Job Arrays

For multiple experiments:

```bash
#SBATCH --array=0-9
#SBATCH --output=logs/train_%A_%a.out

# In script, use $SLURM_ARRAY_TASK_ID
python train.py --config config_${SLURM_ARRAY_TASK_ID}.yaml
```

## Best Practices

### 1. Resource Estimation

Start with short test jobs to estimate resource needs:

```bash
#SBATCH --time=00:30:00  # 30 minutes for testing
```

Then scale up based on results.

### 2. Checkpointing

**Critical**: Slurm jobs have time limits. Always checkpoint:

```python
# Save checkpoint every N epochs
if epoch % checkpoint_freq == 0:
    save_checkpoint(f'checkpoint_epoch_{epoch}.pt')

# Save on job interruption
def signal_handler(sig, frame):
    print('Job interrupted, saving checkpoint...')
    save_checkpoint('checkpoint_interrupted.pt')
    sys.exit(0)

signal.signal(signal.SIGUSR1, signal_handler)
```

### 3. Efficient Resource Use

```bash
# Request only what you need
#SBATCH --gres=gpu:2  # Not gpu:8 if you only use 2

# Use appropriate partitions
#SBATCH --partition=debug  # For short test runs

# Set realistic time limits
#SBATCH --time=12:00:00  # 12 hours, not 7 days
```

### 4. Data Location

Use fast storage (scratch space) for training:

```bash
# Copy data to local scratch
cp -r /shared/data/ $SCRATCH/data/

# Train from scratch
python train.py --data-dir $SCRATCH/data/

# Copy results back
cp -r checkpoints/ /shared/results/
```

## Multi-Node Training

### 1. PyTorch Distributed

```bash
#SBATCH --nodes=4
#SBATCH --ntasks-per-node=1
#SBATCH --gres=gpu:4

# In script
srun python train.py \
    --distributed \
    --world-size $((SLURM_NNODES * SLURM_GPUS_PER_NODE)) \
    --rank $SLURM_PROCID
```

### 2. Using torchrun

```bash
# Launch with torchrun
srun torchrun \
    --nnodes=$SLURM_NNODES \
    --nproc_per_node=$SLURM_GPUS_PER_NODE \
    --rdzv_backend=c10d \
    --rdzv_endpoint=$MASTER_ADDR:$MASTER_PORT \
    train.py
```

## Troubleshooting

### Job Pending

If job stays in PENDING state:

```bash
# Check why
squeue -u $USER --start

# Common reasons:
# - Resources: Not enough free GPUs
# - Priority: Other jobs have higher priority
# - Limits: You've hit job/resource limits
```

### Job Failed

Check logs and accounting:

```bash
# View error log
cat logs/train_<JOBID>.err

# Check job details
sacct -j <JOBID> -o JobID,State,ExitCode,DerivedExitCode

# Common exit codes:
# 0: Success
# 1: General error
# 137: Out of memory (SIGKILL)
# 143: Timeout (SIGTERM)
```

### Resuming Failed Jobs

```bash
# Resubmit with dependency on failed job
sbatch --dependency=afternotok:<FAILED_JOBID> train.slurm
```

## Useful Commands

```bash
# Check cluster status
sinfo -o "%20P %5a %.10l %16F"

# Check partition limits
scontrol show partition <PARTITION_NAME>

# Check account limits
sacctmgr show assoc user=$USER format=User,Account,MaxJobs,MaxSubmit

# Estimate start time
squeue -u $USER --start

# Job efficiency report
seff <JOBID>
```

## Tools Available

- **bash**: Execute Slurm commands
- **read**: Read job scripts and configs
- **write**: Create/modify Slurm scripts
- **grep**: Search in output logs

Use these tools to help the user submit, monitor, and debug Slurm jobs.
