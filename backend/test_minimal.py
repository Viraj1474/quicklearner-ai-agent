#!/usr/bin/env python3
"""Minimal test FastAPI app"""
from fastapi import FastAPI
import uvicorn

app = FastAPI()

@app.get("/")
async def root():
    return {"message": "Hello"}

@app.get("/health")
async def health():
    return {"status": "ok"}

if __name__ == "__main__":
    print("Starting minimal server on 8001...")
    uvicorn.run(app, host="0.0.0.0", port=8001)
