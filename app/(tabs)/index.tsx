import React, { useState, useCallback, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, StatusBar, Alert, Animated } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { Audio } from 'expo-av'; // <-- O MOTOR DE ÁUDIO CHEGOU!

const AnimatedLottie = Animated.createAnimatedComponent(LottieView);

export default function HomeScreen() {
  const router = useRouter();

  const [aguaEstoque, setAguaEstoque] = useState(0); 
  const [aguaNaPlanta, setAguaNaPlanta] = useState(0); 
  const [metaMaxima, setMetaMaxima] = useState(10); 

  const larguraBarraAnimada = useRef(new Animated.Value(0)).current;
  const progressoLottieAnimado = useRef(new Animated.Value(0)).current;
  
  // TRAVA DE ÁUDIO: Garante que os pássaros só toquem 1x ao abrir o app
  const jaTocouPassaros = useRef(false);

  const porcentagemCrescimento = (aguaNaPlanta / metaMaxima) * 100;

  // ==========================================
  // FUNÇÕES DE ÁUDIO PROFISSIONAIS
  // ==========================================
  const tocarPassaros = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(require('../../assets/passaros.mp3'));
      await sound.playAsync();
      // Ouve quando o áudio termina e descarrega da memória para o app não ficar pesado
      sound.setOnPlaybackStatusUpdate((status) => { if (status.isLoaded && status.didJustFinish) sound.unloadAsync(); });
    } catch (e) { console.log('Erro áudio pássaros', e); }
  };

  const tocarRegar = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(require('../../assets/regar.mp3'));
      await sound.playAsync();
      
      // A TESOURA INVISÍVEL: Conta 2 segundos (2000ms) e corta o áudio!
      setTimeout(async () => {
        const status = await sound.getStatusAsync();
        // Se o áudio ainda estiver tocando, nós mandamos parar e jogamos fora
        if (status.isLoaded) {
          await sound.stopAsync();
          await sound.unloadAsync();
        }
      }, 2000); 

    } catch (e) { console.log('Erro áudio regar', e); }
  };

  const tocarLevelUp = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(require('../../assets/levelup.mp3'));
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate((status) => { if (status.isLoaded && status.didJustFinish) sound.unloadAsync(); });
    } catch (e) { console.log('Erro áudio level up', e); }
  };

  // ==========================================
  // ANIMAÇÃO DO REGADOR E CARREGAMENTO
  // ==========================================
  useEffect(() => {
    const porcentagemRegador = (aguaEstoque / metaMaxima) * 100;
    Animated.spring(larguraBarraAnimada, {
      toValue: porcentagemRegador > 100 ? 100 : porcentagemRegador,
      useNativeDriver: false, 
      bounciness: 12, 
    }).start();
  }, [aguaEstoque, metaMaxima]);

  useFocusEffect(
    useCallback(() => {
      const carregarJardim = async () => {
        try {
          const max = await AsyncStorage.getItem('metaMaxima');
          const maxNum = max ? parseInt(max) : 10;
          setMetaMaxima(maxNum);

          const estoque = await AsyncStorage.getItem('aguaEstoque');
          if (estoque) setAguaEstoque(parseInt(estoque));

          const naPlanta = await AsyncStorage.getItem('aguaNaPlanta');
          const plantaAtual = naPlanta ? parseInt(naPlanta) : 0;
          setAguaNaPlanta(plantaAtual);

          // LÓGICA DO PÁSSARO (Só na abertura e se progresso > 60%)
          const progressoAtual = (plantaAtual / maxNum) * 100;
          if (progressoAtual > 60 && !jaTocouPassaros.current) {
            jaTocouPassaros.current = true; // Tranca a porta
            tocarPassaros();
          }

          Animated.timing(progressoLottieAnimado, {
            toValue: plantaAtual / maxNum,
            duration: 1200, 
            useNativeDriver: false,
          }).start();

        } catch (e) { console.log('Erro ao carregar'); }
      };
      carregarJardim();
    }, [])
  );

  const irParaMetas = () => router.push('/metas'); 

  // ==========================================
  // O NOVO MOTOR DE REGAR COM INTELIGÊNCIA SONORA
  // ==========================================
  const regarPlanta = async () => {
    if (aguaEstoque > 0 && aguaNaPlanta < metaMaxima) {
      const novoEstoque = aguaEstoque - 1;
      const novaAguaNaPlanta = aguaNaPlanta + 1;
      
      setAguaEstoque(novoEstoque); 
      setAguaNaPlanta(novaAguaNaPlanta); 

      await AsyncStorage.setItem('aguaEstoque', novoEstoque.toString());
      await AsyncStorage.setItem('aguaNaPlanta', novaAguaNaPlanta.toString());

      // LÓGICA DOS SONS (Level Up vs Regador)
      const porcentagemAntiga = (aguaNaPlanta / metaMaxima) * 100;
      const novaPorcentagem = (novaAguaNaPlanta / metaMaxima) * 100;

      // Descobre se pulou de nível (marcos de 25%, 50%, 75%, 100%)
      const nivelAntigo = Math.floor(porcentagemAntiga / 25);
      const nivelNovo = Math.floor(novaPorcentagem / 25);

      if (nivelNovo > nivelAntigo) {
        tocarLevelUp(); // Toca SOMENTE o Level Up
      } else {
        tocarRegar();   // Toca SOMENTE a água
      }

      // Animação Visual
      Animated.timing(progressoLottieAnimado, {
        toValue: novaAguaNaPlanta / metaMaxima,
        duration: 1500, 
        useNativeDriver: false,
      }).start();

    } else if (aguaEstoque === 0) {
      Alert.alert('Falta Água', 'Cumpra suas metas para ganhar mais água!');
    } else {
      Alert.alert('Jardim Completo', 'Sua planta já chegou ao máximo!');
    }
  };

  const resetarPlanta = async () => {
    Alert.alert('Modo Desenvolvedor 🛠️', 'Deseja zerar a planta para testar?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sim, Zerar!', onPress: async () => {
          setAguaNaPlanta(0); 
          await AsyncStorage.setItem('aguaNaPlanta', '0'); 
          Animated.timing(progressoLottieAnimado, { toValue: 0, duration: 1500, useNativeDriver: false }).start();
        }
      }
    ]);
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
        {porcentagemCrescimento >= 25 && <Text style={styles.sunIcon}>☀️</Text>}
        {porcentagemCrescimento >= 50 && <Text style={styles.lagartaIcon}>🐛</Text>}
        {porcentagemCrescimento >= 75 && <Text style={styles.passaroIcon}>🐦</Text>}
        {porcentagemCrescimento >= 100 && <Text style={styles.borboletaIcon}>🦋</Text>}
        
        <AnimatedLottie
          source={require('../../assets/planta.json')} 
          style={styles.lottiePlant}
          progress={progressoLottieAnimado} 
        />
        
        <TouchableOpacity style={styles.cardStatus} onLongPress={resetarPlanta}>
          <Text style={styles.statusText}>Progresso: {Math.floor(porcentagemCrescimento)}%</Text>
        </TouchableOpacity>
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