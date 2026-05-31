from django.utils.dateparse import parse_datetime
from rest_framework import serializers
from .models import OfficerPerksDiscount

READ_ONLY_KEYS = {"id", "created_at", "updated_at", "createdAt", "updatedAt"}
FIELD_MAP = {
    "companyName": "company_name",
    "postHeader": "post_header",
    "postContent": "post_content",
    "photoURLs": "photo_urls",
    "customCategory": "custom_category",
    "startDate": "start_date",
    "endDate": "end_date",
    "allDay": "all_day",
    "startTime": "start_time",
    "endTime": "end_time",
    "postedOn": "posted_on",
    "effectiveStatus": "effective_status",
    "closedReason": "closed_reason",
    "closedBySystem": "closed_by_system",
    "closedAt": "closed_at",
    "reopenedAt": "reopened_at",
    "authorUid": "author_uid",
    "authorEmail": "author_email",
    "authorName": "author_name",
    "authorRole": "author_role",
}
DIRECT_FIELDS = {"category", "links", "requirements", "location", "status"}
EXTRA_RESERVED = set(FIELD_MAP.keys()) | DIRECT_FIELDS | READ_ONLY_KEYS
DATETIME_FIELDS = {"closed_at", "reopened_at"}


def _iso(value):
    return value.isoformat() if value else None


def _parse_dt(value):
    if value in ("", None):
        return None
    if hasattr(value, "isoformat"):
        return value
    parsed = parse_datetime(str(value))
    return parsed


class OfficerPerksDiscountSerializer(serializers.ModelSerializer):
    class Meta:
        model = OfficerPerksDiscount
        fields = [
            "id", "company_name", "post_header", "category", "custom_category", "post_content",
            "photo_urls", "links", "requirements", "start_date", "end_date", "all_day",
            "start_time", "end_time", "location", "posted_on", "status", "effective_status",
            "closed_reason", "closed_by_system", "closed_at", "reopened_at", "author_uid",
            "author_email", "author_name", "author_role", "extra_data", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def to_representation(self, instance):
        data = dict(instance.extra_data or {})
        data.update({
            "id": instance.id,
            "companyName": instance.company_name,
            "postHeader": instance.post_header,
            "category": instance.category,
            "customCategory": instance.custom_category,
            "postContent": instance.post_content,
            "photoURLs": instance.photo_urls or [],
            "links": instance.links or [],
            "requirements": instance.requirements or [],
            "startDate": instance.start_date,
            "endDate": instance.end_date,
            "allDay": instance.all_day,
            "startTime": instance.start_time,
            "endTime": instance.end_time,
            "location": instance.location,
            "postedOn": instance.posted_on,
            "status": instance.status,
            "effectiveStatus": instance.effective_status,
            "closedReason": instance.closed_reason,
            "closedBySystem": instance.closed_by_system,
            "closedAt": _iso(instance.closed_at),
            "reopenedAt": _iso(instance.reopened_at),
            "authorUid": instance.author_uid,
            "authorEmail": instance.author_email,
            "authorName": instance.author_name,
            "authorRole": instance.author_role,
            "createdAt": _iso(instance.created_at),
            "updatedAt": _iso(instance.updated_at),
            "created_at": _iso(instance.created_at),
            "updated_at": _iso(instance.updated_at),
        })
        return data

    def to_internal_value(self, data):
        if not isinstance(data, dict):
            raise serializers.ValidationError("Expected an object.")
        values = {}
        extra = {}
        for key, value in data.items():
            if key in READ_ONLY_KEYS:
                continue
            if key in FIELD_MAP:
                field = FIELD_MAP[key]
                values[field] = _parse_dt(value) if field in DATETIME_FIELDS else value
            elif key in DIRECT_FIELDS:
                values[key] = value
            elif key not in EXTRA_RESERVED:
                extra[key] = value

        existing_extra = {}
        if self.instance is not None:
            existing_extra = dict(getattr(self.instance, "extra_data", {}) or {})
        existing_extra.update(extra)
        values["extra_data"] = existing_extra

        if "post_header" not in values and not self.partial and self.instance is None:
            values["post_header"] = "Untitled Perk"
        if "company_name" not in values and not self.partial and self.instance is None:
            values["company_name"] = ""
        if "effective_status" not in values and "status" in values:
            values["effective_status"] = values["status"]
        return values
