"""API routes for Pip's Puzzles.

  GET  /api/health/                 is the server up?                      (public)
  GET  /api/puzzles/                published puzzles in play order          (public)
  POST /api/auth/register/          {email, password} -> new parent account  (public)
  POST /api/auth/token/             {username: email, password} -> JWT pair (public)
  POST /api/auth/token/refresh/     {refresh} -> new access token          (public)
  CRUD /api/children/               the signed-in parent's children
  GET  /api/progress/?child=<id>    a child's best stars per puzzle
  POST /api/progress/sync/          upload stars, get the merged result back
  POST /api/events/                 anonymous play events from the game     (public)
  /privacy/                         privacy policy for parents and app stores (public)
  /dashboard/                       staff dashboard: play stats, puzzle builder
  /admin/                           Django admin: puzzles, parents, children, progress, raw play events
"""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from accounts.views import ChildViewSet, RegisterView
from analytics.views import EventIngestView
from content.views import HealthView, PrivacyView, PuzzleListView
from progress.views import ProgressListView, ProgressSyncView

admin.site.site_header = "Pip's Puzzles admin"
admin.site.site_title = "Pip's Puzzles admin"
admin.site.site_url = "/dashboard/"  # "View site" in the admin goes to the dashboard

router = DefaultRouter()
router.register("children", ChildViewSet, basename="child")

urlpatterns = [
    path("admin/", admin.site.urls),
    path("dashboard/", include("dashboard.urls")),
    path("privacy/", PrivacyView.as_view(), name="privacy"),
    path("api/health/", HealthView.as_view(), name="health"),
    path("api/puzzles/", PuzzleListView.as_view(), name="puzzles"),
    path("api/auth/register/", RegisterView.as_view(), name="register"),
    path("api/auth/token/", TokenObtainPairView.as_view(), name="token"),
    path("api/auth/token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("api/progress/", ProgressListView.as_view(), name="progress"),
    path("api/progress/sync/", ProgressSyncView.as_view(), name="progress-sync"),
    path("api/events/", EventIngestView.as_view(), name="events"),
    path("api/", include(router.urls)),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
