import { useEffect, useRef, useState } from "react";

import Navbar from "../components/Navbar";
import ChatBox from "../components/ChatBox";

import { useAuth } from "../context/AuthContext";

import {
  connectFacebook,
  disconnectFacebook,
  getFacebookStatus,
  publishFacebookPhoto,
  publishFacebookPost,
} from "../api/facebook";

export default function Home() {
  const { user } = useAuth();

  const fileInputRef = useRef(null);

  const [facebookConnected, setFacebookConnected] = useState(false);

  const [facebookPageName, setFacebookPageName] = useState("");

  const [checkingFacebook, setCheckingFacebook] = useState(true);

  const [connecting, setConnecting] = useState(false);

  const [publishing, setPublishing] = useState(false);

  const [disconnecting, setDisconnecting] = useState(false);

  const [postText, setPostText] = useState("");

  const [selectedImage, setSelectedImage] = useState(null);

  const [imagePreview, setImagePreview] = useState("");

  const [message, setMessage] = useState("");

  const [messageType, setMessageType] = useState("");

  // =======================================================
  // LOAD FACEBOOK STATUS
  // =======================================================

  useEffect(() => {
    loadFacebookStatus();

    const params = new URLSearchParams(window.location.search);

    const facebookResult = params.get("facebook");

    if (facebookResult === "connected") {
      setMessage("Facebook Page connected successfully.");

      setMessageType("success");

      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (facebookResult === "error") {
      setMessage("Facebook connection was cancelled or failed.");

      setMessageType("error");

      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // =======================================================
  // CLEAN IMAGE PREVIEW MEMORY
  // =======================================================

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  // =======================================================
  // FACEBOOK STATUS
  // =======================================================

  async function loadFacebookStatus() {
    try {
      setCheckingFacebook(true);

      const data = await getFacebookStatus();

      setFacebookConnected(Boolean(data?.connected));

      setFacebookPageName(data?.page_name || "");
    } catch (error) {
      console.error("Facebook status error:", error);
    } finally {
      setCheckingFacebook(false);
    }
  }

  // =======================================================
  // CONNECT FACEBOOK
  // =======================================================

  async function handleFacebookConnect() {
    try {
      setConnecting(true);

      setMessage("");
      setMessageType("");

      await connectFacebook();
    } catch (error) {
      setMessage(error.message || "Facebook connection failed.");

      setMessageType("error");

      setConnecting(false);
    }
  }

  // =======================================================
  // SELECT IMAGE
  // =======================================================

  function handleImageChange(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setMessage("Please select a valid image file.");

      setMessageType("error");

      return;
    }

    const maxFileSize = 15 * 1024 * 1024;

    if (file.size > maxFileSize) {
      setMessage("Image is too large. Maximum size is 15 MB.");

      setMessageType("error");

      return;
    }

    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    const previewUrl = URL.createObjectURL(file);

    setSelectedImage(file);
    setImagePreview(previewUrl);

    setMessage("");
    setMessageType("");
  }

  // =======================================================
  // REMOVE IMAGE
  // =======================================================

  function removeSelectedImage() {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    setSelectedImage(null);
    setImagePreview("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  // =======================================================
  // PUBLISH FACEBOOK POST
  // =======================================================

  async function handlePublish() {
    if (!postText.trim() && !selectedImage) {
      setMessage("Please write some content or select an image.");

      setMessageType("error");

      return;
    }

    try {
      setPublishing(true);

      setMessage("");
      setMessageType("");

      let result;

      if (selectedImage) {
        result = await publishFacebookPhoto(postText, selectedImage);
      } else {
        result = await publishFacebookPost(postText);
      }

      if (selectedImage) {
        setMessage("Photo published successfully to your Facebook Page.");
      } else {
        setMessage(
          result?.post_id
            ? `Facebook post published successfully. Post ID: ${result.post_id}`
            : "Facebook post published successfully.",
        );
      }

      setMessageType("success");

      setPostText("");

      removeSelectedImage();
    } catch (error) {
      setMessage(error.message || "Facebook publishing failed.");

      setMessageType("error");
    } finally {
      setPublishing(false);
    }
  }

  // =======================================================
  // DISCONNECT FACEBOOK
  // =======================================================

  async function handleDisconnect() {
    try {
      setDisconnecting(true);

      setMessage("");
      setMessageType("");

      await disconnectFacebook();

      setFacebookConnected(false);
      setFacebookPageName("");

      setPostText("");

      removeSelectedImage();

      setMessage("Facebook Page disconnected successfully.");

      setMessageType("success");
    } catch (error) {
      setMessage(error.message || "Could not disconnect Facebook.");

      setMessageType("error");
    } finally {
      setDisconnecting(false);
    }
  }

  return (
    <div className="min-h-screen bg-beige">
      <Navbar />

      <main className="max-w-7xl mx-auto px-5 py-8">
        <section className="grid lg:grid-cols-[1.1fr_0.9fr] gap-8 items-stretch">
          <div>
            {/* =================================================
                HERO
            ================================================= */}

            <div className="classic-card rounded-3xl p-8 mb-8">
              <p className="text-sm uppercase tracking-[0.3em] text-mehroon">
                AI Powered Marketing
              </p>

              <h1 className="font-classic text-4xl md:text-6xl font-bold text-mehroonDark mt-4 leading-tight">
                Create Marketing Plans & Social Posts for Your Business
              </h1>

              <p className="text-mehroonDark/70 mt-5 text-lg max-w-2xl">
                Welcome {user?.name}. Chat with our AI, create your marketing
                plan, generate social content, and publish directly to your
                connected Facebook Page.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <button className="rounded-full bg-mehroon px-7 py-3 text-beige font-semibold hover:bg-mehroonDark transition">
                  Start Marketing Plan
                </button>

                {!facebookConnected ? (
                  <button
                    onClick={handleFacebookConnect}
                    disabled={connecting || checkingFacebook}
                    className="rounded-full border border-mehroon/30 px-7 py-3 text-mehroon font-semibold hover:bg-mehroon hover:text-beige transition disabled:opacity-60"
                  >
                    {checkingFacebook
                      ? "Checking Facebook..."
                      : connecting
                        ? "Connecting..."
                        : "Connect Facebook Page"}
                  </button>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-green-50 border border-green-200 px-5 py-3">
                      <p className="text-xs text-green-700">
                        Facebook Connected
                      </p>

                      <p className="text-sm font-semibold text-green-900">
                        {facebookPageName || "Facebook Page"}
                      </p>
                    </div>

                    <button
                      onClick={handleDisconnect}
                      disabled={disconnecting}
                      className="rounded-full border border-mehroon/30 px-5 py-3 text-mehroon font-semibold hover:bg-mehroon hover:text-beige transition disabled:opacity-60"
                    >
                      {disconnecting ? "Disconnecting..." : "Disconnect"}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* =================================================
                MESSAGE
            ================================================= */}

            {message && (
              <div
                className={`rounded-2xl p-4 mb-8 border ${
                  messageType === "success"
                    ? "bg-green-50 border-green-200 text-green-800"
                    : messageType === "error"
                      ? "bg-red-50 border-red-200 text-red-800"
                      : "classic-card text-mehroonDark"
                }`}
              >
                <p className="text-sm font-medium">{message}</p>
              </div>
            )}

            {/* =================================================
                FACEBOOK PUBLISHER
            ================================================= */}

            {facebookConnected && (
              <div className="classic-card rounded-3xl p-7 mb-8">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.2em] text-mehroon">
                      Facebook Publisher
                    </p>

                    <h2 className="font-classic text-3xl font-bold text-mehroonDark mt-2">
                      Create Your Facebook Post
                    </h2>

                    <p className="mt-2 text-sm text-mehroonDark/60">
                      Publishing to{" "}
                      <span className="font-semibold text-mehroonDark">
                        {facebookPageName || "your connected Page"}
                      </span>
                    </p>
                  </div>

                  <div className="rounded-full bg-green-50 border border-green-200 px-4 py-2 text-sm font-semibold text-green-700">
                    ✓ Connected
                  </div>
                </div>

                {/* =============================================
                    POST CAPTION
                ============================================= */}

                <div className="mt-7">
                  <label className="block text-sm font-semibold text-mehroonDark mb-2">
                    Post Caption
                  </label>

                  <textarea
                    value={postText}
                    onChange={(event) => setPostText(event.target.value)}
                    rows={7}
                    maxLength={5000}
                    placeholder="Write your Facebook post here..."
                    className="w-full resize-y rounded-2xl border border-mehroon/20 bg-white px-5 py-4 text-mehroonDark outline-none transition focus:border-mehroon focus:ring-2 focus:ring-mehroon/10"
                  />

                  <div className="mt-2 flex justify-end">
                    <span className="text-xs text-mehroonDark/45">
                      {postText.length} characters
                    </span>
                  </div>
                </div>

                {/* =============================================
                    IMAGE UPLOAD
                ============================================= */}

                <div className="mt-6">
                  <label className="block text-sm font-semibold text-mehroonDark mb-2">
                    Upload Photo
                  </label>

                  {!imagePreview ? (
                    <label className="flex cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed border-mehroon/20 bg-white px-6 py-10 text-center transition hover:border-mehroon/50 hover:bg-mehroon/[0.02]">
                      <div>
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-mehroon/10 text-xl text-mehroon">
                          +
                        </div>

                        <p className="mt-4 font-semibold text-mehroon">
                          Choose Photo From Computer
                        </p>

                        <p className="mt-1 text-xs text-mehroonDark/50">
                          JPG, JPEG, PNG, WEBP or another image format
                        </p>

                        <p className="mt-1 text-xs text-mehroonDark/40">
                          Maximum file size: 15 MB
                        </p>
                      </div>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  ) : (
                    <div className="overflow-hidden rounded-2xl border border-mehroon/15 bg-white">
                      <div className="bg-[#f8f5ef] p-4">
                        <img
                          src={imagePreview}
                          alt="Facebook post preview"
                          className="mx-auto max-h-[500px] w-full rounded-xl object-contain"
                        />
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-4 p-4">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-mehroonDark">
                            {selectedImage?.name}
                          </p>

                          <p className="mt-1 text-xs text-mehroonDark/50">
                            {selectedImage
                              ? (selectedImage.size / 1024 / 1024).toFixed(2)
                              : "0.00"}{" "}
                            MB
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={removeSelectedImage}
                          disabled={publishing}
                          className="rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                        >
                          Remove Photo
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* =============================================
                    PUBLISH BUTTON
                ============================================= */}

                <div className="mt-7 flex flex-wrap items-center gap-4">
                  <button
                    onClick={handlePublish}
                    disabled={publishing}
                    className="rounded-full bg-mehroon px-8 py-3.5 text-beige font-semibold transition hover:bg-mehroonDark disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {publishing
                      ? "Publishing..."
                      : selectedImage
                        ? "Post Photo to Facebook"
                        : "Post to Facebook"}
                  </button>

                  <p className="text-xs text-mehroonDark/50">
                    {selectedImage
                      ? "Your photo and caption will be published together."
                      : "Add a photo if you want to publish an image post."}
                  </p>
                </div>
              </div>
            )}

            {/* =================================================
                FEATURE CARDS
            ================================================= */}

            <div className="grid md:grid-cols-3 gap-5">
              <div className="classic-card rounded-2xl p-5">
                <h3 className="font-classic text-xl font-bold text-mehroonDark">
                  AI Strategy
                </h3>

                <p className="text-sm text-mehroonDark/65 mt-2">
                  AI understands your business and creates a practical marketing
                  direction.
                </p>
              </div>

              <div className="classic-card rounded-2xl p-5">
                <h3 className="font-classic text-xl font-bold text-mehroonDark">
                  Post Ideas
                </h3>

                <p className="text-sm text-mehroonDark/65 mt-2">
                  Generate captions, questions, hooks, and content plans for
                  social media.
                </p>
              </div>

              <div className="classic-card rounded-2xl p-5">
                <h3 className="font-classic text-xl font-bold text-mehroonDark">
                  Facebook Sharing
                </h3>

                <p className="text-sm text-mehroonDark/65 mt-2">
                  Connect your Facebook Page, upload photos, and publish
                  directly from your dashboard.
                </p>
              </div>
            </div>
          </div>

          {/* ===================================================
              AI CHAT
          =================================================== */}

          <ChatBox />
        </section>
      </main>
    </div>
  );
}
