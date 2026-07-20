import { auth, defineMcp } from "@lovable.dev/mcp-js";
import getMeTool from "./tools/get-me";
import getWalletTool from "./tools/get-wallet";
import listActiveRoomsTool from "./tools/list-active-rooms";
import listNotificationsTool from "./tools/list-notifications";

// Direct Supabase issuer — see cloud-auth-oauth-server: the .lovable.cloud proxy
// is not accepted by mcp-js's issuer discovery check.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "talk-room-mcp",
  title: "Talk Room",
  version: "0.1.0",
  instructions:
    "Tools for the Talk Room voice-chat app. Use these to look up the signed-in user's profile, wallet balance, notifications, and browse currently active voice rooms.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [getMeTool, getWalletTool, listActiveRoomsTool, listNotificationsTool],
});