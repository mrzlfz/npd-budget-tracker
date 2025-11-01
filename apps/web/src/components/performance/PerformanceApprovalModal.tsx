'use client'

/**
 * Performance Approval Modal
 * 
 * Modal for reviewing and approving/rejecting performance logs
 * Shows performance details, evidence, and approval form
 */

import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { CheckCircle, XCircle, FileText, Loader2 } from 'lucide-react'
import { formatDate } from '@/lib/utils/format'

type PerformanceLog = any // TODO: Add proper type

interface PerformanceApprovalModalProps {
  isOpen: boolean
  onClose: () => void
  performanceLog: PerformanceLog
}

export function PerformanceApprovalModal({
  isOpen,
  onClose,
  performanceLog,
}: PerformanceApprovalModalProps) {
  const { toast } = useToast()
  const [mode, setMode] = useState<'view' | 'approve' | 'reject'>('view')
  const [approvalNotes, setApprovalNotes] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const approveMutation = useMutation(api.performance.approve)
  const rejectMutation = useMutation(api.performance.reject)

  // Calculate achievement percentage
  const calculatePercentage = () => {
    if (performanceLog.target === 0) return 0
    return ((performanceLog.realisasi / performanceLog.target) * 100).toFixed(2)
  }

  const percentage = parseFloat(calculatePercentage())
  const getPercentageColor = () => {
    if (percentage >= 80) return 'text-green-600'
    if (percentage >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  const handleApprove = async () => {
    if (!performanceLog._id) return

    setIsSubmitting(true)
    try {
      const result = await approveMutation({
        id: performanceLog._id,
        approvalNotes: approvalNotes || undefined,
      })

      toast({
        title: 'Kinerja Disetujui',
        description: `Capaian: ${result.persentaseCapaian.toFixed(2)}%. Email notifikasi telah dikirim.`,
      })

      onClose()
    } catch (error) {
      toast({
        title: 'Gagal Menyetujui',
        description: error instanceof Error ? error.message : 'Terjadi kesalahan',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReject = async () => {
    if (!performanceLog._id || !rejectionReason.trim()) {
      toast({
        title: 'Alasan Diperlukan',
        description: 'Harap berikan alasan penolakan',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)
    try {
      await rejectMutation({
        id: performanceLog._id,
        rejectionReason,
      })

      toast({
        title: 'Kinerja Ditolak',
        description: 'Kinerja telah ditolak dan akan dikembalikan ke PPTK',
      })

      onClose()
    } catch (error) {
      toast({
        title: 'Gagal Menolak',
        description: error instanceof Error ? error.message : 'Terjadi kesalahan',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tinjau Pencatatan Kinerja</DialogTitle>
          <DialogDescription>
            Tinjau detail kinerja dan berikan persetujuan atau penolakan
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Sub Kegiatan Info */}
          <div>
            <h3 className="font-semibold text-lg mb-2">Sub Kegiatan</h3>
            <p className="text-sm text-muted-foreground">
              {performanceLog.subkegiatan?.nama || '-'}
            </p>
          </div>

          {/* Indicator Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Indikator</Label>
              <p className="font-medium mt-1">{performanceLog.indikatorNama}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Periode</Label>
              <p className="font-medium mt-1">{performanceLog.periode}</p>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="border rounded-lg p-4 bg-muted/50">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-muted-foreground text-xs">Target</Label>
                <p className="text-2xl font-bold mt-1">
                  {performanceLog.target}
                  <span className="text-sm font-normal ml-1">{performanceLog.satuan}</span>
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Realisasi</Label>
                <p className="text-2xl font-bold mt-1">
                  {performanceLog.realisasi}
                  <span className="text-sm font-normal ml-1">{performanceLog.satuan}</span>
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Capaian (Auto)</Label>
                <p className={`text-2xl font-bold mt-1 ${getPercentageColor()}`}>
                  {percentage}%
                </p>
              </div>
            </div>
          </div>

          {/* Evidence */}
          {performanceLog.buktiURL && (
            <div>
              <Label className="text-muted-foreground">Bukti/Dokumen</Label>
              <div className="mt-2 flex items-center gap-2 p-3 border rounded-lg">
                <FileText className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{performanceLog.buktiName || 'Dokumen'}</p>
                  <p className="text-xs text-muted-foreground">
                    {performanceLog.buktiType} • {(performanceLog.buktiSize / 1024).toFixed(0)} KB
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(performanceLog.buktiURL, '_blank')}
                >
                  Lihat
                </Button>
              </div>
            </div>
          )}

          {/* Notes from Creator */}
          {performanceLog.keterangan && (
            <div>
              <Label className="text-muted-foreground">Keterangan dari PPTK</Label>
              <p className="text-sm mt-2 p-3 bg-muted/50 rounded-lg">
                {performanceLog.keterangan}
              </p>
            </div>
          )}

          {/* Creator Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <Label className="text-muted-foreground">Dibuat Oleh</Label>
              <p className="mt-1">{performanceLog.creator?.name || '-'}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Tanggal Dibuat</Label>
              <p className="mt-1">{formatDate(performanceLog.createdAt)}</p>
            </div>
          </div>

          {/* Approval/Rejection Form */}
          {mode === 'approve' && (
            <div className="border-t pt-4">
              <Label htmlFor="approvalNotes">Catatan Persetujuan (Opsional)</Label>
              <Textarea
                id="approvalNotes"
                placeholder="Tambahkan catatan persetujuan..."
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                className="mt-2"
                rows={3}
              />
              <p className="text-xs text-muted-foreground mt-2">
                Capaian akan otomatis dihitung: {percentage}%
              </p>
            </div>
          )}

          {mode === 'reject' && (
            <div className="border-t pt-4">
              <Label htmlFor="rejectionReason">
                Alasan Penolakan <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="rejectionReason"
                placeholder="Jelaskan alasan penolakan (wajib)..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="mt-2"
                rows={4}
                required
              />
              <p className="text-xs text-muted-foreground mt-2">
                Penolakan akan mengembalikan kinerja ke PPTK untuk diperbaiki
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {mode === 'view' && (
            <>
              <Button variant="outline" onClick={onClose}>
                Tutup
              </Button>
              <Button
                variant="destructive"
                onClick={() => setMode('reject')}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Tolak
              </Button>
              <Button
                onClick={() => setMode('approve')}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Setujui
              </Button>
            </>
          )}

          {mode === 'approve' && (
            <>
              <Button
                variant="outline"
                onClick={() => setMode('view')}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button
                onClick={handleApprove}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Menyetujui...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Konfirmasi Persetujuan
                  </>
                )}
              </Button>
            </>
          )}

          {mode === 'reject' && (
            <>
              <Button
                variant="outline"
                onClick={() => setMode('view')}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={isSubmitting || !rejectionReason.trim()}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Menolak...
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 mr-2" />
                    Konfirmasi Penolakan
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

