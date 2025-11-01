'use client'

/**
 * Performance Management Page
 * 
 * Displays performance logs with approval queue for Bendahara/Admin
 * and performance history for all users.
 */

import { useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { CheckCircle, XCircle, Clock, TrendingUp, Search } from 'lucide-react'
import { PerformanceApprovalModal } from '@/components/performance/PerformanceApprovalModal'
import { formatCurrency, formatDate } from '@/lib/utils/format'

type PerformanceLog = any // TODO: Add proper type from Convex

export default function PerformancePage() {
  const { user, organizationId } = useAuth()
  const [selectedTab, setSelectedTab] = useState<'pending' | 'approved' | 'rejected'>('pending')
  const [selectedLog, setSelectedLog] = useState<PerformanceLog | null>(null)
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [periodFilter, setPeriodFilter] = useState<string>('all')

  // Query pending approvals
  const pendingLogs = useQuery(
    api.performance.getPendingApproval,
    organizationId ? { organizationId, limit: 50 } : 'skip'
  )

  // Query history (approved/rejected)
  const historyLogs = useQuery(
    api.performance.getHistory,
    organizationId
      ? {
          organizationId,
          status: selectedTab === 'approved' ? 'approved' : selectedTab === 'rejected' ? 'rejected' : undefined,
          limit: 100,
        }
      : 'skip'
  )

  const canApprove = user?.role === 'bendahara' || user?.role === 'admin'

  // Filter logs based on search query and period
  const filterLogs = (logs: PerformanceLog[] | undefined) => {
    if (!logs) return []
    
    return logs.filter((log) => {
      const matchesSearch =
        searchQuery === '' ||
        log.indikatorNama?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.subkegiatan?.nama?.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesPeriod =
        periodFilter === 'all' ||
        log.periode?.toString().includes(periodFilter)
      
      return matchesSearch && matchesPeriod
    })
  }

  const filteredPending = filterLogs(pendingLogs)
  const filteredHistory = filterLogs(historyLogs)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Disetujui
          </Badge>
        )
      case 'rejected':
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            Ditolak
          </Badge>
        )
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Menunggu
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getCapaianBadge = (percentage: number) => {
    if (percentage >= 80) {
      return <Badge className="bg-green-100 text-green-800">{percentage.toFixed(2)}%</Badge>
    } else if (percentage >= 50) {
      return <Badge className="bg-yellow-100 text-yellow-800">{percentage.toFixed(2)}%</Badge>
    } else {
      return <Badge className="bg-red-100 text-red-800">{percentage.toFixed(2)}%</Badge>
    }
  }

  const handleApprove = (log: PerformanceLog) => {
    setSelectedLog(log)
    setIsApprovalModalOpen(true)
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manajemen Kinerja</h1>
          <p className="text-muted-foreground mt-1">
            Kelola dan setujui pencatatan kinerja sub kegiatan
          </p>
        </div>
        {canApprove && pendingLogs && pendingLogs.length > 0 && (
          <Badge variant="destructive" className="text-lg px-4 py-2">
            {pendingLogs.length} Menunggu Persetujuan
          </Badge>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Cari indikator atau sub kegiatan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={periodFilter} onValueChange={setPeriodFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter Periode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Periode</SelectItem>
                <SelectItem value="TW1">Triwulan 1</SelectItem>
                <SelectItem value="TW2">Triwulan 2</SelectItem>
                <SelectItem value="TW3">Triwulan 3</SelectItem>
                <SelectItem value="TW4">Triwulan 4</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending">
            Menunggu Persetujuan
            {pendingLogs && pendingLogs.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {pendingLogs.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">Disetujui</TabsTrigger>
          <TabsTrigger value="rejected">Ditolak</TabsTrigger>
        </TabsList>

        {/* Pending Approval Tab */}
        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Kinerja Menunggu Persetujuan</CardTitle>
              <CardDescription>
                {canApprove
                  ? 'Tinjau dan setujui pencatatan kinerja dari PPTK'
                  : 'Kinerja yang menunggu persetujuan dari Bendahara'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredPending.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">Tidak ada kinerja menunggu persetujuan</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {searchQuery || periodFilter !== 'all'
                      ? 'Coba ubah filter pencarian'
                      : 'Semua kinerja sudah diproses'}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sub Kegiatan</TableHead>
                      <TableHead>Indikator</TableHead>
                      <TableHead>Periode</TableHead>
                      <TableHead className="text-right">Target</TableHead>
                      <TableHead className="text-right">Realisasi</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead>Dibuat Oleh</TableHead>
                      <TableHead>Tanggal</TableHead>
                      {canApprove && <TableHead className="text-right">Aksi</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPending.map((log) => (
                      <TableRow key={log._id}>
                        <TableCell className="font-medium">
                          {log.subkegiatan?.nama || '-'}
                        </TableCell>
                        <TableCell>{log.indikatorNama}</TableCell>
                        <TableCell>{log.periode}</TableCell>
                        <TableCell className="text-right">
                          {log.target} {log.satuan}
                        </TableCell>
                        <TableCell className="text-right">
                          {log.realisasi} {log.satuan}
                        </TableCell>
                        <TableCell className="text-center">
                          {getStatusBadge(log.status)}
                        </TableCell>
                        <TableCell>{log.creator?.name || '-'}</TableCell>
                        <TableCell>{formatDate(log.createdAt)}</TableCell>
                        {canApprove && (
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              onClick={() => handleApprove(log)}
                            >
                              Tinjau
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Approved Tab */}
        <TabsContent value="approved">
          <Card>
            <CardHeader>
              <CardTitle>Kinerja Disetujui</CardTitle>
              <CardDescription>
                Riwayat kinerja yang telah disetujui
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredHistory.length === 0 ? (
                <div className="text-center py-12">
                  <TrendingUp className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">Belum ada kinerja disetujui</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {searchQuery || periodFilter !== 'all'
                      ? 'Coba ubah filter pencarian'
                      : 'Kinerja yang disetujui akan muncul di sini'}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sub Kegiatan</TableHead>
                      <TableHead>Indikator</TableHead>
                      <TableHead>Periode</TableHead>
                      <TableHead className="text-right">Target</TableHead>
                      <TableHead className="text-right">Realisasi</TableHead>
                      <TableHead className="text-center">Capaian</TableHead>
                      <TableHead>Disetujui Oleh</TableHead>
                      <TableHead>Tanggal Disetujui</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredHistory.map((log) => {
                      const capaian = log.persentaseCapaian || 0
                      return (
                        <TableRow key={log._id}>
                          <TableCell className="font-medium">
                            {log.subkegiatan?.nama || '-'}
                          </TableCell>
                          <TableCell>{log.indikatorNama}</TableCell>
                          <TableCell>{log.periode}</TableCell>
                          <TableCell className="text-right">
                            {log.target} {log.satuan}
                          </TableCell>
                          <TableCell className="text-right">
                            {log.realisasi} {log.satuan}
                          </TableCell>
                          <TableCell className="text-center">
                            {getCapaianBadge(capaian)}
                          </TableCell>
                          <TableCell>{log.approver?.name || '-'}</TableCell>
                          <TableCell>{formatDate(log.approvedAt)}</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rejected Tab */}
        <TabsContent value="rejected">
          <Card>
            <CardHeader>
              <CardTitle>Kinerja Ditolak</CardTitle>
              <CardDescription>
                Riwayat kinerja yang ditolak dengan alasan penolakan
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredHistory.length === 0 ? (
                <div className="text-center py-12">
                  <XCircle className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">Belum ada kinerja ditolak</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {searchQuery || periodFilter !== 'all'
                      ? 'Coba ubah filter pencarian'
                      : 'Kinerja yang ditolak akan muncul di sini'}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sub Kegiatan</TableHead>
                      <TableHead>Indikator</TableHead>
                      <TableHead>Periode</TableHead>
                      <TableHead className="text-right">Target</TableHead>
                      <TableHead className="text-right">Realisasi</TableHead>
                      <TableHead>Alasan Penolakan</TableHead>
                      <TableHead>Ditolak Oleh</TableHead>
                      <TableHead>Tanggal Ditolak</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredHistory.map((log) => (
                      <TableRow key={log._id}>
                        <TableCell className="font-medium">
                          {log.subkegiatan?.nama || '-'}
                        </TableCell>
                        <TableCell>{log.indikatorNama}</TableCell>
                        <TableCell>{log.periode}</TableCell>
                        <TableCell className="text-right">
                          {log.target} {log.satuan}
                        </TableCell>
                        <TableCell className="text-right">
                          {log.realisasi} {log.satuan}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                          {log.rejectionReason || '-'}
                        </TableCell>
                        <TableCell>{log.rejector?.name || '-'}</TableCell>
                        <TableCell>{formatDate(log.rejectedAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Approval Modal */}
      {selectedLog && (
        <PerformanceApprovalModal
          isOpen={isApprovalModalOpen}
          onClose={() => {
            setIsApprovalModalOpen(false)
            setSelectedLog(null)
          }}
          performanceLog={selectedLog}
        />
      )}
    </div>
  )
}
