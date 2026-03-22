import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useRouter } from 'next/router';
import { Tenant, Student, Bus, Route } from 'shared-types';

const API_BASE_URL = 'http://localhost:3000';

type TabType = 'map' | 'vehicles' | 'routes' | 'students';

export default function AdminDashboard() {
  const router = useRouter();
  const { schoolId } = router.query;
  const [school, setSchool] = useState<Tenant | null>(null);
  const [busesOnline, setBusesOnline] = useState<Record<string, { lat: number, lng: number }>>({});
  const [activeTab, setActiveTab] = useState<TabType>('map');

  // Entity States
  const [students, setStudents] = useState<Student[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);

  // Modal States
  const [showModal, setShowModal] = useState<TabType | null>(null);
  const [editingEntity, setEditingEntity] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{type: TabType, id: string, name: string} | null>(null);
  const [newData, setNewData] = useState<any>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [sosAlerts, setSosAlerts] = useState<any[]>([]);

  const headers = {
    'Content-Type': 'application/json',
    'x-tenant-id': schoolId as string
  };

  const fetchData = async () => {
    if (!schoolId) return;
    try {
      const [sRes, bRes, rRes] = await Promise.all([
        fetch(`${API_BASE_URL}/core/students`, { headers }),
        fetch(`${API_BASE_URL}/core/buses`, { headers }),
        fetch(`${API_BASE_URL}/core/routes`, { headers })
      ]);
      if (sRes.ok) setStudents(await sRes.json());
      if (bRes.ok) setBuses(await bRes.json());
      if (rRes.ok) setRoutes(await rRes.json());
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    }
  };

  useEffect(() => {
    if (schoolId) {
      fetch(`${API_BASE_URL}/tenant/${schoolId}`)
        .then(res => res.json())
        .then(data => setSchool(data))
        .catch(err => console.error('Failed to fetch school details:', err));
      fetchData();
    }
  }, [schoolId]);

  useEffect(() => {
    const newSocket = io(API_BASE_URL);
    newSocket.on('locationUpdate', (data: any) => {
      setBusesOnline((prev) => ({
        ...prev,
        [data.tripId]: { lat: data.latitude, lng: data.longitude }
      }));
    });
    return () => { newSocket.disconnect(); };
  }, []);

  // Poll for SOS alerts every 5 seconds
  useEffect(() => {
    if (!schoolId) return;
    const fetchAlerts = () => {
      fetch(`${API_BASE_URL}/core/alerts?resolved=false`, { headers })
        .then(r => r.json())
        .then(data => setSosAlerts(Array.isArray(data) ? data : []))
        .catch(() => {});
    };
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 5000);
    return () => clearInterval(interval);
  }, [schoolId]);

  const dismissAlert = async (id: string) => {
    await fetch(`${API_BASE_URL}/core/alerts/${id}/resolve`, { method: 'PATCH', headers });
    setSosAlerts(prev => prev.filter(a => a.id !== id));
  };

  const handleSave = async (type: TabType) => {
    try {
      const endpointMap: any = { students: 'students', vehicles: 'buses', routes: 'routes' };
      const method = editingEntity ? 'PATCH' : 'POST';
      const url = editingEntity 
        ? `${API_BASE_URL}/core/${endpointMap[type]}/${editingEntity.id}`
        : `${API_BASE_URL}/core/${endpointMap[type]}`;

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(newData)
      });
      if (res.ok) {
        setShowModal(null);
        setEditingEntity(null);
        setNewData({});
        fetchData();
      }
    } catch (err) {
      alert('Failed to save ' + type);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      const { type, id } = deleteConfirm;
      const endpointMap: any = { students: 'students', vehicles: 'buses', routes: 'routes' };
      const res = await fetch(`${API_BASE_URL}/core/${endpointMap[type]}/${id}`, {
        method: 'DELETE',
        headers
      });
      if (res.ok) {
        setDeleteConfirm(null);
        fetchData();
      } else {
        const errData = await res.json();
        console.error('Delete failed:', errData);
        alert('Delete failed. See console.');
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete');
    }
  };

  const startEdit = (type: TabType, entity: any) => {
    setEditingEntity(entity);
    setNewData(entity);
    setShowModal(type);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#F3F4F6', fontFamily: 'Inter, sans-serif', margin: 0 }}>
      {/* SIDE NAVIGATION */}
      <div style={{ width: 260, backgroundColor: '#000000', color: 'white', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '24px 28px', fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', borderBottom: '1px solid #1F2937' }}>
          BusFleet <span style={{ color: '#3B82F6' }}>OS</span>
        </div>
        <div style={{ padding: 20, flex: 1 }}>
          <div onClick={() => setActiveTab('map')} style={navItemStyle(activeTab === 'map')}>🗺️ Live Map</div>
          <div onClick={() => setActiveTab('vehicles')} style={navItemStyle(activeTab === 'vehicles')}>🚍 Vehicles</div>
          <div onClick={() => setActiveTab('routes')} style={navItemStyle(activeTab === 'routes')}>🛣️ Routes</div>
          <div onClick={() => setActiveTab('students')} style={navItemStyle(activeTab === 'students')}>👥 Students</div>
        </div>
        <div style={{ padding: 20, borderTop: '1px solid #1F2937' }}>
          <div style={navItemStyle(false)}>⚙️ Settings</div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* 🚨 SOS ALERT BANNER */}
        {sosAlerts.length > 0 && (
          <div style={{ 
            backgroundColor: '#DC2626', padding: '0 24px',
            borderBottom: '2px solid #991B1B',
            animation: 'pulse 1.5s infinite',
          }}>
            {sosAlerts.map(alert => (
              <div key={alert.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 20 }}>🚨</span>
                  <div>
                    <div style={{ color: 'white', fontWeight: 800, fontSize: 14 }}>{alert.message}</div>
                    <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11 }}>
                      {new Date(alert.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => dismissAlert(alert.id)}
                  style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)', color: 'white', padding: '6px 16px', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 12 }}
                >
                  Dismiss ✓
                </button>
              </div>
            ))}
          </div>
        )}

        {/* TOP HEADER */}
        <div style={{ height: 72, backgroundColor: 'white', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', padding: '0 32px', justifyContent: 'space-between', zIndex: 10 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, color: '#111827', fontWeight: 700 }}>{school ? school.name : 'Loading School...'}</h2>
            <p style={{ margin: 0, fontSize: 12, color: '#6B7280', fontWeight: 500 }}>School Administration Console</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <span style={{ fontWeight: 700, fontSize: 14 }}>System Admin</span>
              <span style={{ fontSize: 11, color: '#10B981', fontWeight: 700 }}>ACTIVE SESSION</span>
            </div>
            <div style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#F3F4F6', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>👤</div>
          </div>
        </div>

        <div style={{ flex: 1, padding: 32, overflowY: 'auto' }}>
          {activeTab === 'map' && <MapView busesOnline={busesOnline} schoolName={school?.name} />}
          {activeTab === 'vehicles' && <EntityView title="Fleet Management" items={buses} type="vehicles" onAdd={() => setShowModal('vehicles')} onEdit={(it: any) => startEdit('vehicles', it)} onDelete={(it: any) => setDeleteConfirm({type:'vehicles', id: it.id, name: it.number})} />}
          {activeTab === 'routes' && <EntityView title="Route Management" items={routes} type="routes" onAdd={() => setShowModal('routes')} onEdit={(it: any) => startEdit('routes', it)} onDelete={(it: any) => setDeleteConfirm({type:'routes', id: it.id, name: it.name})} />}
          {activeTab === 'students' && <EntityView title="Student Directory" items={students} type="students" onAdd={() => setShowModal('students')} onEdit={(it: any) => startEdit('students', it)} onDelete={(it: any) => setDeleteConfirm({type:'students', id: it.id, name: it.name})} />}
        </div>
      </div>

      {/* ADD/EDIT MODAL */}
      {showModal && showModal !== 'routes' && (
        <div style={modalOverlayStyle}>
          <div style={modalStyle}>
            <h2 style={{ margin: '0 0 20px 0' }}>{editingEntity ? 'Edit' : 'Add'} {showModal === 'vehicles' ? 'Bus' : showModal.charAt(0).toUpperCase() + showModal.slice(1, -1)}</h2>
            
            {showModal === 'students' && (
              <>
                <input placeholder="Student Name" value={newData.name || ''} style={inputStyle} onChange={e => setNewData({...newData, name: e.target.value})} />
                <input placeholder="Address" value={newData.address || ''} style={inputStyle} onChange={e => setNewData({...newData, address: e.target.value})} />
              </>
            )}
            
            {showModal === 'vehicles' && (
              <>
                <input placeholder="Bus Number" value={newData.number || ''} style={inputStyle} onChange={e => setNewData({...newData, number: e.target.value})} />
                <input placeholder="Capacity" type="number" value={newData.capacity || ''} style={inputStyle} onChange={e => setNewData({...newData, capacity: parseInt(e.target.value)})} />
              </>
            )}

            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button onClick={() => { setShowModal(null); setEditingEntity(null); setNewData({}); }} style={cancelButtonStyle}>Cancel</button>
              <button onClick={() => handleSave(showModal)} style={confirmButtonStyle}>{editingEntity ? 'Update' : 'Confirm'}</button>
            </div>
          </div>
        </div>
      )}

      {/* BIG ROUTE MODAL */}
      {showModal === 'routes' && (
        <div style={modalOverlayStyle}>
          <div style={{ ...modalStyle, width: 800, maxWidth: '90vw', padding: 40 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
              <h2 style={{ margin: 0 }}>{editingEntity ? 'Edit' : 'Create'} School Route</h2>
              <button onClick={() => { setShowModal(null); setEditingEntity(null); setNewData({}); }} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
              <div>
                <label style={labelStyle}>Route Name</label>
                <input placeholder="e.g. North Springfield Express" value={newData.name || ''} style={inputStyle} onChange={e => setNewData({...newData, name: e.target.value})} />
                
                <div style={{ marginTop: 24 }}>
                  <label style={labelStyle}>Route Summary</label>
                  <div style={{ padding: 20, backgroundColor: '#F9FAFB', borderRadius: 12, border: '1px solid #E5E7EB' }}>
                    <p style={{ margin: 0, fontSize: 13, color: '#6B7280' }}>
                      Selected Stops: <strong>{(newData.stops || []).length}</strong>
                    </p>
                    <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {(newData.stops || []).map((sid: string) => {
                        const s = students.find(st => st.id === sid);
                        return s ? <span key={sid} style={{ backgroundColor: '#2563EB', color: 'white', padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>{s.name}</span> : null;
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Assign Students (Stops)</label>
                <input 
                  placeholder="Search students..." 
                  value={searchTerm} 
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{ ...inputStyle, marginBottom: 12, padding: '10px 16px', fontSize: 13 }}
                />
                <div style={{ height: 260, overflowY: 'auto', border: '1px solid #E5E7EB', borderRadius: 12 }}>
                  {students
                    .filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || (s.address || '').toLowerCase().includes(searchTerm.toLowerCase()))
                    .map(s => {
                      const isSelected = (newData.stops || []).includes(s.id);
                    return (
                      <div key={s.id} onClick={() => {
                        const current = newData.stops || [];
                        const updated = isSelected ? current.filter((id: string) => id !== s.id) : [...current, s.id];
                        setNewData({...newData, stops: updated});
                      }} style={{ 
                        padding: '12px 16px', borderBottom: '1px solid #F1F5F9', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 12,
                        backgroundColor: isSelected ? '#EFF6FF' : 'transparent'
                      }}>
                        <div style={{ 
                          width: 20, height: 20, borderRadius: 4, border: '2px solid #D1D5DB',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          backgroundColor: isSelected ? '#2563EB' : 'white',
                          borderColor: isSelected ? '#2563EB' : '#D1D5DB'
                        }}>
                          {isSelected && <span style={{ color: 'white', fontSize: 12 }}>✓</span>}
                        </div>
                        <div>
                          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: isSelected ? '#1E40AF' : '#111827' }}>{s.name}</p>
                          <p style={{ margin: 0, fontSize: 11, color: '#6B7280' }}>{s.address || 'No address'}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 40, justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowModal(null); setEditingEntity(null); setNewData({}); }} style={cancelButtonStyle}>Cancel</button>
              <button onClick={() => handleSave('routes')} style={{ ...confirmButtonStyle, width: 200 }}>{editingEntity ? 'Update Route' : 'Create Route'}</button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirm && (
        <div style={modalOverlayStyle}>
          <div style={{ ...modalStyle, width: 400, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 20 }}>⚠️</div>
            <h2 style={{ margin: '0 0 12px 0', color: '#111827' }}>Confirm Delete</h2>
            <p style={{ color: '#6B7280', marginBottom: 32, lineHeight: 1.5 }}>
              Are you sure you want to delete <strong>{deleteConfirm.name}</strong>? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ ...cancelButtonStyle, flex: 1 }}>Keep it</button>
              <button onClick={handleDelete} style={{ ...confirmButtonStyle, flex: 1, backgroundColor: '#EF4444', boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.3)' }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const MapView = ({ busesOnline, schoolName }: any) => (
  <div style={{ display: 'flex', gap: 32, height: '100%' }}>
    <div style={{ flex: 2, backgroundColor: 'white', borderRadius: 28, border: '1px solid #E5E7EB', position: 'relative', overflow: 'hidden', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.04)' }}>
      <div style={{ position: 'absolute', top: 24, left: 24, backgroundColor: 'white', padding: '12px 24px', borderRadius: 99, fontWeight: '800', fontSize: 13, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.12)', display: 'flex', alignItems: 'center', gap: 10, zIndex: 10 }}>
        <span style={{ width: 10, height: 10, backgroundColor: '#10B981', borderRadius: '50%', boxShadow: '0 0 0 4px rgba(16, 185, 129, 0.2)' }}></span>
        {Object.keys(busesOnline).length} BUSES TRACKING
      </div>
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', backgroundColor: '#F8FAFC' }}>
        <div style={{ fontSize: 72, marginBottom: 24 }}>🗺️</div>
        <h3 style={{ color: '#1E293B', margin: '0 0 12px 0', fontWeight: 800, fontSize: 24 }}>Fleet Activity Map</h3>
        <p style={{ color: '#64748B', maxWidth: 350, textAlign: 'center', fontSize: 15, lineHeight: 1.6 }}>(Interactive Map View for {schoolName || 'this school'})</p>
      </div>
    </div>
    <div style={{ flex: 1, backgroundColor: 'white', borderRadius: 28, padding: 32, border: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.04)' }}>
      <h3 style={{ margin: '0 0 28px 0', color: '#111827', fontSize: 20, fontWeight: 800 }}>Active Fleet</h3>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {Object.entries(busesOnline).length === 0 ? (
          <div style={{ textAlign: 'center', color: '#94A3B8', marginTop: 80 }}>
            <div style={{ fontSize: 48, marginBottom: 20 }}>📡</div>
            <p style={{ fontSize: 15, fontWeight: 500 }}>Waiting for GPS signals...</p>
          </div>
        ) : (
          Object.entries(busesOnline).map(([id, loc]: any) => (
            <div key={id} style={{ padding: 24, backgroundColor: '#F9FAFB', borderRadius: 20, marginBottom: 20, border: '1px solid #F1F5F9' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <span style={{ fontWeight: 800, fontSize: 14, letterSpacing: '0.05em' }}>BUS-{id.substring(0,4).toUpperCase()}</span>
                <span style={{ backgroundColor: '#DCFCE7', color: '#166534', padding: '6px 14px', borderRadius: 99, fontSize: 11, fontWeight: '800' }}>ON ROUTE</span>
              </div>
              <div style={{ fontSize: 12, color: '#64748B', fontFamily: 'monospace', letterSpacing: '-0.02em', fontWeight: 600 }}>
                LOC: {loc.lat.toFixed(5)}, {loc.lng.toFixed(5)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  </div>
);

const EntityView = ({ title, items, type, onAdd, onEdit, onDelete }: any) => (
  <div style={{ backgroundColor: 'white', borderRadius: 28, border: '1px solid #E5E7EB', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.04)', overflow: 'hidden' }}>
    <div style={{ padding: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9' }}>
      <h2 style={{ margin: 0, fontWeight: 800, fontSize: 24 }}>{title}</h2>
      <button onClick={onAdd} style={confirmButtonStyle}>+ Add {type.charAt(0).toUpperCase() + type.slice(1, -1)}</button>
    </div>
    <div style={{ minHeight: 400 }}>
      {items.length === 0 ? (
        <div style={{ padding: 80, textAlign: 'center', color: '#94A3B8' }}>
          <div style={{ fontSize: 60, marginBottom: 20 }}>📦</div>
          <p style={{ fontSize: 16, fontWeight: 500 }}>No {type} found. Click the button above to add some.</p>
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', backgroundColor: '#F8FAFC' }}>
              <th style={thStyle}>Name/Number</th>
              {type === 'students' && <th style={thStyle}>Address</th>}
              {type === 'vehicles' && <th style={thStyle}>Capacity</th>}
              {type === 'routes' && <th style={thStyle}>Details</th>}
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item: any, idx: number) => (
              <tr key={item.id} style={{ borderBottom: idx === items.length - 1 ? 'none' : '1px solid #F1F5F9' }}>
                <td style={tdStyle}>{item.name || item.number}</td>
                {type === 'students' && <td style={tdStyle}>{item.address || 'N/A'}</td>}
                {type === 'vehicles' && <td style={tdStyle}>{item.capacity} seats</td>}
                {type === 'routes' && <td style={tdStyle}>{(item.stops || []).length} Stops</td>}
                <td style={tdStyle}>
                  <button onClick={() => onEdit(item)} style={editLinkStyle}>Edit</button>
                  <button onClick={() => onDelete(item)} style={deleteLinkStyle}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  </div>
);

const editLinkStyle = { background: 'none', border: 'none', color: '#3B82F6', fontWeight: 700, cursor: 'pointer', marginRight: 16, fontSize: 13 };
const deleteLinkStyle = { background: 'none', border: 'none', color: '#EF4444', fontWeight: 700, cursor: 'pointer', fontSize: 13 };

const navItemStyle = (active: boolean): React.CSSProperties => ({
  padding: '14px 20px',
  borderRadius: 12,
  backgroundColor: active ? '#1F2937' : 'transparent',
  color: active ? 'white' : '#9CA3AF',
  cursor: 'pointer',
  marginBottom: 10,
  fontWeight: active ? '700' : '500',
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  fontSize: 14,
  display: 'flex',
  alignItems: 'center',
  gap: 12
});

const thStyle: React.CSSProperties = { padding: '20px 32px', color: '#64748B', fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em' };
const tdStyle: React.CSSProperties = { padding: '24px 32px', color: '#1E293B', fontWeight: 600, fontSize: 15 };

const modalOverlayStyle: React.CSSProperties = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const modalStyle: React.CSSProperties = { backgroundColor: 'white', padding: 40, borderRadius: 32, width: 450, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' };
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '14px 18px', borderRadius: 12, border: '1px solid #E5E7EB',
  fontSize: 15, marginBottom: 16, outline: 'none', transition: 'border-color 0.2s'
};

const labelStyle: React.CSSProperties = {
  display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em'
};

const confirmButtonStyle: React.CSSProperties = {
 backgroundColor: '#3B82F6', color: 'white', border: 'none', padding: '14px 28px', borderRadius: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)' };
const cancelButtonStyle: React.CSSProperties = { backgroundColor: '#F3F4F6', color: '#4B5563', border: 'none', padding: '14px 28px', borderRadius: 14, fontWeight: 700, cursor: 'pointer' };
