import { APP_VERSION, AUTHOR, COPYRIGHT_YEAR } from "@/lib/version";

export default function Footer() {
  return (
    <footer className="w-full border-t border-gray-200 py-4 px-6 text-center text-sm text-gray-500">
      <p>
        © {COPYRIGHT_YEAR} {AUTHOR}. Research Prototype — All Rights Reserved.
      </p>
      <p className="text-xs text-gray-400 mt-1">
        Developed and maintained by {AUTHOR} ·{" "}
        <a href="/about" className="underline hover:text-gray-700">About</a>
        {" "}· {APP_VERSION}
      </p>
    </footer>
  );
}