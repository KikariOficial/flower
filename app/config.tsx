import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Switch, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ConfigScreen() {
  const router = useRouter();
  
  // Estado da nossa chave de Notificações
  const [notificacoesAtivas, setNotificacoesAtivas] = useState(false);

  // Ao abrir a tela, lê se o usuário já tinha ativado antes
  useEffect(() => {
    const carregarConfigs = async () => {
      const notif = await AsyncStorage.getItem('notificacoesAtivas');
      if (notif === 'true') setNotificacoesAtivas(true);
    };
    carregarConfigs();
  }, []);

  // Quando o usuário clica na chavinha
  const alternarNotificacoes = async (valor: boolean) => {
    setNotificacoesAtivas(valor);
    await AsyncStorage.setItem('notificacoesAtivas', valor ? 'true' : 'false');
    
    if (valor) {
      Alert.alert('Notificações Ativadas', 'Você receberá lembretes para regar sua planta!');
    }
  };

  const mostrarCreditos = () => {
    Alert.alert('Créditos', 'Desenvolvido com ❤️ por você.\n\nAnimações por LottieFiles.');
  };

  const limparDados = () => {
    Alert.alert(
      'Atenção ⚠️',
      'Isso vai apagar sua planta, suas metas e toda a sua água. Tem certeza absoluta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sim, Apagar Tudo', style: 'destructive', onPress: async () => {
            await AsyncStorage.clear(); // A BOMBA NUCLEAR: Apaga tudo do app!
            Alert.alert('Pronto', 'Os dados foram apagados. Reinicie o aplicativo.');
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Configurações</Text>

      <ScrollView style={styles.scroll}>
        
        {/* SESSÃO: PREFERÊNCIAS */}
        <Text style={styles.sessaoTitulo}>Preferências</Text>
        <View style={styles.card}>
          <View style={styles.linhaConfig}>
            <View>
              <Text style={styles.textoConfig}>Notificações Diárias</Text>
              <Text style={styles.subtextoConfig}>Lembretes para não deixar a planta secar</Text>
            </View>
            <Switch
              value={notificacoesAtivas}
              onValueChange={alternarNotificacoes}
              trackColor={{ false: '#E0E0E0', true: '#8CB369' }}
              thumbColor={'#FFFFFF'}
            />
          </View>
        </View>

        {/* SESSÃO: SOBRE O APP */}
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

        {/* SESSÃO: AVANÇADO */}
        <Text style={styles.sessaoTitulo}>Avançado</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.linhaBotao} onPress={limparDados}>
            <Text style={[styles.textoConfig, { color: '#FF6B6B' }]}>Apagar todos os dados</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      <TouchableOpacity style={styles.botaoVoltar} onPress={() => router.back()}>
        <Text style={styles.textoBotaoVoltar}>Voltar</Text>
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
  linhaBotao: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  divisoria: { height: 1, backgroundColor: '#F0F0F0', marginLeft: 16 },
  textoConfig: { fontSize: 16, color: '#5A5A5A', fontWeight: '500' },
  subtextoConfig: { fontSize: 12, color: '#A0A0A0', marginTop: 4 },
  seta: { fontSize: 20, color: '#CCCCCC' },
  versaoTexto: { fontSize: 16, color: '#A0A0A0' },
  botaoVoltar: { backgroundColor: '#4A8DB7', borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 16 },
  textoBotaoVoltar: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 18 }
});