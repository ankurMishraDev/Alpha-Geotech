import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Text, FAB, Card, Modal, Portal, TextInput, Button, ActivityIndicator } from 'react-native-paper';
import { supabase } from '../services/supabase';
import { Supplier } from '../types/database';
import { useAppStore } from '../store/useAppStore';

export default function SuppliersScreen({ navigation }: any) {
  const suppliers = useAppStore(state => state.suppliers);
  const setSuppliers = useAppStore(state => state.setSuppliers);
  const addSupplierStore = useAppStore(state => state.addSupplier);

  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (suppliers.length === 0) {
      fetchSuppliers();
    }
  }, []);

  const fetchSuppliers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) console.error('Error fetching suppliers:', error);
    else setSuppliers(data || []);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Supplier Name is required');
      return;
    }
    
    setSaving(true);
    const { data, error } = await supabase
      .from('suppliers')
      .insert([
        {
          name,
          contact_number: contactNumber || null,
          supplier_address: address || null,
          email: email || null
        }
      ]).select();

    setSaving(false);
    
    if (error) {
      console.error('Error saving supplier:', error);
      alert('Error saving supplier');
    } else if (data && data.length > 0) {
      addSupplierStore(data[0] as Supplier);
      hideModal();
    }
  };

  const showModal = () => setVisible(true);
  const hideModal = () => {
    setVisible(false);
    setName('');
    setContactNumber('');
    setAddress('');
    setEmail('');
  };

  const renderItem = ({ item }: { item: Supplier }) => (
    <TouchableOpacity onPress={() => navigation.navigate('SupplierDetails', { supplier: item })}>
      <Card style={styles.card}>
        <Card.Title title={item.name} subtitle={item.email || 'No email provided'} />
        <Card.Content>
          <Text variant="bodyMedium">Contact: {item.contact_number || 'N/A'}</Text>
          <Text variant="bodyMedium">Address: {item.supplier_address || 'N/A'}</Text>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" />
      ) : (
        <FlatList
          data={suppliers}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={<Text style={styles.emptyText}>No suppliers added yet.</Text>}
        />
      )}

      <Portal>
        <Modal visible={visible} onDismiss={hideModal} contentContainerStyle={styles.modalStyle}>
          <Text variant="titleLarge" style={styles.modalTitle}>Add New Supplier</Text>
          <TextInput
            label="Supplier Name *"
            value={name}
            onChangeText={setName}
            mode="outlined"
            style={styles.input}
          />
          <TextInput
            label="Contact Number"
            value={contactNumber}
            onChangeText={setContactNumber}
            mode="outlined"
            keyboardType="phone-pad"
            style={styles.input}
          />
          <TextInput
            label="Supplier Address"
            value={address}
            onChangeText={setAddress}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={styles.input}
          />
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
          />
          <View style={styles.modalActions}>
            <Button onPress={hideModal} style={styles.actionButton}>Cancel</Button>
            <Button mode="contained" onPress={handleSave} loading={saving} style={styles.actionButton}>
              Save
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
  modalStyle: { backgroundColor: 'white', padding: 20, margin: 20, borderRadius: 8 },
  modalTitle: { marginBottom: 16, fontWeight: 'bold' },
  input: { marginBottom: 12 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 },
  actionButton: { marginLeft: 8 },
});
