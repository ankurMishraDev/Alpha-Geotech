import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Card, Text, Button, Modal, Portal, TextInput, Divider, IconButton } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import { supabase } from '../services/supabase';
import DatePicker from './DatePicker';

export default function ProductLedgerCard({ product, type, onRefresh }: any) {
  const [charges, setCharges] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [expanded, setExpanded] = useState(false);

  // Modal states
  const [chargeVisible, setChargeVisible] = useState(false);
  const [paymentVisible, setPaymentVisible] = useState(false);
  const [editProductVisible, setEditProductVisible] = useState(false);
  const [editChargeId, setEditChargeId] = useState<string | null>(null);
  const [editPaymentId, setEditPaymentId] = useState<string | null>(null);
  const [editProductData, setEditProductData] = useState({ date: new Date(), name: '', quantity: '', price: '', remarks: '' });
  const [saving, setSaving] = useState(false);

  // Form states
  const [date, setDate] = useState(new Date());
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  
  // Charge specific
  const [operation, setOperation] = useState('add');
  const [chargeType, setChargeType] = useState('GST');
  const [customChargeType, setCustomChargeType] = useState('');

  // Payment specific
  const [paymentMode, setPaymentMode] = useState('Bank');

  useEffect(() => {
    fetchLedgerDetails();
  }, [product.id]);

  const fetchLedgerDetails = async () => {
    const chargeTable = type === 'client' ? 'client_product_charges' : 'supplier_product_charges';
    const paymentTable = type === 'client' ? 'client_product_payments' : 'supplier_product_payments';
    const idField = type === 'client' ? 'client_product_id' : 'supplier_product_id';

    const [cRes, pRes] = await Promise.all([
      supabase.from(chargeTable).select('*').eq(idField, product.id).order('date', { ascending: true }),
      supabase.from(paymentTable).select('*').eq(idField, product.id).order('date', { ascending: true })
    ]);

    if (cRes.data) setCharges(cRes.data);
    if (pRes.data) setPayments(pRes.data);
  };

  const handleAddCharge = async () => {
    if (!amount) { alert('Amount is required'); return; }
    const finalChargeType = chargeType === 'Others' ? customChargeType : chargeType;
    if (chargeType === 'Others' && !customChargeType) { alert('Specify charge type'); return; }

    setSaving(true);
    const table = type === 'client' ? 'client_product_charges' : 'supplier_product_charges';
    const idField = type === 'client' ? 'client_product_id' : 'supplier_product_id';

    let error;
    if (editChargeId) {
      const { error: updateErr } = await supabase.from(table).update({
        date: date.toISOString().split('T')[0],
        operation,
        charge_type: finalChargeType,
        amount: parseFloat(amount),
        notes: notes || null
      }).eq('id', editChargeId);
      error = updateErr;
    } else {
      const { error: insErr } = await supabase.from(table).insert([{
        [idField]: product.id,
        date: date.toISOString().split('T')[0],
        operation,
        charge_type: finalChargeType,
        amount: parseFloat(amount),
        notes: notes || null
      }]);
      error = insErr;
    }

    setSaving(false);
    if (!error) {
      setChargeVisible(false);
      resetForms();
      fetchLedgerDetails();
      onRefresh();
    } else {
      alert('Failed to add charge');
    }
  };

  const handleAddPayment = async () => {
    if (!amount) { alert('Amount is required'); return; }

    setSaving(true);
    const table = type === 'client' ? 'client_product_payments' : 'supplier_product_payments';
    const idField = type === 'client' ? 'client_product_id' : 'supplier_product_id';

    let error;
    if (editPaymentId) {
      const { error: updateErr } = await supabase.from(table).update({
        date: date.toISOString().split('T')[0],
        payment_mode: paymentMode,
        amount: parseFloat(amount),
        notes: notes || null
      }).eq('id', editPaymentId);
      error = updateErr;
    } else {
      const { error: insErr } = await supabase.from(table).insert([{
        [idField]: product.id,
        date: date.toISOString().split('T')[0],
        payment_mode: paymentMode,
        amount: parseFloat(amount),
        notes: notes || null
      }]);
      error = insErr;
    }

    setSaving(false);
    if (!error) {
      setPaymentVisible(false);
      resetForms();
      fetchLedgerDetails();
      onRefresh();
    } else {
      alert('Failed to add payment');
    }
  };

  const handleDeleteCharge = (id: string) => {
    Alert.alert('Delete Charge', 'Are you sure you want to delete this charge?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        const table = type === 'client' ? 'client_product_charges' : 'supplier_product_charges';
        await supabase.from(table).delete().eq('id', id);
        fetchLedgerDetails();
        onRefresh();
      }}
    ]);
  };

  const handleDeletePayment = (id: string) => {
    Alert.alert('Delete Payment', 'Are you sure you want to delete this payment?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        const table = type === 'client' ? 'client_product_payments' : 'supplier_product_payments';
        await supabase.from(table).delete().eq('id', id);
        fetchLedgerDetails();
        onRefresh();
      }}
    ]);
  };

  const handleEditProduct = async () => {
    setSaving(true);
    const table = type === 'client' ? 'client_products' : 'supplier_products';
    const { error } = await supabase.from(table).update({
      date: editProductData.date.toISOString().split('T')[0],
      name: editProductData.name,
      quantity: parseFloat(editProductData.quantity),
      price: parseFloat(editProductData.price),
      remarks: editProductData.remarks
    }).eq('id', product.id);
    
    setSaving(false);
    if (!error) {
      setEditProductVisible(false);
      onRefresh(); // this will refresh the parent
    } else {
      Alert.alert('Error', 'Failed to update product');
    }
  };

  const resetForms = () => {
    setDate(new Date());
    setAmount('');
    setNotes('');
    setOperation('add');
    setChargeType('GST');
    setCustomChargeType('');
    setPaymentMode('Bank');
    setEditChargeId(null);
    setEditPaymentId(null);
  };

  const baseTotal = product.quantity * product.price;
  const totalCharges = charges.reduce((acc, curr) => {
    return curr.operation === 'add' ? acc + Number(curr.amount) : acc - Number(curr.amount);
  }, 0);
  const finalTotal = baseTotal + totalCharges;
  const totalPaid = payments.reduce((acc, curr) => acc + Number(curr.amount), 0);
  const remaining = finalTotal - totalPaid;

  return (
    <Card style={styles.card}>
      <TouchableOpacity onPress={() => setExpanded(!expanded)}>
        <Card.Title 
          title={`${product.name} (Qty: ${product.quantity})`} 
          subtitle={type === 'supplier' ? `Supplier: ${product.supplier?.name || 'Unknown'}` : `Date: ${product.date}`}
          right={(props) => (
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <IconButton 
                {...props} 
                icon="pencil" 
                onPress={(e) => { 
                  e.stopPropagation(); 
                  setEditProductData({ 
                    date: product.date ? new Date(product.date) : new Date(), 
                    name: product.name, 
                    quantity: String(product.quantity), 
                    price: String(product.price), 
                    remarks: product.remarks || '' 
                  }); 
                  setEditProductVisible(true); 
                }} 
              />
              <IconButton {...props} icon={expanded ? "chevron-up" : "chevron-down"} onPress={() => setExpanded(!expanded)} />
            </View>
          )}
        />
        <Card.Content>
          <View style={styles.summaryRow}>
            <Text>Base: ₹{baseTotal.toFixed(2)}</Text>
            <Text style={{fontWeight: 'bold', color: '#1976D2'}}>Final: ₹{finalTotal.toFixed(2)}</Text>
            <Text style={{color: remaining > 0 ? 'red' : 'green'}}>Due: ₹{remaining.toFixed(2)}</Text>
          </View>
        </Card.Content>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.expandedContent}>
          <Divider style={styles.divider} />
          <View style={styles.sectionHeader}>
            <Text variant="titleMedium">Charges / Adjustments</Text>
            <Button compact mode="text" onPress={() => setChargeVisible(true)}>+ Add</Button>
          </View>
          {charges.map(c => (
            <View key={c.id} style={styles.listItem}>
              <View style={{flex: 1}}>
                <Text>{c.date} - {c.charge_type}</Text>
                <Text style={{color: c.operation === 'add' ? 'green' : 'red'}}>
                  {c.operation === 'add' ? '+' : '-'} ₹{c.amount}
                </Text>
              </View>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <IconButton icon="pencil" size={20} onPress={() => {
                  setEditChargeId(c.id);
                  setDate(new Date(c.date));
                  setOperation(c.operation);
                  
                  const predefinedTypes = ['GST', 'TDS', 'Delay', 'Expenses'];
                  if (predefinedTypes.includes(c.charge_type)) {
                    setChargeType(c.charge_type);
                    setCustomChargeType('');
                  } else {
                    setChargeType('Others');
                    setCustomChargeType(c.charge_type);
                  }
                  
                  setAmount(String(c.amount));
                  setNotes(c.notes || '');
                  setChargeVisible(true);
                }} />
                <IconButton icon="delete" size={20} iconColor="red" onPress={() => handleDeleteCharge(c.id)} />
              </View>
            </View>
          ))}
          {charges.length === 0 && <Text style={styles.emptyItem}>No charges recorded</Text>}

          <Divider style={styles.divider} />
          <View style={styles.sectionHeader}>
            <Text variant="titleMedium">Payments</Text>
            <Button compact mode="text" onPress={() => setPaymentVisible(true)}>+ Add</Button>
          </View>
          {payments.map(p => (
            <View key={p.id} style={styles.listItem}>
              <View style={{flex: 1}}>
                <Text>{p.date} - {p.payment_mode}</Text>
                <Text style={{color: 'green'}}>₹{p.amount}</Text>
              </View>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <IconButton icon="pencil" size={20} onPress={() => {
                  setEditPaymentId(p.id);
                  setDate(new Date(p.date));
                  setPaymentMode(p.payment_mode);
                  setAmount(String(p.amount));
                  setNotes(p.notes || '');
                  setPaymentVisible(true);
                }} />
                <IconButton icon="delete" size={20} iconColor="red" onPress={() => handleDeletePayment(p.id)} />
              </View>
            </View>
          ))}
          {payments.length === 0 && <Text style={styles.emptyItem}>No payments recorded</Text>}
          
          {product.remarks && (
            <View style={{marginTop: 12}}>
              <Text variant="bodySmall" style={{color: '#666'}}>Remarks: {product.remarks}</Text>
            </View>
          )}
        </View>
      )}

      <Portal>
        {/* Edit Product Modal */}
        <Modal visible={editProductVisible} onDismiss={() => setEditProductVisible(false)} contentContainerStyle={styles.modalStyle}>
          <Text variant="titleLarge" style={styles.modalTitle}>Edit Product</Text>
          <DatePicker label="Date *" value={editProductData.date} onChange={(d) => setEditProductData({...editProductData, date: d})} />
          <TextInput label="Name *" value={editProductData.name} onChangeText={(t) => setEditProductData({...editProductData, name: t})} mode="outlined" style={styles.input} />
          <TextInput label="Quantity *" value={editProductData.quantity} onChangeText={(t) => setEditProductData({...editProductData, quantity: t})} mode="outlined" keyboardType="numeric" style={styles.input} />
          <TextInput label="Price *" value={editProductData.price} onChangeText={(t) => setEditProductData({...editProductData, price: t})} mode="outlined" keyboardType="numeric" style={styles.input} />
          <TextInput label="Remarks" value={editProductData.remarks} onChangeText={(t) => setEditProductData({...editProductData, remarks: t})} mode="outlined" style={styles.input} />
          <View style={styles.modalActions}>
            <Button onPress={() => setEditProductVisible(false)}>Cancel</Button>
            <Button mode="contained" onPress={handleEditProduct} loading={saving}>Save</Button>
          </View>
        </Modal>

        {/* Charge Modal */}
        <Modal visible={chargeVisible} onDismiss={() => { setChargeVisible(false); resetForms(); }} contentContainerStyle={styles.modalStyle}>
          <Text variant="titleLarge" style={styles.modalTitle}>{editChargeId ? 'Edit Charge/Adjustment' : 'Add Charge/Adjustment'}</Text>
          <DatePicker label="Date *" value={date} onChange={setDate} />
          
          <View style={{flexDirection: 'row', gap: 8}}>
            <View style={[styles.pickerContainer, {flex: 1}]}>
              <Text variant="bodySmall" style={styles.pickerLabel}>Operation</Text>
              <Picker selectedValue={operation} onValueChange={setOperation} style={styles.picker}>
                <Picker.Item label="Add (+)" value="add" />
                <Picker.Item label="Subtract (-)" value="subtract" />
              </Picker>
            </View>
            <View style={[styles.pickerContainer, {flex: 1}]}>
              <Text variant="bodySmall" style={styles.pickerLabel}>Type</Text>
              <Picker selectedValue={chargeType} onValueChange={setChargeType} style={styles.picker}>
                <Picker.Item label="GST" value="GST" />
                <Picker.Item label="TDS" value="TDS" />
                <Picker.Item label="Delay" value="Delay" />
                <Picker.Item label="Expenses" value="Expenses" />
                <Picker.Item label="Others" value="Others" />
              </Picker>
            </View>
          </View>

          {chargeType === 'Others' && (
            <TextInput label="Specify Type" value={customChargeType} onChangeText={setCustomChargeType} mode="outlined" style={styles.input} />
          )}

          <TextInput label="Amount *" value={amount} onChangeText={setAmount} mode="outlined" keyboardType="numeric" style={styles.input} />
          <TextInput label="Notes" value={notes} onChangeText={setNotes} mode="outlined" style={styles.input} />

          <View style={styles.modalActions}>
            <Button onPress={() => setChargeVisible(false)}>Cancel</Button>
            <Button mode="contained" onPress={handleAddCharge} loading={saving}>Save</Button>
          </View>
        </Modal>

        {/* Payment Modal */}
        <Modal visible={paymentVisible} onDismiss={() => { setPaymentVisible(false); resetForms(); }} contentContainerStyle={styles.modalStyle}>
          <Text variant="titleLarge" style={styles.modalTitle}>{editPaymentId ? 'Edit Payment' : 'Record Payment'}</Text>
          <DatePicker label="Date *" value={date} onChange={setDate} />
          
          <View style={styles.pickerContainer}>
            <Text variant="bodySmall" style={styles.pickerLabel}>Payment Mode</Text>
            <Picker selectedValue={paymentMode} onValueChange={setPaymentMode} style={styles.picker}>
              <Picker.Item label="UPI" value="UPI" />
              <Picker.Item label="Bank" value="Bank" />
              <Picker.Item label="Cheque" value="Cheque" />
              <Picker.Item label="Cash" value="Cash" />
              <Picker.Item label="Other" value="Other" />
            </Picker>
          </View>

          <TextInput label="Amount *" value={amount} onChangeText={setAmount} mode="outlined" keyboardType="numeric" style={styles.input} />
          <TextInput label="Notes" value={notes} onChangeText={setNotes} mode="outlined" style={styles.input} />

          <View style={styles.modalActions}>
            <Button onPress={() => setPaymentVisible(false)}>Cancel</Button>
            <Button mode="contained" onPress={handleAddPayment} loading={saving}>Save</Button>
          </View>
        </Modal>
      </Portal>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 12, backgroundColor: 'white' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  expandedContent: { padding: 16, backgroundColor: '#fafafa', borderBottomLeftRadius: 8, borderBottomRightRadius: 8 },
  divider: { marginVertical: 8 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  listItem: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 4 },
  emptyItem: { color: '#888', fontStyle: 'italic', marginVertical: 4 },
  modalStyle: { backgroundColor: 'white', padding: 20, margin: 20, borderRadius: 8 },
  modalTitle: { marginBottom: 16, fontWeight: 'bold' },
  input: { marginBottom: 12 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16, gap: 8 },
  pickerContainer: { borderWidth: 1, borderColor: '#79747E', borderRadius: 4, marginBottom: 12, paddingTop: 8, backgroundColor: '#fff' },
  pickerLabel: { position: 'absolute', top: -10, left: 10, backgroundColor: '#fff', paddingHorizontal: 4, color: '#79747E', zIndex: 1 },
  picker: { height: 50, width: '100%', borderWidth: 0, backgroundColor: 'transparent' }
});
