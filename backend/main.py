from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
import asyncio
import json
import os
import uuid
import random
import tempfile
import boto3
import requests
import urllib.parse
from botocore.exceptions import ClientError
from dotenv import load_dotenv
from generate_pptx import generate_presentation as create_pptx
from generate_word import create_word
import anthropic

TEMP_DIR = tempfile.gettempdir()
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

from botocore.config import Config

r2 = boto3.client(
    "s3",
    endpoint_url=os.getenv("R2_ENDPOINT"),
    aws_access_key_id=os.getenv("R2_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("R2_SECRET_ACCESS_KEY"),
    config=Config(signature_version="s3v4"),
    region_name="auto",
)

BUCKET = os.getenv("R2_BUCKET_NAME")


def detect_language(prompt: str) -> str:
    kurdish_keywords = [
        'بە کوردی', 'بکە کوردی', 'کوردی بنووسە', 'بزمانی کوردی',
        'به کوردی', 'Kurdish', 'kurdish', 'in Kurdish', 'in kurdish',
        'کوردی بێت', 'زمانی کوردی', 'make it kurdish', 'write in kurdish'
    ]
    prompt_lower = prompt.lower()
    for kw in kurdish_keywords:
        if kw.lower() in prompt_lower:
            return 'kurdish'
    return 'english'


def ask_claude(prompt: str, output_type: str, slides: int, tone: str, file_text: str = "",
               audience: str = "general", purpose: str = "education", level: str = "intermediate",
               detail: str = "normal", include_stats: bool = True, include_examples: bool = True,
               include_conclusion: bool = True, include_images: bool = True, include_ai_images: bool = False) -> dict:
    lang = detect_language(prompt)

    if lang == 'kurdish':
        lang_instruction = "زمان: کوردی (سۆرانی) — هەموو ناوەڕۆک بە کوردی بنووسە"
        create_pptx_phrase = "پێشکەشکردنێک دروست بکە دەربارەی"
        create_word_phrase = "ڕاپۆرتێک دروست بکە دەربارەی"
        extra = f"\n\nناوەڕۆکی فایلی بارکراو:\n{file_text}" if file_text else ""
    else:
        lang_instruction = "Language: English — write ALL content in English"
        create_pptx_phrase = "Create a presentation about"
        create_word_phrase = "Create a report about"
        extra = f"\n\nUploaded file content:\n{file_text}" if file_text else ""

    detail_map = {"brief": "3 bullet points per slide, concise", "normal": "5 bullet points per slide, clear explanations", "detailed": "7+ bullet points per slide with full explanations and sub-points"}
    bullets_instruction = detail_map.get(detail, detail_map["normal"])
    extras_instruction = []
    if include_stats: extras_instruction.append("include relevant statistics and data where appropriate")
    if include_examples: extras_instruction.append("include real-world examples to illustrate key points")
    if include_conclusion: extras_instruction.append("ALWAYS add exactly one separate summary/conclusion slide at the very end. DO NOT mention 'Conclusion' on any other slide.")
    if include_images or include_ai_images:
        extras_instruction.append("provide 3-4 specific English keywords in 'image_keywords' (e.g. 'macOS terminal') ONLY for 1 slide if total slides <= 5, or 2 slides if total slides <= 10, or 3 slides maximum for longer presentations. Pick only the slides where an image adds the most value. NEVER add images to the first slide or the conclusion slide.")
    extras_str = ", ".join(extras_instruction) if extras_instruction else ""

    if output_type == "pptx":
        system = f"""You are an expert professional presentation designer. Stick strictly to the user's intent. If the topic is software, do not talk about cars.
Your response MUST be valid JSON in this exact format:
{{
  "title": "Presentation Title",
  "slides": [
    {{"title": "Slide Title", "content": ["Point one", "Point two"], "image_keywords": "keyword1 keyword2"}},
    ...
  ]
}}

REQUIREMENTS:
- Tone: {tone}
- Number of slides: {slides}
- Content depth: {bullets_instruction}
- MAX BULLETS: Exactly 5 concise bullet points per slide. NEVER exceed 5.
- CONCLUSION: The final slide must be a high-level summary. Focus on impact, not detail.
{f'- Additional: {extras_str}' if extras_str else ''}
- {lang_instruction}
- Accurate Topic: Stick strictly to the specific subject. If topic is computers, DO NOT show cars.
- Do NOT repeat titles in content.
Output ONLY the JSON, nothing else."""
        user = f"{create_pptx_phrase}: {prompt}{extra}"
    else:
        system = f"""You are an expert professional report writer.
Your response MUST be valid JSON in this exact format:
{{
  "title": "Report Title",
  "sections": [
    {{"heading": "Section Heading", "paragraphs": ["Detailed paragraph one...", "Detailed paragraph two..."]}},
    ...
  ]
}}

REQUIREMENTS:
- Tone: {tone}
- Target audience: {audience}
- Content depth: {bullets_instruction}
{f'- Additional: {extras_str}' if extras_str else ''}
- {lang_instruction}
Output ONLY the JSON, nothing else."""
        user = f"{create_word_phrase}: {prompt}{extra}"

    message = claude.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=8192,
        messages=[{"role": "user", "content": user}],
        system=system,
    )

    import json
    text = message.content[0].text.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    text = text.strip()

    # Fix truncated JSON by closing open brackets
    try:
        result = json.loads(text)
    except json.JSONDecodeError:
        # Count open/close braces and brackets and close them
        open_braces = text.count('{') - text.count('}')
        open_brackets = text.count('[') - text.count(']')
        # Remove trailing comma if any
        text = text.rstrip().rstrip(',')
        text += ']' * open_brackets + '}' * open_braces
        result = json.loads(text)

    tokens = (message.usage.input_tokens or 0) + (message.usage.output_tokens or 0)
    result["__tokens__"] = tokens
    return result


