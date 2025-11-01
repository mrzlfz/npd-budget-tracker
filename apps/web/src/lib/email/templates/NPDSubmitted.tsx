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

interface NPDSubmittedEmailProps {
  npdNumber: string
  programName: string
  totalAmount: number
  submitterName: string
  verifierName: string
  verifyUrl: string
  organizationName: string
}

export function NPDSubmittedEmail({
  npdNumber,
  programName,
  totalAmount,
  submitterName,
  verifierName,
  verifyUrl,
  organizationName,
}: NPDSubmittedEmailProps) {
  const formattedAmount = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(totalAmount)

  return (
    <Html>
      <Head />
      <Preview>NPD {npdNumber} menunggu verifikasi Anda</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Nota Pencairan Dana Menunggu Verifikasi</Heading>
          
          <Text style={text}>
            Yth. {verifierName},
          </Text>
          
          <Text style={text}>
            Nota Pencairan Dana telah diajukan oleh {submitterName} dan menunggu verifikasi Anda.
          </Text>

          <Section style={infoBox}>
            <Text style={infoLabel}>Nomor NPD:</Text>
            <Text style={infoValue}>{npdNumber}</Text>
            
            <Text style={infoLabel}>Program/Kegiatan:</Text>
            <Text style={infoValue}>{programName}</Text>
            
            <Text style={infoLabel}>Total Jumlah:</Text>
            <Text style={infoValue}>{formattedAmount}</Text>
            
            <Text style={infoLabel}>Diajukan oleh:</Text>
            <Text style={infoValue}>{submitterName}</Text>
          </Section>

          <Section style={buttonContainer}>
            <Button style={button} href={verifyUrl}>
              Verifikasi NPD Sekarang
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

export default NPDSubmittedEmail

