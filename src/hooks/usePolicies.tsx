import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type PolicyCategory =
  | "agency" | "host" | "admin" | "bd" | "super_admin"
  | "salary" | "commission" | "withdrawal";

export interface Policy {
  id: string;
  category: PolicyCategory;
  title: string;
  description: string | null;
  image_path: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  image_url?: string | null;
}

export const POLICY_CATEGORIES: { value: PolicyCategory; label: string }[] = [
  { value: "agency", label: "Agency Policy" },
  { value: "host", label: "Host Policy" },
  { value: "admin", label: "Admin Policy" },
  { value: "bd", label: "BD Policy" },
  { value: "super_admin", label: "Super Admin Policy" },
  { value: "salary", label: "Salary Rules" },
  { value: "commission", label: "Commission Rules" },
  { value: "withdrawal", label: "Withdrawal Rules" },
];

async function signImages(rows: Policy[]): Promise<Policy[]> {
  const paths = rows.map((r) => r.image_path).filter((p): p is string => !!p);
  if (paths.length === 0) return rows.map((r) => ({ ...r, image_url: null }));
  const { data } = await supabase.storage.from("policies").createSignedUrls(paths, 3600);
  const map = new Map<string, string>();
  data?.forEach((d) => { if (d.path && d.signedUrl) map.set(d.path, d.signedUrl); });
  return rows.map((r) => ({ ...r, image_url: r.image_path ? map.get(r.image_path) ?? null : null }));
}

export const usePolicies = (opts?: { includeInactive?: boolean }) => {
  return useQuery({
    queryKey: ["policies", opts?.includeInactive ?? false],
    queryFn: async () => {
      let q = supabase.from("policies").select("*").order("category").order("sort_order");
      if (!opts?.includeInactive) q = q.eq("is_active", true);
      const { data, error } = await q;
      if (error) throw error;
      return signImages((data ?? []) as Policy[]);
    },
  });
};

export const useUpsertPolicy = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      id?: string;
      category: PolicyCategory;
      title: string;
      description?: string | null;
      sort_order?: number;
      is_active?: boolean;
      file?: File | null;
      existingImagePath?: string | null;
    }) => {
      let imagePath = payload.existingImagePath ?? null;
      if (payload.file) {
        const ext = payload.file.name.split(".").pop() ?? "jpg";
        const key = `policies/${payload.category}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("policies")
          .upload(key, payload.file, { upsert: true, contentType: payload.file.type });
        if (upErr) throw upErr;
        imagePath = key;
      }
      const row = {
        category: payload.category,
        title: payload.title,
        description: payload.description ?? null,
        sort_order: payload.sort_order ?? 0,
        is_active: payload.is_active ?? true,
        image_path: imagePath,
      };
      if (payload.id) {
        const { error } = await supabase.from("policies").update(row).eq("id", payload.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("policies").insert(row);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["policies"] }),
  });
};

export const useDeletePolicy = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("policies").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["policies"] }),
  });
};