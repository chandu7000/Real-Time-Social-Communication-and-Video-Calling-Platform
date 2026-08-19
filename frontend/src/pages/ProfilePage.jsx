import { useEffect, useMemo, useRef, useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  CameraIcon,
  ImageIcon,
  MapPinIcon,
  PencilIcon,
  SaveIcon,
  ShuffleIcon,
  UserRoundIcon,
  XIcon,
} from "lucide-react";
import toast from "react-hot-toast";

import {
  getMyProfile,
  updateMyProfile,
  uploadMyProfilePhoto,
} from "../lib/api";
import {
  getApiErrorMessage,
  validateProfileForm,
} from "../lib/profile";
import ProfileAvatar from "../components/ProfileAvatar";

const MAX_PROFILE_PHOTO_SIZE = 5 * 1024 * 1024;

const ALLOWED_PROFILE_PHOTO_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const emptyForm = {
  fullName: "",
  bio: "",
  location: "",
  nativeLanguage: "",
  learningLanguage: "",
  uploadedProfilePic: "",
  avatarProfilePic: "",
  profileImageMode: "avatar",
};

const buildProfileForm = (user = {}) => {
  const uploadedProfilePic = user.uploadedProfilePic || "";
  const avatarProfilePic = user.avatarProfilePic || "";

  let profileImageMode = user.profileImageMode;

  if (!["photo", "avatar"].includes(profileImageMode)) {
    profileImageMode = avatarProfilePic ? "avatar" : "photo";
  }

  return {
    fullName: user.fullName || "",
    bio: user.bio || "",
    location: user.location || "",
    nativeLanguage: user.nativeLanguage || "",
    learningLanguage: user.learningLanguage || "",
    uploadedProfilePic,
    avatarProfilePic,
    profileImageMode,
  };
};

