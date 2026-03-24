import React, { useState, useCallback, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, StatusBar, Alert, Animated } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';

export default function HomeScreen() {
  const router = useRouter();

  const [aguaEstoque, setAguaEstoque] = useState(0); 
  const [aguaNaPlanta, setAguaNaPlanta] = useState(0); 
  const [metaMaxima, setMetaMaxima] = useState(10); 

  const larguraBarraAnimada = useRef(new Animated.Value(0)).current;
  
  // 2. NOVA MEMÓRIA: Controla o "vídeo" da planta indo de 0.0 a 1.0
  const progressoLottieAnimado = useRef(new Animated.Value(0)).current;
  const lottieRef = useRef<LottieView>(null);

  const porcentagemCrescimento = (aguaNaPlanta / metaMaxima) * 100;

  // 3. O CORAÇÃO DA ANIMAÇÃO: Roda sozinho toda vez que a água muda!
  useEffect(() => {
    // Anima a barra azul do regador
    const porcentagemRegador = (aguaEstoque / metaMaxima) * 100;
    Animated.spring(larguraBarraAnimada, {
      toValue: porcentagemRegador > 100 ? 100 : porcentagemRegador,
      useNativeDriver: false, 
      bounciness: 12, 
    }).start();

    // Anima a PLANTA suavemente (Calcula um valor entre 0 e 1)
    const progressoDecimal = aguaNaPlanta / metaMaxima;
    
    // Setup listener para atualizar o Lottie diretamente
    const listenerId = progressoLottieAnimado.addListener(({ value }) => {
      if (lottieRef.current) {
        // Calcula a frame baseado no progresso (0-1)
        // Lottie JSON tem 100 frames (ip:0, op:100)
        const frameAtual = Math.round(value * 100);
        lottieRef.current.play(frameAtual, frameAtual);
      }
    });
    
    Animated.timing(progressoLottieAnimado, {
      toValue: progressoDecimal,
      duration: 1500, // Leva 1.5 segundos para crescer a cada clique
      useNativeDriver: false,
    }).start();
    
    // Cleanup do listener
    return () => {
      progressoLottieAnimado.removeListener(listenerId);
    };

  }, [aguaEstoque, aguaNaPlanta, metaMaxima]);

  useFocusEffect(
    useCallback(() => {
      const carregarJardim = async () => {
        try {
          const estoque = await AsyncStorage.getItem('aguaEstoque');
          if (estoque) setAguaEstoque(parseInt(estoque));

          const naPlanta = await AsyncStorage.getItem('aguaNaPlanta');
          if (naPlanta) setAguaNaPlanta(parseInt(naPlanta));

          const max = await AsyncStorage.getItem('metaMaxima');
          if (max) setMetaMaxima(parseInt(max));
        } catch (e) { console.log('Erro ao carregar'); }
      };
      carregarJardim();
    }, [])
  );

  const irParaMetas = () => router.push('/metas'); 

  const regarPlanta = async () => {
    if (aguaEstoque > 0 && aguaNaPlanta < metaMaxima) {
      const novoEstoque = aguaEstoque - 1;
      const novaAguaNaPlanta = aguaNaPlanta + 1;
      
      setAguaEstoque(novoEstoque); 
      setAguaNaPlanta(novaAguaNaPlanta); 

      await AsyncStorage.setItem('aguaEstoque', novoEstoque.toString());
      await AsyncStorage.setItem('aguaNaPlanta', novaAguaNaPlanta.toString());
    } else if (aguaEstoque === 0) {
      Alert.alert('Falta Água', 'Cumpra suas metas para ganhar mais água!');
    } else {
      Alert.alert('Jardim Completo', 'Sua planta já chegou ao máximo!');
    }
  };

  return (
    <LinearGradient colors={['#E9F5E9', '#FFF9E6', '#FFE4B5']} style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />

      <View style={styles.topBar}>
        <TouchableOpacity style={styles.botaoCirculo}>
          <Text style={styles.iconText}>≡</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.botaoCirculo} onPress={irParaMetas}>
          <Text style={styles.iconText}>+</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.centerArea}>
        
        {/* O Ecossistema */}
        {porcentagemCrescimento >= 25 && <Text style={styles.sunIcon}>☀️</Text>}
        {porcentagemCrescimento >= 50 && <Text style={styles.lagartaIcon}>🐛</Text>}
        {porcentagemCrescimento >= 75 && <Text style={styles.passaroIcon}>🐦</Text>}
        {porcentagemCrescimento >= 100 && <Text style={styles.borboletaIcon}>🦋</Text>}
        
        {/* Usamos o LottieView com progresso controlado! */}
        <LottieView
          ref={lottieRef}
          source={require('../../assets/planta.json')} 
          style={styles.lottiePlant}
          progress={0}
          loop={false}
          autoPlay={false}
        />
        
        <View style={styles.cardStatus}>
          <Text style={styles.statusText}>Progresso: {Math.round(porcentagemCrescimento)}%</Text>
        </View>
      </View>

      <View style={styles.bottomArea}>
        <TouchableOpacity style={styles.botaoRegador} onPress={regarPlanta}>
          <Text style={styles.wateringCanIcon}>🚿</Text>
        </TouchableOpacity>
        
        <Text style={styles.waterLabel}>ÁGUA NO REGADOR: {aguaEstoque}</Text>
        
        <View style={styles.progressBarBackground}>
          <Animated.View style={[
            styles.progressBarFill, 
            { width: larguraBarraAnimada.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }) }
          ]} />
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, paddingHorizontal: 24, paddingBottom: 40, justifyContent: 'space-between' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between' },
  botaoCirculo: { backgroundColor: '#FFFFFF', width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  iconText: { fontSize: 24, color: '#8CB369', fontWeight: 'bold' },
  centerArea: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  sunIcon: { fontSize: 80, position: 'absolute', top: 10, left: 0, opacity: 0.8 },
  passaroIcon: { fontSize: 40, position: 'absolute', top: 50, right: 20 },
  lagartaIcon: { fontSize: 30, position: 'absolute', bottom: 120, left: 40 },
  borboletaIcon: { fontSize: 50, position: 'absolute', top: 100, left: 50 },
  lottiePlant: { width: 280, height: 280, marginBottom: 20 },
  cardStatus: { backgroundColor: 'rgba(255, 255, 255, 0.7)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, marginTop: -20 },
  statusText: { fontSize: 16, color: '#5A5A5A', textAlign: 'center', fontWeight: 'bold' },
  bottomArea: { alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.5)', padding: 20, borderRadius: 30 },
  botaoRegador: { marginBottom: 15 },
  wateringCanIcon: { fontSize: 75 },
  waterLabel: { color: '#4A8DB7', fontWeight: 'bold', letterSpacing: 1, marginBottom: 10 },
  progressBarBackground: { width: '100%', height: 24, backgroundColor: '#E0E0E0', borderRadius: 12, overflow: 'hidden', borderWidth: 2, borderColor: '#FFFFFF' },
  progressBarFill: { height: '100%', backgroundColor: '#4A8DB7', borderRadius: 10 },
});