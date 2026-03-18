import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage'; // A nossa nova memória!

export default function MetasScreen() {
  const router = useRouter();
  const [textoNovaMeta, setTextoNovaMeta] = useState('');
  const [listaMetas, setListaMetas] = useState<any[]>([]);

  // 1. Carrega as metas salvas assim que a tela abre
  useEffect(() => {
    carregarMetas();
  }, []);

  const carregarMetas = async () => {
    try {
      const metasSalvas = await AsyncStorage.getItem('listaDeMetas');
      if (metasSalvas !== null) {
        setListaMetas(JSON.parse(metasSalvas)); // Transforma o texto de volta em lista
      }
    } catch (e) {
      console.log('Erro ao carregar metas');
    }
  };

  // Função auxiliar para salvar a lista na memória sempre que ela mudar
  const salvarListaNaMemoria = async (novaLista: any[]) => {
    setListaMetas(novaLista);
    await AsyncStorage.setItem('listaDeMetas', JSON.stringify(novaLista));
  };

  const adicionarMeta = () => {
    if (textoNovaMeta.trim() !== '') {
      const novaMeta = {
        id: Date.now().toString(),
        texto: textoNovaMeta,
        concluida: false
      };
      salvarListaNaMemoria([...listaMetas, novaMeta]);
      setTextoNovaMeta('');
    }
  };

  const excluirMeta = (idParaExcluir: string) => {
    const listaAtualizada = listaMetas.filter(meta => meta.id !== idParaExcluir);
    salvarListaNaMemoria(listaAtualizada);
  };

  // 2. A MÁGICA: Concluir a meta e ganhar água!
  const concluirMeta = async (idParaConcluir: string) => {
    // Primeiro, atualiza a caixinha para ✅
    const listaAtualizada = listaMetas.map(meta => {
      if (meta.id === idParaConcluir) return { ...meta, concluida: true };
      return meta;
    });
    salvarListaNaMemoria(listaAtualizada);

    // Segundo, dá a recompensa de água!
    try {
      const aguaAtualString = await AsyncStorage.getItem('aguaSalva');
      let aguaAtual = aguaAtualString ? parseInt(aguaAtualString) : 0; // Se não tiver nada, é 0

      if (aguaAtual < 10) {
        await AsyncStorage.setItem('aguaSalva', (aguaAtual + 1).toString());
        Alert.alert('Parabéns!', '+1 gota no seu regador 💧');
      } else {
        Alert.alert('Regador Cheio!', 'Volte ao jardim para regar sua planta!');
      }
    } catch (e) {
      console.log('Erro ao salvar água');
    }
  };

  // O ROSTO (continua exatamente igual ao passo anterior)
  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Minhas Metas Diárias</Text>

      <View style={styles.areaInput}>
        <TextInput
          style={styles.input}
          placeholder="Digite um novo hábito..."
          value={textoNovaMeta}
          onChangeText={setTextoNovaMeta}
        />
        <TouchableOpacity style={styles.botaoAdicionar} onPress={adicionarMeta}>
          <Text style={styles.textoBotaoAdicionar}>Adicionar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.listaScroll}>
        {listaMetas.map((meta) => (
          <View key={meta.id} style={styles.itemMeta}>
            <TouchableOpacity 
              style={styles.areaTextoMeta} 
              onPress={() => concluirMeta(meta.id)}
              disabled={meta.concluida}
            >
              <Text style={styles.checkbox}>{meta.concluida ? '✅' : '⬜'}</Text>
              <Text style={[styles.textoMeta, meta.concluida && styles.textoMetaConcluida]}>
                {meta.texto}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => excluirMeta(meta.id)}>
              <Text style={styles.iconeLixeira}>🗑️</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.botaoVoltar} onPress={() => router.back()}>
        <Text style={styles.textoBotaoVoltar}>Voltar para o Jardim</Text>
      </TouchableOpacity>
    </View>
  );
}

// O StyleSheet continua igual
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF9E6', paddingTop: 60, paddingHorizontal: 24, paddingBottom: 40 },
  titulo: { fontSize: 28, fontWeight: 'bold', color: '#8CB369', textAlign: 'center', marginBottom: 24 },
  areaInput: { flexDirection: 'row', marginBottom: 24 },
  input: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 8, padding: 16, fontSize: 16, color: '#5A5A5A', marginRight: 12, borderWidth: 1, borderColor: '#8CB369' },
  botaoAdicionar: { backgroundColor: '#8CB369', borderRadius: 8, paddingHorizontal: 20, justifyContent: 'center' },
  textoBotaoAdicionar: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },
  listaScroll: { flex: 1, marginBottom: 16 },
  itemMeta: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 16, borderRadius: 8, marginBottom: 12 },
  areaTextoMeta: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  checkbox: { fontSize: 20, marginRight: 12 },
  textoMeta: { fontSize: 18, color: '#5A5A5A', flex: 1 },
  textoMetaConcluida: { color: '#CCCCCC', textDecorationLine: 'line-through' },
  iconeLixeira: { fontSize: 24, paddingLeft: 12 },
  botaoVoltar: { backgroundColor: '#4A8DB7', borderRadius: 8, padding: 16, alignItems: 'center' },
  textoBotaoVoltar: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 18 }
});