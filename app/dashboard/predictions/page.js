"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button, EmptyState, Loading } from "@/components/ui";
import PredictionCard from "@/components/PredictionCard";

export default function PredictionsPage() {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/predictions?limit=50")
      .then((r) => r.json())
      .then((d) => setPredictions(d.predictions || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-2xl font-extrabold font-display">My Predictions ({predictions.length})</h2>
        <Link href="/dashboard/predict"><Button sm>+ New Prediction</Button></Link>
      </div>

      {predictions.length === 0 ? (
        <EmptyState
          icon="🤖"
          title="No predictions yet"
          description="Upload a SportyBet screenshot to get your first AI prediction"
          action={<Link href="/dashboard/predict"><Button>Get Prediction</Button></Link>}
        />
      ) : (
        predictions.map((p) => <PredictionCard key={p._id} prediction={p} />)
      )}
    </div>
  );
}
