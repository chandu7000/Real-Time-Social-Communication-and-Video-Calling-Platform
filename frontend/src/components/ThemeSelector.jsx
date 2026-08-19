import { PaletteIcon } from "lucide-react";
import { THEMES } from "../constants";
import { useThemeStore } from "../store/useThemeStore";

const ThemeSelector = () => {
  const { theme, setTheme } = useThemeStore();

  return (
    <div className="dropdown dropdown-end">
      <button type="button" tabIndex={0} className="btn btn-ghost btn-circle" aria-label="Choose appearance theme" title="Choose theme">
        <PaletteIcon className="size-5" aria-hidden="true" />
      </button>
      <div tabIndex={0} className="dropdown-content z-[60] mt-3 max-h-80 w-56 overflow-y-auto rounded-2xl border border-base-300 bg-base-100 p-2 shadow-xl">
        <p className="px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-wider opacity-55">Appearance</p>
        <div className="space-y-1">
          {THEMES.map((themeOption) => (
            <button
              type="button"
              key={themeOption.name}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${theme === themeOption.name ? "bg-primary/10 text-primary" : "hover:bg-base-200"}`}
              onClick={() => setTheme(themeOption.name)}
              aria-pressed={theme === themeOption.name}
            >
              <PaletteIcon className="size-4" aria-hidden="true" />
              <span className="text-sm font-medium">{themeOption.label}</span>
              <span className="ml-auto flex gap-1" aria-hidden="true">
                {themeOption.colors.map((color) => <span key={color} className="size-2 rounded-full" style={{ backgroundColor: color }} />)}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ThemeSelector;
