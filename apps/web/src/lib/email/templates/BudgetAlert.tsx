import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Hr,
} from '@react-email/components'

interface BudgetAlertEmailProps {
  accountCode: string
  accountName: string
  pagu: number
  realization: number
  percentage: number
  remaining: number
  programName: string
  viewUrl: string
  organizationName: string
}

export function BudgetAlertEmail({
  accountCode,
  accountName,
  pagu,
  realization,
  percentage,
  remaining,
  programName,
  viewUrl,
  organizationName,
}: BudgetAlertEmailProps) {
  const formattedPagu = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(pagu)

  const formattedRealization = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(realization)

  const formattedRemaining = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(remaining)

  const getAlertLevel = (pct: number) => {
    if (pct >= 95) return { level: 'CRITICAL', color: '#dc2626', icon: '🚨' }
    if (pct >= 90) return { level: 'TINGGI', color: '#ea580c', icon: '⚠️' }
    return { level: 'SEDANG', color: '#f59e0b', icon: '⚡' }
  }

  const alert = getAlertLevel(percentage)

  return (
    <Html>
      <Head />
      <Preview>Peringatan: Penggunaan anggaran {percentage.toFixed(0)}%</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>{alert.icon} Peringatan Anggaran</Heading>
          
          <Text style={text}>
            Penggunaan anggaran pada rekening berikut telah mencapai tingkat yang memerlukan perhatian.
          </Text>

          <Section style={{...alertBox, borderColor: alert.color}}>
            <Text style={alertLevel}>LEVEL: {alert.level}</Text>
            <Text style={alertPercentage}>{percentage.toFixed(1)}%</Text>
            <Text style={alertSubtext}>dari pagu terealisasi</Text>
          </Section>

          <Section style={infoBox}>
            <Text style={infoLabel}>Kode Rekening:</Text>
            <Text style={infoValue}>{accountCode}</Text>
            
            <Text style={infoLabel}>Uraian:</Text>
            <Text style={infoValue}>{accountName}</Text>
            
            <Text style={infoLabel}>Program:</Text>
            <Text style={infoValue}>{programName}</Text>
          </Section>

          <Section style={statsBox}>
            <div style={statItem}>
              <Text style={statLabel}>Total Pagu</Text>
              <Text style={statValue}>{formattedPagu}</Text>
            </div>
            
            <div style={statItem}>
              <Text style={statLabel}>Realisasi</Text>
              <Text style={{...statValue, color: alert.color}}>{formattedRealization}</Text>
            </div>
            
            <div style={statItem}>
              <Text style={statLabel}>Sisa Pagu</Text>
              <Text style={statValue}>{formattedRemaining}</Text>
            </div>
          </Section>

          <Section style={warningBox}>
            <Text style={warningText}>
              ⚠️ <strong>Tindakan yang Diperlukan:</strong>
              <br /><br />
              {percentage >= 95 && (
                <>
                  • Segera tinjau rencana pencairan dana yang tersisa
                  <br />
                  • Koordinasikan dengan tim untuk menghindari overbudget
                  <br />
                  • Pertimbangkan revisi anggaran jika diperlukan
                </>
              )}
              {percentage >= 90 && percentage < 95 && (
                <>
                  • Monitor pencairan dana dengan cermat
                  <br />
                  • Pastikan setiap NPD baru sudah sesuai dengan sisa anggaran
                  <br />
                  • Siapkan rencana mitigasi jika mendekati 100%
                </>
              )}
              {percentage < 90 && (
                <>
                  • Pantau perkembangan realisasi anggaran
                  <br />
                  • Pastikan pengajuan NPD tetap dalam batas wajar
                  <br />
                  • Lakukan perencanaan untuk sisa pagu yang tersedia
                </>
              )}
            </Text>
          </Section>

          <Section style={buttonContainer}>
            <Button style={button} href={viewUrl}>
              Lihat Detail Anggaran
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            Email ini dikirim secara otomatis oleh sistem NPD Tracker - {organizationName}.
            <br />
            Mohon tidak membalas email ini.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
}

const h1 = {
  color: '#1f2937',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0 48px',
  textAlign: 'center' as const,
}

const text = {
  color: '#4b5563',
  fontSize: '16px',
  lineHeight: '24px',
  padding: '0 48px',
  marginBottom: '16px',
}

const alertBox = {
  background: '#fef2f2',
  border: '3px solid',
  borderRadius: '12px',
  padding: '24px',
  margin: '24px 48px',
  textAlign: 'center' as const,
}

const alertLevel = {
  fontSize: '14px',
  color: '#991b1b',
  fontWeight: 'bold',
  letterSpacing: '1px',
  margin: '0 0 8px',
}

const alertPercentage = {
  fontSize: '48px',
  fontWeight: 'bold',
  color: '#dc2626',
  margin: '8px 0',
  lineHeight: '1',
}

const alertSubtext = {
  fontSize: '14px',
  color: '#6b7280',
  margin: '8px 0 0',
}

const infoBox = {
  background: '#f3f4f6',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 48px',
}

const infoLabel = {
  fontSize: '12px',
  color: '#6b7280',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  margin: '16px 0 4px',
}

const infoValue = {
  fontSize: '16px',
  color: '#1f2937',
  fontWeight: 'bold',
  margin: '0 0 8px',
}

const statsBox = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: '16px',
  padding: '24px 48px',
}

const statItem = {
  textAlign: 'center' as const,
  padding: '16px',
  background: '#f9fafb',
  borderRadius: '8px',
}

const statLabel = {
  fontSize: '12px',
  color: '#6b7280',
  margin: '0 0 8px',
  fontWeight: '600',
}

const statValue = {
  fontSize: '14px',
  color: '#1f2937',
  fontWeight: 'bold',
  margin: '0',
}

const warningBox = {
  background: '#fffbeb',
  border: '2px solid #fbbf24',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 48px',
}

const warningText = {
  fontSize: '14px',
  color: '#78350f',
  lineHeight: '22px',
  margin: '0',
}

const buttonContainer = {
  padding: '27px 48px',
}

const button = {
  backgroundColor: '#dc2626',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '16px 24px',
}

const hr = {
  borderColor: '#e5e7eb',
  margin: '20px 48px',
}

const footer = {
  color: '#9ca3af',
  fontSize: '12px',
  lineHeight: '16px',
  padding: '0 48px',
  textAlign: 'center' as const,
}

export default BudgetAlertEmail