def download_image(description: str, ai: bool = False) -> str:
    print(f"--- Attempting image download for: {description[:50]}... (AI={ai}) ---")

    stop_words = {'a', 'the', 'an', 'in', 'on', 'with', 'at', 'by', 'of', 'for', 'is', 'and', 'or', 'to', 'from', 'about', 'vs', 'comparison', 'history', 'impact', 'legacy'}
    words = description.lower().replace(".", " ").replace(",", " ").replace(":", " ").replace("-", " ").split()
    keywords = [w for w in words if w not in stop_words and len(w) > 2]
    if not keywords:
        keywords = ["professional", "modern"]

    seed = random.randint(1, 100000)
    key_phrase = " ".join(keywords[:8])

    if ai:
        prompt = f"{key_phrase}, professional photography, realistic, highly detailed, 8k resolution"
    else:
        prompt = f"{key_phrase}, photorealistic stock photo, sharp, well lit, professional"

    query_safe = urllib.parse.quote(prompt)
    tag_query = urllib.parse.quote(",".join(keywords[:2]))
    urls = [
        f"https://image.pollinations.ai/prompt/{query_safe}?width=800&height=600&nologo=true&seed={seed}&model=turbo",
        f"https://image.pollinations.ai/prompt/{query_safe}?width=800&height=600&nologo=true&seed={seed}&model=flux",
        f"https://loremflickr.com/800/600/{tag_query}?random={seed}",
    ]

    img_id = str(uuid.uuid4())
    local_path = os.path.join(TEMP_DIR, f"img_{img_id}.jpg")

    for url in urls:
        try:
            print(f"Trying: {url[:80]}...")
            timeout = 20 if "turbo" in url else 35 if "pollinations" in url else 8
            resp = requests.get(url, timeout=timeout, allow_redirects=True)
            if resp.status_code == 200 and len(resp.content) > 5000:
                with open(local_path, "wb") as f:
                    f.write(resp.content)
                print(f"Downloaded image OK: {local_path}")
                return local_path
        except Exception as e:
            print(f"Image error: {str(e)}")
            continue

    print("All image sources failed.")
    return None


def upload_to_r2(local_path: str, filename: str, content_type: str) -> str:
    with open(local_path, "rb") as f:
        r2.put_object(Bucket=BUCKET, Key=filename, Body=f, ContentType=content_type)
    return filename


