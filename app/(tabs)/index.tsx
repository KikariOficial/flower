import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, StatusBar, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router'; // useFocusEffect detecta quando voltamos para a tela!
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HomeScreen() {
  const router = useRouter();

  const [agua, setAgua] = useState(0); 
  const [estagioPlanta, setEstagioPlanta] = useState(0); 
  const MAX_AGUA = 10;

  // 1. CARREGAR OS DADOS (Sempre que a tela aparecer)
  useFocusEffect(
    useCallback(() => {
      const carregarJardim = async () => {
        try {
          const aguaSalva = await AsyncStorage.getItem('aguaSalva');
          if (aguaSalva !== null) setAgua(parseInt(aguaSalva));

          const estagioSalvo = await AsyncStorage.getItem('estagioPlantaSalvo');
          if (estagioSalvo !== null) setEstagioPlanta(parseInt(estagioSalvo));
        } catch (e) {
          console.log('Erro ao carregar os dados do jardim');
        }
      };

      carregarJardim();
    }, [])
  );

  const irParaMetas = () => {
    router.push('/metas'); 
  };

  // 2. REGAR A PLANTA (E salvar o novo progresso)
  const regarPlanta = async () => {
    if (agua > 0 && estagioPlanta < 3) {
      const novaAgua = agua - 1;
      const novoEstagio = estagioPlanta + 1;
      
      setAgua(novaAgua); 
      setEstagioPlanta(novoEstagio); 

      // Salva imediatamente para não perder!
      await AsyncStorage.setItem('aguaSalva', novaAgua.toString());
      await AsyncStorage.setItem('estagioPlantaSalvo', novoEstagio.toString());

    } else if (agua === 0) {
      Alert.alert('Falta Água', 'Você precisa cumprir metas no ≡ para ter água!');
    } else {
      Alert.alert('Jardim Completo', 'Sua flor já desabrochou ao máximo!');
    }
  };

  let emojiPlanta = '🪴';
  let textoStatus = 'Vaso pronto para a semente!';

  if (estagioPlanta === 1) {
    emojiPlanta = '🟤';
    textoStatus = 'Semente plantada. Regue mais!';
  } else if (estagioPlanta === 2) {
    emojiPlanta = '🌱';
    textoStatus = 'Um lindo broto! Continue regando.';
  } else if (estagioPlanta === 3) {
    emojiPlanta = '🌻';
    textoStatus = 'Seu jardim floresceu! Parabéns!';
  }

  const porcentagemAgua = (agua / MAX_AGUA) * 100;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF9E6" />

      {/* TOPO */}
      <View style={styles.topBar}>
        <TouchableOpacity>
          <Text style={styles.iconText}>≡</Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={irParaMetas}>
          <Text style={styles.iconText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* CENTRO */}
      <View style={styles.centerArea}>
        <Text style={styles.sunIcon}>☀️</Text>
        <Text style={styles.plantIcon}>{emojiPlanta}</Text>
        <Text style={styles.statusText}>{textoStatus}</Text>
      </View>

      {/* BASE */}
      <View style={styles.bottomArea}>
        <TouchableOpacity onPress={regarPlanta}>
          <Text style={styles.wateringCanIcon}>🚿</Text>
        </TouchableOpacity>
        
        <Text style={styles.waterLabel}>WATER</Text>
        
        <View style={styles.progressBarBackground}>
          <View style={[styles.progressBarFill, { width: `${porcentagemAgua}%` }]} />
        </View>
      </View>

    </View>
  );
}

// O Estilo (StyleSheet) continua idêntico!
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF9E6', paddingTop: 60, paddingHorizontal: 24, paddingBottom: 40, justifyContent: 'space-between' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between' },
  iconText: { fontSize: 40, color: '#8CB369', fontWeight: 'bold' },
  centerArea: { alignItems: 'center', justifyContent: 'center' },
  sunIcon: { fontSize: 80, position: 'absolute', top: -60, left: -20, opacity: 0.8 },
  plantIcon: { fontSize: 120 },
  statusText: { fontSize: 18, color: '#5A5A5A', marginTop: 16, textAlign: 'center' },
  bottomArea: { alignItems: 'center' },
  wateringCanIcon: { fontSize: 70, marginBottom: 8 },
  waterLabel: { color: '#4A8DB7', fontWeight: 'bold', letterSpacing: 2, marginBottom: 8 },
  progressBarBackground: { width: '100%', height: 20, backgroundColor: '#E0E0E0', borderRadius: 10, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#4A8DB7' },
});