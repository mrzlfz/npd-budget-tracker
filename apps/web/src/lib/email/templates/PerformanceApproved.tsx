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

interface PerformanceApprovedEmailProps {
  indicatorName: string
  subkegiatanName: string
  period: string
  target: number
  realization: number
  percentage: number
  approverName: string
  viewUrl: string
  organizationName: string
}

export function PerformanceApprovedEmail({
  indicatorName,
  subkegiatanName,
  period,
  target,
  realization,
  percentage,
  approverName,
  viewUrl,
  organizationName,
}: PerformanceApprovedEmailProps) {
  const getPerformanceColor = (pct: number) => {
    if (pct >= 90) return '#10b981' // green
    if (pct >= 70) return '#f59e0b' // yellow
    return '#ef4444' // red
  }

  const performanceColor = getPerformanceColor(percentage)

  return (
    <Html>
      <Head />
      <Preview>Kinerja indikator {indicatorName} telah disetujui</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>✓ Kinerja Disetujui</Heading>
          
          <Text style={text}>
            Laporan kinerja indikator Anda telah disetujui.
          </Text>

          <Section style={successBox}>
            <Text style={statusText}>DISETUJUI</Text>
          </Section>

          <Section style={infoBox}>
            <Text style={infoLabel}>Indikator:</Text>
            <Text style={infoValue}>{indicatorName}</Text>
            
            <Text style={infoLabel}>Sub Kegiatan:</Text>
            <Text style={infoValue}>{subkegiatanName}</Text>
            
            <Text style={infoLabel}>Periode:</Text>
            <Text style={infoValue}>{period}</Text>
            
            <Text style={infoLabel}>Target:</Text>
            <Text style={infoValue}>{target}</Text>
            
            <Text style={infoLabel}>Realisasi:</Text>
            <Text style={infoValue}>{realization}</Text>
            
            <Text style={infoLabel}>Capaian:</Text>
            <Text style={{...infoValue, color: performanceColor}}>
              {percentage.toFixed(1)}%
            </Text>
            
            <Text style={infoLabel}>Disetujui oleh:</Text>
            <Text style={infoValue}>{approverName}</Text>
          </Section>

          <Section style={{...highlightBox, borderColor: performanceColor}}>
            <Text style={highlightText}>
              {percentage >= 90 && '🎉 Luar biasa! Capaian kinerja sangat baik.'}
              {percentage >= 70 && percentage < 90 && '👍 Baik! Capaian kinerja memadai.'}
              {percentage < 70 && '⚠️ Perlu peningkatan untuk periode selanjutnya.'}
            </Text>
          </Section>

          <Section style={buttonContainer}>
            <Button style={button} href={viewUrl}>
              Lihat Detail Kinerja
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

const successBox = {
  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  borderRadius: '8px',
  padding: '16px',
  margin: '24px 48px',
  textAlign: 'center' as const,
}

const statusText = {
  color: '#ffffff',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0',
  letterSpacing: '1px',
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

const highlightBox = {
  background: '#f0fdf4',
  border: '2px solid',
  borderRadius: '8px',
  padding: '16px',
  margin: '24px 48px',
}

const highlightText = {
  fontSize: '14px',
  color: '#1f2937',
  lineHeight: '20px',
  margin: '0',
  textAlign: 'center' as const,
}

const buttonContainer = {
  padding: '27px 48px',
}

const button = {
  backgroundColor: '#2563eb',
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

export default PerformanceApprovedEmail