@app.post("/generate")
async def generate(
    prompt: str = Form(...),
    output_type: str = Form(...),
    slides: int = Form(10),
    theme: str = Form("dark"),
    tone: str = Form("formal"),
    audience: str = Form("general"),
    purpose: str = Form("education"),
    level: str = Form("intermediate"),
    detail: str = Form("normal"),
    include_stats: str = Form("true"),
    include_examples: str = Form("true"),
    include_conclusion: str = Form("true"),
    include_images: str = Form("false"),
    include_ai_images: str = Form("false"),
    style: str = Form("classic"),
    file: UploadFile = File(None),
):
    file_text = ""
    if file:
        content = await file.read()
        filename_lower = (file.filename or "").lower()
        try:
            if filename_lower.endswith(".pdf"):
                import fitz
                doc = fitz.open(stream=content, filetype="pdf")
                file_text = "\n".join(page.get_text() for page in doc)[:5000]
            elif filename_lower.endswith(".docx"):
                import io
                from docx import Document
                doc = Document(io.BytesIO(content))
                file_text = "\n".join(p.text for p in doc.paragraphs if p.text.strip())[:5000]
            else:
                file_text = content.decode("utf-8")[:5000]
        except Exception:
            file_text = ""

    async def event_stream():
        yield f"data: {json.dumps({'status': 'generating'})}\n\n"
        try:
            data = await asyncio.to_thread(
                ask_claude,
                prompt, output_type, slides, tone, file_text,
                audience=audience, purpose=purpose, level=level,
                detail=detail,
                include_stats=include_stats.lower() == "true",
                include_examples=include_examples.lower() == "true",
                include_conclusion=include_conclusion.lower() == "true",
                include_images=include_images.lower() == "true",
                include_ai_images=include_ai_images.lower() == "true",
            )
        except Exception as e:
            yield f"data: {json.dumps({'status': 'error', 'detail': f'Claude error: {str(e)}'})}\n\n"
            return

        file_id = str(uuid.uuid4())
        use_ai = include_ai_images.lower() == "true"

        if output_type == "pptx":
            main_title = data.get("title", "")
            for slide in data.get("slides", []):
                keywords = slide.get("image_keywords")
                if keywords:
                    search_query = f"{main_title} {slide.get('title', '')} {keywords}"
                    yield f"data: {json.dumps({'status': 'ai_photo' if use_ai else 'photo', 'slide': slide.get('title', '')})}\n\n"
                    path = await asyncio.to_thread(download_image, search_query, use_ai)
                    if path:
                        slide["image_path"] = path

            yield f"data: {json.dumps({'status': 'creating_file'})}\n\n"
            local_path = os.path.join(TEMP_DIR, f"{file_id}.pptx")
            await asyncio.to_thread(create_pptx, data, local_path, theme, style)
            filename = f"{file_id}.pptx"
            content_type = "application/vnd.openxmlformats-officedocument.presentationml.presentation"
        else:
            yield f"data: {json.dumps({'status': 'creating_file'})}\n\n"
            local_path = os.path.join(TEMP_DIR, f"{file_id}.docx")
            await asyncio.to_thread(create_word, data, local_path)
            filename = f"{file_id}.docx"
            content_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

        yield f"data: {json.dumps({'status': 'uploading'})}\n\n"
        tokens_used = data.pop("__tokens__", 0)
        r2_key = None
        try:
            r2_key = await asyncio.to_thread(upload_to_r2, local_path, filename, content_type)
        except Exception:
            pass

        result = {
            "success": True,
            "r2_key": r2_key,
            "filename": filename,
            "title": data.get("title", "ڕاپۆرتەکەم"),
            "download_path": f"/download/{file_id}/{output_type}",
            "r2_download": f"/r2/{filename}" if r2_key else None,
            "tokens_used": tokens_used,
        }
        yield f"data: {json.dumps({'status': 'done', 'result': result})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@app.get("/download/{file_id}/{output_type}")
async def download(file_id: str, output_type: str):
    ext = "pptx" if output_type == "pptx" else "docx"
    path = os.path.join(TEMP_DIR, f"{file_id}.{ext}")
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="فایل نەدۆزرایەوە")
    return FileResponse(path, filename=f"raportakam.{ext}")


@app.get("/r2/{filename}")
async def download_r2(filename: str):
    try:
        ext = filename.split(".")[-1]
        local_path = os.path.join(TEMP_DIR, filename)
        # Download from R2 to temp then serve
        r2.download_file(BUCKET, filename, local_path)
        media_type = (
            "application/vnd.openxmlformats-officedocument.presentationml.presentation"
            if ext == "pptx"
            else "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        )
        return FileResponse(local_path, filename=filename, media_type=media_type)
    except ClientError:
        raise HTTPException(status_code=404, detail="File not found in storage")


@app.get("/admin/users")
async def admin_users(secret: str = ""):
    if secret != os.getenv("ADMIN_SECRET", "raportakam-admin-2026"):
        raise HTTPException(status_code=403, detail="Forbidden")
    try:
        from supabase import create_client
        sb = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SECRET_KEY"))

        # Get all profiles
        profiles_res = sb.table("profiles").select("*").execute()
        profiles = {p["id"]: p for p in profiles_res.data}

        # Get token stats per user
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
            # Auto-revert expired pro plans
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


@app.get("/health")
async def health():
    return {"status": "ok"}
