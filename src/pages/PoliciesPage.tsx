import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, ImageOff } from "lucide-react";
import { motion } from "framer-motion";
import { usePolicies, POLICY_CATEGORIES, PolicyCategory } from "@/hooks/usePolicies";
import EmptyState from "@/components/EmptyState";

const PoliciesPage = () => {
  const navigate = useNavigate();
  const { data: policies, isLoading } = usePolicies();
  const [category, setCategory] = useState<PolicyCategory>("agency");
  const [viewer, setViewer] = useState<string | null>(null);

  const filtered = (policies ?? []).filter((p) => p.category === category);

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-30 bg-background/90 backdrop-blur-xl border-b border-border/40 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <h1 className="font-display font-bold text-lg text-foreground">Policy Center</h1>
        </div>
      </header>

      <div className="px-4 pt-4">
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 pb-3">
          {POLICY_CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => setCategory(c.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                category === c.value
                  ? "gradient-primary text-primary-foreground"
                  : "bg-card text-muted-foreground border border-border/50"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState message="No policies in this category yet." />
        ) : (
          <div className="space-y-4 mt-2">
            {filtered.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-card rounded-2xl overflow-hidden shadow-card border border-border/40"
              >
                {p.image_url ? (
                  <button onClick={() => setViewer(p.image_url!)} className="block w-full">
                    <img
                      src={p.image_url}
                      alt={p.title}
                      loading="lazy"
                      className="w-full h-auto object-contain bg-muted/20"
                    />
                  </button>
                ) : (
                  <div className="aspect-[4/3] flex items-center justify-center bg-muted/20 text-muted-foreground">
                    <ImageOff className="w-8 h-8" />
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-bold text-foreground text-base">{p.title}</h3>
                  {p.description && (
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{p.description}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {viewer && (
        <div
          onClick={() => setViewer(null)}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
        >
          <img src={viewer} alt="" className="max-h-full max-w-full object-contain" />
        </div>
      )}
    </div>
  );
};

export default PoliciesPage;