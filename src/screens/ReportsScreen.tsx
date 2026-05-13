import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

export default function ReportsScreen() {
  return (
    <View style={styles.container}>
      <Text variant="titleLarge">Reports</Text>
      <Text style={{ marginTop: 20 }}>Reports section coming soon.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
