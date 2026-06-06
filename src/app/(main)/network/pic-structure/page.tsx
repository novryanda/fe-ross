'use client'

import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Building2, ChevronDown, ChevronRight, Plus } from 'lucide-react'
import { RoleGuard } from '@/components/layout/role-guard'
import { PageHeader } from '@/components/ui/page-header'
import { DataFilters } from '@/components/ui/data-filters'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { StatusBadge } from '@/components/ui/badges'
import { orgUnitsApi, type OrgUnitWriteDto } from '@/lib/api/org-units'
import { usersApi } from '@/lib/api/users'
import { mapApiErrorToToastMessage } from '@/lib/api/errors'
import type { OrgUnit } from '@/types'
import { toast } from 'sonner'

type OrgUnitTreeNode = {
  unit: OrgUnit
  children: OrgUnitTreeNode[]
}

function buildOrgUnitTree(units: OrgUnit[]) {
  const nodeMap = new Map<string, OrgUnitTreeNode>()
  for (const unit of units) {
    nodeMap.set(unit.id, { unit, children: [] })
  }

  const roots: OrgUnitTreeNode[] = []

  for (const unit of units) {
    const node = nodeMap.get(unit.id)
    if (!node) continue

    if (unit.parentId && nodeMap.has(unit.parentId)) {
      nodeMap.get(unit.parentId)?.children.push(node)
      continue
    }

    roots.push(node)
  }

  const sortNodes = (nodes: OrgUnitTreeNode[]) => {
    nodes.sort((left, right) => left.unit.name.localeCompare(right.unit.name))
    for (const node of nodes) sortNodes(node.children)
  }

  sortNodes(roots)
  return roots
}

