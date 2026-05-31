import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
} from "@/pages/alumni-officer/services/firebaseCompat";
import { db } from "@/pages/alumni-officer/services/firebaseCompat";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CalendarDays,
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  FileText,
  Globe,
  Image as ImageIcon,
  Link2,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
} from "lucide-react";

const BB = "#3D398C";
const PS_OPTIONS = [10, 20, 50, 100];
const PS_DEFAULT = 10;

function safe(v) {
  return String(v ?? "").trim();
}

function norm(v) {
  return safe(v).toLowerCase();
}

function normalizePostStatus(status) {
  const value = norm(status);

  if (["open", "published", "active"].includes(value)) return "open";
  if (["draft", "closed", "archived"].includes(value)) return value;

  return "open";
}

function getPostStatusBadge(status) {
  switch (normalizePostStatus(status)) {
    case "open":
      return {
        label: "Open",
        cls: "bg-emerald-50 text-emerald-700 border border-emerald-200",
      };
    case "draft":
      return {
        label: "Draft",
        cls: "bg-yellow-50 text-yellow-700 border border-yellow-200",
      };
    case "closed":
      return {
        label: "Closed",
        cls: "bg-red-50 text-red-700 border border-red-200",
      };
    case "archived":
      return {
        label: "Archived",
        cls: "bg-slate-50 text-slate-700 border border-slate-200",
      };
    default:
      return {
        label: "Open",
        cls: "bg-emerald-50 text-emerald-700 border border-emerald-200",
      };
  }
}

function cleanText(value) {
  return String(value || "").trim();
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
      value.profileImageUrl ||
      value.profileImageURL ||
      value.imageUrl ||
      value.imageURL ||
      value.avatarUrl ||
      value.avatarURL ||
      value.pictureUrl ||
      value.pictureURL ||
      ""
    );
  }

  return "";
}

function getPostAuthorPhotoURL(post = {}) {
  return (
    getStringPhoto(post.authorPhotoURL) ||
    getStringPhoto(post.authorPhotoUrl) ||
    getStringPhoto(post.authorPhoto) ||
    getStringPhoto(post.photoURL) ||
    getStringPhoto(post.photoUrl) ||
    getStringPhoto(post.profilePhotoURL) ||
    getStringPhoto(post.profilePhotoUrl) ||
    getStringPhoto(post.profilePictureURL) ||
    getStringPhoto(post.profilePictureUrl) ||
    getStringPhoto(post.profileImageURL) ||
    getStringPhoto(post.profileImageUrl) ||
    getStringPhoto(post.avatarURL) ||
    getStringPhoto(post.avatarUrl) ||
    getStringPhoto(post.pictureURL) ||
    getStringPhoto(post.pictureUrl) ||
    ""
  );
}

function cacheBustPhoto(url) {
  if (!url) return "";
  return `${url}${url.includes("?") ? "&" : "?"}v=${Date.now()}`;
}

function getSafeLinks(links = []) {
  return links
    .map((link) => ({
      label: cleanText(link?.label),
      url: cleanText(link?.url),
    }))
    .filter((link) => link.url);
}

