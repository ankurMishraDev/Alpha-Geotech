import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, ScrollView } from 'react-native';
import { Text, FAB, Card, Modal, Portal, TextInput, Button, ActivityIndicator } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import { supabase } from '../services/supabase';
import { Project, Client } from '../types/database';
import DatePicker from '../components/DatePicker';
import { useNavigation } from '@react-navigation/native';

export default function ProjectsScreen() {
  const navigation = useNavigation<any>();
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);
  
  // Form state
  const [date, setDate] = useState(new Date());
  const [clientId, setClientId] = useState('');
  const [name, setName] = useState('');
  const [projectIdentifier, setProjectIdentifier] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [projectsRes, clientsRes] = await Promise.all([
      supabase.from('projects').select('*, client:clients(*)').order('created_at', { ascending: false }),
      supabase.from('clients').select('*').order('name', { ascending: true })
    ]);
      
    if (projectsRes.error) console.error('Error fetching projects:', projectsRes.error);
    else setProjects(projectsRes.data || []);

    if (clientsRes.error) console.error('Error fetching clients:', clientsRes.error);
    else {
      setClients(clientsRes.data || []);
      if (clientsRes.data && clientsRes.data.length > 0) {
        setClientId(clientsRes.data[0].id);
      }
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!name.trim() || !clientId) {
      alert('Project Name and Client are required');
      return;
    }
    
    setSaving(true);
    const { error } = await supabase
      .from('projects')
      .insert([
        { 
          date: date.toISOString().split('T')[0],
          client_id: clientId,
          name, 
          project_identifier: projectIdentifier || null, 
          description: description || null, 
          notes: notes || null 
        }
      ]);
      
    setSaving(false);
    
    if (error) {
      console.error('Error saving project:', error);
      alert('Error saving project');
    } else {
      hideModal();
      fetchData();
    }
  };

  const showModal = () => setVisible(true);
  const hideModal = () => {
    setVisible(false);
    setName('');
    setProjectIdentifier('');
    setDescription('');
    setNotes('');
    setDate(new Date());
    if (clients.length > 0) setClientId(clients[0].id);
  };

  const renderItem = ({ item }: { item: Project }) => (
    <Card 
      style={styles.card}
      onPress={() => navigation.navigate('ProjectDetails', { projectId: item.id, project: item })}
    >
      <Card.Title 
        title={item.name} 
        subtitle={`Client: ${item.client?.name || 'Unknown'} | Date: ${item.date}`} 
      />
      <Card.Content>
        {item.project_identifier && <Text variant="bodyMedium">ID: {item.project_identifier}</Text>}
        {item.description && <Text variant="bodyMedium" numberOfLines={2}>{item.description}</Text>}
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" />
      ) : (
        <FlatList
          data={projects}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={<Text style={styles.emptyText}>No projects added yet.</Text>}
        />
      )}

      <Portal>
        <Modal visible={visible} onDismiss={hideModal} contentContainerStyle={styles.modalStyle}>
          <Text variant="titleLarge" style={styles.modalTitle}>Create New Project</Text>
          <ScrollView>
            <DatePicker label="Date *" value={date} onChange={setDate} />
            
            <View style={styles.pickerContainer}>
              <Text variant="bodySmall" style={styles.pickerLabel}>Client *</Text>
              <Picker
                selectedValue={clientId}
                onValueChange={(itemValue) => setClientId(itemValue)}
                style={styles.picker}
              >
                {clients.map(c => (
                  <Picker.Item key={c.id} label={c.name} value={c.id} />
                ))}
              </Picker>
            </View>

            <TextInput
              label="Project Name *"
              value={name}
              onChangeText={setName}
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Project ID (Optional)"
              value={projectIdentifier}
              onChangeText={setProjectIdentifier}
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Project Description (Optional)"
              value={description}
              onChangeText={setDescription}
              mode="outlined"
              multiline
              numberOfLines={2}
              style={styles.input}
            />
            <TextInput
              label="Notes"
              value={notes}
              onChangeText={setNotes}
              mode="outlined"
              multiline
              numberOfLines={2}
              style={styles.input}
            />
          </ScrollView>
          <View style={styles.modalActions}>
            <Button onPress={hideModal} style={styles.actionButton}>Cancel</Button>
            <Button mode="contained" onPress={handleSave} loading={saving} style={styles.actionButton}>
              Confirm
            </Button>
          </View>
        </Modal>
      </Portal>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={showModal}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContainer: { padding: 16, paddingBottom: 80 },
  card: { marginBottom: 12, backgroundColor: 'white' },
  emptyText: { textAlign: 'center', marginTop: 40, color: '#666' },
  fab: { position: 'absolute', margin: 16, right: 0, bottom: 0 },
  modalStyle: { backgroundColor: 'white', padding: 20, margin: 20, borderRadius: 8, maxHeight: '80%' },
  modalTitle: { marginBottom: 16, fontWeight: 'bold' },
  input: { marginBottom: 12 },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#79747E',
    borderRadius: 4,
    marginBottom: 12,
    paddingTop: 8,
    backgroundColor: '#fff',
  },
  pickerLabel: {
    position: 'absolute',
    top: -10,
    left: 10,
    backgroundColor: '#fff',
    paddingHorizontal: 4,
    color: '#79747E',
    zIndex: 1,
  },
  picker: {
    height: 50,
    width: '100%',
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 },
  actionButton: { marginLeft: 8 },
});
