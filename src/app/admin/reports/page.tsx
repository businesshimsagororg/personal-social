
"use client";
import React, { useEffect, useState } from 'react';
import AdminLayout from '@/app/admin/layout';
import { ShieldAlert } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Report {
  id: string;
  reporterId: string;
  targetType: string;
  status: string;
  reason: string;
  createdAt: string;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/reports');
      if (res.ok) {
        const data = await res.json();
        setReports(data);
      } else {
        toast.error('Failed to fetch reports');
      }
    } catch (e) {
      console.error(e);
      toast.error('Error fetching reports');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/reports/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        toast.success('Report updated');
        fetchReports();
      } else {
        toast.error('Failed to update report');
      }
    } catch (e) {
      console.error(e);
      toast.error('Error updating report');
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  if (loading) return <AdminLayout><p>Loading...</p></AdminLayout>;

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-4">Reports</h1>
      <div className="grid gap-4">
        {reports.map((r) => (
          <div key={r.id} className="glass p-4 rounded-xl border border-border">
            <div className="flex items-center gap-2 mb-2">
              <ShieldAlert className="h-5 w-5 text-primary" />
              <span className="font-medium">{r.targetType} - {r.reason}</span>
            </div>
            <p className="text-sm text-muted-foreground mb-2">Submitted by {r.reporterId} on {new Date(r.createdAt).toLocaleString()}</p>
            <p>Status: <span className="font-semibold">{r.status}</span></p>
            <div className="mt-3 flex space-x-2">
              {r.status !== 'RESOLVED' && (
                <button
                  onClick={() => updateStatus(r.id, 'RESOLVED')}
                  className="px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700 transition"
                >
                  Resolve
                </button>
              )}
              {r.status !== 'DISMISSED' && (
                <button
                  onClick={() => updateStatus(r.id, 'DISMISSED')}
                  className="px-3 py-1 rounded bg-gray-600 text-white hover:bg-gray-700 transition"
                >
                  Dismiss
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
