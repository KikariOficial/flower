import { Stack } from 'expo-router';
import { Platform } from 'react-native';

export default function RootLayout() {
  return (
    <Stack 
      screenOptions={{ 
        headerShown: false,
        animation: Platform.OS === 'ios' ? 'default' : 'fade_from_bottom',
        animationDuration: 400,
        contentStyle: { backgroundColor: '#FFF9E6' } // Mantém a cor base do app durante a transição
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen 
        name="metas" 
        options={{ 
          animation: 'slide_from_right',
          presentation: 'card'
        }} 
      />
      <Stack.Screen 
        name="config" 
        options={{ 
          animation: 'slide_from_left',
          presentation: 'card'
        }} 
      />
    </Stack>
  );
}