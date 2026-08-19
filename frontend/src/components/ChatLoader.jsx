import { LoaderIcon, MessageCircleIcon } from "lucide-react";

const ChatLoader = ({ message = "Connecting to chat..." }) => (
  <div className="flex min-h-[70vh] items-center justify-center p-4" role="status" aria-live="polite">
    <div className="surface-card flex w-full max-w-md flex-col items-center gap-3 p-8 text-center">
      <span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
        <MessageCircleIcon className="size-6" aria-hidden="true" />
      </span>
      <LoaderIcon className="size-6 animate-spin text-primary" aria-hidden="true" />
      <p className="text-sm font-medium opacity-70">{message}</p>
    </div>
  </div>
);

export default ChatLoader;
