import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Switch, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ConfigScreen() {
  const router = useRouter();
  
  const [notificacoesAtivas, setNotificacoesAtivas] = useState(false);
  const [metaEscolhida, setMetaEscolhida] = useState(10); 
  const [cicloVida, setCicloVida] = useState('diario'); 

  // A nossa nova lista para a catraca (de 10 até 100)
  const opcoesGotas = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

  useEffect(() => {
    carregarConfigs();
  }, []);

  const carregarConfigs = async () => {
    try {
      const notif = await AsyncStorage.getItem('notificacoesAtivas');
      if (notif === 'true') setNotificacoesAtivas(true);

      const max = await AsyncStorage.getItem('metaMaxima');
      if (max) setMetaEscolhida(parseInt(max));

      const ciclo = await AsyncStorage.getItem('cicloVida');
      if (ciclo) setCicloVida(ciclo);
    } catch (e) { console.log('Erro ao carregar configurações'); }
  };

  const mudarCiclo = async (valor: string) => {
    setCicloVida(valor);
    await AsyncStorage.setItem('cicloVida', valor);
    Alert.alert('Ciclo Atualizado', `Sua planta agora irá resetar de forma ${valor}.`);
  };

  const alternarNotificacoes = async (valor: boolean) => {
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (valor === true) {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') return;

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('jardim-avisos', {
          name: 'Avisos do Jardim',
          importance: Notifications.AndroidImportance.HIGH,
        });
      }

      await Notifications.scheduleNotificationAsync({
        content: { title: 'Sua planta está com sede! 🌱', body: 'Hora de cumprir suas metas!', sound: true },
        trigger: { hour: 10, minute: 0, repeats: true } as any,
      });

      setNotificacoesAtivas(true);
      await AsyncStorage.setItem('notificacoesAtivas', 'true');
    } else {
      setNotificacoesAtivas(false);
      await AsyncStorage.setItem('notificacoesAtivas', 'false');
    }
  };

  const mudarDificuldade = async (valor: number) => {
    setMetaEscolhida(valor);
    await AsyncStorage.setItem('metaMaxima', valor.toString());
  };

  const mostrarCreditos = () => {
    Alert.alert('Créditos', 'Desenvolvido por Carlos.\n\nAnimações por LottieFiles.');
  };

  const limparDados = () => {
    Alert.alert(
      'Atenção ⚠️',
      'Isso vai apagar sua planta, suas metas e toda a sua água. Tem certeza absoluta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sim, Apagar Tudo', style: 'destructive', onPress: async () => {
            await AsyncStorage.clear(); 
            Alert.alert('Pronto', 'Os dados foram apagados. Reinicie o aplicativo.');
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Configurações</Text>
      
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* SESSÃO 1: JARDIM E CICLO */}
        <Text style={styles.sessaoTitulo}>Jardim & Ciclo</Text>
        <View style={styles.card}>
          <View style={styles.blocoConfig}>
            
            {/* A NOVA CATRACA DE DIFICULDADE */}
            <Text style={styles.textoConfig}>Dificuldade (Gotas para 100%)</Text>
            <View style={styles.areaCatraca}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollCatraca}>
                {opcoesGotas.map(v => (
                  <TouchableOpacity 
                    key={v} 
                    style={[styles.itemCatraca, metaEscolhida === v && styles.itemCatracaAtivo]} 
                    onPress={() => mudarDificuldade(v)}
                  >
                    <Text style={[styles.textoCatraca, metaEscolhida === v && styles.textoCatracaAtivo]}>{v}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <Text style={[styles.textoConfig, {marginTop: 24}]}>Reset Automático da Planta</Text>
            <View style={styles.linhaBotoesConfig}>
              <TouchableOpacity style={[styles.botaoConfig, cicloVida === 'diario' && styles.botaoConfigAtivo]} onPress={() => mudarCiclo('diario')}>
                <Text style={[styles.textoBotaoConfig, cicloVida === 'diario' && styles.textoBotaoConfigAtivo]}>Diário</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.botaoConfig, cicloVida === 'semanal' && styles.botaoConfigAtivo]} onPress={() => mudarCiclo('semanal')}>
                <Text style={[styles.textoBotaoConfig, cicloVida === 'semanal' && styles.textoBotaoConfigAtivo]}>Semanal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.botaoConfig, cicloVida === 'mensal' && styles.botaoConfigAtivo]} onPress={() => mudarCiclo('mensal')}>
                <Text style={[styles.textoBotaoConfig, cicloVida === 'mensal' && styles.textoBotaoConfigAtivo]}>Mensal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* SESSÃO 2: PREFERÊNCIAS */}
        <Text style={styles.sessaoTitulo}>Preferências</Text>
        <View style={styles.card}>
          <View style={styles.linhaConfig}>
            <View><Text style={styles.textoConfig}>Notificações Diárias</Text></View>
            <Switch value={notificacoesAtivas} onValueChange={alternarNotificacoes} trackColor={{ false: '#E0E0E0', true: '#8CB369' }} thumbColor="#FFF" />
          </View>
        </View>

        {/* SESSÃO 3: SOBRE */}
        <Text style={styles.sessaoTitulo}>Sobre</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.linhaBotao} onPress={mostrarCreditos}>
            <Text style={styles.textoConfig}>Créditos</Text>
            <Text style={styles.seta}>›</Text>
          </TouchableOpacity>
          <View style={styles.divisoria} />
          <View style={styles.linhaConfig}>
            <Text style={styles.textoConfig}>Versão do Aplicativo</Text>
            <Text style={styles.versaoTexto}>1.0.0</Text>
          </View>
        </View>

        {/* SESSÃO 4: AVANÇADO */}
        <Text style={styles.sessaoTitulo}>Avançado</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.linhaBotao} onPress={limparDados}>
            <Text style={[styles.textoConfig, { color: '#FF6B6B' }]}>Apagar todos os dados</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      <TouchableOpacity style={styles.botaoVoltar} onPress={() => router.back()}>
        <Text style={styles.textoBotaoVoltar}>Voltar ao Jardim</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF9E6', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 40 },
  titulo: { fontSize: 28, fontWeight: 'bold', color: '#8CB369', textAlign: 'center', marginBottom: 24 },
  scroll: { flex: 1 },
  sessaoTitulo: { fontSize: 14, fontWeight: 'bold', color: '#A0A0A0', textTransform: 'uppercase', marginBottom: 8, marginTop: 16, marginLeft: 8 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, overflow: 'hidden', marginBottom: 8, elevation: 2 },
  linhaConfig: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  linhaBotao: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  divisoria: { height: 1, backgroundColor: '#F0F0F0', marginLeft: 16 },
  blocoConfig: { padding: 16 },
  textoConfig: { fontSize: 16, color: '#5A5A5A', fontWeight: '500' },
  versaoTexto: { fontSize: 16, color: '#A0A0A0' },
  seta: { fontSize: 20, color: '#CCCCCC' },
  
  // ESTILOS DA NOVA CATRACA
  areaCatraca: { marginTop: 12, height: 70 },
  scrollCatraca: { alignItems: 'center', paddingRight: 20 },
  itemCatraca: { backgroundColor: '#F0F0F0', borderRadius: 25, width: 50, height: 50, justifyContent: 'center', alignItems: 'center', marginRight: 12, borderWidth: 1, borderColor: '#E0E0E0' },
  itemCatracaAtivo: { backgroundColor: '#8CB369', borderColor: '#8CB369', transform: [{ scale: 1.1 }], elevation: 4, shadowColor: '#8CB369', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3 },
  textoCatraca: { fontWeight: 'bold', color: '#5A5A5A', fontSize: 16 },
  textoCatracaAtivo: { color: '#FFFFFF', fontSize: 18 },

  // BOTÕES ANTIGOS (Mantidos para o ciclo de vida)
  linhaBotoesConfig: { flexDirection: 'row', gap: 8, marginTop: 12 },
  botaoConfig: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: '#F0F0F0', alignItems: 'center' },
  botaoConfigAtivo: { backgroundColor: '#4A8DB7' },
  textoBotaoConfig: { fontWeight: 'bold', color: '#5A5A5A' },
  textoBotaoConfigAtivo: { color: '#FFFFFF' },
  
  botaoVoltar: { backgroundColor: '#4A8DB7', borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 16 },
  textoBotaoVoltar: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 18 }
});