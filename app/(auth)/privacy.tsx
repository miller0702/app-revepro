import { useRouter } from 'expo-router';
import { LegalDocumentScreen } from '../../src/components/legal/LegalDocumentScreen';

export default function PrivacyScreen() {
  const router = useRouter();

  return (
    <LegalDocumentScreen
      type="PRIVACY"
      title="Política de privacidad"
      subtitle="Cómo tratamos tus datos en RESVEPRO"
      onBack={() => router.back()}
    />
  );
}
