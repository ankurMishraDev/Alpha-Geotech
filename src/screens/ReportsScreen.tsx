import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, SegmentedButtons, Checkbox, Button, ActivityIndicator } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import { useAppStore } from '../store/useAppStore';
import { supabase } from '../services/supabase';
import { fetchReportData, exportToExcel, exportToPDF, ReportParams } from '../utils/reportGenerator';

const COLUMNS = ['Date', 'Project', 'Product', 'Quantity', 'Price', 'Charges', 'Final Total', 'Amount Paid', 'Balance', 'Remarks'];

export default function ReportsScreen() {
  const [reportType, setReportType] = useState('ClientSupplier');
  const [operand, setOperand] = useState<'Client' | 'Supplier'>('Client');
  const [partyId, setPartyId] = useState('All');
  const [month, setMonth] = useState('All Time');
  const [paymentMode, setPaymentMode] = useState<'Separate column' | 'Comment' | 'None'>('None');
  const [selectedCols, setSelectedCols] = useState<string[]>(COLUMNS);
  const [loading, setLoading] = useState(false);

  const { clients, suppliers, setClients, setSuppliers } = useAppStore();

  useEffect(() => {
    // Ensure clients/suppliers are loaded if not
    const loadParties = async () => {
      if (clients.length === 0) {
        const { data } = await supabase.from('clients').select('*');
        if (data) setClients(data);
      }
      if (suppliers.length === 0) {
        const { data } = await supabase.from('suppliers').select('*');
        if (data) setSuppliers(data);
      }
    };
    loadParties();
  }, []);

  const toggleCol = (col: string) => {
    setSelectedCols(prev => 
      prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]
    );
  };

  const handleExport = async (format: 'PDF' | 'Excel') => {
    setLoading(true);
    try {
      const params: ReportParams = {
        operand,
        partyId,
        month,
        paymentDetailsMode: paymentMode,
        selectedColumns: COLUMNS.filter(c => selectedCols.includes(c)), // maintain order
      };
      
      const data = await fetchReportData(params);
      
      if (data.length === 0) {
        Alert.alert('No data found for these filters.');
        setLoading(false);
        return;
      }

      if (format === 'PDF') {
        await exportToPDF(params, data);
      } else {
        await exportToExcel(params, data);
      }
    } catch (e: any) {
      Alert.alert('Error generating report', e.message);
    }
    setLoading(false);
  };

  const parties = operand === 'Client' ? clients : suppliers;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <SegmentedButtons
        value={reportType}
        onValueChange={setReportType}
        buttons={[
          { value: 'ClientSupplier', label: 'Client / Supplier' },
          { value: 'Revenue', label: 'Revenue Report' },
        ]}
        style={styles.mainSegment}
      />

      {reportType === 'Revenue' ? (
        <View style={styles.placeholderContainer}>
          <Text variant="titleMedium">Revenue Report</Text>
          <Text style={{ marginTop: 10 }}>Coming soon.</Text>
        </View>
      ) : (
        <View style={styles.formContainer}>
          <SegmentedButtons
            value={operand}
            onValueChange={(val) => { setOperand(val as 'Client' | 'Supplier'); setPartyId('All'); }}
            buttons={[
              { value: 'Client', label: 'Client' },
              { value: 'Supplier', label: 'Supplier' },
            ]}
            style={styles.field}
          />

          <Text variant="labelLarge" style={styles.label}>Select Party</Text>
          <View style={styles.pickerContainer}>
            <Picker selectedValue={partyId} onValueChange={setPartyId}>
              <Picker.Item label="All" value="All" />
              {parties.map(p => (
                <Picker.Item key={p.id} label={p.name} value={p.id} />
              ))}
            </Picker>
          </View>

          <Text variant="labelLarge" style={styles.label}>Month</Text>
          <View style={styles.pickerContainer}>
            <Picker selectedValue={month} onValueChange={setMonth}>
              <Picker.Item label="All Time" value="All Time" />
              {/* Simplistic month options for demo, normally would generate dynamically */}
              <Picker.Item label="Jan 2026" value="2026-01" />
              <Picker.Item label="Feb 2026" value="2026-02" />
              <Picker.Item label="Mar 2026" value="2026-03" />
              <Picker.Item label="Apr 2026" value="2026-04" />
              <Picker.Item label="May 2026" value="2026-05" />
            </Picker>
          </View>

          <Text variant="labelLarge" style={styles.label}>Payment Details Mode</Text>
          <View style={styles.pickerContainer}>
            <Picker selectedValue={paymentMode} onValueChange={(val) => setPaymentMode(val as any)}>
              <Picker.Item label="None" value="None" />
              <Picker.Item label="Separate column" value="Separate column" />
              <Picker.Item label="Comment (Excel only)" value="Comment" />
            </Picker>
          </View>

          <Text variant="labelLarge" style={[styles.label, { marginTop: 10 }]}>Columns to include</Text>
          <View style={styles.columnsContainer}>
            {COLUMNS.map(col => (
              <Checkbox.Item
                key={col}
                label={col}
                status={selectedCols.includes(col) ? 'checked' : 'unchecked'}
                onPress={() => toggleCol(col)}
                style={styles.checkboxItem}
              />
            ))}
          </View>

          <View style={styles.actions}>
            {loading ? (
              <ActivityIndicator size="large" />
            ) : (
              <>
                <Button mode="contained" onPress={() => handleExport('PDF')} style={styles.btn}>Export PDF</Button>
                <Button mode="contained" onPress={() => handleExport('Excel')} style={styles.btn}>Export Excel</Button>
              </>
            )}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
  },
  mainSegment: {
    marginBottom: 20,
  },
  placeholderContainer: {
    alignItems: 'center',
    marginTop: 50,
  },
  formContainer: {
    flex: 1,
  },
  field: {
    marginBottom: 15,
  },
  label: {
    marginBottom: 5,
    fontWeight: 'bold',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 15,
  },
  columnsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  checkboxItem: {
    width: '50%',
    paddingVertical: 2,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  btn: {
    flex: 1,
    marginHorizontal: 10,
  }
});
