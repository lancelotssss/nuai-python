import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "@/pages/alumni-officer/services/firebaseCompat";
import { getDownloadURL, ref, uploadBytes } from "@/pages/alumni-officer/services/firebaseCompat";
import { httpsCallable, getFunctions } from "@/pages/alumni-officer/services/firebaseCompat";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  ChevronRight,
  FileText,
  Globe,
  ImagePlus,
  Link2,
  MoreHorizontal,
  Newspaper,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
  UploadCloud,
  User,
  X,
} from "lucide-react";

import { auth, db, storage, functions } from "@/pages/alumni-officer/services/firebaseCompat";
import { useAuth } from "@/pages/alumni-officer/services/officerAuthCompat";
import { Card, CardContent } from "@/components/ui/card";

const STEP_COUNT = 4;
const MAX_IMAGE_SIZE = 4 * 1024 * 1024;
const MAX_IMAGE_COUNT = 5;

function getUploadExtension(file) {
  const name = String(file?.name || "");
  const match = name.match(/\.[a-zA-Z0-9]+$/);
  return match ? match[0].toLowerCase() : ".jpg";
}

function buildPostImagePath(postId, index, file) {
  return `newsPosts/${postId}/post-image-${index + 1}${getUploadExtension(file)}`;
}

function buildNameWithMiddleInitial(personalInfo = {}) {
  const first = String(personalInfo.firstName || "").trim();
  const middle = String(personalInfo.middleName || "").trim();
  const last = String(personalInfo.lastName || "").trim();
  const middleInitial = middle ? `${middle[0].toUpperCase()}.` : "";

  return [first, middleInitial, last].filter(Boolean).join(" ").trim();
}

function getStringPhoto(value) {
  if (!value) return "";

  if (typeof value === "string") return value;

  if (typeof value === "object") {
    return (
      value.url ||
      value.downloadURL ||
      value.photoUrl ||
      value.photoURL ||
      value.profilePhotoUrl ||
      value.profilePhotoURL ||
      value.profilePictureUrl ||
      value.profilePictureURL ||
      value.imageUrl ||
      value.imageURL ||
      ""
    );
  }

  return "";
}

function getUserPhotoURL(data = {}, personal = {}, user = null) {
  return (
    getStringPhoto(data?.personalization?.photoUrl) ||
    getStringPhoto(data?.personalization?.photoURL) ||
    getStringPhoto(data?.personalization?.profilePhotoUrl) ||
    getStringPhoto(data?.personalization?.profilePhotoURL) ||
    getStringPhoto(data?.photoUrl) ||
    getStringPhoto(data?.photoURL) ||
    getStringPhoto(data?.profilePhotoUrl) ||
    getStringPhoto(data?.profilePhotoURL) ||
    getStringPhoto(data?.profilePictureUrl) ||
    getStringPhoto(data?.profilePictureURL) ||
    getStringPhoto(data?.profileImageUrl) ||
    getStringPhoto(data?.profileImageURL) ||
    getStringPhoto(data?.avatarUrl) ||
    getStringPhoto(data?.avatarURL) ||
    getStringPhoto(data?.imageUrl) ||
    getStringPhoto(data?.imageURL) ||
    getStringPhoto(data?.pictureUrl) ||
    getStringPhoto(data?.pictureURL) ||
    getStringPhoto(personal?.photoUrl) ||
    getStringPhoto(personal?.photoURL) ||
    getStringPhoto(personal?.profilePhotoUrl) ||
    getStringPhoto(personal?.profilePhotoURL) ||
    getStringPhoto(personal?.profilePictureUrl) ||
    getStringPhoto(personal?.profilePictureURL) ||
    getStringPhoto(personal?.profileImageUrl) ||
    getStringPhoto(personal?.profileImageURL) ||
    getStringPhoto(personal?.avatarUrl) ||
    getStringPhoto(personal?.avatarURL) ||
    getStringPhoto(personal?.imageUrl) ||
    getStringPhoto(personal?.imageURL) ||
    getStringPhoto(personal?.pictureUrl) ||
    getStringPhoto(personal?.pictureURL) ||
    getStringPhoto(user?.photoURL) ||
    ""
  );
}

function cacheBustPhoto(url) {
  if (!url) return "";
  return `${url}${url.includes("?") ? "&" : "?"}v=${Date.now()}`;
}

function cleanText(value) {
  return String(value || "").trim();
}

function getSafeLinks(links = []) {
  return links
    .map((link) => ({
      label: cleanText(link.label),
      url: cleanText(link.url),
    }))
    .filter((link) => link.url);
}

