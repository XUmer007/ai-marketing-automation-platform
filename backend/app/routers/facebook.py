import os
from urllib.parse import urlencode

import requests
from dotenv import load_dotenv
from fastapi import (
    APIRouter,
    HTTPException,
    UploadFile,
    File,
    Form,
)
from fastapi.responses import RedirectResponse
from pydantic import BaseModel

load_dotenv()

router = APIRouter()


# =========================================================
# CONFIG
# =========================================================

FACEBOOK_APP_ID = os.getenv("FACEBOOK_APP_ID")
FACEBOOK_APP_SECRET = os.getenv("FACEBOOK_APP_SECRET")

BACKEND_URL = os.getenv(
    "BACKEND_URL",
    "http://localhost:8000",
)

FRONTEND_URL = os.getenv(
    "FRONTEND_URL",
    "http://localhost:5173",
)

FACEBOOK_GRAPH_VERSION = "v23.0"

FACEBOOK_REDIRECT_URI = (
    f"{BACKEND_URL}/facebook/callback"
)

FACEBOOK_PERMISSIONS = [
    "pages_show_list",
    "pages_read_engagement",
    "pages_manage_posts",
]


# =========================================================
# TEMPORARY FACEBOOK CONNECTION STORAGE
# =========================================================
#
# FIRST TEST VERSION ONLY.
#
# Later:
# Save these details per Firebase user in PostgreSQL.
#
# =========================================================

facebook_connection = {
    "connected": False,
    "page_id": None,
    "page_name": None,
    "page_access_token": None,
}


# =========================================================
# SCHEMAS
# =========================================================

class FacebookPostRequest(BaseModel):
    message: str


# =========================================================
# CONNECT FACEBOOK
# =========================================================

@router.get("/connect-url")
def get_facebook_connect_url():

    if not FACEBOOK_APP_ID:
        raise HTTPException(
            status_code=500,
            detail="FACEBOOK_APP_ID is missing",
        )

    params = {
        "client_id": FACEBOOK_APP_ID,
        "redirect_uri": FACEBOOK_REDIRECT_URI,
        "scope": ",".join(FACEBOOK_PERMISSIONS),
        "response_type": "code",
    }

    connect_url = (
        f"https://www.facebook.com/"
        f"{FACEBOOK_GRAPH_VERSION}/dialog/oauth?"
        f"{urlencode(params)}"
    )

    return {
        "success": True,
        "connect_url": connect_url,
    }


# =========================================================
# FACEBOOK OAUTH CALLBACK
# =========================================================

@router.get("/callback")
def facebook_callback(
    code: str | None = None,
    error: str | None = None,
):

    if error:
        return RedirectResponse(
            url=f"{FRONTEND_URL}/?facebook=error"
        )

    if not code:
        raise HTTPException(
            status_code=400,
            detail="Facebook authorization code missing",
        )

    if not FACEBOOK_APP_ID:
        raise HTTPException(
            status_code=500,
            detail="FACEBOOK_APP_ID is missing",
        )

    if not FACEBOOK_APP_SECRET:
        raise HTTPException(
            status_code=500,
            detail="FACEBOOK_APP_SECRET is missing",
        )

    # =====================================================
    # EXCHANGE AUTHORIZATION CODE
    # FOR USER ACCESS TOKEN
    # =====================================================

    token_url = (
        f"https://graph.facebook.com/"
        f"{FACEBOOK_GRAPH_VERSION}/oauth/access_token"
    )

    try:
        token_response = requests.get(
            token_url,
            params={
                "client_id": FACEBOOK_APP_ID,
                "client_secret": FACEBOOK_APP_SECRET,
                "redirect_uri": FACEBOOK_REDIRECT_URI,
                "code": code,
            },
            timeout=30,
        )
    except requests.RequestException as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Facebook token request failed: {str(exc)}",
        )

    try:
        token_data = token_response.json()
    except ValueError:
        raise HTTPException(
            status_code=502,
            detail="Invalid response received from Facebook",
        )

    if token_response.status_code != 200:
        raise HTTPException(
            status_code=400,
            detail={
                "message": "Facebook token exchange failed",
                "facebook_response": token_data,
            },
        )

    user_access_token = token_data.get(
        "access_token"
    )

    if not user_access_token:
        raise HTTPException(
            status_code=400,
            detail="Facebook did not return a user access token",
        )

    # =====================================================
    # GET FACEBOOK PAGES
    # =====================================================

    pages_url = (
        f"https://graph.facebook.com/"
        f"{FACEBOOK_GRAPH_VERSION}/me/accounts"
    )

    try:
        pages_response = requests.get(
            pages_url,
            params={
                "fields": (
                    "id,name,access_token,tasks"
                ),
                "access_token": user_access_token,
            },
            timeout=30,
        )
    except requests.RequestException as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Could not contact Facebook: {str(exc)}",
        )

    try:
        pages_data = pages_response.json()
    except ValueError:
        raise HTTPException(
            status_code=502,
            detail="Invalid Pages response from Facebook",
        )

    if pages_response.status_code != 200:
        raise HTTPException(
            status_code=400,
            detail={
                "message": "Could not retrieve Facebook Pages",
                "facebook_response": pages_data,
            },
        )

    pages = pages_data.get(
        "data",
        [],
    )

    if not pages:
        raise HTTPException(
            status_code=400,
            detail=(
                "No Facebook Pages were found for this account."
            ),
        )

    # =====================================================
    # FIRST TEST VERSION
    #
    # CONNECT FIRST AVAILABLE FACEBOOK PAGE
    #
    # Later we can build page selection UI
    # if user manages multiple pages.
    # =====================================================

    page = pages[0]

    page_id = page.get("id")
    page_name = page.get("name")
    page_access_token = page.get(
        "access_token"
    )

    if not page_id:
        raise HTTPException(
            status_code=400,
            detail="Facebook Page ID is missing",
        )

    if not page_access_token:
        raise HTTPException(
            status_code=400,
            detail="Facebook Page access token is missing",
        )

    facebook_connection["connected"] = True
    facebook_connection["page_id"] = page_id
    facebook_connection["page_name"] = page_name
    facebook_connection[
        "page_access_token"
    ] = page_access_token

    print("========================================")
    print("FACEBOOK PAGE CONNECTED")
    print("Page ID:", page_id)
    print("Page Name:", page_name)
    print(
        "Page Token Received:",
        bool(page_access_token),
    )
    print("========================================")

    return RedirectResponse(
        url=f"{FRONTEND_URL}/?facebook=connected"
    )


