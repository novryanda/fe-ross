'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Anchor,
  Building2,
  ChevronDown,
  ChevronRight,
  Download,
  Eye,
  FolderTree,
  Lightbulb,
  MoreVertical,
  Move,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
} from 'lucide-react'
import { RoleGuard } from '@/components/layout/role-guard'
import { PageHeader } from '@/components/ui/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { StatusBadge } from '@/components/ui/badges'
import { PaginationControls } from '@/components/ui/pagination-controls'
import {
  orgUnitsApi,
  type OrgUnitListParams,
  type OrgUnitMoveDto,
  type OrgUnitWriteDto,
} from '@/lib/api/org-units'
import { mapApiErrorToToastMessage } from '@/lib/api/errors'
import type { OrgUnit, OrgUnitDetail } from '@/types'
import { formatDateTime } from '@/lib/utils'
import { toast } from 'sonner'

type OrgUnitTreeNode = {
  unit: OrgUnit
  children: OrgUnitTreeNode[]
}

type FlatTreeRow = {
  unit: OrgUnit
  depth: number
  hasChildren: boolean
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

function flattenTree(
  nodes: OrgUnitTreeNode[],
  expandedUnitIds: Set<string>,
  depth = 0,
): FlatTreeRow[] {
  const rows: FlatTreeRow[] = []

  for (const node of nodes) {
    const hasChildren = node.children.length > 0
    rows.push({ unit: node.unit, depth, hasChildren })

    if (hasChildren && expandedUnitIds.has(node.unit.id)) {
      rows.push(...flattenTree(node.children, expandedUnitIds, depth + 1))
    }
  }

  return rows
}

function getUnitIcon(name: string) {
  if (/laut|navy|marinir/i.test(name)) {
    return <Anchor size={15} />
  }
  return <Building2 size={15} />
}

function getLevelBadgeClass(level?: number) {
  if (level === 1) return 'level-badge-1'
  if (level === 2) return 'level-badge-2'
  if (level === 3) return 'level-badge-3'
  return 'level-badge-default'
}

function computeDepthLevels(units: OrgUnit[]) {
  const levels = new Map<string, number>()
  const parentMap = new Map(units.map((unit) => [unit.id, unit.parentId ?? null]))

  const resolveLevel = (unitId: string): number => {
    const cached = levels.get(unitId)
    if (cached !== undefined) return cached

    const parentId = parentMap.get(unitId)
    if (!parentId) {
      levels.set(unitId, 1)
      return 1
    }

    const level = resolveLevel(parentId) + 1
    levels.set(unitId, level)
    return level
  }

  for (const unit of units) {
    resolveLevel(unit.id)
  }

  return levels
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export default function PicStructurePage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [levelFilter, setLevelFilter] = useState('')
  const [picAssignedFilter, setPicAssignedFilter] = useState('')
  const [activeOnly, setActiveOnly] = useState(false)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [expandedUnitIds, setExpandedUnitIds] = useState<string[]>([])
  const [openMenuUnitId, setOpenMenuUnitId] = useState<string | null>(null)

  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false)

  const [editingUnit, setEditingUnit] = useState<OrgUnit | null>(null)
  const [parentUnitPreset, setParentUnitPreset] = useState<OrgUnit | null>(null)
  const [detailUnitId, setDetailUnitId] = useState<string | null>(null)
  const [movingUnit, setMovingUnit] = useState<OrgUnit | null>(null)

  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [parentId, setParentId] = useState('')
  const [status, setStatus] = useState<OrgUnit['status']>('ACTIVE')
  const [moveParentId, setMoveParentId] = useState('')

  const menuRef = useRef<HTMLDivElement | null>(null)

  const listParams = useMemo<OrgUnitListParams>(() => ({
    page: 1,
    limit: 100,
    search: search || undefined,
    status: (activeOnly ? 'ACTIVE' : statusFilter || undefined) as OrgUnit['status'] | undefined,
    level: levelFilter ? Number(levelFilter) : undefined,
    picAssigned: (picAssignedFilter || undefined) as OrgUnitListParams['picAssigned'],
    sortBy: 'name',
    sortOrder: 'asc',
  }), [activeOnly, levelFilter, picAssignedFilter, search, statusFilter])

  useEffect(() => {
    setPage(1)
  }, [search, statusFilter, levelFilter, picAssignedFilter, activeOnly])

  useEffect(() => {
    if (!openMenuUnitId) return

    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpenMenuUnitId(null)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [openMenuUnitId])

  useEffect(() => {
    if (isFormModalOpen && editingUnit) {
      setName(editingUnit.name)
      setCode(editingUnit.code ?? '')
      setParentId(editingUnit.parentId ?? '')
      setStatus(editingUnit.status)
      return
    }

    if (isFormModalOpen && parentUnitPreset) {
      setName('')
      setCode('')
      setParentId(parentUnitPreset.id)
      setStatus('ACTIVE')
      return
    }

    if (!isFormModalOpen) {
      setEditingUnit(null)
      setParentUnitPreset(null)
      setName('')
      setCode('')
      setParentId('')
      setStatus('ACTIVE')
    }
  }, [editingUnit, isFormModalOpen, parentUnitPreset])

  useEffect(() => {
    if (isMoveModalOpen && movingUnit) {
      setMoveParentId(movingUnit.parentId ?? '')
    } else if (!isMoveModalOpen) {
      setMovingUnit(null)
      setMoveParentId('')
    }
  }, [isMoveModalOpen, movingUnit])

  const orgUnitsQuery = useQuery({
    queryKey: ['org-units', listParams],
    queryFn: () => orgUnitsApi.list(listParams),
  })

  const detailQuery = useQuery({
    queryKey: ['org-units', 'detail', detailUnitId],
    queryFn: () => orgUnitsApi.getById(detailUnitId!),
    enabled: Boolean(detailUnitId && isDetailModalOpen),
  })

  const saveMutation = useMutation({
    mutationFn: (dto: OrgUnitWriteDto) =>
      editingUnit ? orgUnitsApi.update(editingUnit.id, dto) : orgUnitsApi.create(dto),
    onSuccess: () => {
      toast.success(editingUnit ? 'PIC unit berhasil diperbarui.' : 'PIC unit berhasil dibuat.')
      setIsFormModalOpen(false)
      queryClient.invalidateQueries({ queryKey: ['org-units'] })
    },
    onError: (error) => toast.error(mapApiErrorToToastMessage(error)),
  })

  const moveMutation = useMutation({
    mutationFn: ({ unitId, dto }: { unitId: string; dto: OrgUnitMoveDto }) =>
      orgUnitsApi.move(unitId, dto),
    onSuccess: () => {
      toast.success('PIC unit berhasil dipindahkan.')
      setIsMoveModalOpen(false)
      queryClient.invalidateQueries({ queryKey: ['org-units'] })
    },
    onError: (error) => toast.error(mapApiErrorToToastMessage(error)),
  })

  const deleteMutation = useMutation({
    mutationFn: (unit: OrgUnit) => orgUnitsApi.delete(unit.id),
    onSuccess: (_, unit) => {
      toast.success(`PIC unit "${unit.name}" berhasil dihapus.`)
      setOpenMenuUnitId(null)
      queryClient.invalidateQueries({ queryKey: ['org-units'] })
    },
    onError: (error) => toast.error(mapApiErrorToToastMessage(error)),
  })

  const exportMutation = useMutation({
    mutationFn: () => orgUnitsApi.exportCsv(listParams),
    onSuccess: (blob) => {
      downloadBlob(blob, 'pic-structure.csv')
      toast.success('Export PIC structure berhasil diunduh.')
    },
    onError: (error) => toast.error(mapApiErrorToToastMessage(error)),
  })

  const units = orgUnitsQuery.data?.data ?? []
  const depthLevels = useMemo(() => computeDepthLevels(units), [units])
  const unitsWithLevel = useMemo(
    () =>
      units.map((unit) => ({
        ...unit,
        level: unit.level ?? depthLevels.get(unit.id),
      })),
    [depthLevels, units],
  )
  const unitTree = useMemo(() => buildOrgUnitTree(unitsWithLevel), [unitsWithLevel])
  const expandedUnitIdSet = useMemo(() => new Set(expandedUnitIds), [expandedUnitIds])
  const visibleRows = useMemo(
    () => flattenTree(unitTree, expandedUnitIdSet),
    [expandedUnitIdSet, unitTree],
  )
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * limit
    return visibleRows.slice(start, start + limit)
  }, [limit, page, visibleRows])

  const paginationMeta = useMemo(
    () => ({
      page,
      limit,
      total: visibleRows.length,
      totalPages: Math.max(1, Math.ceil(visibleRows.length / limit)),
    }),
    [limit, page, visibleRows.length],
  )

  useEffect(() => {
    if (!expandedUnitIds.length && unitsWithLevel.length) {
      setExpandedUnitIds(unitsWithLevel.map((unit) => unit.id))
    }
  }, [expandedUnitIds.length, unitsWithLevel])

  const toggleUnit = (unitId: string) => {
    setExpandedUnitIds((current) =>
      current.includes(unitId)
        ? current.filter((id) => id !== unitId)
        : [...current, unitId],
    )
  }

  const openCreateModal = (parent?: OrgUnit) => {
    setEditingUnit(null)
    setParentUnitPreset(parent ?? null)
    setIsFormModalOpen(true)
    setOpenMenuUnitId(null)
  }

  const openEditModal = (unit: OrgUnit) => {
    setEditingUnit(unit)
    setParentUnitPreset(null)
    setIsFormModalOpen(true)
    setOpenMenuUnitId(null)
  }

  const openDetailModal = (unit: OrgUnit) => {
    setDetailUnitId(unit.id)
    setIsDetailModalOpen(true)
    setOpenMenuUnitId(null)
  }

  const openMoveModal = (unit: OrgUnit) => {
    setMovingUnit(unit)
    setIsMoveModalOpen(true)
    setOpenMenuUnitId(null)
  }

  const handleDelete = (unit: OrgUnit) => {
    if (
      !window.confirm(
        `Hapus unit "${unit.name}"? Tindakan ini hanya bisa dilakukan jika unit tidak punya sub unit, user PIC, atau posting order.`,
      )
    ) {
      return
    }

    deleteMutation.mutate(unit)
  }

  const detailUnit: OrgUnitDetail | undefined = detailQuery.data

  return (
    <RoleGuard roles={['ADMIN']}>
      <div className="page-container">
        <PageHeader
          title="PIC Structure"
          subtitle="Kelola unit organisasi bertingkat untuk distribusi posting order ke PIC."
          backHref="/network"
          actions={
            <button type="button" className="btn-primary" onClick={() => openCreateModal()}>
              <Plus size={14} /> Add Unit
            </button>
          }
        />

        <div className="info-banner info-banner-cyan">
          <Lightbulb size={15} style={{ flexShrink: 0 }} />
          Tree view memudahkan Anda melihat struktur organisasi secara hierarkis dalam satu tampilan.
        </div>

        <div className="pic-structure-filters">
          <div style={{ position: 'relative', flex: 1, minWidth: 220, maxWidth: 320 }}>
            <Search
              size={14}
              style={{
                position: 'absolute',
                left: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
                pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              className="input-field"
              placeholder="Search unit name or code..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              style={{ paddingLeft: '2.25rem' }}
            />
          </div>

          <select
            className="input-field"
            style={{ width: 'auto' }}
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            disabled={activeOnly}
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>

          <select
            className="input-field"
            style={{ width: 'auto' }}
            value={levelFilter}
            onChange={(event) => setLevelFilter(event.target.value)}
          >
            <option value="">All Level</option>
            <option value="1">Level 1</option>
            <option value="2">Level 2</option>
            <option value="3">Level 3</option>
          </select>

          <select
            className="input-field"
            style={{ width: 'auto' }}
            value={picAssignedFilter}
            onChange={(event) => setPicAssignedFilter(event.target.value)}
          >
            <option value="">All PIC Assigned</option>
            <option value="ASSIGNED">Has PIC</option>
            <option value="UNASSIGNED">No PIC</option>
          </select>

          <label className="pic-structure-toggle">
            <input
              type="checkbox"
              checked={activeOnly}
              onChange={(event) => setActiveOnly(event.target.checked)}
            />
            Tampilkan hanya unit aktif
          </label>

          <button
            type="button"
            className="btn-secondary"
            onClick={() => exportMutation.mutate()}
            disabled={exportMutation.isPending}
            style={{ marginLeft: 'auto' }}
          >
            <Download size={14} />
            {exportMutation.isPending ? 'Exporting...' : 'Export'}
          </button>
        </div>

        {orgUnitsQuery.isLoading ? (
          <div className="data-table-container" aria-busy="true">
            <div style={{ padding: '1.5rem' }}>
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="skeleton" style={{ height: 28, marginBottom: '0.75rem' }} />
              ))}
            </div>
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
            action={<button type="button" className="btn-primary" onClick={() => openCreateModal()}>Add Unit</button>}
          />
        ) : (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Unit Name</th>
                  <th>Code</th>
                  <th>Level</th>
                  <th>PIC Assigned</th>
                  <th>Child Units</th>
                  <th>Status</th>
                  <th>Updated At</th>
                  <th style={{ width: 56 }} />
                </tr>
              </thead>
              <tbody>
                {paginatedRows.map(({ unit, depth, hasChildren }) => {
                  const level = unit.level ?? depthLevels.get(unit.id) ?? depth + 1
                  const isMenuOpen = openMenuUnitId === unit.id
                  const isExpanded = expandedUnitIdSet.has(unit.id)
                  const isNavy = /laut|navy|marinir/i.test(unit.name)

                  return (
                    <tr key={unit.id}>
                      <td>
                        <div className="org-unit-tree-cell">
                          <span
                            className="org-unit-tree-indent"
                            style={{ width: depth * 18 }}
                          />
                          <button
                            type="button"
                            className={`org-unit-tree-toggle${hasChildren ? '' : ' placeholder'}`}
                            aria-label={isExpanded ? `Collapse ${unit.name}` : `Expand ${unit.name}`}
                            onClick={() => hasChildren && toggleUnit(unit.id)}
                          >
                            {hasChildren ? (
                              isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
                            ) : (
                              <ChevronRight size={14} />
                            )}
                          </button>
                          <span className={`org-unit-icon${isNavy ? ' navy' : ''}`}>
                            {getUnitIcon(unit.name)}
                          </span>
                          <span style={{ fontWeight: 700 }}>{unit.name}</span>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{unit.code ?? '-'}</td>
                      <td>
                        <span className={`level-badge ${getLevelBadgeClass(level)}`}>
                          Level {level}
                        </span>
                      </td>
                      <td>
                        <span className="metric-chip">
                          <Users size={13} />
                          <strong>{unit.memberCount ?? 0}</strong>
                        </span>
                      </td>
                      <td>
                        <span className="metric-chip">
                          <FolderTree size={13} />
                          <strong>{unit.childCount ?? 0}</strong>
                        </span>
                      </td>
                      <td>
                        <StatusBadge
                          type="user"
                          status={unit.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE'}
                          size="sm"
                        />
                      </td>
                      <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {unit.updatedAt ? formatDateTime(unit.updatedAt) : '-'}
                      </td>
                      <td>
                        <div
                          className="kebab-menu"
                          ref={isMenuOpen ? menuRef : null}
                        >
                          <button
                            type="button"
                            className={`kebab-trigger${isMenuOpen ? ' active' : ''}`}
                            aria-label={`Actions for ${unit.name}`}
                            onClick={() =>
                              setOpenMenuUnitId((current) =>
                                current === unit.id ? null : unit.id,
                              )
                            }
                          >
                            <MoreVertical size={15} />
                          </button>

                          {isMenuOpen && (
                            <div className="kebab-dropdown">
                              <button type="button" onClick={() => openDetailModal(unit)}>
                                <Eye size={14} /> View Detail
                              </button>
                              <button type="button" onClick={() => openCreateModal(unit)}>
                                <Plus size={14} /> Add Sub Unit
                              </button>
                              <button type="button" onClick={() => openEditModal(unit)}>
                                <Pencil size={14} /> Edit Unit
                              </button>
                              <button type="button" onClick={() => openMoveModal(unit)}>
                                <Move size={14} /> Move Unit
                              </button>
                              <button
                                type="button"
                                className="danger"
                                onClick={() => handleDelete(unit)}
                                disabled={deleteMutation.isPending && deleteMutation.variables?.id === unit.id}
                              >
                                <Trash2 size={14} />
                                {deleteMutation.isPending && deleteMutation.variables?.id === unit.id
                                  ? 'Deleting...'
                                  : 'Delete Unit'}
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            <PaginationControls
              meta={paginationMeta}
              pageSize={limit}
              itemLabel="units"
              onPageChange={setPage}
              onPageSizeChange={(nextLimit) => {
                setLimit(nextLimit)
                setPage(1)
              }}
            />
          </div>
        )}

        <Modal
          open={isFormModalOpen}
          onClose={() => setIsFormModalOpen(false)}
          title={
            editingUnit
              ? 'Edit PIC Unit'
              : parentUnitPreset
                ? `Add Sub Unit - ${parentUnitPreset.name}`
                : 'Add PIC Unit'
          }
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
              options={unitsWithLevel
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
              <button type="button" className="btn-ghost" onClick={() => setIsFormModalOpen(false)}>
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

        <Modal
          open={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false)
            setDetailUnitId(null)
          }}
          title={detailUnit?.name ?? 'Unit Detail'}
        >
          {detailQuery.isLoading ? (
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="skeleton" style={{ height: 18 }} />
              ))}
            </div>
          ) : detailQuery.isError ? (
            <ErrorState
              title="Gagal memuat detail unit"
              message={mapApiErrorToToastMessage(detailQuery.error)}
              retry={() => detailQuery.refetch()}
            />
          ) : detailUnit ? (
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <div className="muted-meta">Code</div>
                  <div style={{ fontWeight: 700 }}>{detailUnit.code ?? '-'}</div>
                </div>
                <div>
                  <div className="muted-meta">Level</div>
                  <span className={`level-badge ${getLevelBadgeClass(detailUnit.level)}`}>
                    Level {detailUnit.level ?? '-'}
                  </span>
                </div>
                <div>
                  <div className="muted-meta">Status</div>
                  <StatusBadge
                    type="user"
                    status={detailUnit.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE'}
                    size="sm"
                  />
                </div>
                <div>
                  <div className="muted-meta">Updated At</div>
                  <div>{detailUnit.updatedAt ? formatDateTime(detailUnit.updatedAt) : '-'}</div>
                </div>
              </div>

              {detailUnit.ancestors && detailUnit.ancestors.length > 0 && (
                <div>
                  <div className="muted-meta" style={{ marginBottom: '0.35rem' }}>Hierarchy Path</div>
                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                    {detailUnit.ancestors.map((ancestor) => (
                      <span key={ancestor.id} className="selected-chip">
                        {ancestor.name}
                      </span>
                    ))}
                    <span className="selected-chip">{detailUnit.name}</span>
                  </div>
                </div>
              )}

              <div>
                <div className="muted-meta" style={{ marginBottom: '0.5rem' }}>
                  PIC Assigned ({detailUnit.members?.length ?? detailUnit.memberCount ?? 0})
                </div>
                {detailUnit.members && detailUnit.members.length > 0 ? (
                  <div style={{ display: 'grid', gap: '0.5rem' }}>
                    {detailUnit.members.map((member) => (
                      <div
                        key={member.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.75rem',
                          padding: '0.65rem 0.75rem',
                          borderRadius: 10,
                          border: '1px solid var(--border-subtle)',
                          background: 'rgba(17, 29, 56, 0.45)',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700 }}>{member.name}</div>
                          <div className="muted-meta">{member.email}</div>
                        </div>
                        <StatusBadge type="user" status={member.status} size="sm" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="muted-meta">Belum ada PIC yang ditugaskan ke unit ini.</div>
                )}
              </div>
            </div>
          ) : null}
        </Modal>

        <Modal
          open={isMoveModalOpen}
          onClose={() => setIsMoveModalOpen(false)}
          title={movingUnit ? `Move Unit - ${movingUnit.name}` : 'Move Unit'}
        >
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div className="info-banner info-banner-cyan" style={{ marginBottom: 0 }}>
              Pindahkan unit ke parent baru. Kosongkan parent untuk menjadikan unit sebagai top level.
            </div>
            <Select
              label="New Parent Unit"
              value={moveParentId}
              onChange={(event) => setMoveParentId(event.target.value)}
              options={unitsWithLevel
                .filter((unit) => unit.id !== movingUnit?.id)
                .map((unit) => ({
                  value: unit.id,
                  label: unit.parent ? `${unit.parent.name} / ${unit.name}` : unit.name,
                }))}
              placeholder="No parent / top level"
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button type="button" className="btn-ghost" onClick={() => setIsMoveModalOpen(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                disabled={!movingUnit || moveMutation.isPending}
                onClick={() =>
                  movingUnit &&
                  moveMutation.mutate({
                    unitId: movingUnit.id,
                    dto: { parentId: moveParentId || null },
                  })
                }
              >
                Move Unit
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </RoleGuard>
  )
}
