import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { TextInput, Button, Text, Surface } from 'react-native-paper';

export default function AuthScreen({ onLogin }: { onLogin: (password: string) => Promise<boolean> }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    const success = await onLogin(password);
    if (!success) {
      setError('Invalid password');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Surface style={styles.surface} elevation={4}>
        <View style={styles.header}>
          <Text variant="headlineLarge" style={styles.title}>Alpha GeoTech</Text>
          <Text variant="titleMedium" style={styles.subtitle}>Ledger System</Text>
        </View>

        <TextInput
          label="Password"
          value={password}
          onChangeText={text => {
            setPassword(text);
            setError('');
          }}
          secureTextEntry
          mode="outlined"
          style={styles.input}
          error={!!error}
          onSubmitEditing={handleLogin}
        />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Button 
          mode="contained" 
          onPress={handleLogin} 
          style={styles.button}
          contentStyle={styles.buttonContent}
        >
          Login
        </Button>
      </Surface>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    padding: 20,
  },
  surface: {
    padding: 24,
    borderRadius: 12,
    backgroundColor: 'white',
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontWeight: 'bold',
    color: '#1976D2',
  },
  subtitle: {
    color: '#666',
  },
  input: {
    marginBottom: 8,
  },
  errorText: {
    color: '#B00020',
    marginBottom: 16,
    fontSize: 12,
  },
  button: {
    marginTop: 16,
  },
  buttonContent: {
    paddingVertical: 8,
  },
});
