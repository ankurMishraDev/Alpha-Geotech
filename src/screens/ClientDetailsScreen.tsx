import React, { useState, useEffect, useLayoutEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Text, Card, ActivityIndicator, Modal, Portal, TextInput, Button, IconButton } from 'react-native-paper';
import { supabase } from '../services/supabase';
import { Client, Project } from '../types/database';
import { useAppStore } from '../store/useAppStore';

export default function ClientDetailsScreen({ route, navigation }: any) {
  const { client } = route.params;
  const updateClientStore = useAppStore(state => state.updateClient);

  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [remainingAmount, setRemainingAmount] = useState(0);

  // Edit Modal State
  const [visible, setVisible] = useState(false);
  const [name, setName] = useState(client.name);
  const [contactNumber, setContactNumber] = useState(client.contact_number || '');
  const [address, setAddress] = useState(client.company_address || '');
  const [email, setEmail] = useState(client.email || '');
  const [saving, setSaving] = useState(false);

  // Keep a local state for the client to reflect updates immediately
  const [currentClient, setCurrentClient] = useState<Client>(client);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: currentClient.name,
      headerRight: () => (
        <IconButton
          icon="pencil"
          onPress={() => setVisible(true)}
        />
      ),
    });
  }, [navigation, currentClient]);

  useEffect(() => {
    fetchClientDetails();
  }, [currentClient.id]);

  const fetchClientDetails = async () => {
    setLoading(true);
    try {
      // Fetch projects
      const { data: projectsData, error: projError } = await supabase
        .from('projects')
        .select('*')
        .eq('client_id', currentClient.id)
        .order('created_at', { ascending: false });

      if (projError) throw projError;
      const projs = projectsData || [];
      setProjects(projs);

      if (projs.length === 0) {
        setTotalProducts(0);
        setRemainingAmount(0);
        setLoading(false);
        return;
      }

      const projectIds = projs.map(p => p.id);

      // Fetch products
      const { data: productsData, error: prodError } = await supabase
        .from('client_products')
        .select('*')
        .in('project_id', projectIds);

      if (prodError) throw prodError;
      const products = productsData || [];
      setTotalProducts(products.length);

      if (products.length === 0) {
        setRemainingAmount(0);
        setLoading(false);
        return;
      }

      const productIds = products.map(p => p.id);

      // Fetch charges
      const { data: chargesData, error: chargeError } = await supabase
        .from('client_product_charges')
        .select('*')
        .in('client_product_id', productIds);

      if (chargeError) throw chargeError;
      const charges = chargesData || [];

      // Fetch payments
      const { data: paymentsData, error: payError } = await supabase
        .from('client_product_payments')
        .select('*')
        .in('client_product_id', productIds);

      if (payError) throw payError;
      const payments = paymentsData || [];

      // Calculate total remaining
      let total = 0;
      products.forEach(product => {
        let productTotal = product.quantity * product.price;

        const prodCharges = charges.filter(c => c.client_product_id === product.id);
        prodCharges.forEach(c => {
          if (c.operation === 'add') productTotal += c.amount;
          if (c.operation === 'subtract') productTotal -= c.amount;
        });

        const prodPayments = payments.filter(p => p.client_product_id === product.id);
        prodPayments.forEach(p => {
          productTotal -= p.amount;
        });

        total += productTotal;
      });

      setRemainingAmount(total);

    } catch (error) {
      console.error('Error fetching client details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Client Name is required');
      return;
    }

    setSaving(true);
    const updates = {
      name: name.trim(),
      contact_number: contactNumber.trim() || null,
      company_address: address.trim() || null,
      email: email.trim() || null,
    };

    const { error } = await supabase
      .from('clients')
      .update(updates)
      .eq('id', currentClient.id);

    setSaving(false);

    if (error) {
      Alert.alert('Error', 'Failed to update client');
      console.error(error);
    } else {
      const updatedClient = { ...currentClient, ...updates };
      setCurrentClient(updatedClient);
      updateClientStore(currentClient.id, updates);
      setVisible(false);
    }
  };

  const renderProject = ({ item }: { item: Project }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('ProjectDetails', { projectId: item.id, project: item })}
    >
      <Card style={styles.projectCard}>
        <Card.Title 
          title={item.name} 
          subtitle={item.date ? new Date(item.date).toLocaleDateString() : 'No date'} 
        />
        <Card.Content>
          {item.description ? <Text variant="bodyMedium" numberOfLines={2}>{item.description}</Text> : null}
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Card style={styles.summaryCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.summaryTitle}>Summary</Text>
          <View style={styles.summaryRow}>
            <Text variant="bodyMedium">Total Projects:</Text>
            <Text variant="bodyLarge" style={styles.bold}>{projects.length}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text variant="bodyMedium">Total Products:</Text>
            <Text variant="bodyLarge" style={styles.bold}>{totalProducts}</Text>
          </View>
          <Divider style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text variant="titleMedium">Amount Due:</Text>
            <Text variant="titleLarge" style={[styles.bold, { color: remainingAmount > 0 ? '#d32f2f' : '#2e7d32' }]}>
              ₹ {remainingAmount.toFixed(2)}
            </Text>
          </View>
        </Card.Content>
      </Card>

      <Text variant="titleLarge" style={styles.sectionTitle}>Projects</Text>

      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" />
      ) : (
        <FlatList
          data={projects}
          keyExtractor={(item) => item.id}
          renderItem={renderProject}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={<Text style={styles.emptyText}>No projects found for this client.</Text>}
        />
      )}

      <Portal>
        <Modal visible={visible} onDismiss={() => setVisible(false)} contentContainerStyle={styles.modalStyle}>
          <Text variant="titleLarge" style={styles.modalTitle}>Edit Client</Text>
          <TextInput
            label="Client Name *"
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
            label="Email"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
          />
          <TextInput
            label="Company Address"
            value={address}
            onChangeText={setAddress}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={styles.input}
          />
          <View style={styles.modalActions}>
            <Button onPress={() => setVisible(false)} disabled={saving}>Cancel</Button>
            <Button mode="contained" onPress={handleSave} loading={saving}>Save</Button>
          </View>
        </Modal>
      </Portal>
    </View>
  );
}

const Divider = ({ style }: any) => <View style={[{ height: 1, backgroundColor: '#e0e0e0' }, style]} />;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  summaryCard: {
    margin: 16,
    backgroundColor: 'white',
  },
  summaryTitle: {
    marginBottom: 12,
    fontWeight: 'bold',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  bold: {
    fontWeight: 'bold',
  },
  divider: {
    marginVertical: 12,
  },
  sectionTitle: {
    marginLeft: 16,
    marginBottom: 8,
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 16,
    paddingTop: 0,
  },
  projectCard: {
    marginBottom: 12,
    backgroundColor: 'white',
  },
  loader: {
    marginTop: 40,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    color: '#666',
  },
  modalStyle: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  modalTitle: {
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    marginBottom: 12,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
});
