import { APP_VERSION, AUTHOR, COPYRIGHT_YEAR } from "@/lib/version";

export default function AboutPage() {
  return (
    <main className="max-w-2xl mx-auto py-16 px-6">
      <h1 className="text-2xl font-semibold mb-4">About OneHealth Hub</h1>
      <p className="text-gray-700 leading-relaxed">
        This platform is a proof-of-concept tool developed to support ongoing
        research on community-based One Health surveillance in Nigeria,
        exploring how participatory reporting can strengthen early detection
        of zoonotic disease risk. It accompanies academic work on the
        Community-Centred One Health Surveillance (CCOHS) framework.
      </p>
      <p className="text-gray-700 leading-relaxed mt-4">
        This platform, its design, and the underlying CCOHS framework are the
        original work of {AUTHOR}, © {COPYRIGHT_YEAR}. It is shared for
        academic evaluation purposes only. Please do not redistribute,
        reproduce, or repurpose this platform or its framework without
        written permission from the author.
      </p>
      <p className="text-sm text-gray-400 mt-8">{APP_VERSION}</p>
    </main>
  );
}