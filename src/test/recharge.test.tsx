import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";

// ---- Shared in-memory db for the recharge flow ----
type Row = Record<string, any>;
const db: { recharges: Row[]; coin_transactions: Row[]; profile: Row } = {
  recharges: [],
  coin_transactions: [],
  profile: { user_id: "user-1", display_name: "Test User", coins_balance: 0 },
};

const rpcCalls: { name: string; args: any }[] = [];

// ---- Supabase mock ----
vi.mock("@/integrations/supabase/client", () => {
  const builder = (table: string) => {
    const state: any = { table, filters: {} as Record<string, any> };
    const api: any = {
      select: () => api,
      eq: (col: string, val: any) => {
        state.filters[col] = val;
        return api;
      },
      in: () => api,
      order: () => api,
      limit: () => api,
      insert: (row: Row) => {
        if (table === "recharge_requests") {
          db.recharges.unshift({
            id: `r-${db.recharges.length + 1}`,
            status: "pending",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            ...row,
          });
        }
        return Promise.resolve({ data: null, error: null });
      },
      update: () => Promise.resolve({ data: null, error: null }),
      then: (resolve: any) => {
        if (table === "recharge_requests") {
          let rows = db.recharges;
          if (state.filters.user_id) rows = rows.filter((r) => r.user_id === state.filters.user_id);
          if (state.filters.status) rows = rows.filter((r) => r.status === state.filters.status);
          resolve({ data: rows, error: null });
        } else if (table === "coin_transactions") {
          resolve({ data: db.coin_transactions, error: null });
        } else if (table === "profiles") {
          resolve({ data: [db.profile], error: null });
        } else if (table === "withdrawal_requests") {
          resolve({ data: [], error: null });
        } else {
          resolve({ data: [], error: null });
        }
      },
    };
    return api;
  };

  return {
    supabase: {
      from: (t: string) => builder(t),
      rpc: (name: string, args: any) => {
        rpcCalls.push({ name, args });
        if (name === "approve_recharge") {
          const r = db.recharges.find((x) => x.id === args.p_request_id);
          if (r) {
            r.status = "approved";
            r.updated_at = new Date().toISOString();
            r.processed_by = "admin-1";
            db.profile.coins_balance += r.coins_amount;
            db.coin_transactions.push({
              id: `tx-${db.coin_transactions.length + 1}`,
              user_id: r.user_id,
              amount: r.coins_amount,
              type: "recharge",
              balance_after: db.profile.coins_balance,
              created_at: new Date().toISOString(),
            });
          }
          return Promise.resolve({ data: { success: true }, error: null });
        }
        if (name === "reject_recharge") {
          const r = db.recharges.find((x) => x.id === args.p_request_id);
          if (r) {
            r.status = "rejected";
            r.processed_by = "admin-1";
            r.updated_at = new Date().toISOString();
          }
          return Promise.resolve({ data: { success: true }, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      },
    },
  };
});

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "user-1", email: "u@test" } }),
}));
vi.mock("@/hooks/useProfile", () => ({
  useProfile: () => ({ data: { coins_balance: db.profile.coins_balance } }),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import WalletPage from "@/pages/WalletPage";
import AdminRecharge from "@/pages/admin/AdminRecharge";

const wrap = (ui: React.ReactNode) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
};

beforeEach(() => {
  db.recharges.length = 0;
  db.coin_transactions.length = 0;
  db.profile.coins_balance = 0;
  rpcCalls.length = 0;
});

describe("Recharge end-to-end flow", () => {
  it("user can submit a recharge request and see it in history", async () => {
    wrap(<WalletPage />);
    fireEvent.click(screen.getAllByText(/Recharge/i)[0]);
    fireEvent.change(screen.getByPlaceholderText(/Custom amount/i), { target: { value: "5" } });
    fireEvent.click(screen.getByText(/Submit Recharge Request/i));

    await waitFor(() => {
      expect(db.recharges.length).toBe(1);
      expect(db.recharges[0].amount).toBe(5);
      expect(db.recharges[0].coins_amount).toBe(500);
      expect(db.recharges[0].status).toBe("pending");
    });
  });

  it("admin approve calls approve_recharge RPC and credits ledger + balance", async () => {
    db.recharges.push({
      id: "r-seed", user_id: "user-1", amount: 10, coins_amount: 1000,
      payment_method: "PayPal", status: "pending",
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    });
    wrap(<AdminRecharge />);
    const approveBtn = await screen.findByTitle("Approve");
    fireEvent.click(approveBtn);

    await waitFor(() => {
      expect(rpcCalls.find((c) => c.name === "approve_recharge")).toBeTruthy();
      expect(db.recharges[0].status).toBe("approved");
      expect(db.profile.coins_balance).toBe(1000);
      expect(db.coin_transactions.length).toBe(1);
      expect(db.coin_transactions[0].type).toBe("recharge");
      expect(db.coin_transactions[0].balance_after).toBe(1000);
    });
  });

  it("admin reject calls reject_recharge RPC and does not change balance", async () => {
    db.recharges.push({
      id: "r-seed", user_id: "user-1", amount: 10, coins_amount: 1000,
      payment_method: "PayPal", status: "pending",
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    });
    wrap(<AdminRecharge />);
    const rejectBtn = await screen.findByTitle("Reject");
    fireEvent.click(rejectBtn);

    await waitFor(() => {
      expect(rpcCalls.find((c) => c.name === "reject_recharge")).toBeTruthy();
      expect(db.recharges[0].status).toBe("rejected");
      expect(db.profile.coins_balance).toBe(0);
      expect(db.coin_transactions.length).toBe(0);
    });
  });
});