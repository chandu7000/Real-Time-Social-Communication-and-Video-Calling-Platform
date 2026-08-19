import { LoaderIcon } from "lucide-react";
import { useThemeStore } from "../store/useThemeStore";

const PageLoader = ({ message = "Loading Zenvio..." }) => {
  const { theme } = useThemeStore();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-base-200/50 p-4" data-theme={theme} role="status" aria-live="polite">
      <LoaderIcon className="animate-spin size-9 text-primary" aria-hidden="true" />
      <p className="text-sm font-medium opacity-65">{message}</p>
    </div>
  );
};

export default PageLoader;
