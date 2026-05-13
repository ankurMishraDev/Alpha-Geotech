import React, { useState } from 'react';
import { View, Platform, TouchableOpacity, StyleSheet } from 'react-native';
import { TextInput, Text } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';

interface DatePickerProps {
  label: string;
  value: Date;
  onChange: (date: Date) => void;
}

export default function DatePicker({ label, value, onChange }: DatePickerProps) {
  const [show, setShow] = useState(false);

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShow(Platform.OS === 'ios');
    if (selectedDate) {
      onChange(selectedDate);
    }
  };

  const formattedDate = value.toISOString().split('T')[0];

  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <TextInput
          label={label}
          value={formattedDate}
          mode="outlined"
          render={(props) => (
            <input
              type="date"
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                outline: 'none',
                padding: '0 14px',
                fontSize: 16,
                backgroundColor: 'transparent',
                boxSizing: 'border-box',
                fontFamily: 'System',
              }}
              value={formattedDate}
              onChange={(e) => onChange(new Date(e.target.value))}
            />
          )}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => setShow(true)}>
        <TextInput
          label={label}
          value={formattedDate}
          mode="outlined"
          editable={false}
          right={<TextInput.Icon icon="calendar" />}
        />
      </TouchableOpacity>
      {show && (
        <DateTimePicker
          value={value}
          mode="date"
          display="default"
          onChange={onDateChange}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  }
});
