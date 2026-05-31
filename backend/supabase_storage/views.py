import os
import re
from pathlib import PurePosixPath
from uuid import uuid4

from django.conf import settings
from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView
from supabase import create_client


MAX_UPLOAD_SIZE = 10 * 1024 * 1024
ALLOWED_CONTENT_TYPES = {
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
}


def get_setting(name, default=""):
    return getattr(settings, name, None) or os.getenv(name, default)


def get_supabase_client():
    supabase_url = get_setting("SUPABASE_URL")
    service_role_key = get_setting("SUPABASE_SERVICE_ROLE_KEY")

    if not supabase_url or not service_role_key:
        raise RuntimeError(
            "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in Django settings/.env."
        )

    return create_client(supabase_url, service_role_key)


def sanitize_path_part(value):
    value = str(value or "").strip().replace("\\", "/")
    value = re.sub(r"[^a-zA-Z0-9._/-]+", "-", value)
    value = re.sub(r"-+", "-", value).strip("-./")
    return value or "upload"


def infer_bucket_and_folder(raw_path):
    clean_path = sanitize_path_part(raw_path)
    parts = [part for part in clean_path.split("/") if part]
    root = parts[0] if parts else "uploads"

    post_bucket = get_setting("SUPABASE_POST_BUCKET", "officer-posts")
    perks_bucket = get_setting("SUPABASE_PERKS_BUCKET", "officer-perks-discounts")
    events_bucket = get_setting("SUPABASE_EVENTS_BUCKET", "officer-calendar-events")

    root_key = root.lower()

    if root_key in {"newsposts", "posts", "officer-posts", "officer_posts"}:
        return post_bucket, parts[1:] or ["uploads"]

    if root_key in {
        "perksdiscounts",
        "perks-discounts",
        "perks",
        "officer-perks-discounts",
        "officer_perks_discounts",
    }:
        return perks_bucket, parts[1:] or ["uploads"]

    if root_key in {
        "calendarevents",
        "calendar-events",
        "events",
        "officer-calendar-events",
        "officer_calendar_events",
    }:
        return events_bucket, parts[1:] or ["uploads"]

    return post_bucket, parts


def build_object_path(folder_parts, uploaded_file):
    original_name = sanitize_path_part(uploaded_file.name or "image")
    extension = PurePosixPath(original_name).suffix.lower()
    if extension not in {".jpg", ".jpeg", ".png", ".webp", ".gif"}:
        extension = ".jpg"

    folder = "/".join(sanitize_path_part(part) for part in folder_parts if part)
    filename = f"{uuid4().hex}{extension}"
    return f"{folder}/{filename}" if folder else filename


class SupabaseUploadView(APIView):
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        uploaded_file = request.FILES.get("file")
        raw_path = request.data.get("path") or "uploads/image"

        if not uploaded_file:
            return Response(
                {"detail": "No file was uploaded. Expected multipart field named 'file'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if uploaded_file.size > MAX_UPLOAD_SIZE:
            return Response(
                {"detail": "File is too large. Maximum allowed size is 10MB."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if uploaded_file.content_type not in ALLOWED_CONTENT_TYPES:
            return Response(
                {"detail": "Only JPG, PNG, WEBP, and GIF image uploads are allowed."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        bucket, folder_parts = infer_bucket_and_folder(raw_path)
        object_path = build_object_path(folder_parts, uploaded_file)

        try:
            client = get_supabase_client()
            file_bytes = uploaded_file.read()

            client.storage.from_(bucket).upload(
                path=object_path,
                file=file_bytes,
                file_options={
                    "content-type": uploaded_file.content_type,
                    "upsert": "true",
                },
            )

            public_url = client.storage.from_(bucket).get_public_url(object_path)

            return Response(
                {
                    "bucket": bucket,
                    "path": object_path,
                    "publicUrl": public_url,
                    "public_url": public_url,
                    "url": public_url,
                },
                status=status.HTTP_201_CREATED,
            )
        except Exception as exc:
            return Response(
                {
                    "detail": "Supabase upload failed.",
                    "error": str(exc),
                    "bucket": bucket,
                    "path": object_path,
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
