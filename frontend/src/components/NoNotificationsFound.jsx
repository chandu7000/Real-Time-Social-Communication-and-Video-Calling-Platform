import { BellIcon } from "lucide-react";

function NoNotificationsFound() {
  return (
    <div className="surface-card flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-4 grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
        <BellIcon className="size-7" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-semibold">You’re all caught up</h3>
      <p className="mt-2 max-w-md text-sm opacity-70">Friend requests and other account updates will appear here when they arrive.</p>
    </div>
  );
}

export default NoNotificationsFound;
