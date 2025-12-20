import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Settings, Mail, Check } from 'lucide-react';
import { accessService, PropertyAccess } from '../services/accessService';
import { useLanguage } from '../contexts/LanguageContext';

interface FamilyAccessProps {
  propertyId: string;
  onClose: () => void;
}

export default function FamilyAccess({ propertyId, onClose }: FamilyAccessProps) {
  const { t } = useLanguage();
  const [access, setAccess] = useState<PropertyAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showShareForm, setShowShareForm] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [shareRole, setShareRole] = useState('view');
  const [shareLoading, setShareLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchAccess();
  }, [propertyId]);

  const fetchAccess = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await accessService.getPropertyAccess(propertyId);
      setAccess(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load access list');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareEmail.trim()) {
      setError('Email is required');
      return;
    }

    try {
      setShareLoading(true);
      setError('');
      const result = await accessService.shareProperty(propertyId, shareEmail, shareRole);
      setAccess([...access, result]);
      setShareEmail('');
      setShareRole('view');
      setShowShareForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to share property');
    } finally {
      setShareLoading(false);
    }
  };

  const handleUpdateRole = async (accessId: string, newRole: string) => {
    try {
      setError('');
      await accessService.updateAccess(propertyId, accessId, newRole);
      setAccess(access.map(a => a.id === accessId ? { ...a, role: newRole as any } : a));
      setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update role');
    }
  };

  const handleRemoveAccess = async (accessId: string) => {
    if (!window.confirm('Are you sure you want to remove this person\'s access?')) return;

    try {
      setError('');
      await accessService.removeAccess(propertyId, accessId);
      setAccess(access.filter(a => a.id !== accessId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove access');
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'admin':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'edit':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'view':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      'owner': 'Owner',
      'admin': 'Admin',
      'edit': 'Can Edit',
      'view': 'View Only'
    };
    return labels[role] || role;
  };

  const roleOptions = ['view', 'edit', 'admin'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-900">Manage Family Access</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Share Form */}
          {!showShareForm ? (
            <button
              onClick={() => setShowShareForm(true)}
              className="w-full py-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-600 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2 font-medium"
            >
              <Plus className="w-5 h-5" />
              Invite Family Member
            </button>
          ) : (
            <form onSubmit={handleShare} className="space-y-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <h3 className="font-semibold text-slate-900">Invite Family Member</h3>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  placeholder="family@example.com"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Permission Level</label>
                <select
                  value={shareRole}
                  onChange={(e) => setShareRole(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  <option value="view">View Only - Can see property details and history</option>
                  <option value="edit">Can Edit - Can add tasks and logs, but not manage access</option>
                  <option value="admin">Admin - Full access including inviting others</option>
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={shareLoading}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors"
                >
                  {shareLoading ? 'Sending Invite...' : 'Send Invite'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowShareForm(false);
                    setShareEmail('');
                    setShareRole('view');
                  }}
                  className="flex-1 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Access List */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-4">Current Access</h3>
            
            {loading ? (
              <div className="text-center py-8 text-slate-500">Loading access list...</div>
            ) : access.length === 0 ? (
              <div className="text-center py-8 text-slate-500">No one else has access yet</div>
            ) : (
              <div className="space-y-3">
                {access.map(item => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {item.inviteAccepted ? (
                          <>
                            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                              <span className="text-sm font-bold text-slate-600">
                                {(item.name || item.email)[0].toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium text-slate-900">{item.name}</div>
                              <div className="text-sm text-slate-600">{item.email}</div>
                            </div>
                          </>
                        ) : (
                          <>
                            <Mail className="w-5 h-5 text-slate-400 flex-shrink-0" />
                            <div>
                              <div className="font-medium text-slate-900">Pending Invite</div>
                              <div className="text-sm text-slate-600">{item.inviteEmail}</div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                      {item.role === 'owner' ? (
                        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getRoleColor(item.role)}`}>
                          {getRoleLabel(item.role)}
                        </span>
                      ) : editingId === item.id ? (
                        <select
                          value={item.role}
                          onChange={(e) => handleUpdateRole(item.id, e.target.value)}
                          onBlur={() => setEditingId(null)}
                          className="px-2 py-1 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                          autoFocus
                        >
                          {roleOptions.map(role => (
                            <option key={role} value={role}>{getRoleLabel(role)}</option>
                          ))}
                        </select>
                      ) : (
                        <button
                          onClick={() => setEditingId(item.id)}
                          className={`px-3 py-1 rounded-full text-sm font-medium border cursor-pointer hover:shadow-md transition-all ${getRoleColor(item.role)}`}
                        >
                          {getRoleLabel(item.role)}
                        </button>
                      )}

                      {item.role !== 'owner' && (
                        <button
                          onClick={() => handleRemoveAccess(item.id)}
                          className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                          title="Remove access"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Role Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Permission Levels</h4>
            <ul className="space-y-1 text-sm text-blue-800">
              <li><strong>View Only:</strong> Can view property details and maintenance history</li>
              <li><strong>Can Edit:</strong> Can add/edit tasks, logs, and documents</li>
              <li><strong>Admin:</strong> Full access, can invite others and manage permissions</li>
              <li><strong>Owner:</strong> Property owner, has all permissions (cannot be changed)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
