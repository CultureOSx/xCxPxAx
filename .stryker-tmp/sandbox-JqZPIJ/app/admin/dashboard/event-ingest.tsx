// @ts-nocheck
import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { api } from '@/lib/api';

// Replace dummy API call with real backend call
async function triggerIngest(url: string) {
  return api.ingest.trigger(url);
}

export default function EventIngestDashboard() {
  const colors = useColors();
  const [url, setUrl] = useState('');
  const [urls, setUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<{ url: string; status: string }[]>([]);

  const handleAddUrl = () => {
    if (url && !urls.includes(url)) {
      setUrls([url, ...urls]);
      setUrl('');
    }
  };

  const handleRun = async (targetUrl: string) => {
    setLoading(true);
    try {
      await triggerIngest(targetUrl);
      setHistory([{ url: targetUrl, status: 'Success' }, ...history]);
    } catch (_e) {
      setHistory([{ url: targetUrl, status: 'Failed' }, ...history]);
      Alert.alert('Ingest failed', String(_e));
    } finally {
      setLoading(false);
    }
  };

  const handleRunAll = async () => {
    setLoading(true);
    for (const u of urls) {
      try {
        await triggerIngest(u);
        setHistory(h => [{ url: u, status: 'Success' }, ...h]);
      } catch {
        setHistory(h => [{ url: u, status: 'Failed' }, ...h]);
      }
    }
    setLoading(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <Text style={[styles.title, { color: colors.text }]}>Event Ingestion Dashboard</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={[styles.input, { color: colors.text, borderColor: colors.border }]}
          placeholder="Paste event URL..."
          placeholderTextColor={colors.textSecondary}
          value={url}
          onChangeText={setUrl}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Button title="Add" onPress={handleAddUrl} disabled={!url} />
      </View>
      <Button title="Run All" onPress={handleRunAll} disabled={loading || urls.length === 0} />
      <FlatList
        data={urls}
        keyExtractor={item => item}
        renderItem={({ item }) => (
          <View style={styles.urlRow}>
            <Text style={{ flex: 1, color: colors.text }}>{item}</Text>
            <TouchableOpacity onPress={() => handleRun(item)} disabled={loading}>
              <Text style={{ color: colors.primary, marginRight: 12 }}>Run</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={{ color: colors.textSecondary, marginTop: 20 }}>No URLs added yet.</Text>}
        style={{ marginTop: 20 }}
      />
      {loading && <ActivityIndicator style={{ marginTop: 20 }} color={colors.primary} />}
      <Text style={[styles.historyTitle, { color: colors.text, marginTop: 30 }]}>Ingestion History</Text>
      <FlatList
        data={history}
        keyExtractor={item => item.url + item.status + Math.random()}
        renderItem={({ item }) => (
          <View style={styles.historyRow}>
            <Text style={{ flex: 1, color: colors.text }}>{item.url}</Text>
            <Text style={{ color: item.status === 'Success' ? colors.success : colors.error }}>{item.status}</Text>
          </View>
        )}
        style={{ marginTop: 10 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 18 },
  inputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  input: { flex: 1, borderWidth: 1, borderRadius: 8, padding: 10, marginRight: 10 },
  urlRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderColor: '#eee' },
  historyTitle: { fontSize: 18, fontWeight: 'bold' },
  historyRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
});
