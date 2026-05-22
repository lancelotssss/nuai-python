from .models import SystemAudit


def get_client_ip(request):
    forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")

    if forwarded_for:
        return forwarded_for.split(",")[0].strip()

    return request.META.get("REMOTE_ADDR", "")


def get_actor_from_request(request):
    """
    Local Django setup has no token/session auth yet, so the frontend may pass
    actor information through headers or request body. If not present, use
    a safe Super Admin fallback so successful system actions are still audited.
    """
    data = getattr(request, "data", {}) or {}

    actor_email = (
        request.META.get("HTTP_X_NUAI_ACTOR_EMAIL")
        or data.get("actor_email")
        or data.get("_actor_email")
        or data.get("created_by")
        or data.get("updated_by")
        or ""
    )

    actor_role = (
        request.META.get("HTTP_X_NUAI_ACTOR_ROLE")
        or data.get("actor_role")
        or data.get("_actor_role")
        or "super-admin"
    )

    return actor_email, actor_role


def create_system_audit(
    request,
    action,
    details,
    scope="system",
    target_table="",
    target_id="",
    metadata=None,
    actor_email=None,
    actor_role=None,
):
    if not actor_email or not actor_role:
        request_actor_email, request_actor_role = get_actor_from_request(request)
        actor_email = actor_email or request_actor_email
        actor_role = actor_role or request_actor_role

    return SystemAudit.objects.create(
        actor_email=actor_email or "",
        actor_role=actor_role or "super-admin",
        action=action,
        details=details,
        scope=scope,
        target_table=target_table or "",
        target_id=str(target_id or ""),
        ip_address=get_client_ip(request),
        user_agent=request.META.get("HTTP_USER_AGENT", ""),
        metadata=metadata or {},
    )
