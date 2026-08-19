import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MapPinIcon, PencilIcon, SaveIcon, XIcon } from "lucide-react";
import toast from "react-hot-toast";
import { getMyProfile, updateMyProfile } from "../lib/api";
import { getApiErrorMessage, validateProfileForm } from "../lib/profile";
import ProfileAvatar from "../components/ProfileAvatar";

const emptyForm = { fullName: "", bio: "", location: "", nativeLanguage: "", learningLanguage: "", profilePic: "" };

const ProfilePage = () => {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  const profileQuery = useQuery({ queryKey: ["myProfile"], queryFn: getMyProfile });
  const user = profileQuery.data?.user;

  useEffect(() => {
    if (user) {
      setForm({
        fullName: user.fullName || "",
        bio: user.bio || "",
        location: user.location || "",
        nativeLanguage: user.nativeLanguage || "",
        learningLanguage: user.learningLanguage || "",
        profilePic: user.profilePic || "",
      });
    }
  }, [user]);

  const updateMutation = useMutation({
    mutationFn: updateMyProfile,
    onSuccess: async (data) => {
      queryClient.setQueryData(["myProfile"], data);
      await queryClient.invalidateQueries({ queryKey: ["authUser"] });
      await queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success(data.message || "Profile updated successfully");
      setEditing(false);
      setErrors({});
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Unable to update profile")),
  });

  const handleSave = (event) => {
    event.preventDefault();
    const result = validateProfileForm(form);
    setErrors(result.errors);
    if (!result.isValid) return;
    updateMutation.mutate(result.values);
  };

  if (profileQuery.isLoading) {
    return <div className="flex justify-center py-20"><span className="loading loading-spinner loading-lg" /></div>;
  }

  if (profileQuery.isError || !user) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="alert alert-error"><span>{getApiErrorMessage(profileQuery.error, "Unable to load profile")}</span></div>
        <button className="btn btn-primary mt-4" onClick={() => profileQuery.refetch()}>Retry</button>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="max-w-3xl mx-auto card bg-base-200 shadow-sm">
        <div className="card-body gap-6">
          <div className="flex flex-col sm:flex-row sm:items-start gap-5">
            <ProfileAvatar src={editing ? form.profilePic : user.profilePic} name={user.fullName} className="w-28 h-28" />
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h1 className="text-3xl font-bold break-words">{user.fullName}</h1>
                  <p className="flex items-center gap-1 opacity-70 mt-1"><MapPinIcon className="size-4" />{user.location || "Location not added"}</p>
                </div>
                {!editing && <button className="btn btn-primary btn-sm" onClick={() => setEditing(true)}><PencilIcon className="size-4" />Edit Profile</button>}
              </div>
              {!editing && <p className="mt-4 whitespace-pre-wrap opacity-80">{user.bio || "No bio added yet."}</p>}
            </div>
          </div>

          {editing ? (
            <form onSubmit={handleSave} className="space-y-4" noValidate>
              {[
                ["fullName", "Full name"], ["location", "Location"], ["nativeLanguage", "Native language"],
                ["learningLanguage", "Learning language"], ["profilePic", "Profile image URL"],
              ].map(([field, label]) => (
                <label className="form-control" key={field}>
                  <span className="label-text font-medium mb-1">{label}</span>
                  <input className={`input input-bordered w-full ${errors[field] ? "input-error" : ""}`} value={form[field]} onChange={(e) => setForm((current) => ({ ...current, [field]: e.target.value }))} aria-invalid={Boolean(errors[field])} />
                  {errors[field] && <span className="text-error text-sm mt-1">{errors[field]}</span>}
                </label>
              ))}
              <label className="form-control">
                <span className="label-text font-medium mb-1">Bio</span>
                <textarea className={`textarea textarea-bordered min-h-28 ${errors.bio ? "textarea-error" : ""}`} value={form.bio} onChange={(e) => setForm((current) => ({ ...current, bio: e.target.value }))} />
                <div className="flex justify-between mt-1 text-xs opacity-60"><span>{errors.bio || "Tell people a little about yourself"}</span><span>{form.bio.length}/300</span></div>
              </label>
              <div className="flex flex-wrap gap-3 justify-end">
                <button type="button" className="btn btn-ghost" onClick={() => { setEditing(false); setErrors({}); setForm({ ...emptyForm, ...user }); }} disabled={updateMutation.isPending}><XIcon className="size-4" />Cancel</button>
                <button className="btn btn-primary" disabled={updateMutation.isPending}>{updateMutation.isPending ? <span className="loading loading-spinner loading-sm" /> : <SaveIcon className="size-4" />}Save</button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-box bg-base-100 p-4"><p className="text-sm opacity-60">Native language</p><p className="font-medium mt-1">{user.nativeLanguage || "Not added"}</p></div>
              <div className="rounded-box bg-base-100 p-4"><p className="text-sm opacity-60">Learning language</p><p className="font-medium mt-1">{user.learningLanguage || "Not added"}</p></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
