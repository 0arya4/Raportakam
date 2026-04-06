from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import asyncio
import json
import os
import re
import tempfile
import subprocess
import uuid
import shutil
import time
import boto3
from botocore.config import Config
from dotenv import load_dotenv
import anthropic
from system_prompt import SYSTEM_PROMPT

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://raportakam.com", "https://www.raportakam.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

claude = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

# ── Smart Estimation System ──────────────────────────────────────────────────
STATS_FILE = os.path.join(os.path.dirname(__file__), "generation_stats.json")
MAX_STATS = 200  # keep last 200 entries

def _load_stats():
    try:
        with open(STATS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []

def _save_stats(stats):
    try:
        with open(STATS_FILE, "w", encoding="utf-8") as f:
            json.dump(stats[-MAX_STATS:], f)
    except Exception:
        pass

def _detail_score(detail: str) -> int:
    return {"Summary": 0, "Balanced": 1, "Detailed": 2}.get(detail, 1)

def _addon_count(req) -> int:
    return sum([
        req.addon_table, req.addon_timeline, req.addon_chart_extra,
        req.addon_quotes, req.addon_comparison, req.addon_cover_page,
        req.conclusion, req.addon_references,
    ])

def smart_estimate(slide_count: int, detail_level: str, addon_count: int, is_pro: bool) -> int:
    """
    Smart time estimator. Pro uses claude-sonnet (slower, higher quality),
    Free uses claude-haiku (faster). Always keeps the two plans separated.
    Falls back to a calibrated formula when not enough same-plan data exists.
    """
    stats = _load_stats()

    # Filter to only same-plan entries for a cleaner signal
    same_plan = [e for e in stats if e.get("is_pro") == is_pro]

    def formula_estimate() -> int:
        # Calibrated separately per plan — sonnet is roughly 1.8-2x slower than haiku
        base = 45 if is_pro else 25
        t = base + max(0, slide_count - 5) * (3.5 if is_pro else 2.0)
        if detail_level == "Detailed": t += 18 if is_pro else 10
        if detail_level == "Summary":  t -= 5
        t += addon_count * (5 if is_pro else 3)
        return max(int(t), 20)

    # Need at least 5 same-plan points for KNN to be meaningful
    if len(same_plan) < 5:
        return formula_estimate()

    # KNN on same-plan data only — no cross-plan contamination
    d_score = _detail_score(detail_level)
    scored = []
    for i, entry in enumerate(same_plan):
        dist = (
            abs(entry["slide_count"] - slide_count) * 3.0 +
            abs(_detail_score(entry["detail_level"]) - d_score) * 5.0 +
            abs(entry["addon_count"] - addon_count) * 2.0
        )
        # Newer entries weighted higher (index grows toward end = newer)
        recency_weight = 1.0 + (i / len(same_plan)) * 0.6
        scored.append((dist, recency_weight, entry["actual_seconds"]))

    scored.sort(key=lambda x: x[0])
    # Use top 7 neighbors for stability (more data = smoother estimate)
    top = scored[:7]
    total_w, total_wt = 0.0, 0.0
    for dist, rw, secs in top:
        w = rw / (dist + 1.0)
        total_wt += w * secs
        total_w += w
    knn_estimate = int(total_wt / total_w) if total_w > 0 else formula_estimate()

    # Blend KNN with formula when data is limited (< 20 same-plan points)
    if len(same_plan) < 20:
        blend = len(same_plan) / 20.0          # 0.25 … 0.99
        knn_estimate = int(knn_estimate * blend + formula_estimate() * (1 - blend))

    return max(knn_estimate, 15)

def record_generation(slide_count: int, detail_level: str, addon_count: int, is_pro: bool, actual_seconds: float):
    stats = _load_stats()
    stats.append({
        "slide_count": slide_count,
        "detail_level": detail_level,
        "addon_count": addon_count,
        "is_pro": is_pro,
        "actual_seconds": round(actual_seconds),
        "ts": int(time.time()),
    })
    _save_stats(stats)

# ─────────────────────────────────────────────────────────────────────────────


@app.get("/admin/users")
async def admin_users(secret: str = ""):
    if secret != os.getenv("ADMIN_SECRET", "raportakam-admin-2026"):
        raise HTTPException(status_code=403, detail="Forbidden")
    try:
        from supabase import create_client
        sb = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SECRET_KEY"))

        profiles_res = sb.table("profiles").select("*").execute()
        profiles = {p["id"]: p for p in profiles_res.data}

        gen_res = sb.table("generations").select("user_id, tokens_used").execute()
        token_map = {}
        gen_count_map = {}
        for g in gen_res.data:
            uid = g["user_id"]
            token_map[uid] = token_map.get(uid, 0) + (g["tokens_used"] or 0)
            gen_count_map[uid] = gen_count_map.get(uid, 0) + 1

        from datetime import datetime, timezone
        now = datetime.now(timezone.utc)
        users = []
        for uid, p in profiles.items():
            plan = p.get("plan", "free")
            expires_at = p.get("plan_expires_at")
            if plan == "pro" and expires_at:
                exp = datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
                if exp < now:
                    plan = "free"
                    sb.table("profiles").update({"plan": "free", "plan_expires_at": None}).eq("id", uid).execute()
                    expires_at = None
            users.append({
                "id": uid,
                "email": p.get("email", ""),
                "full_name": p.get("full_name", ""),
                "plan": plan,
                "plan_expires_at": expires_at,
                "points": p.get("points", 100),
                "generations_used": gen_count_map.get(uid, 0),
                "tokens_used": token_map.get(uid, 0),
                "created_at": p.get("created_at", ""),
            })

        users.sort(key=lambda x: x["tokens_used"], reverse=True)
        return {"users": users, "total": len(users)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/admin/set-plan")
async def set_plan(secret: str = "", user_id: str = "", plan: str = ""):
    if secret != os.getenv("ADMIN_SECRET", "raportakam-admin-2026"):
        raise HTTPException(status_code=403, detail="Forbidden")
    if plan not in ("free", "pro"):
        raise HTTPException(status_code=400, detail="Invalid plan")
    try:
        from supabase import create_client
        from datetime import datetime, timezone, timedelta
        sb = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SECRET_KEY"))
        expires_at = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat() if plan == "pro" else None
        sb.table("profiles").update({"plan": plan, "plan_expires_at": expires_at}).eq("id", user_id).execute()
        return {"success": True, "plan_expires_at": expires_at}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/admin/add-points")
async def add_points(secret: str = "", user_id: str = "", points: int = 0):
    if secret != os.getenv("ADMIN_SECRET", "raportakam-admin-2026"):
        raise HTTPException(status_code=403, detail="Forbidden")
    try:
        from supabase import create_client
        sb = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SECRET_KEY"))
        profile = sb.table("profiles").select("points").eq("id", user_id).single().execute()
        current = profile.data.get("points", 100) or 0
        new_points = current + points
        sb.table("profiles").update({"points": new_points}).eq("id", user_id).execute()
        return {"success": True, "points": new_points}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def sanitize_js(code: str) -> str:
    # Curly/smart quotes → straight ASCII
    code = code.replace('\u201c', '"').replace('\u201d', '"')
    code = code.replace('\u2018', "'").replace('\u2019', "'")
    # Remove # from hex color strings: "#RRGGBB" → "RRGGBB"
    code = re.sub(r'(["\'])#([0-9a-fA-F]{3,6})\1', r'\1\2\1', code)
    # Strip 8-char hex colors down to 6 (opacity-in-hex is invalid)
    code = re.sub(r'(["\'])([0-9a-fA-F]{8})\1', lambda m: f'{m.group(1)}{m.group(2)[:6]}{m.group(1)}', code)
    # Fix valig → valign
    code = re.sub(r'\bvalig\b(?!n)', 'valign', code)
    # Fix align: "justified" → align: "left" (not supported by pptxgenjs)
    code = re.sub(r'align:\s*["\']justified["\']', 'align: "left"', code)
    # Replace LINE shape type with rect to avoid missing-param errors
    code = re.sub(r'pptxgen\.shapes\.LINE', 'pres.ShapeType.rect', code, flags=re.IGNORECASE)
    code = re.sub(r'pres\.ShapeType\.line\b', 'pres.ShapeType.rect', code, flags=re.IGNORECASE)
    code = re.sub(r'ShapeType\.line\b', 'pres.ShapeType.rect', code, flags=re.IGNORECASE)
    # Fix h:0 (bare zero height) → h:0.02 so rect renders, but don't touch h:0.07 etc.
    code = re.sub(r'\bh:\s*0(?![\.\d])', 'h:0.02', code)
    # Replace backtick template literals with empty string fallback (rare but happens)
    code = re.sub(r'`[^`]*`', lambda m: '"' + m.group(0)[1:-1].replace('"', '\\"').replace('${', '"+').replace('}', '+"') + '"', code)
    # Fix addChart calls with empty data arrays to avoid PptxGenJS crash
    code = re.sub(
        r'(\.addChart\s*\([^,]+,\s*)\[\s*\]',
        r'\1[{name:"Data",labels:["A","B","C","D"],values:[10,20,30,40]}]',
        code
    )
    return code


def pick_model_and_tokens(slide_count: int, is_pro: bool, addon_count: int = 0):
    model = "claude-3-5-sonnet-20241022" if is_pro else "claude-3-5-haiku-20241022"
    if slide_count <= 5:    tokens = 8000
    elif slide_count <= 10: tokens = 10000
    elif slide_count <= 15: tokens = 13000
    elif slide_count <= 20: tokens = 16000
    elif slide_count <= 25: tokens = 19000
    else:                   tokens = 22000
    # Each addon adds extra slides/content — bump the budget to avoid truncation
    tokens += addon_count * 500
    return model, tokens


class GenerateRequest(BaseModel):
    topic: str
    slide_count: int = 10
    color_theme: str = "Auto (AI decides)"
    language: str = "English"
    style: str = "Academic / University"
    detail_level: str = "Balanced"
    student_name: str = ""
    instructor_name: str = ""
    date: str = "2026"
    addon_table: bool = False
    addon_timeline: bool = False
    addon_chart_extra: bool = False
    addon_quotes: bool = False
    addon_comparison: bool = False
    addon_cover_page: bool = False
    addon_custom_text: str = ""
    conclusion: bool = True
    addon_references: bool = False
    file_name: str = "raportakam"
    is_pro: bool = False


def build_prompt(req: GenerateRequest) -> str:
    prompt = SYSTEM_PROMPT
    replacements = {
        "{{TOPIC}}":             req.topic,
        "{{SLIDE_COUNT}}":       str(req.slide_count),
        "{{COLOR_THEME}}":       req.color_theme,
        "{{LANGUAGE}}":          req.language,
        "{{STYLE}}":             req.style,
        "{{DETAIL_LEVEL}}":      req.detail_level,
        "{{STUDENT_NAME}}":      req.student_name,
        "{{INSTRUCTOR_NAME}}":   req.instructor_name,
        "{{DATE}}":              req.date,
        "{{ADDON_TABLE}}":       "ON" if req.addon_table else "OFF",
        "{{ADDON_TIMELINE}}":    "ON" if req.addon_timeline else "OFF",
        "{{ADDON_CHART_EXTRA}}": "ON" if req.addon_chart_extra else "OFF",
        "{{ADDON_QUOTES}}":      "ON" if req.addon_quotes else "OFF",
        "{{ADDON_COMPARISON}}":  "ON" if req.addon_comparison else "OFF",
        "{{ADDON_COVER_PAGE}}":  "ON" if req.addon_cover_page else "OFF",
        "{{ADDON_CUSTOM_TEXT}}": req.addon_custom_text,
        "{{CONCLUSION_SLIDE}}":   "on" if req.conclusion else "off",
        "{{ADDON_CONCLUSION}}":   "ON" if req.conclusion else "OFF",
        "{{ADDON_REFERENCES}}":   "ON" if req.addon_references else "OFF",
    }
    for k, v in replacements.items():
        prompt = prompt.replace(k, v)
    return prompt


r2 = boto3.client(
    "s3",
    endpoint_url=os.getenv("R2_ENDPOINT"),
    aws_access_key_id=os.getenv("R2_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("R2_SECRET_ACCESS_KEY"),
    config=Config(signature_version="s3v4"),
    region_name="auto",
)
BUCKET = os.getenv("R2_BUCKET_NAME")


@app.get("/estimate")
async def estimate_time(slide_count: int = 10, detail_level: str = "Balanced", addon_count: int = 0, is_pro: bool = False):
    secs = smart_estimate(slide_count, detail_level, addon_count, is_pro)
    return {"seconds": secs}


@app.post("/generate/stream")
async def generate_stream(req: GenerateRequest):
    prompt = build_prompt(req)
    _gen_start = time.time()

    async def event_stream():
        yield f"data: {json.dumps({'stage': 1, 'label': 'Analyzing topic...'})}\n\n"
        full_code = ""
        char_count = 0
        tokens_used = 0
        try:
            def run_claude():
                nonlocal full_code, char_count, tokens_used
                _model, _tokens = pick_model_and_tokens(req.slide_count, req.is_pro, _addon_count(req))
                with claude.messages.stream(
                    model=_model,
                    max_tokens=_tokens,
                    messages=[{"role": "user", "content": prompt}]
                ) as stream:
                    for text in stream.text_stream:
                        full_code += text
                        char_count += len(text)
                    usage = stream.get_final_message().usage
                    tokens_used = (usage.input_tokens or 0) + (usage.output_tokens or 0)
            await asyncio.to_thread(run_claude)
            print(f"[Claude] chars={char_count} tokens={tokens_used} has_writefile={'pres.writeFile' in full_code} last50={repr(full_code[-50:])}")
        except Exception as e:
            yield f"data: {json.dumps({'stage': -1, 'error': str(e)})}\n\n"
            return

        yield f"data: {json.dumps({'stage': 2, 'label': 'Designing layout...'})}\n\n"

        def _extract_code(raw: str) -> str:
            raw = raw.strip()
            raw = re.sub(r"^```[a-z]*\n?", "", raw)
            raw = re.sub(r"\n?```$", "", raw).strip()
            js_start = raw.find('const pptxgen = require')
            if js_start == -1:
                js_start = raw.find('const pptxgen=require')
            if js_start > 0:
                raw = raw[js_start:]
            return sanitize_js(raw.strip())

        clean_code = _extract_code(full_code)

        # Detect truncation: code must end with writeFile call
        if 'pres.writeFile' not in clean_code:
            print(f"[TRUNCATED] last100={repr(clean_code[-100:])}")
            yield f"data: {json.dumps({'stage': -1, 'error': 'کۆدەکە ناتەواو بوو. دووبارە هەوڵ بدەرەوە.'})}\n\n"
            return

        yield f"data: {json.dumps({'stage': 3, 'label': 'Generating slides...'})}\n\n"

        node_modules = os.path.join(os.path.dirname(__file__), "node_modules")
        backend_dir = os.path.dirname(__file__).replace(chr(92), "/")

        async def run_node(code_to_run: str):
            with tempfile.TemporaryDirectory() as tmpdir:
                js_path = os.path.join(tmpdir, "gen.js")
                out_path = os.path.join(tmpdir, "output.pptx")
                out_path_js = out_path.replace('\\', '/')
                code = re.sub(
                    r'fileName\s*:\s*["\']output\.pptx["\']',
                    f'fileName: "{out_path_js}"',
                    code_to_run
                )
                with open(js_path, "w", encoding="utf-8") as f:
                    f.write(f'process.chdir("{backend_dir}"); {code}')
                js_path_copy = js_path  # avoid closure issues
                def _run():
                    return subprocess.run(
                        ["node", js_path_copy],
                        capture_output=True, text=True, timeout=90,
                        env={**os.environ, "NODE_PATH": node_modules}
                    )
                res = await asyncio.to_thread(_run)
                if res.returncode == 0:
                    saved = os.path.join(tempfile.gettempdir(), f"pptx_{uuid.uuid4()}.pptx")
                    shutil.copy2(out_path, saved)
                    return res, saved
                return res, None

        async def generate_code():
            code = ""
            _model, _tokens = pick_model_and_tokens(req.slide_count, req.is_pro, _addon_count(req))
            def _call():
                nonlocal code
                with claude.messages.stream(
                    model=_model,
                    max_tokens=_tokens,
                    messages=[{"role": "user", "content": prompt}]
                ) as stream:
                    for text in stream.text_stream:
                        code += text
            await asyncio.to_thread(_call)
            return _extract_code(code)

        try:
            result, saved_path = await run_node(clean_code)

            # Auto-retry once if Node failed
            if result.returncode != 0:
                yield f"data: {json.dumps({'stage': 2, 'label': 'Retrying...'})}\n\n"
                try:
                    retry_code = await generate_code()
                except Exception as e:
                    yield f"data: {json.dumps({'stage': -1, 'error': str(e)})}\n\n"
                    return
                if 'pres.writeFile' not in retry_code:
                    yield f"data: {json.dumps({'stage': -1, 'error': 'کۆدەکە ناتەواو بوو. دووبارە هەوڵ بدەرەوە.'})}\n\n"
                    return
                yield f"data: {json.dumps({'stage': 3, 'label': 'Generating slides...'})}\n\n"
                result, saved_path = await run_node(retry_code)

            if result.returncode != 0:
                err = result.stderr or result.stdout or "Node.js error"
                err = re.sub(r'[A-Za-z]:[^\n:]+\.js:\d+\s*', '', err).strip()
                err = re.sub(r'\s+', ' ', err).strip()
                err = err[:200] if err else "کێشەیەک روویدا لە دروستکردنی فایلەکە"
                yield f"data: {json.dumps({'stage': -1, 'error': err})}\n\n"
                return

            yield f"data: {json.dumps({'stage': 4, 'label': 'Building your file...'})}\n\n"

            file_id = str(uuid.uuid4())
            r2_key = f"presentations/{file_id}.pptx"
            r2.upload_file(
                saved_path, BUCKET, r2_key,
                ExtraArgs={"ContentType": "application/vnd.openxmlformats-officedocument.presentationml.presentation"}
            )
            try:
                os.remove(saved_path)
            except Exception:
                pass
            actual_secs = time.time() - _gen_start
            record_generation(req.slide_count, req.detail_level, _addon_count(req), req.is_pro, actual_secs)
            download_url = f"/pptx/{file_id}"
            yield f"data: {json.dumps({'stage': 5, 'label': 'Ready!', 'url': download_url, 'file_id': file_id, 'tokens_used': tokens_used})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'stage': -1, 'error': str(e)})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@app.get("/pptx/{file_id}")
async def download_pptx(file_id: str, name: str = "raportakam"):
    try:
        # unique path per request to avoid conflicts
        local_path = os.path.join(tempfile.gettempdir(), f"dl_{uuid.uuid4()}.pptx")
        r2.download_file(BUCKET, f"presentations/{file_id}.pptx", local_path)
        from fastapi.responses import FileResponse
        download_name = name if name.endswith(".pptx") else f"{name}.pptx"
        return FileResponse(local_path, filename=download_name,
                            media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
                            background=None)
    except Exception:
        raise HTTPException(status_code=404, detail="File not found")


@app.get("/health")
async def health():
    return {"status": "ok"}
