from rest_framework import serializers
from .models import OfficerCalendarEvent

READ_ONLY_KEYS = {"id", "created_at", "updated_at", "createdAt", "updatedAt"}
FIELD_MAP = {
    "eventDate": "event_date",
    "endDate": "end_date",
    "allDay": "all_day",
    "startTime": "start_time",
    "endTime": "end_time",
    "customCategory": "custom_category",
    "coverImageUrl": "cover_image_url",
    "contactName": "contact_name",
    "contactEmail": "contact_email",
    "postedOn": "posted_on",
    "createdByUid": "created_by_uid",
    "createdByName": "created_by_name",
    "createdByEmail": "created_by_email",
    "updatedByUid": "updated_by_uid",
    "updatedByName": "updated_by_name",
    "updatedByEmail": "updated_by_email",
}
DIRECT_FIELDS = {"title", "description", "location", "category", "audience", "status", "tags"}
EXTRA_RESERVED = set(FIELD_MAP.keys()) | DIRECT_FIELDS | READ_ONLY_KEYS


def _iso(value):
    return value.isoformat() if value else None


class OfficerCalendarEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = OfficerCalendarEvent
        fields = [
            "id", "title", "description", "event_date", "end_date", "all_day", "start_time",
            "end_time", "location", "category", "custom_category", "audience", "status",
            "cover_image_url", "contact_name", "contact_email", "tags", "posted_on",
            "created_by_uid", "created_by_name", "created_by_email", "updated_by_uid",
            "updated_by_name", "updated_by_email", "extra_data", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def to_representation(self, instance):
        data = dict(instance.extra_data or {})
        data.update({
            "id": instance.id,
            "title": instance.title,
            "description": instance.description,
            "eventDate": instance.event_date,
            "endDate": instance.end_date,
            "allDay": instance.all_day,
            "startTime": instance.start_time,
            "endTime": instance.end_time,
            "location": instance.location,
            "category": instance.category,
            "customCategory": instance.custom_category,
            "audience": instance.audience or [],
            "status": instance.status,
            "coverImageUrl": instance.cover_image_url,
            "contactName": instance.contact_name,
            "contactEmail": instance.contact_email,
            "tags": instance.tags or [],
            "postedOn": instance.posted_on,
            "createdByUid": instance.created_by_uid,
            "createdByName": instance.created_by_name,
            "createdByEmail": instance.created_by_email,
            "updatedByUid": instance.updated_by_uid,
            "updatedByName": instance.updated_by_name,
            "updatedByEmail": instance.updated_by_email,
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
                values[FIELD_MAP[key]] = value
            elif key in DIRECT_FIELDS:
                values[key] = value
            elif key not in EXTRA_RESERVED:
                extra[key] = value

        existing_extra = {}
        if self.instance is not None:
            existing_extra = dict(getattr(self.instance, "extra_data", {}) or {})
        existing_extra.update(extra)
        values["extra_data"] = existing_extra

        if "title" not in values and not self.partial and self.instance is None:
            values["title"] = "Untitled Event"
        return values
