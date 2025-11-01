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

interface NPDFinalizedEmailProps {
  npdNumber: string
  programName: string
  totalAmount: number
  finalizerName: string
  viewUrl: string
  organizationName: string
  finalizedAt: string
}

export function NPDFinalizedEmail({
  npdNumber,
  programName,
  totalAmount,
  finalizerName,
  viewUrl,
  organizationName,
  finalizedAt,
}: NPDFinalizedEmailProps) {
  const formattedAmount = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(totalAmount)

  return (
    <Html>
      <Head />
      <Preview>NPD {npdNumber} telah difinalisasi</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>✓ NPD Difinalisasi</Heading>
          
          <Text style={text}>
            Nota Pencairan Dana telah difinalisasi dan siap untuk pencairan.
          </Text>

          <Section style={successBox}>
            <Text style={statusText}>STATUS: FINAL</Text>
          </Section>

          <Section style={infoBox}>
            <Text style={infoLabel}>Nomor NPD:</Text>
            <Text style={infoValue}>{npdNumber}</Text>
            
            <Text style={infoLabel}>Program/Kegiatan:</Text>
            <Text style={infoValue}>{programName}</Text>
            
            <Text style={infoLabel}>Total Jumlah:</Text>
            <Text style={infoValue}>{formattedAmount}</Text>
            
            <Text style={infoLabel}>Difinalisasi oleh:</Text>
            <Text style={infoValue}>{finalizerName}</Text>
            
            <Text style={infoLabel}>Tanggal Finalisasi:</Text>
            <Text style={infoValue}>{finalizedAt}</Text>
          </Section>

          <Section style={highlightBox}>
            <Text style={highlightText}>
              ℹ️ Dokumen NPD ini sekarang terkunci dan tidak dapat diubah. 
              Anda dapat melanjutkan ke proses pencairan dana (SP2D).
            </Text>
          </Section>

          <Section style={buttonContainer}>
            <Button style={button} href={viewUrl}>
              Lihat NPD Final
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
  background: '#dbeafe',
  border: '2px solid #93c5fd',
  borderRadius: '8px',
  padding: '16px',
  margin: '24px 48px',
}

const highlightText = {
  fontSize: '14px',
  color: '#1e40af',
  lineHeight: '20px',
  margin: '0',
}

const buttonContainer = {
  padding: '27px 48px',
}

const button = {
  backgroundColor: '#10b981',
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

export default NPDFinalizedEmail

