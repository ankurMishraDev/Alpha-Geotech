import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, SegmentedButtons, ActivityIndicator, FAB, Modal, Portal, TextInput, Button } from 'react-native-paper';
import { supabase } from '../services/supabase';
import { Project, ClientProduct, SupplierProduct, Supplier } from '../types/database';
import DatePicker from '../components/DatePicker';
import { Picker } from '@react-native-picker/picker';

import ProductLedgerCard from '../components/ProductLedgerCard';

export default function ProjectDetailsScreen({ route }: any) {
  const { projectId, project } = route.params as { projectId: string; project: Project };
  const [section, setSection] = useState('client');
  const [loading, setLoading] = useState(true);
  
  const [clientProducts, setClientProducts] = useState<ClientProduct[]>([]);
  const [supplierProducts, setSupplierProducts] = useState<SupplierProduct[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  // Add Product State
  const [visible, setVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [date, setDate] = useState(new Date());
  const [productName, setProductName] = useState('');
  
  // Supplier Specific State
  const [supplierId, setSupplierId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const fetchData = async () => {
    setLoading(true);
    const [cProductsRes, sProductsRes, suppliersRes] = await Promise.all([
      supabase.from('client_products').select('*').eq('project_id', projectId).order('created_at', { ascending: false }),
      supabase.from('supplier_products').select('*, supplier:suppliers(*)').eq('project_id', projectId).order('created_at', { ascending: false }),
      supabase.from('suppliers').select('*').order('name', { ascending: true })
    ]);

    if (!cProductsRes.error) setClientProducts(cProductsRes.data || []);
    if (!sProductsRes.error) setSupplierProducts(sProductsRes.data || []);
    if (!suppliersRes.error) {
      setSuppliers(suppliersRes.data || []);
      if (suppliersRes.data && suppliersRes.data.length > 0) {
        setSupplierId(suppliersRes.data[0].id);
      }
    }
    setLoading(false);
  };

  const handleSaveProduct = async () => {
    if (!productName.trim() || !quantity || !price) {
      alert('Name, Quantity, and Price are required');
      return;
    }

    if (section === 'supplier' && !supplierId) {
      alert('Please select a supplier');
      return;
    }

    setSaving(true);
    let error;

    if (section === 'client') {
      const res = await supabase.from('client_products').insert([{
        project_id: projectId,
        date: date.toISOString().split('T')[0],
        name: productName,
        quantity: parseFloat(quantity),
        price: parseFloat(price),
        remarks: remarks || null
      }]);
      error = res.error;
    } else {
      const res = await supabase.from('supplier_products').insert([{
        project_id: projectId,
        supplier_id: supplierId,
        date: date.toISOString().split('T')[0],
        name: productName,
        quantity: parseFloat(quantity),
        price: parseFloat(price),
        remarks: remarks || null
      }]);
      error = res.error;
    }

    setSaving(false);

    if (error) {
      console.error('Error adding product:', error);
      alert('Error adding product');
    } else {
      hideModal();
      fetchData();
    }
  };

  const showModal = () => setVisible(true);
  const hideModal = () => {
    setVisible(false);
    setDate(new Date());
    setProductName('');
    setQuantity('');
    setPrice('');
    setRemarks('');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="titleMedium" style={styles.projectTitle}>{project.name}</Text>
        <SegmentedButtons
          value={section}
          onValueChange={setSection}
          buttons={[
            { value: 'client', label: 'Client Ledger' },
            { value: 'supplier', label: 'Supplier Ledger' },
          ]}
          style={styles.segmented}
        />
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" />
      ) : (
        <ScrollView contentContainerStyle={styles.listContainer}>
          {section === 'client' ? (
            clientProducts.length > 0 ? (
              clientProducts.map(p => <ProductLedgerCard key={p.id} product={p} type="client" onRefresh={fetchData} />)
            ) : (
              <Text style={styles.emptyText}>No client ledger entries found.</Text>
            )
          ) : (
            supplierProducts.length > 0 ? (
              supplierProducts.map(p => <ProductLedgerCard key={p.id} product={p} type="supplier" onRefresh={fetchData} />)
            ) : (
              <Text style={styles.emptyText}>No supplier ledger entries found.</Text>
            )
          )}
        </ScrollView>
      )}

      <Portal>
        <Modal visible={visible} onDismiss={hideModal} contentContainerStyle={styles.modalStyle}>
          <Text variant="titleLarge" style={styles.modalTitle}>
            Add {section === 'client' ? 'Client' : 'Supplier'} Product
          </Text>
          <ScrollView>
            <DatePicker label="Date *" value={date} onChange={setDate} />
            
            {section === 'supplier' && (
              <View style={styles.pickerContainer}>
                <Text variant="bodySmall" style={styles.pickerLabel}>Supplier *</Text>
                <Picker
                  selectedValue={supplierId}
                  onValueChange={(itemValue) => setSupplierId(itemValue)}
                  style={styles.picker}
                >
                  {suppliers.map(s => (
                    <Picker.Item key={s.id} label={s.name} value={s.id} />
                  ))}
                </Picker>
              </View>
            )}

            {section === 'supplier' ? (
              <View style={styles.pickerContainer}>
                <Text variant="bodySmall" style={styles.pickerLabel}>Product Name *</Text>
                <Picker
                  selectedValue={productName}
                  onValueChange={(itemValue) => setProductName(itemValue)}
                  style={styles.picker}
                >
                  <Picker.Item label="Select existing product..." value="" />
                  {clientProducts.map(cp => (
                    <Picker.Item key={cp.id} label={cp.name} value={cp.name} />
                  ))}
                </Picker>
              </View>
            ) : (
              <TextInput
                label="Product Name *"
                value={productName}
                onChangeText={setProductName}
                mode="outlined"
                style={styles.input}
              />
            )}

            <TextInput
              label="Quantity *"
              value={quantity}
              onChangeText={setQuantity}
              mode="outlined"
              keyboardType="numeric"
              style={styles.input}
            />
            <TextInput
              label="Price *"
              value={price}
              onChangeText={setPrice}
              mode="outlined"
              keyboardType="numeric"
              style={styles.input}
            />
            <TextInput
              label="Remarks"
              value={remarks}
              onChangeText={setRemarks}
              mode="outlined"
              style={styles.input}
            />
          </ScrollView>
          <View style={styles.modalActions}>
            <Button onPress={hideModal} style={styles.actionButton}>Cancel</Button>
            <Button mode="contained" onPress={handleSaveProduct} loading={saving} style={styles.actionButton}>
              Add
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
  header: { padding: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#ddd' },
  projectTitle: { fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
  segmented: { marginHorizontal: 16 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContainer: { padding: 16, paddingBottom: 80 },
  cardPlaceholder: { padding: 16, backgroundColor: 'white', marginBottom: 12, borderRadius: 8 },
  emptyText: { textAlign: 'center', marginTop: 40, color: '#666' },
  fab: { position: 'absolute', margin: 16, right: 0, bottom: 0 },
  modalStyle: { backgroundColor: 'white', padding: 20, margin: 20, borderRadius: 8, maxHeight: '80%' },
  modalTitle: { marginBottom: 16, fontWeight: 'bold' },
  input: { marginBottom: 12 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 },
  actionButton: { marginLeft: 8 },
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
  }
});
