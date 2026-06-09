'use client'

import { useMemo, useState, useEffect } from 'react'
import { Search, X, Check, Filter } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { MockMember, CampaignMemberRole } from './enterprise-campaign-form'

interface AddCampaignMemberModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedUserIds: string[]
  onConfirm: (users: MockMember[]) => void
  availableMembers: MockMember[]
}

export function AddCampaignMemberModal({
  open,
  onOpenChange,
  selectedUserIds,
  onConfirm,
  availableMembers,
}: AddCampaignMemberModalProps) {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<CampaignMemberRole | 'ALL'>('ALL')
  
  // Local state for modal selections
  const [localSelectedIds, setLocalSelectedIds] = useState<string[]>([])

  useEffect(() => {
    if (open) {
      setLocalSelectedIds(selectedUserIds)
      setSearch('')
      setRoleFilter('ALL')
    }
  }, [open, selectedUserIds])

  const toggleUser = (userId: string) => {
    setLocalSelectedIds(current => 
      current.includes(userId) 
        ? current.filter(id => id !== userId)
        : [...current, userId]
    )
  }

  const removeSelected = (userId: string) => {
    setLocalSelectedIds(current => current.filter(id => id !== userId))
  }

  const filteredMembers = useMemo(() => {
    return availableMembers.filter(user => {
      const matchSearch = user.name.toLowerCase().includes(search.toLowerCase())
      const matchRole = roleFilter === 'ALL' || user.role === roleFilter
      return matchSearch && matchRole
    })
  }, [availableMembers, search, roleFilter])

  const localSelectedMembers = useMemo(() => {
    return availableMembers.filter(user => localSelectedIds.includes(user.id))
  }, [availableMembers, localSelectedIds])

  const initials = (name: string) => name.split(' ').map(part => part.charAt(0)).join('').slice(0, 2).toUpperCase()

  const getRoleColor = (role: string) => {
    if (role === 'ADMIN') return 'var(--cyan)'
    if (role === 'BUZZER') return '#8b5cf6'
    if (role === 'PIC') return 'var(--status-expired)'
    return '#39ff14' // VIEWER
  }

  return (
    <Modal
      open={open}
      onClose={() => onOpenChange(false)}
      title="Tambah Member Campaign"
      maxWidth={750}
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button onClick={() => {
            onConfirm(localSelectedMembers)
            onOpenChange(false)
          }}>
            Tambah {localSelectedIds.length} Member
          </Button>
        </>
      }
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '1.5rem', minHeight: 400 }}>
        {/* Left Panel: Search & List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderRight: '1px solid var(--border-subtle)', paddingRight: '1.5rem' }}>
          
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama member..."
                style={{
                  width: '100%', padding: '10px 14px 10px 36px', background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-default)', borderRadius: 6, color: 'var(--text-primary)',
                  fontFamily: 'monospace', fontSize: '0.85rem'
                }}
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              style={{
                padding: '0 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
                borderRadius: 6, color: 'var(--text-primary)', fontFamily: 'monospace', fontSize: '0.85rem',
                minWidth: 120
              }}
            >
              <option value="ALL">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="BUZZER">Buzzer</option>
              <option value="PIC">PIC</option>
              <option value="VIEWER">Viewer</option>
            </select>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {filteredMembers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.85rem' }}>
                Tidak ada member yang cocok dengan pencarian.
              </div>
            ) : (
              filteredMembers.map(user => {
                const isSelected = localSelectedIds.includes(user.id)
                return (
                  <div
                    key={user.id}
                    onClick={() => toggleUser(user.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem',
                      background: isSelected ? 'rgba(0, 240, 255, 0.05)' : 'var(--bg-surface)',
                      border: isSelected ? '1px solid var(--cyan)' : '1px solid var(--border-subtle)',
                      borderRadius: 8, cursor: 'pointer', transition: 'all 0.2s'
                    }}
                  >
                    <div style={{
                      width: 18, height: 18, borderRadius: 4, 
                      border: isSelected ? 'none' : '1px solid var(--text-muted)',
                      background: isSelected ? 'var(--cyan)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {isSelected && <Check size={12} style={{ color: '#000' }} />}
                    </div>
                    
                    <div className="mini-avatar" style={{ width: 32, height: 32, fontSize: '0.85rem', background: 'var(--bg-elevated)' }}>
                      {initials(user.name)}
                    </div>
                    
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{user.name}</div>
                      <div style={{ 
                        fontSize: '0.7rem', fontFamily: 'monospace', letterSpacing: 1, 
                        color: getRoleColor(user.role), marginTop: 2
                      }}>
                        {user.role}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Right Panel: Selected Members */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Terpilih</span>
            <span style={{ background: 'var(--cyan)', color: '#000', padding: '2px 8px', borderRadius: 12, fontSize: '0.75rem' }}>
              {localSelectedIds.length}
            </span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingRight: '0.25rem' }}>
            {localSelectedMembers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem', border: '1px dashed var(--border-subtle)', borderRadius: 8 }}>
                Belum ada member yang dipilih.
              </div>
            ) : (
              localSelectedMembers.map(user => (
                <div key={user.id} style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem',
                  background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 6
                }}>
                  <div className="mini-avatar" style={{ width: 24, height: 24, fontSize: '0.65rem' }}>
                    {initials(user.name)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {user.name}
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeSelected(user.id) }}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </Modal>
  )
}
