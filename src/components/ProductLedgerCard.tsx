import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
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
    if (expanded) {
      fetchLedgerDetails();
    }
  }, [expanded]);

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

    const { error } = await supabase.from(table).insert([{
      [idField]: product.id,
      date: date.toISOString().split('T')[0],
      operation,
      charge_type: finalChargeType,
      amount: parseFloat(amount),
      notes: notes || null
    }]);

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

    const { error } = await supabase.from(table).insert([{
      [idField]: product.id,
      date: date.toISOString().split('T')[0],
      payment_mode: paymentMode,
      amount: parseFloat(amount),
      notes: notes || null
    }]);

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

  const resetForms = () => {
    setDate(new Date());
    setAmount('');
    setNotes('');
    setOperation('add');
    setChargeType('GST');
    setCustomChargeType('');
    setPaymentMode('Bank');
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
          right={(props) => <IconButton {...props} icon={expanded ? "chevron-up" : "chevron-down"} />}
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
              <Text>{c.date} - {c.charge_type}</Text>
              <Text style={{color: c.operation === 'add' ? 'green' : 'red'}}>
                {c.operation === 'add' ? '+' : '-'} ₹{c.amount}
              </Text>
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
              <Text>{p.date} - {p.payment_mode}</Text>
              <Text style={{color: 'green'}}>₹{p.amount}</Text>
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
        {/* Charge Modal */}
        <Modal visible={chargeVisible} onDismiss={() => setChargeVisible(false)} contentContainerStyle={styles.modalStyle}>
          <Text variant="titleLarge" style={styles.modalTitle}>Add Charge/Adjustment</Text>
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
        <Modal visible={paymentVisible} onDismiss={() => setPaymentVisible(false)} contentContainerStyle={styles.modalStyle}>
          <Text variant="titleLarge" style={styles.modalTitle}>Record Payment</Text>
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
