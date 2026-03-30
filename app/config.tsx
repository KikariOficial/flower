import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Switch, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 1. IMPORTAMOS O MOTOR DE NOTIFICAÇÕES
import * as Notifications from 'expo-notifications';

// 2. CONFIGURAÇÃO GLOBAL
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function ConfigScreen() {
  const router = useRouter();
  
  const [notificacoesAtivas, setNotificacoesAtivas] = useState(false);
  const [metaEscolhida, setMetaEscolhida] = useState(10); 

  useEffect(() => {
    carregarConfigs();
  }, []);

  const carregarConfigs = async () => {
    try {
      const notif = await AsyncStorage.getItem('notificacoesAtivas');
      if (notif === 'true') setNotificacoesAtivas(true);

      const max = await AsyncStorage.getItem('metaMaxima');
      if (max) setMetaEscolhida(parseInt(max));
    } catch (e) { console.log('Erro ao carregar'); }
  };

  // ==========================================
  // O NOVO CÉREBRO DAS NOTIFICAÇÕES
  // ==========================================
  const alternarNotificacoes = async (valor: boolean) => {
    if (valor === true) {
      // 1. Pede permissão ao usuário de forma explícita
      const { status: statusAtual } = await Notifications.getPermissionsAsync();
      let statusFinal = statusAtual;
      
      if (statusAtual !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        statusFinal = status;
      }
      
      if (statusFinal !== 'granted') {
        Alert.alert('Permissão Negada ❌', 'Ative as notificações nas configurações do celular.');
        return; 
      }

      // 2. CONFIGURA O CANAL DE NOTIFICAÇÃO (Fundamental para Android 8+)
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('jardim-avisos', {
          name: 'Avisos do Jardim',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#8CB369',
        });
      }

      // 3. O DESPERTADOR OFICIAL (Todos os dias às 10h da manhã)
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Sua planta está com sede! 🌱',
          body: 'Não se esqueça de cumprir suas metas hoje para ganhar gotas de água.',
          sound: true, 
        },
        // O gatilho real: Hora, Minuto e Repetição diária!
        trigger: {
          hour: 10,
          minute: 0,
          repeats: true, 
          channelId: 'jardim-avisos', 
        } as any,
      });

      setNotificacoesAtivas(true);
      await AsyncStorage.setItem('notificacoesAtivas', 'true');
      
      // Atualizamos a mensagem de sucesso para o usuário:
      Alert.alert('Notificações Ativadas 🔔', 'Você receberá um lembrete todos os dias às 10:00 da manhã!');
      
    } else {
      // Se ele desligou, nós CANCELAMOS tudo
      await Notifications.cancelAllScheduledNotificationsAsync();
      
      setNotificacoesAtivas(false);
      await AsyncStorage.setItem('notificacoesAtivas', 'false');
      Alert.alert('Notificações Desativadas 🔕', 'Você não receberá mais lembretes.');
    }
  };

  const mudarDificuldade = async (valor: number) => {
    setMetaEscolhida(valor);
    await AsyncStorage.setItem('metaMaxima', valor.toString());
    Alert.alert('Dificuldade Atualizada!', `Sua planta agora precisa de ${valor} gotas para florescer totalmente.`);
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
        
        <Text style={styles.sessaoTitulo}>Jardim</Text>
        <View style={styles.card}>
          <View style={styles.blocoConfig}>
            <View>
              <Text style={styles.textoConfig}>Gotas para florescer</Text>
              <Text style={styles.subtextoConfig}>Define o tempo de crescimento da planta</Text>
            </View>
            
            <View style={styles.linhaBotoesConfig}>
              <TouchableOpacity style={[styles.botaoConfig, metaEscolhida === 10 && styles.botaoConfigAtivo]} onPress={() => mudarDificuldade(10)}>
                <Text style={[styles.textoBotaoConfig, metaEscolhida === 10 && styles.textoBotaoConfigAtivo]}>10</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.botaoConfig, metaEscolhida === 20 && styles.botaoConfigAtivo]} onPress={() => mudarDificuldade(20)}>
                <Text style={[styles.textoBotaoConfig, metaEscolhida === 20 && styles.textoBotaoConfigAtivo]}>20</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.botaoConfig, metaEscolhida === 30 && styles.botaoConfigAtivo]} onPress={() => mudarDificuldade(30)}>
                <Text style={[styles.textoBotaoConfig, metaEscolhida === 30 && styles.textoBotaoConfigAtivo]}>30</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <Text style={styles.sessaoTitulo}>Preferências</Text>
        <View style={styles.card}>
          <View style={styles.linhaConfig}>
            <View>
              <Text style={styles.textoConfig}>Notificações Diárias</Text>
              <Text style={styles.subtextoConfig}>Lembrete às 10:00 da manhã</Text>
            </View>
            <Switch
              value={notificacoesAtivas}
              onValueChange={alternarNotificacoes}
              trackColor={{ false: '#E0E0E0', true: '#8CB369' }}
              thumbColor={'#FFFFFF'}
            />
          </View>
        </View>

        <Text style={styles.sessaoTitulo}>Sobre</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.linhaBotao} onPress={mostrarCreditos}>
            <Text style={styles.textoConfig}>Créditos</Text>
            <Text style={styles.seta}>›</Text>
          </TouchableOpacity>
          <View style={styles.divisoria} />
          <View style={styles.linhaConfig}>
            <Text style={styles.textoConfig}>Versão do Aplicativo</Text>
            <Text style={styles.versaoTexto}>1.1.2</Text>
          </View>
        </View>

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
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, overflow: 'hidden', marginBottom: 8, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  linhaConfig: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  blocoConfig: { padding: 16 }, 
  linhaBotao: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  divisoria: { height: 1, backgroundColor: '#F0F0F0', marginLeft: 16 },
  textoConfig: { fontSize: 16, color: '#5A5A5A', fontWeight: '500' },
  subtextoConfig: { fontSize: 12, color: '#A0A0A0', marginTop: 4 },
  seta: { fontSize: 20, color: '#CCCCCC' },
  versaoTexto: { fontSize: 16, color: '#A0A0A0' },
  linhaBotoesConfig: { flexDirection: 'row', gap: 12, marginTop: 16 },
  botaoConfig: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: '#F0F0F0', alignItems: 'center' },
  botaoConfigAtivo: { backgroundColor: '#4A8DB7' },
  textoBotaoConfig: { fontWeight: 'bold', color: '#5A5A5A' },
  textoBotaoConfigAtivo: { color: '#FFFFFF' },
  botaoVoltar: { backgroundColor: '#4A8DB7', borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 16 },
  textoBotaoVoltar: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 18 }
});