# =========================================================
# FACEBOOK CONNECTION STATUS
# =========================================================

@router.get("/status")
def facebook_status():

    return {
        "success": True,
        "connected": facebook_connection[
            "connected"
        ],
        "page_id": facebook_connection[
            "page_id"
        ],
        "page_name": facebook_connection[
            "page_name"
        ],
    }


# =========================================================
# PUBLISH TEXT POST
# =========================================================

@router.post("/publish")
def publish_to_facebook(
    payload: FacebookPostRequest,
):

    if not facebook_connection[
        "connected"
    ]:
        raise HTTPException(
            status_code=400,
            detail="Facebook Page is not connected",
        )

    page_id = facebook_connection[
        "page_id"
    ]

    page_access_token = facebook_connection[
        "page_access_token"
    ]

    message = payload.message.strip()

    if not message:
        raise HTTPException(
            status_code=400,
            detail="Post message cannot be empty",
        )

    post_url = (
        f"https://graph.facebook.com/"
        f"{FACEBOOK_GRAPH_VERSION}/"
        f"{page_id}/feed"
    )

    try:
        response = requests.post(
            post_url,
            data={
                "message": message,
                "access_token": page_access_token,
            },
            timeout=30,
        )
    except requests.RequestException as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Facebook publishing request failed: {str(exc)}",
        )

    try:
        result = response.json()
    except ValueError:
        raise HTTPException(
            status_code=502,
            detail="Invalid response received from Facebook",
        )

    if response.status_code != 200:
        raise HTTPException(
            status_code=400,
            detail={
                "message": "Facebook publishing failed",
                "facebook_response": result,
            },
        )

    return {
        "success": True,
        "message": "Post published successfully",
        "post_id": result.get("id"),
    }


# =========================================================
# PUBLISH PHOTO + CAPTION
# =========================================================

@router.post("/publish-photo")
async def publish_photo_to_facebook(
    message: str = Form(""),
    image: UploadFile = File(...),
):

    if not facebook_connection[
        "connected"
    ]:
        raise HTTPException(
            status_code=400,
            detail="Facebook Page is not connected",
        )

    page_id = facebook_connection[
        "page_id"
    ]

    page_access_token = facebook_connection[
        "page_access_token"
    ]

    # =====================================================
    # VALIDATE IMAGE
    # =====================================================

    if not image.content_type:
        raise HTTPException(
            status_code=400,
            detail="Image type could not be detected",
        )

    if not image.content_type.startswith(
        "image/"
    ):
        raise HTTPException(
            status_code=400,
            detail="Please upload a valid image file",
        )

    # Optional safety limit
    max_image_size = 15 * 1024 * 1024

    image_bytes = await image.read()

    if not image_bytes:
        raise HTTPException(
            status_code=400,
            detail="Uploaded image is empty",
        )

    if len(image_bytes) > max_image_size:
        raise HTTPException(
            status_code=400,
            detail="Image is too large. Maximum size is 15 MB.",
        )

    # =====================================================
    # FACEBOOK PHOTOS ENDPOINT
    # =====================================================

    photo_url = (
        f"https://graph.facebook.com/"
        f"{FACEBOOK_GRAPH_VERSION}/"
        f"{page_id}/photos"
    )

    files = {
        "source": (
            image.filename or "facebook-image.jpg",
            image_bytes,
            image.content_type,
        )
    }

    data = {
        "access_token": page_access_token,
        "published": "true",
    }

    if message.strip():
        data["caption"] = message.strip()

    try:
        response = requests.post(
            photo_url,
            data=data,
            files=files,
            timeout=60,
        )
    except requests.RequestException as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Facebook photo upload failed: {str(exc)}",
        )

    try:
        result = response.json()
    except ValueError:
        raise HTTPException(
            status_code=502,
            detail="Invalid photo response from Facebook",
        )

    if response.status_code != 200:
        raise HTTPException(
            status_code=400,
            detail={
                "message": "Facebook photo publishing failed",
                "facebook_response": result,
            },
        )

    return {
        "success": True,
        "message": "Photo published successfully",
        "photo_id": result.get("id"),
        "post_id": result.get("post_id"),
    }


# =========================================================
# DISCONNECT FACEBOOK
# =========================================================

@router.post("/disconnect")
def disconnect_facebook():

    facebook_connection["connected"] = False
    facebook_connection["page_id"] = None
    facebook_connection["page_name"] = None
    facebook_connection[
        "page_access_token"
    ] = None

    return {
        "success": True,
        "message": "Facebook Page disconnected",
    }