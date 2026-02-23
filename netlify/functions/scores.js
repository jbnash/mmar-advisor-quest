import { getStore } from "@netlify/blobs";

const STORE_NAME = "mmar-leaderboard";

export default async (req, context) => {
  // Handle CORS for local development
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  // Preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  const store = getStore(STORE_NAME);

  // GET — return full leaderboard
  if (req.method === "GET") {
    try {
      const raw = await store.get("scores");
      const scores = raw ? JSON.parse(raw) : [];
      return new Response(JSON.stringify(scores), { status: 200, headers });
    } catch (err) {
      return new Response(JSON.stringify([]), { status: 200, headers });
    }
  }

  // POST — save or update a player's score
  if (req.method === "POST") {
    try {
      const body = await req.json();
      const { username, xp } = body;

      if (!username || typeof xp !== "number") {
        return new Response(JSON.stringify({ error: "Invalid payload" }), {
          status: 400,
          headers,
        });
      }

      // Load existing scores
      const raw = await store.get("scores").catch(() => null);
      let scores = raw ? JSON.parse(raw) : [];

      // Seed some fake players if empty so leaderboard isn't lonely
      if (scores.length === 0) {
        scores = [
          { username: "DrKeller", xp: 1240, color: "#2a5c45" },
          { username: "ProfMwangi", xp: 980, color: "#2b5fa0" },
          { username: "AdvisorRios", xp: 760, color: "#8b3a8b" },
          { username: "DrLevinson", xp: 590, color: "#c9952a" },
          { username: "ChairPatel", xp: 420, color: "#d4401a" },
        ];
      }

      // Update or insert player
      const existing = scores.find(
        (s) => s.username.toLowerCase() === username.toLowerCase()
      );
      if (existing) {
        existing.xp = xp; // always use latest total, not additive
      } else {
        // Assign a deterministic color based on username
        const colors = ["#2a5c45", "#2b5fa0", "#8b3a8b", "#c9952a", "#d4401a", "#1a6b8a", "#5c2a45"];
        const colorIndex =
          username.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) %
          colors.length;
        scores.push({ username, xp, color: colors[colorIndex] });
      }

      // Sort descending
      scores.sort((a, b) => b.xp - a.xp);

      // Save back
      await store.set("scores", JSON.stringify(scores));

      return new Response(JSON.stringify(scores), { status: 200, headers });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers,
      });
    }
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405,
    headers,
  });
};

export const config = {
  path: "/api/scores",
};