function StepperCard({ step, active, done, onClick }) {
  const Icon = step.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-2xl border px-4 py-3 text-left transition-all duration-200",
        active
          ? "border-[#3D398C]/30 bg-[#3D398C]/8 shadow-sm"
          : done
            ? "border-emerald-200 bg-emerald-50"
            : "border-border bg-card hover:border-[#3D398C]/20 hover:bg-[#3D398C]/[0.03]",
      ].join(" ")}
    >
      <div className="flex items-center gap-3">
        <div
          className={[
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors",
            active
              ? "border-[#3D398C] bg-[#3D398C] text-white"
              : done
                ? "border-emerald-500 bg-emerald-500 text-white"
                : "border-border bg-muted/30 text-muted-foreground",
          ].join(" ")}
        >
          {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
        </div>

        <div className="min-w-0">
          <p className="text-[11px] font-medium text-muted-foreground">
            Step {step.id}
          </p>
          <p
            className={[
              "text-sm font-semibold leading-tight",
              active
                ? "text-[#3D398C]"
                : done
                  ? "text-emerald-700"
                  : "text-foreground",
            ].join(" ")}
          >
            {step.title}
          </p>
        </div>
      </div>
    </button>
  );
}

function PostStyleStepper({ currentStep, steps, onStepClick }) {
  return (
    <div className="grid gap-3 lg:grid-cols-4">
      {steps.map((step) => (
        <StepperCard
          key={step.id}
          step={step}
          active={currentStep === step.id}
          done={currentStep > step.id}
          onClick={() => onStepClick(step.id)}
        />
      ))}
    </div>
  );
}

function StepSectionHeader({ title, helper, icon: Icon }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-muted text-[#6B679D]">
        <Icon className="h-5 w-5" />
      </div>

      <div className="min-w-0">
        <p className="text-[15px] font-semibold leading-tight text-foreground">
          {title}
        </p>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          {helper}
        </p>
      </div>
    </div>
  );
}

function FormShell({ title, helper, icon: Icon, actions = null, children }) {
  return (
    <div className="rounded-[28px] border border-border bg-card shadow-sm">
      <div className="border-b border-border px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <StepSectionHeader title={title} helper={helper} icon={Icon} />
          {actions}
        </div>
      </div>

      <div className="p-5">{children}</div>
    </div>
  );
}

function SectionHeader({ icon: Icon, title, helper }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#3D398C]/10">
        <Icon className="h-4 w-4 text-[#3D398C]" />
      </div>

      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {helper ? (
          <p className="mt-0.5 text-xs text-muted-foreground">{helper}</p>
        ) : null}
      </div>
    </div>
  );
}

function FieldLabel({ children }) {
  return (
    <label className="block text-xs font-medium text-foreground">
      {children}
    </label>
  );
}

function FieldError({ message }) {
  if (!message) return null;

  return (
    <p className="mt-1.5 text-[11px] font-medium text-red-500">{message}</p>
  );
}

function InputField({ error = false, className = "", ...props }) {
  return (
    <input
      {...props}
      className={[
        "mt-2 h-11 w-full rounded-xl border bg-background px-4 text-sm font-medium text-foreground shadow-sm outline-none transition",
        "placeholder:text-muted-foreground",
        error
          ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
          : "border-input focus:border-[#3D398C]/40 focus:ring-2 focus:ring-[#3D398C]/10",
        props.disabled ? "opacity-70" : "",
        className,
      ].join(" ")}
    />
  );
}

function TextareaField({ error = false, className = "", ...props }) {
  return (
    <textarea
      {...props}
      className={[
        "mt-2 w-full rounded-xl border bg-background px-4 py-3 text-sm font-medium text-foreground shadow-sm outline-none transition",
        "placeholder:text-muted-foreground",
        error
          ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
          : "border-input focus:border-[#3D398C]/40 focus:ring-2 focus:ring-[#3D398C]/10",
        props.disabled ? "opacity-70" : "",
        className,
      ].join(" ")}
    />
  );
}

function InfoCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-border bg-background px-4 py-3">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#3D398C]/10 text-[#3D398C]">
          <Icon className="h-4 w-4" />
        </div>

        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="mt-1 break-words text-sm font-medium text-foreground">
            {value || "Not set"}
          </p>
        </div>
      </div>
    </div>
  );
}

