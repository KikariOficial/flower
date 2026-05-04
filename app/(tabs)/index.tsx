import React, { useState, useCallback, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, StatusBar, Alert, Animated, Easing, useWindowDimensions } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';

const AnimatedLottie = Animated.createAnimatedComponent(LottieView);

// Componente para uma gota individual
const WaterDrop = ({ delay }: { delay: number }) => {
  const animY = useRef(new Animated.Value(0)).current;
  const animX = useRef(new Animated.Value(0)).current;
  const animOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(animY, { toValue: 120, duration: 600, easing: Easing.linear, useNativeDriver: true }),
          Animated.timing(animX, { toValue: (Math.random() - 0.5) * 40, duration: 600, useNativeDriver: true }),
          Animated.timing(animOpacity, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(animOpacity, { toValue: 0, duration: 100, useNativeDriver: true }),
      ])
    ).start();
  }, [delay, animY, animX, animOpacity]);

  return (
    <Animated.Text
      style={{
        position: 'absolute',
        fontSize: 20,
        opacity: animOpacity,
        transform: [{ translateY: animY }, { translateX: animX }],
      }}
    >
      💧
    </Animated.Text>
  );
};

export default function HomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const [aguaEstoque, setAguaEstoque] = useState(0); 
  const [aguaNaPlanta, setAguaNaPlanta] = useState(0); 
  const [metaMaxima, setMetaMaxima] = useState(10); 
  const [isWatering, setIsWatering] = useState(false);

  // Tamanhos responsivos
  const plantSize = width * 0.7;
  const sunSize = width * 0.2;

  const larguraBarraAnimada = useRef(new Animated.Value(0)).current;
  const progressoLottieAnimado = useRef(new Animated.Value(0)).current;

  const animEntradaSol = useRef(new Animated.Value(0)).current;
  const animEntradaLagarta = useRef(new Animated.Value(0)).current;
  const animEntradaPassaro = useRef(new Animated.Value(0)).current;
  const animEntradaBorboleta = useRef(new Animated.Value(0)).current;

  const tempoFlutuacao = useRef(new Animated.Value(0)).current;
  const escalaCardStatus = useRef(new Animated.Value(1)).current;
  const inclinacaoRegador = useRef(new Animated.Value(0)).current;

  const porcentagemCrescimento = (aguaNaPlanta / metaMaxima) * 100;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(tempoFlutuacao, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(tempoFlutuacao, {
          toValue: 0,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [tempoFlutuacao]);

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

  useEffect(() => {
    const porcentagemRegador = (aguaEstoque / metaMaxima) * 100;
    Animated.spring(larguraBarraAnimada, {
      toValue: porcentagemRegador > 100 ? 100 : porcentagemRegador,
      useNativeDriver: false, 
      bounciness: 12, 
    }).start();
  }, [aguaEstoque, metaMaxima, larguraBarraAnimada]);

  useFocusEffect(
    useCallback(() => {
      const carregarJardim = async () => {
        try {
          const storedMax = await AsyncStorage.getItem('metaMaxima');
          const max = storedMax ? parseInt(storedMax) : 10;
          setMetaMaxima(max);

          const ciclo = await AsyncStorage.getItem('cicloVida') || 'diario';
          const ultimaDataReset = await AsyncStorage.getItem('ultimaDataReset');
          const hoje = new Date();
          const dataHojeString = hoje.toISOString().split('T')[0];

          let precisaResetar = false;
          if (ultimaDataReset && ultimaDataReset !== dataHojeString) {
            const dataReset = new Date(ultimaDataReset);
            const diffTime = Math.abs(hoje.getTime() - dataReset.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (ciclo === 'diario') precisaResetar = true;
            else if (ciclo === 'semanal' && diffDays >= 7) precisaResetar = true;
            else if (ciclo === 'mensal' && hoje.getMonth() !== dataReset.getMonth()) precisaResetar = true;
          }

          if (precisaResetar) {
            await AsyncStorage.setItem('aguaNaPlanta', '0');
            await AsyncStorage.setItem('ultimaDataReset', dataHojeString);
            setAguaNaPlanta(0);
            progressoLottieAnimado.setValue(0);
            animEntradaSol.setValue(0);
            animEntradaLagarta.setValue(0);
            animEntradaPassaro.setValue(0);
            animEntradaBorboleta.setValue(0);
          } else {
            const aguaSalva = await AsyncStorage.getItem('aguaNaPlanta');
            const valor = aguaSalva ? parseInt(aguaSalva) : 0;
            setAguaNaPlanta(valor);
            
            const progresso = valor / max;
            progressoLottieAnimado.setValue(progresso);
            
            if (progresso >= 0.25) animEntradaSol.setValue(1);
            if (progresso >= 0.50) animEntradaLagarta.setValue(1);
            if (progresso >= 0.75) animEntradaPassaro.setValue(1);
            if (progresso >= 1.0) animEntradaBorboleta.setValue(1);
          }

          const estoque = await AsyncStorage.getItem('aguaEstoque');
          setAguaEstoque(estoque ? parseInt(estoque) : 0);

        } catch (e) { 
          console.log('Erro ao carregar dados:', e); 
        }
      };
      
      carregarJardim();
    }, [progressoLottieAnimado, animEntradaSol, animEntradaLagarta, animEntradaPassaro, animEntradaBorboleta])
  );

  const regarPlanta = async () => {
    if (aguaEstoque > 0 && aguaNaPlanta < metaMaxima) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const novoEstoque = aguaEstoque - 1;
      const novaAguaNaPlanta = aguaNaPlanta + 1;
      
      setAguaEstoque(novoEstoque); 
      setAguaNaPlanta(novaAguaNaPlanta); 

      await AsyncStorage.setItem('aguaEstoque', novoEstoque.toString());
      await AsyncStorage.setItem('aguaNaPlanta', novaAguaNaPlanta.toString());

      setIsWatering(true);
      setTimeout(() => setIsWatering(false), 1200);

      const nivelAntigo = Math.floor((aguaNaPlanta / metaMaxima) * 100 / 25);
      const nivelNovo = Math.floor((novaAguaNaPlanta / metaMaxima) * 100 / 25);

      if (nivelNovo > nivelAntigo) {
        tocarLevelUp();
        if (nivelNovo === 1) Animated.spring(animEntradaSol, { toValue: 1, tension: 10, friction: 3, useNativeDriver: true }).start();
        if (nivelNovo === 2) Animated.spring(animEntradaLagarta, { toValue: 1, tension: 10, friction: 3, useNativeDriver: true }).start();
        if (nivelNovo === 3) Animated.spring(animEntradaPassaro, { toValue: 1, tension: 10, friction: 3, useNativeDriver: true }).start();
        if (nivelNovo === 4) Animated.spring(animEntradaBorboleta, { toValue: 1, tension: 10, friction: 3, useNativeDriver: true }).start();
      } else {
        tocarRegar();
      }

      Animated.sequence([
        Animated.timing(inclinacaoRegador, { toValue: 1, duration: 150, useNativeDriver: true }),
        Animated.timing(inclinacaoRegador, { toValue: 0, duration: 400, useNativeDriver: true }),
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
          Animated.timing(progressoLottieAnimado, { toValue: 0, duration: 1500, useNativeDriver: false }).start();
          Animated.timing(animEntradaSol, { toValue: 0, duration: 500, useNativeDriver: true }).start();
          Animated.timing(animEntradaLagarta, { toValue: 0, duration: 500, useNativeDriver: true }).start();
          Animated.timing(animEntradaPassaro, { toValue: 0, duration: 500, useNativeDriver: true }).start();
          Animated.timing(animEntradaBorboleta, { toValue: 0, duration: 500, useNativeDriver: true }).start();
        }
      }
    ]);
  };

  const animarCardPress = () => {
    Animated.sequence([
      Animated.timing(escalaCardStatus, { toValue: 1.1, duration: 100, useNativeDriver: true }),
      Animated.timing(escalaCardStatus, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start(resetarPlanta);
  };

  const estiloSolAnimado = {
    opacity: animEntradaSol,
    transform: [
      { translateY: animEntradaSol.interpolate({ inputRange: [0, 1], outputRange: [50, 0] }) },
      { translateY: tempoFlutuacao.interpolate({ inputRange: [0, 1], outputRange: [0, -15] }) }
    ]
  };

  const estiloLagartaAnimada = {
    opacity: animEntradaLagarta,
    transform: [
      { translateY: animEntradaLagarta.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) },
      { translateY: tempoFlutuacao.interpolate({ inputRange: [0, 1], outputRange: [0, -5] }) }
    ]
  };

  const estiloPassaroAnimado = {
    opacity: animEntradaPassaro,
    transform: [
      { translateY: animEntradaPassaro.interpolate({ inputRange: [0, 1], outputRange: [80, 0] }) },
      { translateY: tempoFlutuacao.interpolate({ inputRange: [0, 1], outputRange: [0, -25] }) }
    ]
  };

  const estiloBorboletaAnimada = {
    opacity: animEntradaBorboleta,
    transform: [
      { translateY: animEntradaBorboleta.interpolate({ inputRange: [0, 1], outputRange: [100, 0] }) },
      { translateY: tempoFlutuacao.interpolate({ inputRange: [0, 1], outputRange: [0, -20] }) },
      { translateX: tempoFlutuacao.interpolate({ inputRange: [0, 1], outputRange: [-5, 5] }) }
    ]
  };

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
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.botaoCirculo} onPress={() => router.push('/config')}>
            <Text style={styles.iconText}>≡</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.botaoCirculo} onPress={() => router.push('/metas')}>
            <Text style={styles.iconText}>+</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.centerArea}>
          <Animated.Text style={[styles.sunIcon, { fontSize: sunSize }, estiloSolAnimado]}>☀️</Animated.Text>
          <Animated.Text style={[styles.lagartaIcon, estiloLagartaAnimada]}>🐛</Animated.Text>
          <Animated.Text style={[styles.passaroIcon, estiloPassaroAnimado]}>🐦</Animated.Text>
          <Animated.Text style={[styles.borboletaIcon, estiloBorboletaAnimada]}>🦋</Animated.Text>

          <AnimatedLottie
            source={require('../../assets/planta.json')} 
            style={[styles.lottiePlant, { width: plantSize, height: plantSize }]}
            progress={progressoLottieAnimado} 
          />

          <Animated.View style={{ transform: [{ scale: escalaCardStatus }] }}>
            <TouchableOpacity style={styles.cardStatus} onLongPress={animarCardPress} delayLongPress={800}>
              <Text style={styles.statusText}>Progresso: {Math.floor(porcentagemCrescimento)}%</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

        <View style={styles.bottomArea}>
          <TouchableOpacity style={styles.botaoRegador} onPress={regarPlanta} activeOpacity={0.7}>
            <Animated.Text style={[styles.wateringCanIcon, estiloRegadorAnimado]}>🚿</Animated.Text>
            {isWatering && (
              <View style={styles.containerGotas}>
                <WaterDrop delay={0} />
                <WaterDrop delay={200} />
                <WaterDrop delay={400} />
                <WaterDrop delay={600} />
              </View>
            )}
          </TouchableOpacity>

          <Text style={styles.waterLabel}>ÁGUA NO REGADOR: {aguaEstoque}</Text>

          <View style={styles.progressBarBackground}>
            <Animated.View style={[
              styles.progressBarFill, 
              { width: larguraBarraAnimada.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }) }
            ]} />
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 10 },
  botaoCirculo: { backgroundColor: '#FFFFFF', width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  iconText: { fontSize: 24, color: '#8CB369', fontWeight: 'bold' },
  centerArea: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  sunIcon: { position: 'absolute', top: '5%', left: '5%', opacity: 0.8 },
  passaroIcon: { fontSize: 40, position: 'absolute', top: '10%', right: '10%' },
  lagartaIcon: { fontSize: 30, position: 'absolute', bottom: '25%', left: '15%' },
  borboletaIcon: { fontSize: 50, position: 'absolute', top: '20%', left: '10%' },
  lottiePlant: { marginBottom: 20 },
  cardStatus: { backgroundColor: 'rgba(255, 255, 255, 0.7)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, marginTop: -20 },
  statusText: { fontSize: 16, color: '#5A5A5A', textAlign: 'center', fontWeight: 'bold' },
  bottomArea: { alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.5)', padding: 20, marginHorizontal: 24, marginBottom: 20, borderRadius: 30 },
  containerGotas: { position: 'absolute', top: 50, left: 10, width: 40, alignItems: 'center' },
  botaoRegador: { marginBottom: 15 },
  wateringCanIcon: { fontSize: 75 },
  waterLabel: { color: '#4A8DB7', fontWeight: 'bold', letterSpacing: 1, marginBottom: 10 },
  progressBarBackground: { width: '100%', height: 24, backgroundColor: '#E0E0E0', borderRadius: 12, overflow: 'hidden', borderWidth: 2, borderColor: '#FFFFFF' },
  progressBarFill: { height: '100%', backgroundColor: '#4A8DB7', borderRadius: 10 },
});