const ProfilePage = () => {
  const queryClient = useQueryClient();
  const photoInputRef = useRef(null);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  const profileQuery = useQuery({
    queryKey: ["myProfile"],
    queryFn: getMyProfile,
  });

  const user = profileQuery.data?.user;

  useEffect(() => {
    if (user) {
      setForm(buildProfileForm(user));
    }
  }, [user]);

  const activePreview = useMemo(() => {
    if (!editing) {
      return user?.profilePic || "";
    }

    if (form.profileImageMode === "photo") {
      return (
        form.uploadedProfilePic ||
        user?.profilePic ||
        ""
      );
    }

    return (
      form.avatarProfilePic ||
      user?.profilePic ||
      ""
    );
  }, [
    editing,
    form.avatarProfilePic,
    form.profileImageMode,
    form.uploadedProfilePic,
    user?.profilePic,
  ]);

  const updateMutation = useMutation({
    mutationFn: updateMyProfile,

    onSuccess: async (data) => {
      queryClient.setQueryData(["myProfile"], data);

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["authUser"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["users"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["friends"],
        }),
      ]);

      toast.success(
        data.message ||
          "Profile updated successfully"
      );

      setEditing(false);
      setErrors({});
    },

    onError: (error) => {
      toast.error(
        getApiErrorMessage(
          error,
          "Unable to update profile"
        )
      );
    },
  });

  const photoUploadMutation = useMutation({
    mutationFn: uploadMyProfilePhoto,

    onSuccess: async (data) => {
      const updatedUser = data?.user;

      if (!updatedUser) {
        toast.error(
          "Profile photo uploaded, but the profile could not be refreshed"
        );
        return;
      }

      queryClient.setQueryData(
        ["myProfile"],
        data
      );

      setForm((current) => ({
        ...current,
        uploadedProfilePic:
          updatedUser.uploadedProfilePic || "",
        avatarProfilePic:
          updatedUser.avatarProfilePic ||
          current.avatarProfilePic,
        profileImageMode: "photo",
      }));

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["authUser"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["users"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["friends"],
        }),
      ]);

      toast.success(
        data.message ||
          "Profile photo uploaded successfully"
      );
    },

    onError: (error) => {
      toast.error(
        getApiErrorMessage(
          error,
          "Unable to upload profile photo"
        )
      );
    },
  });

  const handlePhotoSelection = (event) => {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) {
      return;
    }

    if (
      !ALLOWED_PROFILE_PHOTO_TYPES.includes(
        file.type
      )
    ) {
      toast.error(
        "Choose a JPEG, PNG, or WebP image"
      );
      return;
    }

    if (file.size > MAX_PROFILE_PHOTO_SIZE) {
      toast.error(
        "Profile photo must be 5 MB or smaller"
      );
      return;
    }

    photoUploadMutation.mutate(file);
  };

  const handleGenerateAvatar = () => {
    const seed = `${
      form.fullName || "zenvio-user"
    }-${Date.now()}`;

    const avatarProfilePic =
      `https://api.dicebear.com/10.x/adventurer/svg?seed=${encodeURIComponent(
        seed
      )}`;

    setForm((current) => ({
      ...current,
      avatarProfilePic,
      profileImageMode: "avatar",
    }));

    toast.success("New avatar generated");
  };

  const handleUsePhoto = () => {
    if (!form.uploadedProfilePic) {
      toast.error(
        "Upload a profile photo first"
      );
      return;
    }

    setForm((current) => ({
      ...current,
      profileImageMode: "photo",
    }));
  };

  const handleUseAvatar = () => {
    if (!form.avatarProfilePic) {
      toast.error(
        "Generate an avatar first"
      );
      return;
    }

    setForm((current) => ({
      ...current,
      profileImageMode: "avatar",
    }));
  };

  const handleCancel = () => {
    setEditing(false);
    setErrors({});
    setForm(buildProfileForm(user));
  };

  const handleSave = (event) => {
    event.preventDefault();

    const standardProfileValues = {
      fullName: form.fullName,
      bio: form.bio,
      location: form.location,
      nativeLanguage: form.nativeLanguage,
      learningLanguage: form.learningLanguage,
      profilePic: activePreview,
    };

    const result =
      validateProfileForm(
        standardProfileValues
      );

    setErrors(result.errors);

    if (!result.isValid) {
      return;
    }

    updateMutation.mutate({
      fullName: result.values.fullName,
      bio: result.values.bio,
      location: result.values.location,
      nativeLanguage:
        result.values.nativeLanguage,
      learningLanguage:
        result.values.learningLanguage,
      uploadedProfilePic:
        form.uploadedProfilePic,
      avatarProfilePic:
        form.avatarProfilePic,
      profileImageMode:
        form.profileImageMode,
    });
  };

  const isBusy =
    updateMutation.isPending ||
    photoUploadMutation.isPending;

  if (profileQuery.isLoading) {
    return (
      <div className="flex justify-center py-20">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  if (profileQuery.isError || !user) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="alert alert-error">
          <span>
            {getApiErrorMessage(
              profileQuery.error,
              "Unable to load profile"
            )}
          </span>
        </div>

        <button
          className="btn btn-primary mt-4"
          onClick={() =>
            profileQuery.refetch()
          }
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="max-w-3xl mx-auto card bg-base-200 shadow-sm">
        <div className="card-body gap-6">
          {!editing && (
            <div className="flex flex-col sm:flex-row sm:items-start gap-5">
              <ProfileAvatar
                src={user.profilePic}
                name={user.fullName}
                className="w-28 h-28"
              />

              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h1 className="text-3xl font-bold break-words">
                      {user.fullName}
                    </h1>

                    <p className="flex items-center gap-1 opacity-70 mt-1">
                      <MapPinIcon
                        className="size-4"
                        aria-hidden="true"
                      />

                      {user.location ||
                        "Location not added"}
                    </p>
                  </div>

                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() =>
                      setEditing(true)
                    }
                  >
                    <PencilIcon
                      className="size-4"
                      aria-hidden="true"
                    />
                    Edit Profile
                  </button>
                </div>

                <p className="mt-4 whitespace-pre-wrap opacity-80">
                  {user.bio ||
                    "No bio added yet."}
                </p>
              </div>
            </div>
          )}

          {editing ? (
            <form
              onSubmit={handleSave}
              className="space-y-6"
              noValidate
            >
              <input
                ref={photoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={
                  handlePhotoSelection
                }
              />

              <section className="rounded-2xl border border-base-300 bg-base-100 p-5 sm:p-6">
                <div className="mb-5">
                  <h2 className="text-lg font-bold">
                    Profile Picture
                  </h2>

                  <p className="mt-1 text-sm opacity-65">
                    Keep both your photo and
                    avatar saved, then choose
                    which one people see across
                    Zenvio.
                  </p>
                </div>

                <div className="flex flex-col items-center">
                  <div className="relative">
                    <ProfileAvatar
                      src={activePreview}
                      name={
                        form.fullName ||
                        user.fullName
                      }
                      className="h-36 w-36 ring-4 ring-base-200 shadow-md"
                    />

                    <div className="absolute -bottom-1 -right-1 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-content shadow">
                      {form.profileImageMode ===
                      "photo" ? (
                        <CameraIcon
                          className="size-5"
                          aria-hidden="true"
                        />
                      ) : (
                        <UserRoundIcon
                          className="size-5"
                          aria-hidden="true"
                        />
                      )}
                    </div>
                  </div>

                  <p className="mt-4 text-sm font-semibold">
                    {form.profileImageMode ===
                    "photo"
                      ? "Showing your photo"
                      : "Showing your avatar"}
                  </p>

                  <p className="mt-1 text-center text-xs opacity-60">
                    Switching display mode does
                    not delete your saved photo
                    or avatar.
                  </p>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    className="btn btn-outline gap-2"
                    disabled={isBusy}
                    onClick={() =>
                      photoInputRef.current?.click()
                    }
                  >
                    {photoUploadMutation.isPending ? (
                      <span className="loading loading-spinner loading-sm" />
                    ) : (
                      <ImageIcon
                        className="size-4"
                        aria-hidden="true"
                      />
                    )}

                    {photoUploadMutation.isPending
                      ? "Uploading..."
                      : form.uploadedProfilePic
                        ? "Change Photo"
                        : "Upload Photo"}
                  </button>

                  <button
                    type="button"
                    className="btn btn-outline gap-2"
                    onClick={
                      handleGenerateAvatar
                    }
                    disabled={isBusy}
                  >
                    <ShuffleIcon
                      className="size-4"
                      aria-hidden="true"
                    />

                    Generate Avatar
                  </button>
                </div>

                <div className="mt-6">
                  <p className="mb-3 text-sm font-semibold">
                    Display preference
                  </p>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      disabled={
                        !form.uploadedProfilePic ||
                        isBusy
                      }
                      onClick={handleUsePhoto}
                      className={`rounded-xl border p-4 text-left transition ${
                        form.profileImageMode ===
                        "photo"
                          ? "border-primary bg-primary/10"
                          : "border-base-300 bg-base-200 hover:border-primary/40"
                      } ${
                        !form.uploadedProfilePic
                          ? "cursor-not-allowed opacity-50"
                          : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                            form.profileImageMode ===
                            "photo"
                              ? "bg-primary text-primary-content"
                              : "bg-base-300"
                          }`}
                        >
                          <CameraIcon
                            className="size-5"
                            aria-hidden="true"
                          />
                        </div>

                        <div className="min-w-0">
                          <p className="font-semibold">
                            My Photo
                          </p>

                          <p className="text-xs opacity-60">
                            {form.uploadedProfilePic
                              ? "Saved photo available"
                              : "No photo uploaded yet"}
                          </p>
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      disabled={
                        !form.avatarProfilePic ||
                        isBusy
                      }
                      onClick={handleUseAvatar}
                      className={`rounded-xl border p-4 text-left transition ${
                        form.profileImageMode ===
                        "avatar"
                          ? "border-primary bg-primary/10"
                          : "border-base-300 bg-base-200 hover:border-primary/40"
                      } ${
                        !form.avatarProfilePic
                          ? "cursor-not-allowed opacity-50"
                          : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                            form.profileImageMode ===
                            "avatar"
                              ? "bg-primary text-primary-content"
                              : "bg-base-300"
                          }`}
                        >
                          <UserRoundIcon
                            className="size-5"
                            aria-hidden="true"
                          />
                        </div>

                        <div className="min-w-0">
                          <p className="font-semibold">
                            Avatar
                          </p>

                          <p className="text-xs opacity-60">
                            {form.avatarProfilePic
                              ? "Saved avatar available"
                              : "Generate an avatar first"}
                          </p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </section>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="form-control">
                  <span className="label-text font-medium mb-1">
                    Full name
                  </span>

                  <input
                    className={`input input-bordered w-full ${
                      errors.fullName
                        ? "input-error"
                        : ""
                    }`}
                    value={form.fullName}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        fullName:
                          event.target.value,
                      }))
                    }
                    aria-invalid={Boolean(
                      errors.fullName
                    )}
                  />

                  {errors.fullName && (
                    <span className="text-error text-sm mt-1">
                      {errors.fullName}
                    </span>
                  )}
                </label>

                <label className="form-control">
                  <span className="label-text font-medium mb-1">
                    Location
                  </span>

                  <input
                    className={`input input-bordered w-full ${
                      errors.location
                        ? "input-error"
                        : ""
                    }`}
                    value={form.location}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        location:
                          event.target.value,
                      }))
                    }
                    aria-invalid={Boolean(
                      errors.location
                    )}
                  />

                  {errors.location && (
                    <span className="text-error text-sm mt-1">
                      {errors.location}
                    </span>
                  )}
                </label>

                <label className="form-control">
                  <span className="label-text font-medium mb-1">
                    Native language
                  </span>

                  <input
                    className={`input input-bordered w-full ${
                      errors.nativeLanguage
                        ? "input-error"
                        : ""
                    }`}
                    value={
                      form.nativeLanguage
                    }
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        nativeLanguage:
                          event.target.value,
                      }))
                    }
                    aria-invalid={Boolean(
                      errors.nativeLanguage
                    )}
                  />

                  {errors.nativeLanguage && (
                    <span className="text-error text-sm mt-1">
                      {
                        errors.nativeLanguage
                      }
                    </span>
                  )}
                </label>

                <label className="form-control">
                  <span className="label-text font-medium mb-1">
                    Learning language
                  </span>

                  <input
                    className={`input input-bordered w-full ${
                      errors.learningLanguage
                        ? "input-error"
                        : ""
                    }`}
                    value={
                      form.learningLanguage
                    }
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        learningLanguage:
                          event.target.value,
                      }))
                    }
                    aria-invalid={Boolean(
                      errors.learningLanguage
                    )}
                  />

                  {errors.learningLanguage && (
                    <span className="text-error text-sm mt-1">
                      {
                        errors.learningLanguage
                      }
                    </span>
                  )}
                </label>
              </div>

              <label className="form-control">
                <span className="label-text font-medium mb-1">
                  Bio
                </span>

                <textarea
                  className={`textarea textarea-bordered min-h-28 ${
                    errors.bio
                      ? "textarea-error"
                      : ""
                  }`}
                  value={form.bio}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      bio: event.target.value,
                    }))
                  }
                />

                <div className="flex justify-between mt-1 text-xs opacity-60">
                  <span>
                    {errors.bio ||
                      "Tell people a little about yourself"}
                  </span>

                  <span>
                    {form.bio.length}/300
                  </span>
                </div>
              </label>

              <div className="flex flex-wrap gap-3 justify-end border-t border-base-300 pt-5">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={handleCancel}
                  disabled={isBusy}
                >
                  <XIcon
                    className="size-4"
                    aria-hidden="true"
                  />

                  Cancel
                </button>

                <button
                  className="btn btn-primary min-w-36"
                  disabled={isBusy}
                >
                  {updateMutation.isPending ? (
                    <span className="loading loading-spinner loading-sm" />
                  ) : (
                    <SaveIcon
                      className="size-4"
                      aria-hidden="true"
                    />
                  )}

                  Save Changes
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-box bg-base-100 p-4">
                <p className="text-sm opacity-60">
                  Native language
                </p>

                <p className="font-medium mt-1">
                  {user.nativeLanguage ||
                    "Not added"}
                </p>
              </div>

              <div className="rounded-box bg-base-100 p-4">
                <p className="text-sm opacity-60">
                  Learning language
                </p>

                <p className="font-medium mt-1">
                  {user.learningLanguage ||
                    "Not added"}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;