function ImagePreviewCard({ src, alt, onRemove, removeTitle }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-background shadow-sm">
      <img
        src={src}
        alt={alt}
        className="h-[220px] w-[170px] object-cover transition duration-200 group-hover:scale-[1.02]"
      />

      <button
        type="button"
        onClick={onRemove}
        title={removeTitle}
        className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/75 text-white shadow transition hover:bg-red-600"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function formatPostPreviewDate() {
  return new Date().toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getInitials(name = "U") {
  const parts = String(name || "U")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return (parts[0]?.[0] || "U").toUpperCase();
}

function AuthorAvatar({ name, photoURL }) {
  const [failed, setFailed] = useState(false);
  const showPhoto = photoURL && !failed;

  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-[#3D398C]/10 text-sm font-semibold text-[#3D398C]">
      {showPhoto ? (
        <img
          src={photoURL}
          alt={name || "Author"}
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        getInitials(name)
      )}
    </div>
  );
}

function PostImageGrid({ images = [] }) {
  if (!images.length) return null;

  if (images.length === 1) {
    return (
      <div className="border-t border-border">
        <img
          src={images[0]}
          alt="Post preview"
          className="max-h-[520px] w-full object-cover"
        />
      </div>
    );
  }

  if (images.length === 2) {
    return (
      <div className="grid grid-cols-2 gap-[2px] border-t border-border bg-border">
        {images.slice(0, 2).map((src, index) => (
          <img
            key={`${src}_${index}`}
            src={src}
            alt={`Post preview ${index + 1}`}
            className="h-[320px] w-full object-cover"
          />
        ))}
      </div>
    );
  }

  if (images.length === 3) {
    return (
      <div className="grid grid-cols-2 gap-[2px] border-t border-border bg-border">
        <img
          src={images[0]}
          alt="Post preview 1"
          className="h-[360px] w-full object-cover"
        />

        <div className="grid grid-rows-2 gap-[2px]">
          <img
            src={images[1]}
            alt="Post preview 2"
            className="h-[179px] w-full object-cover"
          />
          <img
            src={images[2]}
            alt="Post preview 3"
            className="h-[179px] w-full object-cover"
          />
        </div>
      </div>
    );
  }

  if (images.length === 4) {
    return (
      <div className="grid grid-cols-2 gap-[2px] border-t border-border bg-border">
        {images.slice(0, 4).map((src, index) => (
          <img
            key={`${src}_${index}`}
            src={src}
            alt={`Post preview ${index + 1}`}
            className="h-[230px] w-full object-cover"
          />
        ))}
      </div>
    );
  }

  const visibleImages = images.slice(0, 5);
  const extraCount = images.length - 5;

  return (
    <div className="border-t border-border bg-border">
      <div className="grid grid-cols-2 gap-[2px]">
        {visibleImages.slice(0, 2).map((src, index) => (
          <img
            key={`${src}_${index}`}
            src={src}
            alt={`Post preview ${index + 1}`}
            className="h-[270px] w-full object-cover"
          />
        ))}
      </div>

      <div className="mt-[2px] grid grid-cols-3 gap-[2px]">
        {visibleImages.slice(2, 5).map((src, index) => {
          const isLast = index === 2;
          const showOverlay = extraCount > 0 && isLast;

          return (
            <div key={`${src}_${index + 2}`} className="relative">
              <img
                src={src}
                alt={`Post preview ${index + 3}`}
                className="h-[170px] w-full object-cover"
              />

              {showOverlay ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black/45">
                  <span className="text-3xl font-semibold text-white">
                    +{extraCount}
                  </span>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PostFeedPreview({
  headerText = "",
  contentText = "",
  links = [],
  imagePreviews = [],
  authorName = "",
  authorPhotoURL = "",
  authorRole = "Alumni Affairs Officer",
}) {
  const [expanded, setExpanded] = useState(false);

  const safeHeader = cleanText(headerText);
  const safeContent = cleanText(contentText);
  const safeLinks = getSafeLinks(links);

  const hasLinks = safeLinks.length > 0;
  const shouldTruncate = safeContent.length > 260 || hasLinks;

  const displayContent =
    safeContent.length > 260 && !expanded
      ? `${safeContent.slice(0, 260).trim()}...`
      : safeContent;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <AuthorAvatar name={authorName} photoURL={authorPhotoURL} />

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold leading-tight text-foreground">
                  {authorName || "Unknown Author"}
                </p>

                <span className="rounded-full border border-[#3D398C]/20 bg-[#3D398C]/5 px-2 py-0.5 text-[10px] font-medium text-[#3D398C]">
                  {authorRole || "Alumni Affairs Officer"}
                </span>
              </div>

              <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                <span>{formatPostPreviewDate()}</span>
                <span>·</span>
                <Globe className="h-3.5 w-3.5" />
              </div>
            </div>
          </div>

          <button
            type="button"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 space-y-3">
          {safeHeader ? (
            <p className="whitespace-pre-wrap text-[15px] font-semibold leading-6 text-foreground">
              {safeHeader}
            </p>
          ) : (
            <p className="text-[15px] font-semibold leading-6 text-muted-foreground">
              Your post headline will appear here.
            </p>
          )}

          {safeContent ? (
            <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
              {displayContent}
            </p>
          ) : (
            <p className="text-sm leading-6 text-muted-foreground">
              Your post content will appear here.
            </p>
          )}

          {expanded && safeLinks.length > 0 ? (
            <div className="space-y-1">
              {safeLinks.map((link, index) => (
                <p
                  key={`${link.url}_${index}`}
                  className="break-all text-sm font-medium text-[#3D398C]"
                >
                  {link.label ? `${link.label}: ` : ""}
                  {link.url}
                </p>
              ))}
            </div>
          ) : null}

          {shouldTruncate ? (
            <button
              type="button"
              onClick={() => setExpanded((prev) => !prev)}
              className="text-sm font-semibold text-[#3D398C] hover:underline"
            >
              {expanded ? "See less" : "See more"}
            </button>
          ) : null}
        </div>
      </div>

      <PostImageGrid images={imagePreviews} />
    </div>
  );
}

function PostSidebarNotes({
  headerText = "",
  contentText = "",
  links = [],
  existingImages = [],
  files = [],
  authorName = "",
}) {
  const safeHeader = cleanText(headerText);
  const safeContent = cleanText(contentText);
  const safeLinks = getSafeLinks(links);
  const imageCount = existingImages.length + files.length;

  const previewTitle = safeHeader || "Untitled post";
  const previewContent = safeContent || "No content yet.";

  return (
    <Card className="border-border shadow-sm xl:sticky xl:top-0">
      <CardContent className="p-0">
        <div className="border-b border-border px-5 py-5">
          <SectionHeader
            icon={Newspaper}
            title="Preview Notes"
            helper="What this post form will save."
          />
        </div>

        <div className="space-y-3 p-5">
          <div className="rounded-xl border border-border bg-muted/20 px-4 py-4">
            <p className="break-words text-base font-semibold text-foreground">
              {previewTitle}
            </p>
            <p className="mt-1 break-words text-sm text-muted-foreground line-clamp-4">
              {previewContent}
            </p>
          </div>

          <InfoCard
            icon={User}
            label="Author"
            value={authorName || "Unknown"}
          />

          <InfoCard
            icon={FileText}
            label="Header"
            value={safeHeader || "Not set"}
          />

          <InfoCard
            icon={Link2}
            label="Links"
            value={
              safeLinks.length > 0
                ? `${safeLinks.length} link${safeLinks.length > 1 ? "s" : ""}`
                : "Not set"
            }
          />

          <InfoCard
            icon={ImagePlus}
            label="Images"
            value={
              imageCount > 0
                ? `${imageCount} image${imageCount > 1 ? "s" : ""}`
                : "Not set"
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}

export default function OfficerEditPost({
  editPostId,
  initialPost,
  onDone,
  onCancel,
}) {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  const routePostId = cleanText(params.postId || params.id);
  const resolvedPostId = cleanText(editPostId) || routePostId;

  const resolvedInitialPost =
    initialPost || location.state?.post || location.state?.initialPost || null;

  const [headerText, setHeaderText] = useState("");
  const [contentText, setContentText] = useState("");
  const [links, setLinks] = useState([{ label: "", url: "" }]);
  const [files, setFiles] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingPost, setLoadingPost] = useState(true);
  const [error, setError] = useState("");
  const [imageError, setImageError] = useState("");
  const [authorName, setAuthorName] = useState("Unknown");
  const [authorPhotoURL, setAuthorPhotoURL] = useState("");
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [touchedFields, setTouchedFields] = useState({});

  const fileInputRef = useRef(null);

  const logAudit = useMemo(() => {
    const f = functions ?? getFunctions();
    return httpsCallable(f, "logSystemAudit");
  }, []);

  const imagePreviews = useMemo(() => {
    return files.map((file) => URL.createObjectURL(file));
  }, [files]);

  useEffect(() => {
    return () => {
      for (const url of imagePreviews) {
        URL.revokeObjectURL(url);
      }
    };
  }, [imagePreviews]);

  useEffect(() => {
    const loadAuthorName = async () => {
      const uid = auth.currentUser?.uid;

      if (!uid) {
        setAuthorName(
          user?.displayName || user?.email?.split("@")?.[0] || "Unknown"
        );
        setAuthorPhotoURL(cacheBustPhoto(user?.photoURL || ""));
        return;
      }

      try {
        const userRef = doc(db, "users", uid);
        const snap = await getDoc(userRef);

        if (snap.exists()) {
          const data = snap.data();
          const personal = data?.personalInformation || {};
          const formatted = buildNameWithMiddleInitial(personal);
          const photoURL = getUserPhotoURL(data, personal, user);

          setAuthorPhotoURL(cacheBustPhoto(photoURL));

          if (formatted) {
            setAuthorName(formatted);
            return;
          }
        }

        setAuthorName(
          user?.displayName || user?.email?.split("@")?.[0] || "Unknown"
        );
        setAuthorPhotoURL(cacheBustPhoto(user?.photoURL || ""));
      } catch (err) {
        console.error("Failed to load author name:", err);

        setAuthorName(
          user?.displayName || user?.email?.split("@")?.[0] || "Unknown"
        );
        setAuthorPhotoURL(cacheBustPhoto(user?.photoURL || ""));
      }
    };

    loadAuthorName();
  }, [user]);

  useEffect(() => {
    async function loadPost() {
      if (!resolvedPostId) {
        setError("Missing post ID.");
        setLoadingPost(false);
        return;
      }

      if (resolvedInitialPost) {
        setHeaderText(resolvedInitialPost?.postHeader || "");
        setContentText(
          resolvedInitialPost?.postContent || resolvedInitialPost?.text || ""
        );
        setLinks(
          Array.isArray(resolvedInitialPost?.links) &&
            resolvedInitialPost.links.length > 0
            ? resolvedInitialPost.links.map((link) => ({
                label: link?.label || "",
                url: link?.url || "",
              }))
            : [{ label: "", url: "" }]
        );
        setExistingImages(
          Array.isArray(resolvedInitialPost?.photoURLs)
            ? resolvedInitialPost.photoURLs
            : []
        );

        if (resolvedInitialPost?.authorName) {
          setAuthorName(resolvedInitialPost.authorName);
        }

        if (resolvedInitialPost?.authorPhotoURL) {
          setAuthorPhotoURL(cacheBustPhoto(resolvedInitialPost.authorPhotoURL));
        }

        setLoadingPost(false);
      }

      try {
        const postRef = doc(db, "newsPosts", resolvedPostId);
        const snap = await getDoc(postRef);

        if (!snap.exists()) {
          setError("Post not found.");
          setLoadingPost(false);
          return;
        }

        const data = snap.data();

        setHeaderText(data?.postHeader || "");
        setContentText(data?.postContent || data?.text || "");
        setLinks(
          Array.isArray(data?.links) && data.links.length > 0
            ? data.links.map((link) => ({
                label: link?.label || "",
                url: link?.url || "",
              }))
            : [{ label: "", url: "" }]
        );
        setExistingImages(Array.isArray(data?.photoURLs) ? data.photoURLs : []);

        if (data?.authorName) {
          setAuthorName(data.authorName);
        }

        if (data?.authorPhotoURL) {
          setAuthorPhotoURL(cacheBustPhoto(data.authorPhotoURL));
        }
      } catch (err) {
        console.error("Failed to load post:", err);
        setError(err?.message || "Failed to load post.");
      } finally {
        setLoadingPost(false);
      }
    }

    loadPost();
  }, [resolvedPostId]);

  function markFieldTouched(fieldName) {
    setTouchedFields((prev) => ({
      ...prev,
      [fieldName]: true,
    }));
  }

  function markStepFieldsTouched(step) {
    if (step === 1) {
      setTouchedFields((prev) => ({
        ...prev,
        headerText: true,
        contentText: true,
      }));
    }
  }

  const postHeaderError =
    touchedFields.headerText && !cleanText(headerText)
      ? "Post header is required."
      : "";

  const postContentError =
    touchedFields.contentText && !cleanText(contentText)
      ? "Post content is required."
      : "";

  function handleImageSelection(e) {
    const pickedFiles = Array.from(e.target.files || []);
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];

    const invalidFiles = [];
    const oversizedFiles = [];
    const validFiles = [];

    pickedFiles.forEach((file) => {
      if (!allowedTypes.includes(file.type)) {
        invalidFiles.push(file.name);
        return;
      }

      if (file.size > MAX_IMAGE_SIZE) {
        oversizedFiles.push(file.name);
        return;
      }

      validFiles.push(file);
    });

    const combined = [...files, ...validFiles];

    const deduped = combined.filter(
      (file, index, arr) =>
        index ===
        arr.findIndex(
          (f) =>
            f.name === file.name &&
            f.size === file.size &&
            f.lastModified === file.lastModified
        )
    );

    const availableSlots = MAX_IMAGE_COUNT - existingImages.length;
    let nextError = "";

    if (availableSlots <= 0) {
      nextError = `Only ${MAX_IMAGE_COUNT} images are allowed.`;
      setFiles([]);
      setImageError(nextError);
      e.target.value = "";
      return;
    }

    if (deduped.length > availableSlots) {
      nextError = `Only ${MAX_IMAGE_COUNT} images are allowed.`;
    } else if (oversizedFiles.length > 0) {
      nextError = "4MB is the maximum file size per image.";
    } else if (invalidFiles.length > 0) {
      nextError = "Only JPG, JPEG, and PNG files are allowed.";
    }

    setFiles(deduped.slice(0, availableSlots));
    setImageError(nextError);

    e.target.value = "";
  }

  function removeSelectedImage(index) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setImageError("");
  }

  function removeExistingImage(index) {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
    setImageError("");
  }

  function addLink() {
    setLinks((prev) => [...prev, { label: "", url: "" }]);
  }

  function removeLink(index) {
    setLinks((prev) => prev.filter((_, i) => i !== index));
  }

  function updateLink(index, field, value) {
    setLinks((prev) =>
      prev.map((link, i) =>
        i === index ? { ...link, [field]: value } : link
      )
    );
  }

  const steps = useMemo(
    () => [
      { id: 1, title: "Post Details", icon: FileText },
      { id: 2, title: "Links", icon: Link2 },
      { id: 3, title: "Images", icon: ImagePlus },
      { id: 4, title: "Review & Save", icon: ShieldCheck },
    ],
    []
  );

  function isStepValid(step) {
    if (step === 1) {
      return cleanText(headerText) && cleanText(contentText);
    }

    if (step === 2) {
      return true;
    }

    if (step === 3) {
      return !imageError;
    }

    if (step === 4) {
      return cleanText(headerText) && cleanText(contentText) && !imageError;
    }

    return true;
  }

  function goNext() {
    if (!isStepValid(currentStep)) {
      markStepFieldsTouched(currentStep);

      if (currentStep === 1) {
        setError("Post header and post content are required.");
      } else if (currentStep === 3 && imageError) {
        setError(imageError);
      }

      return;
    }

    setError("");
    setDirection(1);
    setCurrentStep((prev) => Math.min(prev + 1, STEP_COUNT));
  }

  function goBack() {
    setError("");
    setDirection(-1);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  }

  function jumpToStep(step) {
    if (step === currentStep) return;

    if (step < currentStep) {
      setError("");
      setDirection(-1);
      setCurrentStep(step);
      return;
    }

    for (let i = 1; i < step; i += 1) {
      if (!isStepValid(i)) {
        markStepFieldsTouched(i);
        setCurrentStep(i);
        setDirection(i < currentStep ? -1 : 1);

        if (i === 1) {
          setError("Post header and post content are required.");
        } else if (i === 3 && imageError) {
          setError(imageError);
        }

        return;
      }
    }

    setError("");
    setDirection(1);
    setCurrentStep(step);
  }

  function goBackToPosts() {
    navigate("/alumni-officer/posts", {
      replace: true,
      state: {
        postId: resolvedPostId,
        postTitle: cleanText(headerText) || "Post",
        title: cleanText(headerText) || "Post",
        breadcrumbLabel: "Manage Posts",
        from: "/alumni-officer/posts/edit",
      },
    });
  }

  async function handleSubmit() {
    setError("");

    setTouchedFields((prev) => ({
      ...prev,
      headerText: true,
      contentText: true,
    }));

    if (!resolvedPostId) {
      setError("Missing post ID.");
      return;
    }

    if (!cleanText(headerText)) {
      setError("Post header is required.");
      return;
    }

    if (!cleanText(contentText)) {
      setError("Post content is required.");
      return;
    }

    setLoading(true);

    try {
      const uploadedURLs = [];

      for (const [index, file] of files.entries()) {
        const path = buildPostImagePath(resolvedPostId, index, file);

        const fileRef = ref(storage, path);
        await uploadBytes(fileRef, file);

        const url = await getDownloadURL(fileRef);
        if (url) uploadedURLs.push(url);
      }

      const nextPhotoURLs = uploadedURLs.length > 0 ? uploadedURLs : existingImages;

      await updateDoc(doc(db, "newsPosts", resolvedPostId), {
        postHeader: cleanText(headerText),
        postContent: cleanText(contentText),
        links: getSafeLinks(links),
        photoURLs: nextPhotoURLs,
        authorUid: auth.currentUser?.uid || "",
        authorEmail: auth.currentUser?.email || "",
        authorName,
        authorRole: role || "",
        authorPhotoURL,
        status: "open",
        effectiveStatus: "open",
        updatedAt: serverTimestamp(),
      });

      logAudit({
        action: "POST_UPDATED",
        details: `Post Updated ${resolvedPostId} by ${
          auth.currentUser?.uid || "Unknown"
        }`,
      }).catch(() => {});

      if (typeof onDone === "function") {
        onDone(resolvedPostId);
        return;
      }

      goBackToPosts();
    } catch (err) {
      console.error(err);
      setError(err?.message || "Failed to update post.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveDraft() {
    setError("");

    if (!resolvedPostId) {
      setError("Missing post ID.");
      return;
    }

    setLoading(true);

    try {
      const uploadedURLs = [];

      for (const [index, file] of files.entries()) {
        const path = buildPostImagePath(resolvedPostId, index, file);

        const fileRef = ref(storage, path);
        await uploadBytes(fileRef, file);

        const url = await getDownloadURL(fileRef);
        if (url) uploadedURLs.push(url);
      }

      const nextPhotoURLs = uploadedURLs.length > 0 ? uploadedURLs : existingImages;

      await updateDoc(doc(db, "newsPosts", resolvedPostId), {
        postHeader: cleanText(headerText),
        postContent: cleanText(contentText),
        links: getSafeLinks(links),
        photoURLs: nextPhotoURLs,
        authorUid: auth.currentUser?.uid || "",
        authorEmail: auth.currentUser?.email || "",
        authorName,
        authorRole: role || "",
        authorPhotoURL,
        status: "draft",
        effectiveStatus: "draft",
        updatedAt: serverTimestamp(),
      });

      logAudit({
        action: "POST_DRAFT_UPDATED",
        details: `Post Draft Updated ${resolvedPostId} by ${
          auth.currentUser?.uid || "Unknown"
        }`,
      }).catch(() => {});

      goBackToPosts();
    } catch (err) {
      console.error(err);
      setError(err?.message || "Failed to save draft.");
    } finally {
      setLoading(false);
    }
  }

  function renderStepContent() {
    switch (currentStep) {
      case 1:
        return (
          <FormShell
            title="Step 1: Post Details"
            helper="Update the main post header and content for the alumni news feed."
            icon={FileText}
          >
            <div className="space-y-5">
              <div>
                <FieldLabel>
                  Post header <span className="text-red-500">*</span>
                </FieldLabel>

                <TextareaField
                  placeholder="What's the headline?"
                  value={headerText}
                  onChange={(e) => {
                    setHeaderText(e.target.value);
                    markFieldTouched("headerText");
                  }}
                  onBlur={() => markFieldTouched("headerText")}
                  required
                  disabled={loading}
                  rows={1}
                  error={Boolean(postHeaderError)}
                  className="min-h-[70px] resize-y"
                />

                <FieldError message={postHeaderError} />
              </div>

              <div>
                <FieldLabel>
                  Post content <span className="text-red-500">*</span>
                </FieldLabel>

                <TextareaField
                  placeholder="What's new?"
                  value={contentText}
                  onChange={(e) => {
                    setContentText(e.target.value);
                    markFieldTouched("contentText");
                  }}
                  onBlur={() => markFieldTouched("contentText")}
                  required
                  disabled={loading}
                  rows={8}
                  error={Boolean(postContentError)}
                  className="min-h-[170px] resize-y"
                />

                <FieldError message={postContentError} />
              </div>
            </div>
          </FormShell>
        );

      case 2:
        return (
          <FormShell
            title="Step 2: Links"
            helper="Update optional links related to this post."
            icon={Link2}
            actions={
              <button
                type="button"
                onClick={addLink}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Plus className="h-4 w-4" />
                Add link
              </button>
            }
          >
            <div className="space-y-3">
              {links.map((link, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-border bg-muted/20 p-4"
                >
                  <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                    <div>
                      <FieldLabel>Label</FieldLabel>
                      <InputField
                        placeholder="e.g., Registration Form"
                        value={link.label}
                        disabled={loading}
                        onChange={(e) =>
                          updateLink(index, "label", e.target.value)
                        }
                      />
                    </div>

                    <div>
                      <FieldLabel>URL</FieldLabel>
                      <InputField
                        placeholder="https://..."
                        value={link.url}
                        disabled={loading}
                        onChange={(e) =>
                          updateLink(index, "url", e.target.value)
                        }
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => removeLink(index)}
                      disabled={loading || links.length === 1}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </FormShell>
        );

      case 3: {
        const totalImages = existingImages.length + files.length;
        const hasImages = totalImages > 0;

        return (
          <FormShell
            title="Step 3: Images"
            helper={`Optional. Upload up to ${MAX_IMAGE_COUNT} JPG or PNG images.`}
            icon={ImagePlus}
          >
            <div className="space-y-5">
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                multiple
                className="hidden"
                disabled={loading}
                onChange={handleImageSelection}
              />

              <div className="rounded-2xl border border-dashed border-[#3D398C]/25 bg-[#3D398C]/[0.04] p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#3D398C]/10">
                      <UploadCloud className="h-5 w-5 text-[#3D398C]" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">
                        Upload post images
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Add announcement posters, event photos, or related
                        images to make the post more engaging.
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {hasImages
                          ? `${totalImages}/${MAX_IMAGE_COUNT} image(s) selected`
                          : "No images selected yet"}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={loading}
                      className="inline-flex h-11 items-center justify-center rounded-xl border border-[#3D398C]/20 bg-white px-4 text-sm font-medium text-[#3D398C] transition hover:bg-[#3D398C]/5 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <ImagePlus className="mr-2 h-4 w-4" />
                      Choose Files
                    </button>
                  </div>
                </div>
              </div>

              {imageError ? (
                <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm font-medium text-destructive">
                  {imageError}
                </div>
              ) : null}

              {existingImages.length > 0 ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Existing Images
                    </p>
                    <p className="text-xs text-muted-foreground">
                      These are already saved to this post.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-4">
                    {existingImages.map((src, index) => (
                      <ImagePreviewCard
                        key={`${src}_${index}`}
                        src={src}
                        alt="existing preview"
                        onRemove={() => removeExistingImage(index)}
                        removeTitle="Remove existing image"
                      />
                    ))}
                  </div>
                </div>
              ) : null}

              {imagePreviews.length > 0 ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      New Selected Images
                    </p>
                    <p className="text-xs text-muted-foreground">
                      These will be uploaded when you save the post.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-4">
                    {imagePreviews.map((src, index) => (
                      <ImagePreviewCard
                        key={`${src}_${index}`}
                        src={src}
                        alt="preview"
                        onRemove={() => removeSelectedImage(index)}
                        removeTitle="Remove selected image"
                      />
                    ))}
                  </div>
                </div>
              ) : null}

              {!existingImages.length && !imagePreviews.length ? (
                <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-5 py-8 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
                    <ImagePlus className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="mt-3 text-sm font-medium text-foreground">
                    No images uploaded yet
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Choose files to preview them here before saving.
                  </p>
                </div>
              ) : null}
            </div>
          </FormShell>
        );
      }

      case 4: {
        const reviewImages = [...existingImages, ...imagePreviews];

        return (
          <FormShell
            title="Step 4: Review & Save"
            helper="Review how your edited post will appear before saving changes."
            icon={ShieldCheck}
          >
            <div className="space-y-5">
              <PostFeedPreview
                headerText={headerText}
                contentText={contentText}
                links={links}
                imagePreviews={reviewImages}
                authorName={authorName}
                authorPhotoURL={authorPhotoURL}
                authorRole={role || "Alumni Affairs Officer"}
              />
            </div>
          </FormShell>
        );
      }

      default:
        return null;
    }
  }

  if (loadingPost) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground shadow-sm">
        Loading post...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PostStyleStepper
        currentStep={currentStep}
        steps={steps}
        onStepClick={jumpToStep}
      />

      {error ? (
        <div className="animate-in fade-in-50 slide-in-from-top-1 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-sm text-destructive duration-200">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px] xl:items-start">
        <div className="space-y-5">
          <AnimatePresence mode="wait" initial={false} custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              initial={(dir) => ({
                opacity: 0,
                x: dir > 0 ? 28 : -28,
                y: 8,
              })}
              animate={{
                opacity: 1,
                x: 0,
                y: 0,
              }}
              exit={(dir) => ({
                opacity: 0,
                x: dir > 0 ? -28 : 28,
                y: -8,
              })}
              transition={{ duration: 0.24, ease: "easeOut" }}
              className="space-y-5"
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="hidden xl:block">
          <PostSidebarNotes
            headerText={headerText}
            contentText={contentText}
            links={links}
            existingImages={existingImages}
            files={files}
            authorName={authorName}
          />
        </div>
      </div>

      <div className="border-t border-border pt-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="shrink-0 text-sm text-muted-foreground">
            Step {currentStep} of {STEP_COUNT}
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                if (currentStep === 1) {
                  if (typeof onCancel === "function") {
                    onCancel();
                    return;
                  }

                  goBackToPosts();
                  return;
                }

                goBack();
              }}
              disabled={loading}
              className="inline-flex h-12 items-center justify-center rounded-2xl border border-border bg-white px-6 text-sm font-semibold text-foreground transition hover:bg-muted disabled:opacity-60"
            >
              {currentStep === 1 ? "Cancel" : "Back"}
            </button>

            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={loading}
              className="inline-flex h-12 items-center justify-center rounded-2xl border border-yellow-300 bg-yellow-50 px-6 text-sm font-semibold text-yellow-700 transition hover:bg-yellow-100 hover:text-yellow-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save className="mr-2 h-4 w-4" />
              {loading ? "Saving..." : "Save as Draft"}
            </button>

            {currentStep < STEP_COUNT ? (
              <button
                type="button"
                onClick={goNext}
                disabled={loading || !isStepValid(currentStep)}
                className="inline-flex h-12 items-center justify-center rounded-2xl bg-[#3D398C] px-6 text-sm font-semibold text-white transition hover:bg-[#2f2b73] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || !isStepValid(4)}
                className="inline-flex h-12 items-center justify-center rounded-2xl bg-[#3D398C] px-6 text-sm font-semibold text-white transition hover:bg-[#2f2b73] disabled:opacity-60"
              >
                <Save className="mr-2 h-4 w-4" />
                {loading ? "Saving..." : "Save Changes"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}