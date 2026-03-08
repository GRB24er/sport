"use client";

import { useState, useEffect } from "react";
import { Card, Badge, EmptyState, Loading } from "@/components/ui";

export default function AdminUploadsPage() {
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/uploads")
      .then((r) => r.json())
      .then((d) => setUploads(d.uploads || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-extrabold font-display mb-5">User Uploads ({uploads.length})</h2>

      {uploads.length === 0 ? (
        <EmptyState icon="📸" title="No uploads yet" description="User screenshots will appear here" />
      ) : uploads.map((img) => (
        <Card key={img._id} className="mb-3 flex justify-between items-center flex-wrap gap-3">
          <div>
            <div className="font-bold text-sm font-display">
              {img.userId?.name || "Unknown"} <span className="text-steel font-normal text-xs">({img.userId?.phone})</span>
            </div>
            <div className="text-steel text-xs">Uploaded: {new Date(img.createdAt).toLocaleString()}</div>
            {img.predictionId && (
              <div className="text-steel text-xs">
                Match: <span className="text-smoke">{img.predictionId.match}</span> •
                Odd: <span className="text-brand-green font-bold">{img.predictionId.totalOdd}x</span>
              </div>
            )}
            <Badge color={img.status === "analyzed" ? "green" : "orange"}>{img.status}</Badge>
          </div>
        </Card>
      ))}
    </div>
  );
}
