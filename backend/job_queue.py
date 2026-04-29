"""Lightweight in-memory job manager for long-running AI tasks."""

import asyncio
import uuid
from datetime import datetime
from typing import Any, Awaitable, Callable, Dict, Optional


class JobStatus:
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class InMemoryJobQueue:
    def __init__(self):
        self.jobs: Dict[str, Dict[str, Any]] = {}
        self._lock = asyncio.Lock()

    async def enqueue(self, task_factory: Callable[[], Awaitable[Any]]) -> str:
        job_id = str(uuid.uuid4())
        async with self._lock:
            self.jobs[job_id] = {
                "id": job_id,
                "status": JobStatus.PENDING,
                "created_at": datetime.utcnow().isoformat(),
                "started_at": None,
                "completed_at": None,
                "result": None,
                "error": None,
            }

        asyncio.create_task(self._run_job(job_id, task_factory))
        return job_id

    async def _run_job(self, job_id: str, task_factory: Callable[[], Awaitable[Any]]) -> None:
        async with self._lock:
            if job_id not in self.jobs:
                return
            self.jobs[job_id]["status"] = JobStatus.RUNNING
            self.jobs[job_id]["started_at"] = datetime.utcnow().isoformat()

        try:
            result = await task_factory()
            async with self._lock:
                self.jobs[job_id]["status"] = JobStatus.COMPLETED
                self.jobs[job_id]["result"] = result
                self.jobs[job_id]["completed_at"] = datetime.utcnow().isoformat()
        except Exception as exc:  # Keep job manager resilient
            async with self._lock:
                self.jobs[job_id]["status"] = JobStatus.FAILED
                self.jobs[job_id]["error"] = str(exc)
                self.jobs[job_id]["completed_at"] = datetime.utcnow().isoformat()

    async def get(self, job_id: str) -> Optional[Dict[str, Any]]:
        async with self._lock:
            return self.jobs.get(job_id)


job_queue = InMemoryJobQueue()
