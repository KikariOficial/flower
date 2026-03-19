import React, { useState, useCallback, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, StatusBar, Alert, Animated } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient'; // Nossa nova ferramenta de cores!

export default function HomeScreen() {
  const router = useRouter();

  const [agua, setAgua] = useState(0); 
  const [estagioPlanta, setEstagioPlanta] = useState(0); 
  const MAX_AGUA = 10;

  // ==========================================
  // O MOTOR DE ANIMAÇÃO
  // ==========================================
  // useRef cria uma variável que não se perde quando a tela atualiza. Ideal para animações.
  const larguraBarraAnimada = useRef(new Animated.Value(0)).current;

  // Esse 'useEffect' fica de olho: toda vez que a variável 'agua' mudar, ele roda a animação!
  useEffect(() => {
    const porcentagem = (agua / MAX_AGUA) * 100;
    
    Animated.spring(larguraBarraAnimada, {
      toValue: porcentagem,
      useNativeDriver: false, // Como vamos animar a 'width' (largura), precisa ser false
      bounciness: 12, // Dá aquele efeitinho de "mola" (quicar) ao encher
    }).start();
  }, [agua]);

  // ==========================================
  // CARREGAR E SALVAR DADOS
  // ==========================================
  useFocusEffect(
    useCallback(() => {
      const carregarJardim = async () => {
        try {
          const aguaSalva = await AsyncStorage.getItem('aguaSalva');
          if (aguaSalva !== null) setAgua(parseInt(aguaSalva));

          const estagioSalvo = await AsyncStorage.getItem('estagioPlantaSalvo');
          if (estagioSalvo !== null) setEstagioPlanta(parseInt(estagioSalvo));
        } catch (e) {
          console.log('Erro ao carregar');
        }
      };
      carregarJardim();
    }, [])
  );

  const irParaMetas = () => router.push('/metas'); 

  const regarPlanta = async () => {
    if (agua > 0 && estagioPlanta < 3) {
      const novaAgua = agua - 1;
      const novoEstagio = estagioPlanta + 1;
      
      setAgua(novaAgua); 
      setEstagioPlanta(novoEstagio); 

      await AsyncStorage.setItem('aguaSalva', novaAgua.toString());
      await AsyncStorage.setItem('estagioPlantaSalvo', novoEstagio.toString());
    } else if (agua === 0) {
      Alert.alert('Falta Água', 'Você precisa cumprir metas no + para ter água!');
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

  return (
    // Substituímos a <View> principal pelo <LinearGradient>
    <LinearGradient 
      colors={['#E9F5E9', '#FFF9E6', '#FFE4B5']} // Do verde claro pro amarelo sol
      style={styles.container}
    >
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />

      {/* TOPO */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.botaoCirculo}>
          <Text style={styles.iconText}>≡</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.botaoCirculo} onPress={irParaMetas}>
          <Text style={styles.iconText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* CENTRO */}
      <View style={styles.centerArea}>
        <Text style={styles.sunIcon}>☀️</Text>
        <Text style={styles.plantIcon}>{emojiPlanta}</Text>
        
        {/* Um "cartão" branco suave por trás do texto para dar destaque */}
        <View style={styles.cardStatus}>
          <Text style={styles.statusText}>{textoStatus}</Text>
        </View>
      </View>

      {/* BASE */}
      <View style={styles.bottomArea}>
        <TouchableOpacity style={styles.botaoRegador} onPress={regarPlanta}>
          <Text style={styles.wateringCanIcon}>🚿</Text>
        </TouchableOpacity>
        
        <Text style={styles.waterLabel}>WATER: {agua}/{MAX_AGUA}</Text>
        
        <View style={styles.progressBarBackground}>
          {/* Usamos Animated.View no lugar da View normal, e passamos a nossa largura interpolada */}
          <Animated.View style={[
            styles.progressBarFill, 
            { 
              width: larguraBarraAnimada.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%']
              }) 
            }
          ]} />
        </View>
      </View>

    </LinearGradient>
  );
}

// ==========================================
// A NOVA MAQUIAGEM (Sombras, Cartões e Arredondamentos)
// ==========================================
const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, paddingHorizontal: 24, paddingBottom: 40, justifyContent: 'space-between' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between' },
  
  // Botões do topo agora têm fundo branco e uma leve sombra
  botaoCirculo: {
    backgroundColor: '#FFFFFF',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3, // Sombra para Android
    shadowColor: '#000', // Sombra para iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  iconText: { fontSize: 24, color: '#8CB369', fontWeight: 'bold' },
  
  centerArea: { alignItems: 'center', justifyContent: 'center' },
  sunIcon: { fontSize: 80, position: 'absolute', top: -40, left: -10, opacity: 0.7 },
  plantIcon: { fontSize: 130, marginBottom: 20 },
  
  // O cartão de status
  cardStatus: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)', // Branco transparente
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  statusText: { fontSize: 16, color: '#5A5A5A', textAlign: 'center', fontWeight: 'bold' },
  
  bottomArea: { alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.5)', padding: 20, borderRadius: 30 },
  
  // Botão do regador animado ao tocar
  botaoRegador: { marginBottom: 15 },
  wateringCanIcon: { fontSize: 75 },
  
  waterLabel: { color: '#4A8DB7', fontWeight: 'bold', letterSpacing: 2, marginBottom: 10 },
  
  progressBarBackground: { 
    width: '100%', 
    height: 24, 
    backgroundColor: '#E0E0E0', 
    borderRadius: 12, 
    overflow: 'hidden',
    borderWidth: 2, // Bordinha para a água
    borderColor: '#FFFFFF'
  },
  progressBarFill: { 
    height: '100%', 
    backgroundColor: '#4A8DB7',
    borderRadius: 10, // A água agora tem a ponta arredondada por dentro
  },
});