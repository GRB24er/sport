"use client";

import { useState, useEffect } from "react";
import { Button, Modal, Input, TextArea, Select, Loading } from "@/components/ui";
import PredictionCard from "@/components/PredictionCard";
import toast from "react-hot-toast";

export default function AdminPredictionsPage() {
  const [predictions, setPredictions] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [sending, setSending] = useState(false);

  const [form, setForm] = useState({
    userId: "", home: "", away: "", analysis: "", adminNote: "",
    sendToAll: false, sendToPackage: "",
    picks: [
      { market: "Match Result", pick: "", odd: "" },
      { market: "Over/Under 2.5", pick: "", odd: "" },
    ],
  });

  const load = () => {
    Promise.all([
      fetch("/api/predictions?limit=50").then((r) => r.json()),
      fetch("/api/users?status=approved").then((r) => r.json()),
    ])
      .then(([predData, userData]) => {
        setPredictions(predData.predictions || []);
        setUsers(userData.users || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const addPick = () => setForm((f) => ({ ...f, picks: [...f.picks, { market: "", pick: "", odd: "" }] }));
  const updPick = (i, k, v) => setForm((f) => ({ ...f, picks: f.picks.map((p, j) => (j === i ? { ...p, [k]: v } : p)) }));

  const sendPrediction = async () => {
    if (!form.home || !form.away) return toast.error("Enter team names");
    if (!form.userId && !form.sendToAll && !form.sendToPackage) return toast.error("Select a recipient");

    setSending(true);
    try {
      const body = {
        homeTeam: form.home,
        awayTeam: form.away,
        predictions: form.picks.filter((p) => p.market && p.pick),
        analysis: form.analysis,
        adminNote: form.adminNote,
      };

      if (form.sendToAll) body.sendToAll = true;
      else if (form.sendToPackage) body.sendToPackage = form.sendToPackage;
      else body.userId = form.userId;

      const res = await fetch("/api/predictions/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) return toast.error(data.error);

      toast.success(`Prediction sent to ${data.recipientCount} user(s)!`);
      setModal(false);
      setForm({ userId: "", home: "", away: "", analysis: "", adminNote: "", sendToAll: false, sendToPackage: "", picks: [{ market: "Match Result", pick: "", odd: "" }, { market: "Over/Under 2.5", pick: "", odd: "" }] });
      load();
    } catch (e) {
      toast.error("Failed to send");
    } finally {
      setSending(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-5 flex-wrap gap-3">
        <h2 className="text-2xl font-extrabold font-display">All Predictions ({predictions.length})</h2>
        <Button variant="green" sm onClick={() => setModal(true)}>+ Send Manual Prediction</Button>
      </div>

      {predictions.map((pred) => (
        <div key={pred._id}>
          {pred.userId?.name && (
            <div className="text-[11px] text-steel mb-1">
              To: <span className="text-smoke font-semibold">{pred.userId.name}</span> ({pred.userId.phone})
            </div>
          )}
          <PredictionCard prediction={pred} showUser />
        </div>
      ))}

      {/* Manual Prediction Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="Send Manual Prediction" wide>
        {/* Recipient */}
        <div className="mb-4 p-4 bg-dark-bg rounded-xl border border-dark-slate/30">
          <div className="text-[11px] text-steel font-bold tracking-widest mb-3 font-display">SEND TO</div>
          <div className="flex gap-2 mb-3 flex-wrap">
            <Button sm variant={!form.sendToAll && !form.sendToPackage ? "primary" : "outline"} onClick={() => setForm((f) => ({ ...f, sendToAll: false, sendToPackage: "" }))}>
              Specific User
            </Button>
            <Button sm variant={form.sendToAll ? "green" : "outline"} onClick={() => setForm((f) => ({ ...f, sendToAll: true, sendToPackage: "", userId: "" }))}>
              All Users ({users.length})
            </Button>
            {["gold", "platinum", "diamond"].map((pkg) => (
              <Button key={pkg} sm variant={form.sendToPackage === pkg ? "gold" : "outline"} onClick={() => setForm((f) => ({ ...f, sendToPackage: pkg, sendToAll: false, userId: "" }))}>
                {pkg === "gold" ? "🥇" : pkg === "platinum" ? "🥈" : "💎"} {pkg} ({users.filter((u) => u.package === pkg).length})
              </Button>
            ))}
          </div>
          {!form.sendToAll && !form.sendToPackage && (
            <Select
              value={form.userId}
              onChange={(e) => setForm((f) => ({ ...f, userId: e.target.value }))}
              options={[{ value: "", label: "Select user..." }, ...users.map((u) => ({ value: u._id, label: `${u.name} (${u.phone})` }))]}
            />
          )}
        </div>

        {/* Match */}
        <div className="grid grid-cols-2 gap-3">
          <Input label="Home Team" placeholder="e.g. Bayern Munich VR" value={form.home} onChange={(e) => setForm((f) => ({ ...f, home: e.target.value }))} />
          <Input label="Away Team" placeholder="e.g. Chelsea VR" value={form.away} onChange={(e) => setForm((f) => ({ ...f, away: e.target.value }))} />
        </div>

        <TextArea label="Analysis" placeholder="Your expert analysis..." value={form.analysis} onChange={(e) => setForm((f) => ({ ...f, analysis: e.target.value }))} />
        <Input label="Admin Note (visible to user)" placeholder="e.g. High confidence — go heavy!" value={form.adminNote} onChange={(e) => setForm((f) => ({ ...f, adminNote: e.target.value }))} />

        {/* Picks */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-3">
            <label className="text-steel text-[11px] font-bold tracking-widest uppercase font-display">PREDICTIONS</label>
            <Button variant="outline" sm onClick={addPick}>+ Add Pick</Button>
          </div>
          {form.picks.map((p, i) => (
            <div key={i} className="grid grid-cols-[2fr_2fr_1fr] gap-2 mb-2">
              <input placeholder="Market" value={p.market} onChange={(e) => updPick(i, "market", e.target.value)} className="px-3 py-2 bg-dark-input border border-dark-slate rounded-md text-smoke text-sm outline-none font-display" />
              <input placeholder="Pick" value={p.pick} onChange={(e) => updPick(i, "pick", e.target.value)} className="px-3 py-2 bg-dark-input border border-dark-slate rounded-md text-smoke text-sm outline-none font-display" />
              <input placeholder="Odd" value={p.odd} onChange={(e) => updPick(i, "odd", e.target.value)} className="px-3 py-2 bg-dark-input border border-dark-slate rounded-md text-smoke text-sm outline-none font-display" />
            </div>
          ))}
        </div>

        <Button variant="green" full onClick={sendPrediction} disabled={sending}>
          {sending ? "Sending..." : "Send Prediction"}
        </Button>
      </Modal>
    </div>
  );
}
