import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';

export default function AdminDashboard() {
  const router = useRouter();
  const colors = useColors();
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <Text style={[styles.title, { color: colors.text }]}>Admin Dashboard</Text>
      <Button title="Event Ingestion" onPress={() => router.push('/admin/dashboard/event-ingest')} />
      {/* Add more admin tools here */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 18 },
});
