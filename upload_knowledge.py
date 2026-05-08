import httpx
import time

FILE_PATH = r"C:\Users\ABHISHEK\Desktop\knowledge_clean.txt"
ENDPOINT  = "http://127.0.0.1:8001/api/knowledge/upload"
CHUNK_SIZE = 2000
DELAY      = 2

with open(FILE_PATH, encoding="utf-8") as f:
    text = f.read()

chunks = [text[i : i + CHUNK_SIZE] for i in range(0, len(text), CHUNK_SIZE)]
chunks = [c.strip() for c in chunks if c.strip()]

total   = len(chunks)
success = 0
failed  = 0

print(f"File size   : {len(text):,} characters")
print(f"Total chunks: {total}")
print("-" * 40)

for i, chunk in enumerate(chunks, start=1):
    print(f"Uploading chunk {i} of {total}...", end=" ", flush=True)
    try:
        resp = httpx.post(ENDPOINT, json={"text": chunk, "source": "knowledge_clean.txt"}, timeout=30)
        resp.raise_for_status()
        data = resp.json()
        print(f"OK  ({data.get('chunks_created', '?')} sub-chunks stored)")
        success += 1
    except Exception as exc:
        print(f"FAILED — {exc}")
        failed += 1
    if i < total:
        time.sleep(DELAY)

print("-" * 40)
print(f"Done. {success}/{total} uploaded successfully." + (f"  {failed} failed." if failed else ""))
