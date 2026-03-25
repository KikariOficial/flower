import React, { useState, useCallback, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, StatusBar, Alert, Animated, Easing } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { Audio } from 'expo-av';

const AnimatedLottie = Animated.createAnimatedComponent(LottieView);

export default function HomeScreen() {
  const router = useRouter();

  const [aguaEstoque, setAguaEstoque] = useState(0); 
  const [aguaNaPlanta, setAguaNaPlanta] = useState(0); 
  const [metaMaxima, setMetaMaxima] = useState(10); 
  const jaTocouPassaros = useRef(false);

  // ==========================================
  // 1. O NOVO CÉREBRO DE ANIMAÇÃO (Animated.Value)
  // ==========================================
  const larguraBarraAnimada = useRef(new Animated.Value(0)).current;
  const progressoLottieAnimado = useRef(new Animated.Value(0)).current;

  // Animações de Entrada (Fade + Slide)
  const animEntradaSol = useRef(new Animated.Value(0)).current;
  const animEntradaLagarta = useRef(new Animated.Value(0)).current;
  const animEntradaPassaro = useRef(new Animated.Value(0)).current;
  const animEntradaBorboleta = useRef(new Animated.Value(0)).current;

  // Animações Contínuas (Oscilação/Flutuação) - Usamos um único 'tempo' contínuo
  const tempoFlutuacao = useRef(new Animated.Value(0)).current;

  // Animações Reativas (Clique)
  const escalaCardStatus = useRef(new Animated.Value(1)).current;
  const inclinacaoRegador = useRef(new Animated.Value(0)).current;

  const porcentagemCrescimento = (aguaNaPlanta / metaMaxima) * 100;

  // ==========================================
  // 2. FUNÇÃO DE FLUTUAÇÃO CONTÍNUA (Loop)
  // ==========================================
  useEffect(() => {
    // Cria um loop infinito de 0 a 1 e volta, usando uma curva suave (Seno)
    Animated.loop(
      Animated.sequence([
        Animated.timing(tempoFlutuacao, {
          toValue: 1,
          duration: 3000, // Leva 3 segundos para subir
          easing: Easing.inOut(Easing.sin), // Movimento orgânico
          useNativeDriver: true,
        }),
        Animated.timing(tempoFlutuacao, {
          toValue: 0,
          duration: 3000, // Leva 3 segundos para descer
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // ==========================================
  // FUNÇÕES DE ÁUDIO
  // ==========================================
  const tocarPassaros = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(require('../../assets/passaros.mp3'));
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate((status) => { if (status.isLoaded && status.didJustFinish) sound.unloadAsync(); });
    } catch (e) { console.log('Erro áudio pássaros', e); }
  };

  const tocarRegar = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(require('../../assets/regar.mp3'));
      await sound.playAsync();
      
      setTimeout(async () => {
        const status = await sound.getStatusAsync();
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
  // EFETIROS VISUAIS E CARREGAMENTO
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

          const progressoAtual = (plantaAtual / maxNum) * 100;
          if (progressoAtual > 60 && !jaTocouPassaros.current) {
            jaTocouPassaros.current = true;
            tocarPassaros();
          }

          Animated.timing(progressoLottieAnimado, {
            toValue: plantaAtual / maxNum,
            duration: 1200, 
            useNativeDriver: false,
          }).start();

          // DISPARA AS ANIMAÇÕES DE ENTRADA DO ECOSSISTEMA (Se já tiver progresso)
          if (progressoAtual >= 25) Animated.spring(animEntradaSol, { toValue: 1, tension: 10, friction: 3, useNativeDriver: true }).start();
          if (progressoAtual >= 50) Animated.spring(animEntradaLagarta, { toValue: 1, tension: 10, friction: 3, useNativeDriver: true }).start();
          if (progressoAtual >= 75) Animated.spring(animEntradaPassaro, { toValue: 1, tension: 10, friction: 3, useNativeDriver: true }).start();
          if (progressoAtual >= 100) Animated.spring(animEntradaBorboleta, { toValue: 1, tension: 10, friction: 3, useNativeDriver: true }).start();

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

      // LÓGICA DOS SONS (Level Up vs Regador)
      const porcentagemAntiga = (aguaNaPlanta / metaMaxima) * 100;
      const novaPorcentagem = (novaAguaNaPlanta / metaMaxima) * 100;
      const nivelAntigo = Math.floor(porcentagemAntiga / 25);
      const nivelNovo = Math.floor(novaPorcentagem / 25);

      if (nivelNovo > nivelAntigo) {
        tocarLevelUp();
        // DISPARA A ANIMAÇÃO DE ENTRADA DO NOVO ANIMAL
        if (nivelNovo === 1) Animated.spring(animEntradaSol, { toValue: 1, tension: 10, friction: 3, useNativeDriver: true }).start();
        if (nivelNovo === 2) Animated.spring(animEntradaLagarta, { toValue: 1, tension: 10, friction: 3, useNativeDriver: true }).start();
        if (nivelNovo === 3) Animated.spring(animEntradaPassaro, { toValue: 1, tension: 10, friction: 3, useNativeDriver: true }).start();
        if (nivelNovo === 4) Animated.spring(animEntradaBorboleta, { toValue: 1, tension: 10, friction: 3, useNativeDriver: true }).start();
      } else {
        tocarRegar();
      }

      // 3. ANIMAÇÃO REATIVA DO REGADOR (Inclinação)
      Animated.sequence([
        Animated.timing(inclinacaoRegador, { toValue: 1, duration: 150, useNativeDriver: true }), // Inclina
        Animated.timing(inclinacaoRegador, { toValue: 0, duration: 400, useNativeDriver: true }), // Volta
      ]).start();

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
    Alert.alert('Modo Desenvolvedor 🛠️', 'Deseja zerar a planta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sim, Zerar!', onPress: async () => {
          setAguaNaPlanta(0); 
          await AsyncStorage.setItem('aguaNaPlanta', '0'); 
          // Rebobina a animação visual e ESCONDE o ecossistema
          Animated.timing(progressoLottieAnimado, { toValue: 0, duration: 1500, useNativeDriver: false }).start();
          Animated.timing(animEntradaSol, { toValue: 0, duration: 500, useNativeDriver: true }).start();
          Animated.timing(animEntradaLagarta, { toValue: 0, duration: 500, useNativeDriver: true }).start();
          Animated.timing(animEntradaPassaro, { toValue: 0, duration: 500, useNativeDriver: true }).start();
          Animated.timing(animEntradaBorboleta, { toValue: 0, duration: 500, useNativeDriver: true }).start();
        }
      }
    ]);
  };

  // Animação reativa do Card (Pulso ao segurar)
  const animarCardPress = () => {
    Animated.sequence([
      Animated.timing(escalaCardStatus, { toValue: 1.1, duration: 100, useNativeDriver: true }),
      Animated.timing(escalaCardStatus, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start(resetarPlanta); // Só reseta no fim da animação
  };

  // ==========================================
  // 3. DEFINIÇÃO DOS ESTILOS ANIMADOS
  // ==========================================
  
  // Sol ☀️: Combina oscilação vertical + entrada suave
  const estiloSolAnimado = {
    opacity: animEntradaSol,
    transform: [
      { translateY: animEntradaSol.interpolate({ inputRange: [0, 1], outputRange: [50, 0] }) }, // Slide up na entrada
      { translateY: tempoFlutuacao.interpolate({ inputRange: [0, 1], outputRange: [0, -15] }) } // Oscilação contínua (15px)
    ]
  };

  // Lagarta 🐛: Oscilação menor (mais pesada)
  const estiloLagartaAnimada = {
    opacity: animEntradaLagarta,
    transform: [
      { translateY: animEntradaLagarta.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) },
      { translateY: tempoFlutuacao.interpolate({ inputRange: [0, 1], outputRange: [0, -5] }) }
    ]
  };

  // Pássaro 🐦: Oscilação maior (mais leve)
  const estiloPassaroAnimado = {
    opacity: animEntradaPassaro,
    transform: [
      { translateY: animEntradaPassaro.interpolate({ inputRange: [0, 1], outputRange: [80, 0] }) },
      { translateY: tempoFlutuacao.interpolate({ inputRange: [0, 1], outputRange: [0, -25] }) }
    ]
  };

  // Borboleta 🦋: Movimento errático (combina slide horizontal sutil)
  const estiloBorboletaAnimada = {
    opacity: animEntradaBorboleta,
    transform: [
      { translateY: animEntradaBorboleta.interpolate({ inputRange: [0, 1], outputRange: [100, 0] }) },
      { translateY: tempoFlutuacao.interpolate({ inputRange: [0, 1], outputRange: [0, -20] }) },
      { translateX: tempoFlutuacao.interpolate({ inputRange: [0, 1], outputRange: [-5, 5] }) } // Balanço lateral
    ]
  };

  // Regador 🚿: Inclinação reativa (-30 graus)
  const estiloRegadorAnimado = {
    transform: [{
      rotate: inclinacaoRegador.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '-30deg']
      })
    }]
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
        {/* ========================================== */}
        {/* 4. ECOSSISTEMA MÁGICO E ANIMADO          */}
        {/* ========================================== */}
        {/* Usamos Animated.Text para aplicar os estilos complexos */}
        <Animated.Text style={[styles.sunIcon, estiloSolAnimado]}>☀️</Animated.Text>
        <Animated.Text style={[styles.lagartaIcon, estiloLagartaAnimada]}>🐛</Animated.Text>
        <Animated.Text style={[styles.passaroIcon, estiloPassaroAnimado]}>🐦</Animated.Text>
        <Animated.Text style={[styles.borboletaIcon, estiloBorboletaAnimada]}>🦋</Animated.Text>
        
        <AnimatedLottie
          source={require('../../assets/planta.json')} 
          style={styles.lottiePlant}
          progress={progressoLottieAnimado} 
        />
        
        {/* Card reativo (Pulso) e gatilho LongPress */}
        <Animated.View style={{ transform: [{ scale: escalaCardStatus }] }}>
          <TouchableOpacity style={styles.cardStatus} onLongPress={animarCardPress} delayLongPress={800}>
            <Text style={styles.statusText}>Progresso: {Math.floor(porcentagemCrescimento)}%</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      <View style={styles.bottomArea}>
        {/* Regador reativo (Inclinação) */}
        <TouchableOpacity style={styles.botaoRegador} onPress={regarPlanta} activeOpacity={0.7}>
          <Animated.Text style={[styles.wateringCanIcon, estiloRegadorAnimado]}>🚿</Animated.Text>
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
  
  // Posicionamento base dos ícones do Ecossistema
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