export default function PicStructurePage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUnit, setEditingUnit] = useState<OrgUnit | null>(null)
  const [parentUnitPreset, setParentUnitPreset] = useState<OrgUnit | null>(null)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [parentId, setParentId] = useState('')
  const [status, setStatus] = useState<OrgUnit['status']>('ACTIVE')
  const [expandedUnitIds, setExpandedUnitIds] = useState<string[]>([])

  useEffect(() => {
    if (isModalOpen && editingUnit) {
      setName(editingUnit.name)
      setCode(editingUnit.code ?? '')
      setParentId(editingUnit.parentId ?? '')
      setStatus(editingUnit.status)
      return
    }

    if (isModalOpen && parentUnitPreset) {
      setName('')
      setCode('')
      setParentId(parentUnitPreset.id)
      setStatus('ACTIVE')
      return
    }

    if (!isModalOpen) {
      setEditingUnit(null)
      setParentUnitPreset(null)
      setName('')
      setCode('')
      setParentId('')
      setStatus('ACTIVE')
    }
  }, [editingUnit, isModalOpen, parentUnitPreset])

  const orgUnitsQuery = useQuery({
    queryKey: ['org-units', search, statusFilter],
    queryFn: () => orgUnitsApi.list({ limit: 100, search: search || undefined, status: (statusFilter || undefined) as OrgUnit['status'] | undefined }),
  })
  const picUsersQuery = useQuery({
    queryKey: ['users', 'pics-for-structure'],
    queryFn: () => usersApi.list({ limit: 100, role: 'PIC', status: 'ACTIVE' }),
  })

  const saveMutation = useMutation({
    mutationFn: (dto: OrgUnitWriteDto) =>
      editingUnit ? orgUnitsApi.update(editingUnit.id, dto) : orgUnitsApi.create(dto),
    onSuccess: () => {
      toast.success(editingUnit ? 'PIC unit berhasil diperbarui.' : 'PIC unit berhasil dibuat.')
      setIsModalOpen(false)
      queryClient.invalidateQueries({ queryKey: ['org-units'] })
    },
    onError: (error) => toast.error(mapApiErrorToToastMessage(error)),
  })

  const units = orgUnitsQuery.data?.data ?? []
  const pics = picUsersQuery.data?.items ?? []
  const picCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const user of pics) {
      if (!user.picUnitId) continue
      counts.set(user.picUnitId, (counts.get(user.picUnitId) ?? 0) + 1)
    }
    return counts
  }, [pics])
  const unitTree = useMemo(() => buildOrgUnitTree(units), [units])
  const expandedUnitIdSet = useMemo(() => new Set(expandedUnitIds), [expandedUnitIds])

  const toggleUnit = (unitId: string) => {
    setExpandedUnitIds((current) =>
      current.includes(unitId)
        ? current.filter((id) => id !== unitId)
        : [...current, unitId],
    )
  }

  return (
    <RoleGuard roles={['ADMIN']}>
      <div className="page-container">
        <PageHeader
          title="PIC Structure"
          subtitle="Kelola unit organisasi bertingkat untuk distribusi posting order ke PIC."
          backHref="/network"
          actions={
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                setEditingUnit(null)
                setParentUnitPreset(null)
                setIsModalOpen(true)
              }}
            >
              <Plus size={14} /> Add Unit
            </button>
          }
        />

        <div className="info-banner info-banner-cyan">
          Admin mengatur struktur unit PIC di sini. User PIC akan dihubungkan ke salah satu unit aktif, lalu queue posting mereka mengikuti unit target order tersebut.
        </div>

        <DataFilters
          search={search}
          onSearchChange={setSearch}
          placeholder="Search unit..."
          filters={[
            {
              label: 'Status',
              value: statusFilter,
              options: [
                { value: 'ACTIVE', label: 'Active' },
                { value: 'INACTIVE', label: 'Inactive' },
              ],
              onChange: setStatusFilter,
            },
          ]}
        />

        {orgUnitsQuery.isLoading ? (
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="skeleton" style={{ height: 86, borderRadius: 16 }} />
            ))}
          </div>
        ) : orgUnitsQuery.isError ? (
          <ErrorState
            title="Gagal memuat unit PIC"
            message={mapApiErrorToToastMessage(orgUnitsQuery.error)}
            retry={() => orgUnitsQuery.refetch()}
          />
        ) : units.length === 0 ? (
          <EmptyState
            icon={<Building2 size={48} />}
            title="Belum ada unit PIC"
            description="Buat unit organisasi pertama untuk mulai mendistribusikan posting order ke PIC."
            action={<button type="button" className="btn-primary" onClick={() => setIsModalOpen(true)}>Add Unit</button>}
          />
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {unitTree.map((node) => (
              <OrgUnitTreeBranch
                key={node.unit.id}
                node={node}
                depth={0}
                picCounts={picCounts}
                expandedUnitIds={expandedUnitIdSet}
                onToggleUnit={toggleUnit}
                onAddSubUnit={(unit) => {
                  setEditingUnit(null)
                  setParentUnitPreset(unit)
                  setIsModalOpen(true)
                }}
                onEditUnit={(unit) => {
                  setEditingUnit(unit)
                  setParentUnitPreset(null)
                  setIsModalOpen(true)
                }}
              />
            ))}
          </div>
        )}

        <Modal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingUnit ? 'Edit PIC Unit' : parentUnitPreset ? `Add Sub Unit - ${parentUnitPreset.name}` : 'Add PIC Unit'}
        >
          <div style={{ display: 'grid', gap: '1rem' }}>
            {parentUnitPreset && !editingUnit && (
              <div className="info-banner info-banner-cyan" style={{ marginBottom: 0 }}>
                Sub unit baru ini akan dibuat di bawah <strong>{parentUnitPreset.name}</strong>.
              </div>
            )}
            <Input
              label="Unit Name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Angkatan Darat / Divisi Media"
            />
            <Input
              label="Unit Code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="Optional code"
            />
            <Select
              label="Parent Unit"
              value={parentId}
              onChange={(event) => setParentId(event.target.value)}
              options={units
                .filter((unit) => unit.id !== editingUnit?.id)
                .map((unit) => ({
                  value: unit.id,
                  label: unit.parent ? `${unit.parent.name} / ${unit.name}` : unit.name,
                }))}
              placeholder="No parent / top level"
            />
            <Select
              label="Status"
              value={status}
              onChange={(event) => setStatus(event.target.value as OrgUnit['status'])}
              options={[
                { value: 'ACTIVE', label: 'Active' },
                { value: 'INACTIVE', label: 'Inactive' },
              ]}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button type="button" className="btn-ghost" onClick={() => setIsModalOpen(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                disabled={!name.trim() || saveMutation.isPending}
                onClick={() =>
                  saveMutation.mutate({
                    name: name.trim(),
                    code: code.trim() || undefined,
                    parentId: parentId || undefined,
                    status,
                  })
                }
              >
                Save Unit
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </RoleGuard>
  )
}

