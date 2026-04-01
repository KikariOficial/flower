import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Switch, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

export default function ConfigScreen() {
  const router = useRouter();
  
  const [notificacoesAtivas, setNotificacoesAtivas] = useState(false);
  const [metaEscolhida, setMetaEscolhida] = useState(10); 
  const [cicloVida, setCicloVida] = useState('diario'); // diario, semanal, mensal

  useEffect(() => {
    carregarConfigs();
  }, []);

  // 1. CARREGA TODAS AS CONFIGURAÇÕES SALVAS
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

  // 2. FUNÇÃO PARA MUDAR O CICLO DE VIDA DA PLANTA
  const mudarCiclo = async (valor: string) => {
    setCicloVida(valor);
    await AsyncStorage.setItem('cicloVida', valor);
    Alert.alert('Ciclo Atualizado', `Sua planta agora irá resetar de forma ${valor}.`);
  };

  // 3. FUNÇÃO DO DESPERTADOR
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
        trigger: { type: 'daily', hour: 10, minute: 0, repeats: true, channeId: 'jardim-avisos' } as any,
      });

      setNotificacoesAtivas(true);
      await AsyncStorage.setItem('notificacoesAtivas', 'true');
    } else {
      setNotificacoesAtivas(false);
      await AsyncStorage.setItem('notificacoesAtivas', 'false');
    }
  };

  // 4. FUNÇÃO DA DIFICULDADE
  const mudarDificuldade = async (valor: number) => {
    setMetaEscolhida(valor);
    await AsyncStorage.setItem('metaMaxima', valor.toString());
  };

  // ==========================================
  // FUNÇÕES RESTAURADAS: CRÉDITOS E LIMPEZA
  // ==========================================
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
            <Text style={styles.textoConfig}>Dificuldade (Gotas)</Text>
            <View style={styles.linhaBotoesConfig}>
              {[10, 20, 30].map(v => (
                <TouchableOpacity key={v} style={[styles.botaoConfig, metaEscolhida === v && styles.botaoConfigAtivo]} onPress={() => mudarDificuldade(v)}>
                  <Text style={[styles.textoBotaoConfig, metaEscolhida === v && styles.textoBotaoConfigAtivo]}>{v}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.textoConfig, {marginTop: 20}]}>Reset Automático da Planta</Text>
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

        {/* SESSÃO 3: SOBRE (CRÉDITOS RESTAURADOS) */}
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

        {/* SESSÃO 4: AVANÇADO (LIMPEZA RESTAURADA) */}
        <Text style={styles.sessaoTitulo}>Avançado</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.linhaBotao} onPress={limparDados}>
            <Text style={[styles.textoConfig, { color: '#FF6B6B' }]}>Apagar todos os dados</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* BOTÃO VOLTAR */}
      <TouchableOpacity style={styles.botaoVoltar} onPress={() => router.back()}>
        <Text style={styles.textoBotaoVoltar}>Voltar ao Jardim</Text>
      </TouchableOpacity>
    </View>
  );
}

// ESTILOS ATUALIZADOS PARA SUPORTAR TUDO
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
  linhaBotoesConfig: { flexDirection: 'row', gap: 8, marginTop: 12 },
  botaoConfig: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: '#F0F0F0', alignItems: 'center' },
  botaoConfigAtivo: { backgroundColor: '#4A8DB7' },
  textoBotaoConfig: { fontWeight: 'bold', color: '#5A5A5A' },
  textoBotaoConfigAtivo: { color: '#FFFFFF' },
  botaoVoltar: { backgroundColor: '#4A8DB7', borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 16 },
  textoBotaoVoltar: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 18 }
});