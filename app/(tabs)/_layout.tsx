import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs 
      screenOptions={{ 
        headerShown: false, // Esconde o cabeçalho desta aba
        tabBarStyle: { display: 'none' } // A MÁGICA: Esconde a barra preta de baixo!
      }}
    >
      <Tabs.Screen name="index" />
    </Tabs>
  );
}