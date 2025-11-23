// frontend/src/App.js
import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

import SmartGateArtifact from "./artifacts/contracts/SmartGate.sol/SmartGate.json";

const SMARTGATE_ADDRESS = "0xfcDB4564c18A9134002b9771816092C9693622e3";

const LS_KEYS = {
  HISTORY: "smartgate_history_v1",
  LAST_RESULT: "smartgate_last_result_v1",
  VALUES: "smartgate_values_v1",
  ENCMODE: "smartgate_encryption_mode_v1",
  ADVANCED: "smartgate_advanced_v1",
  DARK: "smartgate_dark_v1"
};

function parseReceiptEvent(contractInterface, receipt, eventName = "GateOperationResult") {
  if (receipt.events && receipt.events.length > 0) {
    const ev = receipt.events.find(e => e.event === eventName);
    if (ev && ev.args) return ev.args;
  }
  for (const log of receipt.logs || []) {
    try {
      const parsed = contractInterface.parseLog(log);
      if (parsed && parsed.name === eventName) return parsed.args;
    } catch {}
  }
  return null;
}

function formatReadableError(err) {
  if (!err) return "Unknown error";
  if (typeof err === "string") return err;
  if (err.revert?.args?.[0]) return String(err.revert.args[0]);
  if (err.reason) return String(err.reason);
  if (err.shortMessage) return String(err.shortMessage);
  if (err.message) return String(err.message);
  return JSON.stringify(err);
}