function getCreatedAtMillis(createdAt) {
  if (typeof createdAt?.toMillis === "function") return createdAt.toMillis();
  if (typeof createdAt?.seconds === "number") return createdAt.seconds * 1000;

  const parsed = new Date(createdAt).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function formatCreatedAt(createdAt) {
  const millis = getCreatedAtMillis(createdAt);
  if (!millis) return "—";

  return new Date(millis).toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatPostPreviewDate(createdAt) {
  const millis = getCreatedAtMillis(createdAt);
  const date = millis ? new Date(millis) : new Date();

  return date.toLocaleString("en-PH", {
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

function getPostStats(posts) {
  const withImages = posts.filter(
    (post) => Array.isArray(post.photoURLs) && post.photoURLs.length > 0
  ).length;

  const withLinks = posts.filter(
    (post) => Array.isArray(post.links) && post.links.length > 0
  ).length;

  return {
    total: posts.length,
    withImages,
    withLinks,
  };
}

function AuthorAvatar({ name, photoURL }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [photoURL]);

  const showPhoto = photoURL && !failed;

  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-[#3D398C]/10 text-sm font-semibold text-[#3D398C]">
      {showPhoto ? (
        <img
          src={photoURL}
          alt={name || "Author"}
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      ) : (
        getInitials(name)
      )}
    </div>
  );
}


function ImageWithSkeleton({ src, alt, className }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return (
      <div className={`${className} flex items-center justify-center bg-muted`}>
        <ImageIcon className="h-6 w-6 text-muted-foreground/45" />
      </div>
    );
  }

  return (
    <div className={`${className} relative overflow-hidden bg-muted`}>
      {!loaded ? (
        <Skeleton className="absolute inset-0 h-full w-full rounded-none" />
      ) : null}

      <img
        src={src}
        alt={alt}
        className={`h-full w-full object-cover transition-opacity duration-300 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
      />
    </div>
  );
}

function PostImageGrid({ images = [] }) {
  if (!images.length) return null;

  if (images.length === 1) {
    return (
      <div className="border-t border-border">
        <ImageWithSkeleton
          src={images[0]}
          alt="Post preview"
          className="max-h-[520px] min-h-[260px] w-full"
        />
      </div>
    );
  }

  if (images.length === 2) {
    return (
      <div className="grid grid-cols-2 gap-[2px] border-t border-border bg-border">
        {images.slice(0, 2).map((src, index) => (
          <ImageWithSkeleton
            key={`${src}_${index}`}
            src={src}
            alt={`Post preview ${index + 1}`}
            className="h-[320px] w-full"
          />
        ))}
      </div>
    );
  }

  if (images.length === 3) {
    return (
      <div className="grid grid-cols-2 gap-[2px] border-t border-border bg-border">
        <ImageWithSkeleton
          src={images[0]}
          alt="Post preview 1"
          className="h-[360px] w-full"
        />

        <div className="grid grid-rows-2 gap-[2px]">
          <ImageWithSkeleton
            src={images[1]}
            alt="Post preview 2"
            className="h-[179px] w-full"
          />
          <ImageWithSkeleton
            src={images[2]}
            alt="Post preview 3"
            className="h-[179px] w-full"
          />
        </div>
      </div>
    );
  }

  if (images.length === 4) {
    return (
      <div className="grid grid-cols-2 gap-[2px] border-t border-border bg-border">
        {images.slice(0, 4).map((src, index) => (
          <ImageWithSkeleton
            key={`${src}_${index}`}
            src={src}
            alt={`Post preview ${index + 1}`}
            className="h-[230px] w-full"
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
          <ImageWithSkeleton
            key={`${src}_${index}`}
            src={src}
            alt={`Post preview ${index + 1}`}
            className="h-[270px] w-full"
          />
        ))}
      </div>

      <div className="mt-[2px] grid grid-cols-3 gap-[2px]">
        {visibleImages.slice(2, 5).map((src, index) => {
          const isLast = index === 2;
          const showOverlay = extraCount > 0 && isLast;

          return (
            <div key={`${src}_${index + 2}`} className="relative">
              <ImageWithSkeleton
                src={src}
                alt={`Post preview ${index + 3}`}
                className="h-[170px] w-full"
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

function PostPreviewDialog({ open, onOpenChange, post, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!open) setExpanded(false);
  }, [open]);

  if (!post) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent />
      </Dialog>
    );
  }

  const authorName =
    post.authorName || post.authorEmail?.split("@")?.[0] || "Unknown Author";

  const authorRole = post.authorRole || "Alumni Affairs Officer";
  const authorPhotoURL = cacheBustPhoto(getPostAuthorPhotoURL(post));
  const postHeader = post.postHeader || "Untitled Post";
  const postContent = post.postContent || post.text || "";
  const safeLinks = getSafeLinks(Array.isArray(post.links) ? post.links : []);
  const safeImages = Array.isArray(post.photoURLs)
    ? post.photoURLs.map(getStringPhoto).filter(Boolean)
    : [];

  const hasLinks = safeLinks.length > 0;
  const shouldTruncate = postContent.length > 260 || hasLinks;

  const displayContent =
    postContent.length > 260 && !expanded
      ? `${postContent.slice(0, 260).trim()}...`
      : postContent;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-none bg-transparent p-0 shadow-none sm:max-w-2xl">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
          <div className="absolute right-11 top-2.5 z-20">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full bg-card/80 text-muted-foreground backdrop-blur transition hover:bg-muted hover:text-foreground"
                >
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    onOpenChange(false);
                    onEdit?.(post);
                  }}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>

                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600"
                  onSelect={(e) => {
                    e.preventDefault();
                    onOpenChange(false);
                    onDelete?.(post);
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="p-5 pr-20">
            <div className="flex items-start gap-3">
              <AuthorAvatar name={authorName} photoURL={authorPhotoURL} />

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold leading-tight text-foreground">
                    {authorName}
                  </p>

                  <span className="rounded-full border border-[#3D398C]/20 bg-[#3D398C]/5 px-2 py-0.5 text-[10px] font-medium text-[#3D398C]">
                    {authorRole}
                  </span>
                </div>

                <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span>{formatPostPreviewDate(post.createdAt)}</span>
                  <span>·</span>
                  <Globe className="h-3.5 w-3.5" />
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <p className="whitespace-pre-wrap text-[15px] font-semibold leading-6 text-foreground">
                {postHeader}
              </p>

              {postContent ? (
                <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                  {displayContent}
                </p>
              ) : (
                <p className="text-sm leading-6 text-muted-foreground">
                  No post content.
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

          <PostImageGrid images={safeImages} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function OfficerPost({
  inDashboard,
  onEditPost,
  onCreatePost,
}) {
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState("");
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState("recent");
  const [mediaFilter, setMediaFilter] = useState("all");
  const [statusMode, setStatusMode] = useState("active");
  const [statusFilter, setStatusFilter] = useState("all");

  const [selectedIds, setSelectedIds] = useState([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewPost, setPreviewPost] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(PS_DEFAULT);


  async function loadPosts(loadMore = false) {
    try {
      if (loadMore) {
        if (!lastDoc || !hasMore) return;
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      setError("");

      let q = query(
        collection(db, "newsPosts"),
        orderBy("createdAt", "desc"),
        limit(10)
      );

      if (loadMore && lastDoc) {
        q = query(
          collection(db, "newsPosts"),
          orderBy("createdAt", "desc"),
          startAfter(lastDoc),
          limit(10)
        );
      }

      const snap = await getDocs(q);

      const newPosts = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      setPosts((prev) => (loadMore ? [...prev, ...newPosts] : newPosts));
      setLastDoc(snap.docs[snap.docs.length - 1] || null);
      setHasMore(snap.docs.length === 10);
    } catch (err) {
      console.error("Failed to load posts:", err);
      setError(err?.message || "Failed to load posts.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    loadPosts(false);
  }, []);

  function handleCreatePost() {
    if (inDashboard && onCreatePost) {
      onCreatePost();
      return;
    }

    navigate("/alumni-officer/posts/create");
  }

  function handleEditPost(post) {
    const postId = typeof post === "string" ? post : post?.id;
    const postTitle = typeof post === "string" ? "" : post?.postHeader;

    if (!postId) return;

    if (inDashboard && typeof onEditPost === "function") {
      onEditPost(postId, postTitle);
      return;
    }

    navigate(`/alumni-officer/posts/edit/${postId}`, {
      state: {
        post,
        initialPost: post,
        postTitle,
        title: postTitle || "Edit Post",
        breadcrumbLabel: "Edit Post",
      },
    });
  }

  function handlePreviewPost(post) {
    if (!post?.id) return;

    setPreviewPost(post);
    setPreviewOpen(true);
  }

  function openDeleteDialog(post) {
    setPostToDelete(post);
    setDeleteDialogOpen(true);
  }

  async function handleDeletePost() {
    if (!postToDelete?.id) return;

    setActionLoadingId(postToDelete.id);
    setError("");

    try {
      await deleteDoc(doc(db, "newsPosts", postToDelete.id));

      setPosts((prev) => prev.filter((item) => item.id !== postToDelete.id));
      setSelectedIds((prev) => prev.filter((id) => id !== postToDelete.id));
      setDeleteDialogOpen(false);
      setPostToDelete(null);

      if (previewPost?.id === postToDelete.id) {
        setPreviewOpen(false);
        setPreviewPost(null);
      }
    } catch (err) {
      console.error("Failed to delete post:", err);
      setError(err?.message || "Failed to delete post.");
    } finally {
      setActionLoadingId("");
    }
  }

  async function handleBulkDeletePosts() {
    if (!selectedIds.length) return;

    setBulkDeleting(true);
    setError("");

    try {
      for (const postId of selectedIds) {
        await deleteDoc(doc(db, "newsPosts", postId));
      }

      setPosts((prev) => prev.filter((item) => !selectedIds.includes(item.id)));
      setSelectedIds([]);
      setBulkDeleteDialogOpen(false);

      if (previewPost?.id && selectedIds.includes(previewPost.id)) {
        setPreviewOpen(false);
        setPreviewPost(null);
      }
    } catch (err) {
      console.error("Failed to delete selected posts:", err);
      setError(err?.message || "Failed to delete selected posts.");
    } finally {
      setBulkDeleting(false);
    }
  }

  const normalizedPosts = useMemo(() => {
    return posts.map((post) => ({
      ...post,
      postHeader: safe(post.postHeader),
      postContent: safe(post.postContent || post.text),
      authorName: safe(post.authorName),
      authorEmail: safe(post.authorEmail),
      authorRole: safe(post.authorRole),
      authorPhotoURL: getPostAuthorPhotoURL(post),
      links: Array.isArray(post.links) ? post.links : [],
      photoURLs: Array.isArray(post.photoURLs)
        ? post.photoURLs.map(getStringPhoto).filter(Boolean)
        : [],
      status: normalizePostStatus(post.effectiveStatus || post.status),
    }));
  }, [posts]);

  const filtered = useMemo(() => {
    const q = norm(search);

    return normalizedPosts
      .filter((post) => {
        const matchesSearch =
          !q ||
          [
            post.postHeader,
            post.postContent,
            post.authorName,
            post.authorEmail,
            post.authorRole,
          ]
            .map(norm)
            .join(" | ")
            .includes(q);

        const hasImages = post.photoURLs.length > 0;
        const hasLinks = post.links.length > 0;

        const matchesMedia =
          mediaFilter === "all" ||
          (mediaFilter === "with_images" && hasImages) ||
          (mediaFilter === "with_links" && hasLinks) ||
          (mediaFilter === "text_only" && !hasImages && !hasLinks);

        const matchesStatusMode =
          statusMode === "inactive" ? post.status !== "open" : post.status === "open";

        const matchesStatus =
          statusFilter === "all" || post.status === statusFilter;

        return matchesSearch && matchesMedia && matchesStatusMode && matchesStatus;
      })
      .sort((a, b) => {
        const aTime = getCreatedAtMillis(a.createdAt);
        const bTime = getCreatedAtMillis(b.createdAt);

        return sortOrder === "recent" ? bTime - aTime : aTime - bTime;
      });
  }, [normalizedPosts, search, mediaFilter, statusMode, statusFilter, sortOrder]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, mediaFilter, statusMode, statusFilter, sortOrder]);

  useEffect(() => {
    const validIds = new Set(normalizedPosts.map((post) => post.id));
    setSelectedIds((prev) => prev.filter((id) => validIds.has(id)));
  }, [normalizedPosts]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const pageStart = filtered.length === 0 ? 0 : (safePage - 1) * pageSize;
  const pageEnd = Math.min(pageStart + pageSize, filtered.length);
  const paginated = filtered.slice(pageStart, pageEnd);

  useEffect(() => {
    if (currentPage !== safePage) setCurrentPage(safePage);
  }, [currentPage, safePage]);

  const stats = getPostStats(normalizedPosts);

  const hasActiveFilters =
    search !== "" ||
    sortOrder !== "recent" ||
    mediaFilter !== "all" ||
    statusMode !== "active" ||
    statusFilter !== "all";

  const pageIds = paginated.map((post) => post.id).filter(Boolean);
  const selectedCount = selectedIds.length;
  const allSelected =
    pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));
  const someSelected =
    pageIds.some((id) => selectedIds.includes(id)) && !allSelected;

  function resetAllFilters() {
    setSearch("");
    setSortOrder("recent");
    setMediaFilter("all");
    setStatusMode("active");
    setStatusFilter("all");
  }

  function toggleRow(post) {
    if (!post?.id) return;

    setSelectedIds((prev) =>
      prev.includes(post.id)
        ? prev.filter((id) => id !== post.id)
        : [...prev, post.id]
    );
  }

  function toggleAllRows() {
    if (!pageIds.length) return;

    setSelectedIds((prev) => {
      if (pageIds.every((id) => prev.includes(id))) {
        return prev.filter((id) => !pageIds.includes(id));
      }

      const next = new Set(prev);
      pageIds.forEach((id) => next.add(id));
      return Array.from(next);
    });
  }

  function handleStatusModeChange(value) {
    setStatusMode(value);
    setStatusFilter("all");
  }

  function handleStatusFilterChange(value) {
    setStatusFilter(value);

    if (value === "open") {
      setStatusMode("active");
      return;
    }

    if (["draft", "closed", "archived"].includes(value)) {
      setStatusMode("inactive");
    }
  }

  return (
    <>
      <div className="space-y-2">
        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-sm text-destructive animate-in fade-in-50 slide-in-from-top-1 duration-200">
            {error}
          </div>
        )}

        {!loading && (
          <div className="mb-5 grid gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
            <div className="group rounded-xl border border-border bg-card px-5 py-4 shadow-sm transition-all duration-200 hover:shadow-md hover:border-[#3D398C]/20 hover:-translate-y-0.5 cursor-default">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#3D398C]/10 transition-colors duration-200 group-hover:bg-[#3D398C]/15">
                  <FileText className="h-5 w-5" style={{ color: BB }} />
                </div>

                <div className="space-y-0.5">
                  <p
                    className="text-xl font-bold leading-tight tracking-tight"
                    style={{ color: BB }}
                  >
                    {stats.total}
                  </p>
                  <p className="text-xs font-semibold text-foreground/80">
                    Total Posts
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    All post records in the system
                  </p>
                </div>
              </div>
            </div>

            <div className="group rounded-xl border border-border bg-card px-5 py-4 shadow-sm transition-all duration-200 hover:shadow-md hover:border-blue-200 hover:-translate-y-0.5 cursor-default">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 transition-colors duration-200 group-hover:bg-blue-100">
                  <ImageIcon className="h-5 w-5 text-blue-600" />
                </div>

                <div className="space-y-0.5">
                  <p className="text-xl font-bold leading-tight tracking-tight text-blue-700">
                    {stats.withImages}
                  </p>
                  <p className="text-xs font-semibold text-foreground/80">
                    With Images
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Posts containing uploaded images
                  </p>
                </div>
              </div>
            </div>

            <div className="group rounded-xl border border-border bg-card px-5 py-4 shadow-sm transition-all duration-200 hover:shadow-md hover:border-emerald-200 hover:-translate-y-0.5 cursor-default">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 transition-colors duration-200 group-hover:bg-emerald-100">
                  <Link2 className="h-5 w-5 text-emerald-600" />
                </div>

                <div className="space-y-0.5">
                  <p className="text-xl font-bold leading-tight tracking-tight text-emerald-700">
                    {stats.withLinks}
                  </p>
                  <p className="text-xs font-semibold text-foreground/80">
                    With Links
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Posts containing external links
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-semibold tracking-tight text-foreground">
              Posts
            </h2>
            <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground">
              Manage announcements, alumni stories, and published updates shown across the alumni portal.
            </p>
          </div>

          <div className="flex flex-col gap-3 border-b border-border/70 pb-3 xl:flex-row xl:items-end xl:justify-between">
            <div className="flex flex-wrap items-end gap-2.5">
              <div>
                <Label className="mb-1 block text-[11px] font-medium text-muted-foreground">
                  Visibility
                </Label>

                <Tabs value={statusMode} onValueChange={handleStatusModeChange}>
                  <TabsList className="inline-flex h-8 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
                    <TabsTrigger
                      value="active"
                      className="h-6 rounded-sm px-3 text-[11px] font-medium transition-colors data-active:!bg-[#3D398C] data-active:!text-white data-[state=active]:!bg-[#3D398C] data-[state=active]:!text-white"
                    >
                      Active
                    </TabsTrigger>
                    <TabsTrigger
                      value="inactive"
                      className="h-6 rounded-sm px-3 text-[11px] font-medium transition-colors data-active:!bg-[#3D398C] data-active:!text-white data-[state=active]:!bg-[#3D398C] data-[state=active]:!text-white"
                    >
                      Inactive
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="min-w-[240px] flex-1 md:max-w-[320px]">
                <Label className="mb-1 block text-[11px] font-medium text-muted-foreground">
                  Search
                </Label>

                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by title, content, author, or role..."
                    className="h-8 rounded-md border-border bg-background pl-7 pr-7 text-xs shadow-none"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />

                  {search ? (
                    <button
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                      onClick={() => setSearch("")}
                      type="button"
                      aria-label="Clear search"
                    >
                      <RotateCcw className="h-3 w-3" />
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="min-w-[150px]">
                <Label className="mb-1 block text-[11px] font-medium text-muted-foreground">
                  Media
                </Label>

                <Select value={mediaFilter} onValueChange={setMediaFilter}>
                  <SelectTrigger className="h-8 w-[160px] rounded-md border-border bg-background text-xs shadow-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[100] border border-gray-200 bg-white text-gray-900 shadow-lg">
                    <SelectItem value="all">All Posts</SelectItem>
                    <SelectItem value="with_images">With Images</SelectItem>
                    <SelectItem value="with_links">With Links</SelectItem>
                    <SelectItem value="text_only">Text Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="min-w-[130px]">
                <Label className="mb-1 block text-[11px] font-medium text-muted-foreground">
                  Sort
                </Label>

                <Select value={sortOrder} onValueChange={setSortOrder}>
                  <SelectTrigger className="h-8 w-[130px] rounded-md border-border bg-background text-xs shadow-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[100] border border-gray-200 bg-white text-gray-900 shadow-lg">
                    <SelectItem value="recent">Newest</SelectItem>
                    <SelectItem value="oldest">Oldest</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="mb-1 block text-[11px] font-medium text-muted-foreground">
                  Status
                </Label>

                <Tabs value={statusFilter} onValueChange={handleStatusFilterChange}>
                  <TabsList className="inline-flex h-8 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
                    <TabsTrigger
                      value="all"
                      className="h-6 rounded-sm px-3 text-[11px] font-medium transition-colors data-active:!bg-[#3D398C] data-active:!text-white data-[state=active]:!bg-[#3D398C] data-[state=active]:!text-white"
                    >
                      All
                    </TabsTrigger>
                    <TabsTrigger
                      value="open"
                      className="h-6 rounded-sm px-3 text-[11px] font-medium transition-colors data-active:!bg-[#3D398C] data-active:!text-white data-[state=active]:!bg-[#3D398C] data-[state=active]:!text-white"
                    >
                      Open
                    </TabsTrigger>
                    <TabsTrigger
                      value="draft"
                      className="h-6 rounded-sm px-3 text-[11px] font-medium transition-colors data-active:!bg-[#3D398C] data-active:!text-white data-[state=active]:!bg-[#3D398C] data-[state=active]:!text-white"
                    >
                      Draft
                    </TabsTrigger>
                    <TabsTrigger
                      value="closed"
                      className="h-6 rounded-sm px-3 text-[11px] font-medium transition-colors data-active:!bg-[#3D398C] data-active:!text-white data-[state=active]:!bg-[#3D398C] data-[state=active]:!text-white"
                    >
                      Closed
                    </TabsTrigger>
                    <TabsTrigger
                      value="archived"
                      className="h-6 rounded-sm px-3 text-[11px] font-medium transition-colors data-active:!bg-[#3D398C] data-active:!text-white data-[state=active]:!bg-[#3D398C] data-[state=active]:!text-white"
                    >
                      Archive
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {selectedCount > 0 ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={bulkDeleting}
                  className="h-8 gap-1.5 rounded-md border-red-200 bg-red-50 px-3 text-xs font-medium text-red-600 shadow-none hover:bg-red-100 hover:text-red-700"
                  onClick={() => setBulkDeleteDialogOpen(true)}
                >
                  {bulkDeleting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                  Delete {selectedCount} selected {selectedCount === 1 ? "post" : "posts"}
                </Button>
              ) : null}

              {hasActiveFilters ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 rounded-md border-border px-3 text-xs font-medium shadow-none"
                  onClick={resetAllFilters}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Clear filter
                </Button>
              ) : null}
            </div>

            <Button
              type="button"
              size="sm"
              className="h-8 shrink-0 gap-1.5 rounded-md bg-[#3D398C] px-3 text-xs font-semibold text-white shadow-none hover:bg-[#312E73]"
              onClick={handleCreatePost}
            >
              <Plus className="h-3.5 w-3.5" />
              Create new post
            </Button>
          </div>
        </div>
        <div className="overflow-hidden bg-transparent">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border/50 bg-transparent hover:bg-transparent">
                  <TableHead className="w-10 px-3 py-2">
                    <input
                      type="checkbox"
                      checked={allSelected || someSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = someSelected;
                      }}
                      onChange={toggleAllRows}
                      className="h-3.5 w-3.5 cursor-pointer rounded border-gray-300 accent-[#3D398C]"
                    />
                  </TableHead>

                  <TableHead className="min-w-[260px] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    Post
                  </TableHead>

                  <TableHead className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    Author
                  </TableHead>

                  <TableHead className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    Status
                  </TableHead>

                  <TableHead className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    Created
                  </TableHead>

                  <TableHead className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-40 text-center text-muted-foreground"
                    >
                      <div className="flex flex-col items-center gap-3">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground/20 border-t-[#3D398C]" />
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-foreground/70">
                            Loading posts...
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            Fetching post records from the database
                          </p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : paginated.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-40 text-center text-muted-foreground"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                          <Search className="h-5 w-5 text-muted-foreground/40" />
                        </div>

                        <div className="space-y-1">
                          <p className="text-sm font-medium text-foreground/70">
                            No posts found
                          </p>

                          {hasActiveFilters ? (
                            <div className="space-y-1.5">
                              <p className="text-[11px] text-muted-foreground">
                                No posts match your current search or filters.
                              </p>

                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-[11px] gap-1.5"
                                onClick={resetAllFilters}
                              >
                                <RotateCcw className="h-3 w-3" />
                                Clear all filters
                              </Button>
                            </div>
                          ) : (
                            <p className="text-[11px] text-muted-foreground">
                              No post records exist yet.
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((post) => {
                    const isSelected = selectedIds.includes(post.id);

                    const name =
                      post.authorName ||
                      post.authorEmail?.split("@")?.[0] ||
                      "Unknown";

                    const postHeader = post.postHeader || "Untitled Post";
                    const postContent = post.postContent || "—";

                    return (
                      <TableRow
                        key={post.id}
                        onClick={() => handlePreviewPost(post)}
                        className={`cursor-pointer transition-colors duration-150 ${
                          isSelected
                            ? "bg-[#3D398C]/5 hover:bg-[#3D398C]/10"
                            : "hover:bg-[#3D398C]/5"
                        }`}
                      >
                        <TableCell
                          className="py-2 px-3"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleRow(post)}
                            className="h-3.5 w-3.5 rounded border-gray-300 accent-[#3D398C] cursor-pointer"
                          />
                        </TableCell>

                        <TableCell className="py-2 px-3">
                          <div className="min-w-0 space-y-1">
                            <span className="text-[13px] font-semibold text-foreground truncate block max-w-[300px]">
                              {postHeader}
                            </span>
                            <span className="text-xs text-muted-foreground line-clamp-2 block max-w-[360px]">
                              {postContent}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell className="py-2 px-3">
                          <span className="text-xs font-medium text-foreground truncate block max-w-[180px]">
                            {name}
                          </span>
                        </TableCell>

                        <TableCell className="py-2 px-3">
                          {(() => {
                            const badge = getPostStatusBadge(post.status);

                            return (
                              <Badge className={`${badge.cls} h-5 px-1.5 py-0 text-[10px] font-medium`}>
                                {badge.label}
                              </Badge>
                            );
                          })()}
                        </TableCell>

                        <TableCell className="py-2 px-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <CalendarDays className="h-3 w-3" />
                            <span>{formatCreatedAt(post.createdAt)}</span>
                          </div>
                        </TableCell>

                        <TableCell
                          className="py-2 px-3 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-end gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-md text-muted-foreground hover:bg-[#3D398C]/10 hover:text-[#3D398C]"
                                  disabled={actionLoadingId === post.id}
                                  onClick={() => handleEditPost(post)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-xs">
                                Edit
                              </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-md text-muted-foreground hover:bg-red-50 hover:text-red-600"
                                  disabled={actionLoadingId === post.id}
                                  onClick={() => openDeleteDialog(post)}
                                >
                                  {actionLoadingId === post.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-xs">
                                Delete
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col items-center justify-between gap-2 border-t border-border/50 px-3 py-3 sm:flex-row">
            <div className="flex items-center gap-3">
              <p className="text-[11px] text-muted-foreground">
                Showing{" "}
                <span className="font-semibold text-foreground">
                  {filtered.length === 0 ? 0 : pageStart + 1}
                </span>{" "}
                to{" "}
                <span className="font-semibold text-foreground">
                  {pageEnd}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-foreground">
                  {filtered.length}
                </span>{" "}
                {filtered.length === 1 ? "record" : "records"}
                {filtered.length !== normalizedPosts.length && (
                  <span className="text-muted-foreground/60">
                    {" "}
                    (filtered from {normalizedPosts.length})
                  </span>
                )}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-muted-foreground">
                  Rows per page
                </span>

                <Select
                  value={String(pageSize)}
                  onValueChange={(v) => {
                    setPageSize(Number(v));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="h-7 w-[62px] text-[11px] bg-background border-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="end" className="z-[100] border border-gray-200 bg-white text-gray-900 shadow-lg">
                    {PS_OPTIONS.map((n) => (
                      <SelectItem
                        key={n}
                        value={String(n)}
                        className="text-[11px]"
                      >
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <span className="h-4 w-px bg-border" />

              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setCurrentPage(1)}
                disabled={safePage <= 1}
              >
                <ChevronFirst className="h-3.5 w-3.5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>

              <span className="px-2 text-[11px] font-medium text-muted-foreground tabular-nums">
                {safePage} / {totalPages}
              </span>

              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={safePage >= totalPages}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setCurrentPage(totalPages)}
                disabled={safePage >= totalPages}
              >
                <ChevronLast className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {hasMore ? (
          <div className="flex justify-center pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => loadPosts(true)}
              disabled={loadingMore}
              className="gap-2"
            >
              {loadingMore ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              {loadingMore ? "Loading..." : "Load More from Database"}
            </Button>
          </div>
        ) : null}
      </div>

      <PostPreviewDialog
        open={previewOpen}
        onOpenChange={(open) => {
          setPreviewOpen(open);
          if (!open) setPreviewPost(null);
        }}
        post={previewPost}
        onEdit={handleEditPost}
        onDelete={openDeleteDialog}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete post?</AlertDialogTitle>
            <AlertDialogDescription>
              Do you want to delete this post? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="rounded-xl border border-border bg-muted/20 px-4 py-3">
            <p className="text-sm font-semibold text-foreground">
              {postToDelete?.postHeader || "Untitled Post"}
            </p>
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
              {postToDelete?.postContent || postToDelete?.text || "—"}
            </p>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={Boolean(actionLoadingId)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePost}
              disabled={Boolean(actionLoadingId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {actionLoadingId ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={bulkDeleteDialogOpen}
        onOpenChange={setBulkDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete selected posts?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete {selectedCount}{" "}
              {selectedCount === 1 ? "selected post" : "selected posts"}.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkDeleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDeletePosts}
              disabled={bulkDeleting || selectedCount === 0}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {bulkDeleting ? "Deleting..." : "Delete Selected"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