function OrgUnitTreeBranch({
  node,
  depth,
  picCounts,
  expandedUnitIds,
  onToggleUnit,
  onAddSubUnit,
  onEditUnit,
}: {
  node: OrgUnitTreeNode
  depth: number
  picCounts: Map<string, number>
  expandedUnitIds: Set<string>
  onToggleUnit: (unitId: string) => void
  onAddSubUnit: (unit: OrgUnit) => void
  onEditUnit: (unit: OrgUnit) => void
}) {
  const { unit, children } = node
  const isRoot = depth === 0
  const hasChildren = children.length > 0
  const isExpanded = expandedUnitIds.has(unit.id)

  return (
    <div
      style={{
        marginLeft: isRoot ? 0 : 24,
        paddingLeft: isRoot ? 0 : 18,
        borderLeft: isRoot ? 'none' : '1px solid color-mix(in srgb, var(--cyan) 22%, transparent)',
        display: 'grid',
        gap: '0.85rem',
      }}
    >
      <article
        className="card"
        style={{
          padding: '1rem',
          display: 'grid',
          gap: '0.75rem',
          position: 'relative',
          overflow: 'hidden',
          background: isRoot
            ? 'linear-gradient(180deg, rgba(0, 240, 255, 0.03), rgba(255,255,255,0))'
            : undefined,
        }}
      >
        {!isRoot && (
          <div
            style={{
              position: 'absolute',
              left: -19,
              top: 28,
              width: 18,
              borderTop: '1px solid color-mix(in srgb, var(--cyan) 22%, transparent)',
            }}
          />
        )}

        <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexWrap: 'wrap' }}>
              {hasChildren && (
                <button
                  type="button"
                  className="btn-ghost"
                  aria-label={isExpanded ? `Collapse ${unit.name}` : `Expand ${unit.name}`}
                  onClick={() => onToggleUnit(unit.id)}
                  style={{
                    width: 32,
                    height: 32,
                    minWidth: 32,
                    padding: 0,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 999,
                  }}
                >
                  {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
              )}
              <div style={{ fontWeight: 900, color: 'var(--text-primary)' }}>{unit.name}</div>
              {isRoot && <span className="selected-chip">Top Level</span>}
              {!isRoot && <span className="selected-chip">Level {depth + 1}</span>}
            </div>
            <div className="muted-meta" style={{ marginTop: '0.2rem' }}>
              {unit.parent ? `Parent: ${unit.parent.name}` : 'Akar struktur'} {unit.code ? ` / Code: ${unit.code}` : ''}
            </div>
          </div>
          <StatusBadge type="user" status={unit.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE'} size="sm" />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <span className="selected-chip">{picCounts.get(unit.id) ?? unit.memberCount ?? 0} PIC users</span>
          <span className="selected-chip">{children.length} child units</span>
          <span className="selected-chip">{unit.postingOrderCount ?? 0} posting orders</span>
          {hasChildren && (
            <button
              type="button"
              className="selected-chip"
              onClick={() => onToggleUnit(unit.id)}
              style={{ cursor: 'pointer', border: 'none' }}
            >
              {isExpanded ? 'Hide children' : 'Show children'}
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn-primary"
            onClick={() => onAddSubUnit(unit)}
          >
            <Plus size={14} /> Add Sub Unit
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => onEditUnit(unit)}
          >
            Edit Unit
          </button>
        </div>
      </article>

      {hasChildren && isExpanded && (
        <div style={{ display: 'grid', gap: '0.85rem' }}>
          {children.map((child) => (
            <OrgUnitTreeBranch
              key={child.unit.id}
              node={child}
              depth={depth + 1}
              picCounts={picCounts}
              expandedUnitIds={expandedUnitIds}
              onToggleUnit={onToggleUnit}
              onAddSubUnit={onAddSubUnit}
              onEditUnit={onEditUnit}
            />
          ))}
        </div>
      )}
    </div>
  )
}
