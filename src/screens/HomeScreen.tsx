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
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>Alpha GeoTech</Text>
        <Text variant="bodyLarge" style={{ color: theme.colors.secondary }}>Ledger Management System</Text>
      </View>
      <View style={styles.grid}>
        {menuItems.map((item, index) => (
          <Card 
            key={index} 
            style={styles.card} 
            onPress={() => navigation.navigate(item.route)}
            elevation={2}
          >
            <Card.Content style={styles.cardContent}>
              <Button icon={item.icon} mode="contained" style={styles.iconButton} labelStyle={{ fontSize: 24, marginHorizontal: 0 }} contentStyle={{ padding: 8 }}>{''}</Button>
              <Text variant="titleMedium" style={styles.cardTitle}>{item.title}</Text>
              <Text variant="bodySmall" style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
            </Card.Content>
          </Card>
        ))}
      </View>
      <Button mode="text" textColor={theme.colors.error} onPress={onLogout} style={styles.logoutBtn}>
        Logout
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingTop: 40,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  card: {
    width: '48%',
    marginBottom: 16,
    backgroundColor: 'white',
    borderRadius: 16,
  },
  cardContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  iconButton: {
    borderRadius: 12,
    marginBottom: 12,
  },
  cardTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#1E293B',
  },
  cardDesc: {
    textAlign: 'center',
    color: '#64748B',
  },
  logoutBtn: {
    marginTop: 20,
    marginBottom: 40,
    alignSelf: 'center',
  }
});
