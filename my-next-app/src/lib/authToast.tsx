import { toast } from "sonner";

export const showAttractiveAuthToast = (
  router: any,
  message = "Sign in Required",
  description = "Please log in to add items to your cart & start ordering!"
) => {
  toast.custom(
    (t) => (
      <div className="bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl border border-slate-700/80 flex items-center justify-between gap-4 max-w-md w-full animate-in fade-in slide-in-from-top-4 duration-300 ring-1 ring-white/10">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 flex items-center justify-center text-white shrink-0 shadow-md shadow-orange-500/20">
            <span className="material-symbols-outlined text-xl">restaurant</span>
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-sm text-white truncate">{message}</h4>
            <p className="text-xs text-slate-300 leading-snug">{description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              toast.dismiss(t);
              router.push("/login");
            }}
            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 whitespace-nowrap cursor-pointer"
          >
            Sign In
          </button>
          <button
            onClick={() => toast.dismiss(t)}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      </div>
    ),
    {
      id: "sign-in-required",
      duration: 4000,
    }
  );
};
