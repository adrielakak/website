import { useEffect, useState } from "react";
import { apiClient, API_BASE_URL } from "../lib/api";

interface NKNewsItem {
  title?: string;
  content?: string;
  image?: string;
  createdAt?: string;
}

export default function NKNews() {
  const [articles, setArticles] = useState<NKNewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        const res = await apiClient.get<NKNewsItem[]>("/api/nknews");
        setArticles(res.data ?? []);
        setError(null);
      } catch (e) {
        console.error(e);
        setError("Impossible de charger les actualitées pour le moment.");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  return (
    <div className="bg-brand-midnight text-white min-h-screen px-6 sm:px-8 pt-28 sm:pt-36 pb-16 space-y-8">
      <h1 className="text-3xl font-bold text-center">NKNEWS</h1>
      {loading && <p className="text-center text-gray-500">Chargement¦</p>}
      {error && <p className="text-center text-red-600">{error}</p>}
      {!loading && !error && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((item, i) => (
            <div key={i} className="rounded-xl border border-white/10 bg-white/[0.98] text-gray-900 shadow-md overflow-hidden">
              {item.image && (
                <img
                  src={item.image.startsWith("/") ? `${API_BASE_URL}${item.image}` : item.image}
                  alt=""
                  className="w-full h-64 object-cover"
                />
              )}
              <div className="p-4">
                {item.title && <h2 className="font-semibold mb-2 text-gray-900">{item.title}</h2>}
                {item.content && <p className="text-gray-700 whitespace-pre-line">{item.content}</p>}
              </div>
            </div>
          ))}
          {articles.length === 0 && (
            <p className="col-span-full text-center text-gray-500">Aucune actualitée pour le moment.</p>
          )}
        </div>
      )}
    </div>
  );
}



