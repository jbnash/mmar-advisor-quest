const { getStore } = require("@netlify/blobs");

const STORE_NAME = "mmar-leaderboard";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

exports.handler = async function(event, context) {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  const store = getStore({ name: STORE_NAME, consistency: "strong" });

  if (event.httpMethod === "GET") {
    try {
      const raw = await store.get("scores");
      const scores = raw ? JSON.parse(raw) : [];
      return { statusCode: 200, headers, body: JSON.stringify(scores) };
    } catch (err) {
      return { statusCode: 200, headers, body: JSON.stringify([]) };
    }
  }

  if (event.httpMethod === "POST") {
    try {
      const body = JSON.parse(event.body || "{}");
      const { username, xp } = body;

      if (!username || typeof xp !== "number") {
        return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid payload" }) };
      }

      let raw = null;
      try { raw = await store.get("scores"); } catch(e) {}
      let scores = raw ? JSON.parse(raw) : [];

      if (scores.length === 0) {
        scores = [
          { username: "DrKeller", xp: 1240, color: "#2a5c45" },
          { username: "ProfMwangi", xp: 980, color: "#2b5fa0" },
          { username: "AdvisorRios", xp: 760, color: "#8b3a8b" },
          { username: "DrLevinson", xp: 590, color: "#c9952a" },
          { username: "ChairPatel", xp: 420, color: "#d4401a" },
        ];
      }

      const existing = scores.find(s => s.username.toLowerCase() === username.toLowerCase());
      if (existing) {
        existing.xp = xp;
      } else {
        const colors = ["#2a5c45", "#2b5fa0", "#8b3a8b", "#c9952a", "#d4401a", "#1a6b8a", "#5c2a45"];
        const colorIndex = username.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % colors.length;
        scores.push({ username, xp, color: colors[colorIndex] });
      }

      scores.sort((a, b) => b.xp - a.xp);
      await store.set("scores", JSON.stringify(scores));

      return { statusCode: 200, headers, body: JSON.stringify(scores) };
    } catch (err) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
    }
  }

  return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
};
