import { AUTHOR, COPYRIGHT_YEAR } from "@/lib/version";

export default function OwnershipBadge() {
  return (
    <div className="fixed bottom-3 right-3 z-50 bg-white/90 backdrop-blur border border-gray-200 rounded-full px-3 py-1 text-xs text-gray-600 shadow-sm pointer-events-none select-none">
      © {AUTHOR} {COPYRIGHT_YEAR}
    </div>
  );
}