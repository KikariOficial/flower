import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function MetasScreen() {
  const router = useRouter();
  const [textoNovaMeta, setTextoNovaMeta] = useState('');
  const [listaMetas, setListaMetas] = useState<any[]>([]);
  
  // NOVA MEMÓRIA: Para o usuário escolher a dificuldade
  const [metaEscolhida, setMetaEscolhida] = useState(10);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      // Carrega as metas
      const metasSalvas = await AsyncStorage.getItem('listaDeMetas');
      if (metasSalvas !== null) setListaMetas(JSON.parse(metasSalvas));

      // Carrega a dificuldade escolhida
      const max = await AsyncStorage.getItem('metaMaxima');
      if (max !== null) setMetaEscolhida(parseInt(max));
    } catch (e) {
      console.log('Erro ao carregar dados');
    }
  };

  const salvarListaNaMemoria = async (novaLista: any[]) => {
    setListaMetas(novaLista);
    await AsyncStorage.setItem('listaDeMetas', JSON.stringify(novaLista));
  };

  const adicionarMeta = () => {
    if (textoNovaMeta.trim() !== '') {
      const novaMeta = { id: Date.now().toString(), texto: textoNovaMeta, concluida: false };
      salvarListaNaMemoria([...listaMetas, novaMeta]);
      setTextoNovaMeta('');
    }
  };

  const excluirMeta = (idParaExcluir: string) => {
    const listaAtualizada = listaMetas.filter(meta => meta.id !== idParaExcluir);
    salvarListaNaMemoria(listaAtualizada);
  };

  const concluirMeta = async (idParaConcluir: string) => {
    // 1. Marca como concluída na tela
    const listaAtualizada = listaMetas.map(meta => {
      if (meta.id === idParaConcluir) return { ...meta, concluida: true };
      return meta;
    });
    salvarListaNaMemoria(listaAtualizada);

    // 2. Dá a água na nova variável "aguaEstoque"
    try {
      const aguaAtualString = await AsyncStorage.getItem('aguaEstoque');
      let aguaAtual = aguaAtualString ? parseInt(aguaAtualString) : 0;

      // Lê a meta máxima para não deixar o regador transbordar
      const metaMaxString = await AsyncStorage.getItem('metaMaxima');
      let metaMax = metaMaxString ? parseInt(metaMaxString) : 10;

      if (aguaAtual < metaMax) {
        await AsyncStorage.setItem('aguaEstoque', (aguaAtual + 1).toString());
        Alert.alert('Parabéns!', '+1 gota no seu regador 💧');
      } else {
        Alert.alert('Regador Cheio!', 'Volte ao jardim para regar sua planta!');
      }
    } catch (e) { console.log('Erro ao salvar água'); }
  };

  // ==========================================
  // O BOTÃO CONSERTADO: NOVO DIA
  // ==========================================
// ==========================================
  // O BOTÃO CONSERTADO: NOVO DIA (Ação Direta)
  // ==========================================
  const iniciarNovoDia = () => {
    // 1. Pega todas as metas e muda o status delas para falso (⬜)
    const listaResetada = listaMetas.map(meta => ({ 
      ...meta, 
      concluida: false 
    }));
    
    // 2. Salva na memória e atualiza a tela na mesma hora
    salvarListaNaMemoria(listaResetada); 
    
    // 3. Mostra apenas um aviso simples de sucesso (sem botões de escolha)
    Alert.alert('Bom dia! 🌅', 'Suas metas foram renovadas e estão prontas para hoje!');
  };

  // ==========================================
  // NOVA FUNÇÃO: MUDAR DIFICULDADE
  // ==========================================
  const mudarDificuldade = async (valor: number) => {
    setMetaEscolhida(valor);
    await AsyncStorage.setItem('metaMaxima', valor.toString());
    Alert.alert('Dificuldade Atualizada!', `Sua planta agora precisa de ${valor} gotas para florescer totalmente.`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Minhas Metas Diárias</Text>

      {/* ÁREA DE DIGITAÇÃO */}
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

      {/* LISTA DE METAS */}
      <ScrollView style={styles.listaScroll}>
        {listaMetas.map((meta) => (
          <View key={meta.id} style={styles.itemMeta}>
            <TouchableOpacity style={styles.areaTextoMeta} onPress={() => concluirMeta(meta.id)} disabled={meta.concluida}>
              <Text style={styles.checkbox}>{meta.concluida ? '✅' : '⬜'}</Text>
              <Text style={[styles.textoMeta, meta.concluida && styles.textoMetaConcluida]}>{meta.texto}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => excluirMeta(meta.id)}>
              <Text style={styles.iconeLixeira}>🗑️</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {/* ========================================== */}
      {/* SELETOR DE DIFICULDADE DA PLANTA         */}
      {/* ========================================== */}
      <View style={styles.areaConfig}>
        <Text style={styles.textoConfig}>Gotas para crescer a planta 100%:</Text>
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

      {/* BOTÕES INFERIORES */}
      <TouchableOpacity style={styles.botaoNovoDia} onPress={iniciarNovoDia}>
        <Text style={styles.textoBotaoNovoDia}>🌅 Começar um Novo Dia</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.botaoVoltar} onPress={() => router.back()}>
        <Text style={styles.textoBotaoVoltar}>Voltar para o Jardim</Text>
      </TouchableOpacity>
    </View>
  );
}

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
  
  // Estilos da Nova Área de Dificuldade
  areaConfig: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 8, marginBottom: 16, alignItems: 'center' },
  textoConfig: { fontSize: 16, color: '#5A5A5A', marginBottom: 12, fontWeight: 'bold' },
  linhaBotoesConfig: { flexDirection: 'row', gap: 16 },
  botaoConfig: { paddingVertical: 8, paddingHorizontal: 20, borderRadius: 20, backgroundColor: '#E0E0E0' },
  botaoConfigAtivo: { backgroundColor: '#4A8DB7' }, // Fica azul quando selecionado!
  textoBotaoConfig: { fontWeight: 'bold', color: '#5A5A5A' },
  textoBotaoConfigAtivo: { color: '#FFFFFF' },

  botaoNovoDia: { backgroundColor: '#FFB067', borderRadius: 8, padding: 16, alignItems: 'center', marginBottom: 12 },
  textoBotaoNovoDia: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 18 },
  botaoVoltar: { backgroundColor: '#4A8DB7', borderRadius: 8, padding: 16, alignItems: 'center' },
  textoBotaoVoltar: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 18 }
});