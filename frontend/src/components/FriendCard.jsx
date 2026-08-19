import { Link } from "react-router-dom";
import { MessageCircleIcon, UserRoundMinusIcon, UserRoundIcon } from "lucide-react";
import { LANGUAGE_TO_FLAG } from "../constants";
import ProfileAvatar from "./ProfileAvatar";

const FriendCard = ({ friend, onRemove, removing = false }) => {
  return (
    <article className="surface-card interactive-card">
      <div className="card-body p-4">
        <div className="flex items-center gap-3 mb-3">
          <ProfileAvatar src={friend.profilePic} name={friend.fullName} className="w-12 h-12" />
          <div className="min-w-0">
            <h3 className="font-semibold truncate">{friend.fullName}</h3>
            {friend.location && <p className="text-xs opacity-60 truncate">{friend.location}</p>}
          </div>
        </div>

        {(friend.nativeLanguage || friend.learningLanguage) && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {friend.nativeLanguage && (
              <span className="badge badge-secondary text-xs">
                {getLanguageFlag(friend.nativeLanguage)} Native: {friend.nativeLanguage}
              </span>
            )}
            {friend.learningLanguage && (
              <span className="badge badge-outline text-xs">
                {getLanguageFlag(friend.learningLanguage)} Learning: {friend.learningLanguage}
              </span>
            )}
          </div>
        )}

        {friend.bio && <p className="text-sm opacity-70 line-clamp-2 mb-3">{friend.bio}</p>}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Link to={`/users/${friend._id}`} className="btn btn-outline btn-sm">
            <UserRoundIcon className="size-4" /> Profile
          </Link>
          <Link to={`/chat/${friend._id}`} className="btn btn-primary btn-sm">
            <MessageCircleIcon className="size-4" /> Message
          </Link>
        </div>

        {onRemove && (
          <button
            type="button"
            className="btn btn-ghost btn-sm text-error mt-2"
            disabled={removing}
            onClick={() => onRemove(friend)}
            aria-label={`Remove ${friend.fullName} from friends`}
          >
            {removing ? <span className="loading loading-spinner loading-xs" /> : <UserRoundMinusIcon className="size-4" />}
            Remove Friend
          </button>
        )}
      </div>
    </article>
  );
};

export default FriendCard;

export function getLanguageFlag(language) {
  if (!language) return null;

  const langLower = language.toLowerCase();
  const countryCode = LANGUAGE_TO_FLAG[langLower];

  if (countryCode) {
    return (
      <img
        src={`https://flagcdn.com/24x18/${countryCode}.png`}
        alt={`${langLower} flag`}
        className="h-3 mr-1 inline-block"
      />
    );
  }

  return null;
}
