from rest_framework import serializers
from .models import OfficerPost

READ_ONLY_KEYS = {"id", "created_at", "updated_at", "createdAt", "updatedAt"}
FIELD_MAP = {
    "postHeader": "post_header",
    "postContent": "post_content",
    "photoURLs": "photo_urls",
    "effectiveStatus": "effective_status",
    "authorUid": "author_uid",
    "authorEmail": "author_email",
    "authorName": "author_name",
    "authorRole": "author_role",
    "authorPhotoURL": "author_photo_url",
}
REVERSE_FIELD_MAP = {value: key for key, value in FIELD_MAP.items()}
DIRECT_FIELDS = {"links", "status"}
EXTRA_RESERVED = set(FIELD_MAP.keys()) | DIRECT_FIELDS | READ_ONLY_KEYS


def _iso(value):
    return value.isoformat() if value else None


class OfficerPostSerializer(serializers.ModelSerializer):
    class Meta:
        model = OfficerPost
        fields = [
            "id",
            "post_header",
            "post_content",
            "links",
            "photo_urls",
            "status",
            "effective_status",
            "author_uid",
            "author_email",
            "author_name",
            "author_role",
            "author_photo_url",
            "extra_data",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def to_representation(self, instance):
        data = dict(instance.extra_data or {})
        data.update({
            "id": instance.id,
            "postHeader": instance.post_header,
            "postContent": instance.post_content,
            "links": instance.links or [],
            "photoURLs": instance.photo_urls or [],
            "status": instance.status,
            "effectiveStatus": instance.effective_status,
            "authorUid": instance.author_uid,
            "authorEmail": instance.author_email,
            "authorName": instance.author_name,
            "authorRole": instance.author_role,
            "authorPhotoURL": instance.author_photo_url,
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

        if "post_header" not in values and not self.partial and self.instance is None:
            values["post_header"] = "Untitled Post"
        if "effective_status" not in values and "status" in values:
            values["effective_status"] = values["status"]

        return values
