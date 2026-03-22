import React, { useState, useEffect } from 'react';
import { Tenant } from 'shared-types';

const API_BASE_URL = 'http://localhost:3000';

export default function SuperadminDashboard() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [totalStudents, setTotalStudents] = useState<number | string>('...');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newSchoolName, setNewSchoolName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchTenants();
    fetchStats();
  }, []);

  const fetchTenants = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/tenant`);
      const data = await res.json();
      setTenants(data);
    } catch (error) {
      console.error('Failed to fetch tenants:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/tenant/stats/students`);
      if (res.ok) {
        const data = await res.json();
        setTotalStudents(data.totalStudents ?? 0);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      setTotalStudents(0);
    }
  };

  const handleOnboard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchoolName) return;
    setIsCreating(true);
    try {
      const res = await fetch(`${API_BASE_URL}/tenant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newSchoolName }),
      });
      if (res.ok) {
        setNewSchoolName('');
        setShowModal(false);
        fetchTenants();
      } else {
        const errData = await res.json();
        alert(`Failed to onboard school: ${errData.message || res.statusText}`);
      }
    } catch (error) {
      console.error('Failed to onboard school:', error);
      alert('Failed to onboard school. Please check if the backend is running and CORS is enabled.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#F3F4F6', fontFamily: 'Inter, sans-serif', margin: 0 }}>
      {/* SIDE NAVIGATION */}
      <div style={{ width: 260, backgroundColor: '#000000', color: 'white', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: 24, fontSize: 24, fontWeight: 'bold', borderBottom: '1px solid #333' }}>
          Platform HQ
        </div>
        <div style={{ padding: 20, flex: 1 }}>
          <div style={navItemStyle(true)}>🏢 Tenants (Schools)</div>
          <div style={navItemStyle(false)}>🛡️ Security</div>
          <div style={navItemStyle(false)}>📊 Global Analytics</div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        
        {/* TOP HEADER */}
        <div style={{ height: 72, backgroundColor: 'white', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', padding: '0 24px', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0, fontSize: 20, color: '#111827' }}>Tenant Overview</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontWeight: 600 }}>Superadmin</span>
          </div>
        </div>

        <div style={{ padding: 32 }}>
          
          {/* KPI CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 32 }}>
            <KpiCard title="Active Schools" value={(tenants?.length || 0).toString()} trend="across all regions" />
            <KpiCard title="Total Students" value={(totalStudents ?? '...').toString()} trend="enrolled platform-wide" />
            <KpiCard title="System Health" value="100%" trend="All databases online" />
          </div>

          {/* TENANT TABLE */}
          <div style={{ backgroundColor: 'white', borderRadius: 16, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Management</h3>
              <button 
                onClick={() => setShowModal(true)}
                style={{ backgroundColor: '#000', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer' }}
              >
                + Onboard School
              </button>
            </div>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#F9FAFB', color: '#6B7280', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '16px 24px', fontWeight: 600 }}>Tenant Name</th>
                  <th style={{ padding: '16px 24px', fontWeight: 600 }}>Students</th>
                  <th style={{ padding: '16px 24px', fontWeight: 600 }}>Buses</th>
                  <th style={{ padding: '16px 24px', fontWeight: 600 }}>Routes</th>
                  <th style={{ padding: '16px 24px', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '16px 24px', fontWeight: 600 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} style={{ padding: 24, textAlign: 'center', color: '#9CA3AF' }}>Loading tenants...</td></tr>
                ) : tenants.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: 24, textAlign: 'center', color: '#9CA3AF' }}>No tenants found. Onboard your first school.</td></tr>
                ) : (
                  tenants.map((tenant, idx) => (
                    <TenantRow 
                       key={tenant.id} 
                       id={tenant.id}
                       name={tenant.name} 
                       stats={tenant.stats} 
                       status="Active" 
                       rowGray={idx % 2 !== 0} 
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: 'white', padding: 32, borderRadius: 16, width: 400, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginTop: 0, marginBottom: 24 }}>Onboard New School</h3>
            <form onSubmit={handleOnboard}>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600, color: '#374151' }}>School Name</label>
                <input 
                  autoFocus
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 16 }}
                  placeholder="e.g. Springfield Elementary"
                  value={newSchoolName}
                  onChange={(e) => setNewSchoolName(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button 
                  type="submit"
                  disabled={isCreating}
                  style={{ flex: 1, backgroundColor: '#000', color: 'white', border: 'none', padding: '12px', borderRadius: 8, fontWeight: 'bold', cursor: isCreating ? 'not-allowed' : 'pointer', opacity: isCreating ? 0.7 : 1 }}
                >
                  {isCreating ? 'Creating...' : 'Confirm'}
                </button>
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ flex: 1, backgroundColor: '#F3F4F6', color: '#374151', border: 'none', padding: '12px', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const navItemStyle = (active: boolean): React.CSSProperties => ({
  padding: '12px 16px', borderRadius: 8,
  backgroundColor: active ? '#1F2937' : 'transparent',
  color: active ? 'white' : '#9CA3AF',
  cursor: 'pointer', marginBottom: 8,
  fontWeight: active ? '600' : 'normal'
});

const KpiCard = ({ title, value, trend }: { title: string, value: string, trend: string }) => (
  <div style={{ backgroundColor: 'white', padding: 24, borderRadius: 16, border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
    <p style={{ margin: '0 0 8px 0', color: '#6B7280', fontSize: 14, fontWeight: 600 }}>{title}</p>
    <p style={{ margin: '0 0 4px 0', fontSize: 32, fontWeight: 800, color: '#111827' }}>{value}</p>
    <p style={{ margin: 0, color: '#10B981', fontSize: 13, fontWeight: 500 }}>{trend}</p>
  </div>
);

const ADMIN_WEB_URL = 'http://localhost:3002';

const TenantRow = ({ id, name, stats, status, rowGray }: { id: string, name: string, stats?: any, status: string, rowGray: boolean }) => (
  <tr style={{ borderTop: '1px solid #E1E8F0', backgroundColor: rowGray ? '#F9FAFB' : 'white' }}>
    <td style={{ padding: '20px 24px', fontWeight: 600, color: '#111827' }}>{name}</td>
    <td style={{ padding: '20px 24px', color: '#6B7280', fontSize: 14, fontWeight: 500 }}>{stats?.students || 0}</td>
    <td style={{ padding: '20px 24px', color: '#6B7280', fontSize: 14, fontWeight: 500 }}>{stats?.buses || 0}</td>
    <td style={{ padding: '20px 24px', color: '#6B7280', fontSize: 14, fontWeight: 500 }}>{stats?.routes || 0}</td>
    <td style={{ padding: '20px 24px' }}>
      <span style={{ 
        backgroundColor: status === 'Active' ? '#ECFDF5' : '#FEF2F2', 
        color: status === 'Active' ? '#059669' : '#DC2626', 
        padding: '6px 14px', borderRadius: 99, fontSize: 13, fontWeight: 'bold' 
      }}>{status}</span>
    </td>
    <td style={{ padding: '20px 24px' }}>
      <a 
        href={`${ADMIN_WEB_URL}/?schoolId=${id}`} 
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: '#2563EB', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}
      >
        Manage
      </a>
    </td>
  </tr>
);
