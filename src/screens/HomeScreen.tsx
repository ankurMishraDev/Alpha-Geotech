import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Text, Button, useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';

export default function HomeScreen({ onLogout }: { onLogout: () => void }) {
  const navigation = useNavigation<any>();
  const theme = useTheme();

  const menuItems = [
    { title: 'Projects', icon: 'folder', route: 'Projects', description: 'Manage ongoing and past projects' },
    { title: 'Clients', icon: 'account-group', route: 'Clients', description: 'View and add client details' },
    { title: 'Suppliers', icon: 'truck', route: 'Suppliers', description: 'Manage supplier information' },
    { title: 'Reports', icon: 'chart-bar', route: 'Reports', description: 'View financial and project reports' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.grid}>
        {menuItems.map((item, index) => (
          <Card 
            key={index} 
            style={styles.card} 
            onPress={() => navigation.navigate(item.route)}
          >
            <Card.Title 
              title={item.title} 
              subtitle={item.description} 
              left={(props) => <Button icon={item.icon} mode="text" {...props} compact>{''}</Button>}
            />
          </Card>
        ))}
      </View>
      <Button mode="outlined" onPress={onLogout} style={styles.logoutBtn}>
        Logout
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    marginBottom: 16,
    backgroundColor: 'white',
  },
  logoutBtn: {
    marginTop: 20,
    marginBottom: 40,
    alignSelf: 'center',
    width: 200,
  }
});
