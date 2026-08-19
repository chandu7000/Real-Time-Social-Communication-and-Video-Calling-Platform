import { useState } from "react";
import { getAvatarFallback } from "../lib/profile";

const ProfileAvatar = ({ src, name, className = "w-24 h-24", imageClassName = "" }) => {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;

  return (
    <div className={`avatar placeholder ${className}`}>
      <div className={`rounded-full bg-base-300 text-base-content ${className}`}>
        {showImage ? (
          <img src={src} alt={`${name || "User"} profile`} onError={() => setFailed(true)} className={imageClassName} />
        ) : (
          <span className="text-2xl font-semibold" aria-label={`${name || "User"} profile placeholder`}>
            {getAvatarFallback(name)}
          </span>
        )}
      </div>
    </div>
  );
};

export default ProfileAvatar;
