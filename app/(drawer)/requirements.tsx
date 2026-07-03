import { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import axios from 'axios';
import { DrawerScreenLayout } from '../../src/components/layout/DrawerScreenLayout';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { platformApi } from '../../src/api/platform';
import { spacing } from '../../src/theme/tokens';

function getApiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (Array.isArray(message)) return String(message[0]);
    if (typeof message === 'string') return message;
  }
  return fallback;
}

export default function RequirementsScreen() {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) {
      Alert.alert('Completa el formulario', 'Indica un asunto y describe tu requerimiento.');
      return;
    }

    setLoading(true);
    try {
      await platformApi.createRequirement({
        subject: subject.trim(),
        message: message.trim(),
      });
      Alert.alert('Enviado', 'Recibimos tu mensaje. El equipo editorial lo revisará pronto.');
      setSubject('');
      setMessage('');
    } catch (error) {
      Alert.alert('Error', getApiErrorMessage(error, 'No se pudo enviar el requerimiento'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <DrawerScreenLayout
      title="Enviar requerimiento"
      subtitle="Solicitudes, sugerencias o reportes para el equipo RESVEPRO"
    >
      <View style={styles.form}>
        <Input
          label="Asunto"
          placeholder="Ej. Sugerencia de contenido"
          value={subject}
          onChangeText={setSubject}
        />
        <Input
          label="Mensaje"
          placeholder="Describe tu solicitud con detalle..."
          value={message}
          onChangeText={setMessage}
          multiline
          numberOfLines={6}
          style={styles.messageInput}
        />
        <Button title="Enviar" onPress={handleSubmit} loading={loading} />
      </View>
    </DrawerScreenLayout>
  );
}

const styles = StyleSheet.create({
  form: { },
  messageInput: { minHeight: 120, textAlignVertical: 'top' },
});