export default function App() {
  const [values, setValues] = useState("");
  const [encryptionMode, setEncryptionMode] = useState(1);
  const [advancedMode, setAdvancedMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [dark, setDark] = useState(true);

  useEffect(() => {
    try {
      const lsEnc = localStorage.getItem(LS_KEYS.ENCMODE);
      if (lsEnc) setEncryptionMode(Number(lsEnc));

      const lsAdv = localStorage.getItem(LS_KEYS.ADVANCED);
      if (lsAdv) setAdvancedMode(lsAdv === "true");

      const lsDark = localStorage.getItem(LS_KEYS.DARK);
      if (lsDark) setDark(lsDark === "true");

      const lsHist = localStorage.getItem(LS_KEYS.HISTORY);
      if (lsHist) setHistory(JSON.parse(lsHist));

      const lsRes = localStorage.getItem(LS_KEYS.LAST_RESULT);
      if (lsRes) setResult(JSON.parse(lsRes));
    } catch (e) {}
  }, []);

  useEffect(() => localStorage.setItem(LS_KEYS.VALUES, values), [values]);
  useEffect(() => localStorage.setItem(LS_KEYS.ENCMODE, String(encryptionMode)), [encryptionMode]);
  useEffect(() => localStorage.setItem(LS_KEYS.ADVANCED, String(advancedMode)), [advancedMode]);
  useEffect(() => localStorage.setItem(LS_KEYS.DARK, String(dark)), [dark]);
  useEffect(() => localStorage.setItem(LS_KEYS.HISTORY, JSON.stringify(history)), [history]);
  useEffect(() => localStorage.setItem(LS_KEYS.LAST_RESULT, JSON.stringify(result)), [result]);

  const pushHistory = point => {
    setHistory(prev => {
      const next = [...prev, { id: prev.length + 1, ...point }];
      if (next.length > 200) next.shift();
      return next;
    });
  };

  const handleGateOperation = async () => {
    setLoading(true);
    setResult(null);

    try {
      const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
      const signer = await provider.getSigner();
      const smartGate = new ethers.Contract(SMARTGATE_ADDRESS, SmartGateArtifact.abi, signer);

      const numbers = values
        .split(",")
        .map(s => s.trim())
        .filter(s => s.length > 0)
        .map(Number)
        .filter(n => !Number.isNaN(n));

      if (numbers.length === 0) {
        setResult({ error: "Please enter at least one numeric value." });
        setLoading(false);
        return;
      }

      const tx = await smartGate.gateOperation(numbers, encryptionMode, advancedMode);
      const receipt = await tx.wait();

      const args = parseReceiptEvent(smartGate.interface, receipt);

      if (!args) {
        setResult({ error: "No GateOperationResult event found." });
        setLoading(false);
        return;
      }

      const parsed = Array.from(args).map(v => {
        try {
          const s = v?.toString?.() ?? String(v);
          const n = Number(s);
          return Number.isFinite(n) ? n : s;
        } catch {
          return v?.toString?.() ?? String(v);
        }
      });

      const out = {
        avg: parsed[0],
        minVal: parsed[1],
        maxVal: parsed[2],
        variance: parsed[3],
        median: parsed[4],
        standardDeviation: parsed[5],
        percentile: parsed[6]
      };

      setResult(out);
      pushHistory(out);
    } catch (err) {
      setResult({ error: formatReadableError(err) });
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(LS_KEYS.HISTORY);
  };

  const toggleDark = () => setDark(d => !d);

  const bg = dark ? "#0f1724" : "#f4f5f7";
  const cardBg = dark ? "#0b1220" : "#ffffff";
  const text = dark ? "#e6eef8" : "#0b1220";
  const muted = dark ? "#9fb0c9" : "#6b7280";
  const accent = "#4a6cff";

  return (
    <div style={{
      minHeight: "94.5vh",
      background: bg,
      color: text,
      fontFamily: "Inter, Arial, sans-serif",
      padding: 24,
      display: "flex",
      justifyContent: "center"
    }}>
      

      <div style={{
        width: "100%",
        maxWidth: 1300,
        display: "grid",
        gridTemplateColumns: "420px 1fr",
        gap: 24,
        alignItems: "flex-start"
      }}>


        <div style={{
          background: cardBg,
          borderRadius: 12,
          padding: 18,
          boxShadow: dark ? "0 6px 18px rgba(0,0,0,0.6)" : "0 8px 20px rgba(15,23,42,0.06)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h2 style={{ margin: 0 }}>SmartGate</h2>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button onClick={toggleDark} style={{ background: dark ? "#162038" : "#eef2ff", color: text, border: "none", padding: "6px 10px", borderRadius: 8, cursor: "pointer" }} title="Toggle theme">
                {dark ? "Dark" : "Light"}
              </button>
              <button onClick={clearHistory} style={{ background: "transparent", border: "1px solid rgba(100,100,120,0.08)", color: muted, padding: "6px 8px", borderRadius: 8, cursor: "pointer" }} title="Clear local history">
                Clear
              </button>
            </div>
          </div>

          <label style={{ fontSize: 13, color: muted }}>Values</label>
          <input placeholder="eg. 10,20,30" value={values} onChange={e => setValues(e.target.value)} style={{ width: "100%", padding: "10px", marginTop: 8, marginBottom: 12, borderRadius: 8, border: "1px solid rgba(100,100,120,0.08)", background: dark ? "#071123" : "#fff", color: text }} />

          <label style={{ fontSize: 13, color: muted }}>Encryption mode</label>
          <select value={encryptionMode} onChange={e => setEncryptionMode(Number(e.target.value))} style={{ width: "100%", padding: "10px", marginTop: 8, marginBottom: 12, borderRadius: 8, border: "1px solid rgba(100,100,120,0.08)", background: dark ? "#071123" : "#fff", color: text }}>
            <option value={0}>None</option>
            <option value={1}>KECCAK256</option>
            <option value={2}>SHA256</option>
            <option value={3}>RIPEMD160</option>
          </select>

          <label style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, color: muted }}>
            <input type="checkbox" checked={advancedMode} onChange={e => setAdvancedMode(e.target.checked)} />
            Advanced analytics
          </label>

          <button onClick={handleGateOperation} disabled={loading} style={{ width: "100%", padding: 12, background: accent, color: "#fff", border: "none", borderRadius: 10, cursor: loading ? "wait" : "pointer", fontWeight: 600, boxShadow: "0 8px 24px rgba(74,108,255,0.12)" }}>
            {loading ? "Processing..." : "Run Gate Operation"}
          </button>

          {loading && (
            <div style={{ marginTop: 12, display: "flex", justifyContent: "center" }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", border: "4px solid rgba(255,255,255,0.08)", borderTop: `4px solid ${accent}`, animation: "spin 0.9s linear infinite" }} />
            </div>
          )}

          {result && (
            <div style={{ marginTop: 18, padding: 12, borderRadius: 10, background: dark ? "#071123" : "#fafafa", border: dark ? "1px solid rgba(255,255,255,0.03)" : "1px solid rgba(11,18,32,0.04)" }}>
              {result.error ? (
                <div style={{ background: "#3b0d0d", color: "#ffd6d6", padding: 12, borderRadius: 8 }}>
                  <strong>Error</strong>
                  <div style={{ marginTop: 8 }}>{result.error}</div>
                </div>
              ) : (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <strong>Latest result</strong>
                    <span style={{ color: muted }}>{history.length} points</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {Object.entries(result).map(([k, v]) => (
                      <div key={k} style={{ background: dark ? "rgba(255,255,255,0.02)" : "#fff", padding: 8, borderRadius: 8, border: "1px solid rgba(0,0,0,0.03)" }}>
                        <div style={{ fontSize: 12, color: muted }}>{k}</div>
                        <div style={{ fontWeight: 700, marginTop: 6 }}>{String(v)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN — Centered, matched size */}
        <div style={{
          background: cardBg,
          borderRadius: 12,
          padding: 18,
          boxShadow: dark ? "0 6px 18px rgba(0,0,0,0.6)" : "0 8px 20px rgba(15,23,42,0.06)"
        }}>
          {/* chart header */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 10
          }}>
            <h3 style={{ margin: 0 }}>Output trend</h3>
            <span style={{ color: muted }}>{history.length} points</span>
          </div>

          <div style={{ height: "60vh" }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" stroke={dark ? "#0b1930" : "#f0f0f0"} />
                <XAxis dataKey="id" stroke={muted} />
                <YAxis stroke={muted} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="avg" stroke="#4a6cff" dot={false} />
                <Line type="monotone" dataKey="minVal" stroke="#2ecc71" dot={false} />
                <Line type="monotone" dataKey="maxVal" stroke="#e74c3c" dot={false} />
                <Line type="monotone" dataKey="median" stroke="#9b59b6" dot={false} />
                <Line type="monotone" dataKey="variance" stroke="#f1c40f" dot={false} />
                <Line type="monotone" dataKey="standardDeviation" stroke="#1abc9c" dot={false} />
                <Line type="monotone" dataKey="percentile" stroke="#e67e22" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

    </div>
  );
}
