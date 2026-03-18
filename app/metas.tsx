import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router'; // O nosso "táxi" para navegar entre telas

export default function MetasScreen() {
  const router = useRouter(); // Ligando o táxi
  
  // Memória para guardar o texto que o usuário está digitando
  const [textoNovaMeta, setTextoNovaMeta] = useState('');
  
  // Memória para guardar a lista de metas (já deixei duas de exemplo!)
  const [listaMetas, setListaMetas] = useState([
    { id: '1', texto: 'Beber 2L de Água', concluida: false },
    { id: '2', texto: 'Ler 15 páginas', concluida: false }
  ]);

  // Função para adicionar uma nova meta
  const adicionarMeta = () => {
    // Só adiciona se o texto não estiver vazio
    if (textoNovaMeta.trim() !== '') {
      const novaMeta = {
        id: Date.now().toString(), // Cria um ID único usando a hora atual
        texto: textoNovaMeta,
        concluida: false
      };
      
      // O comando abaixo significa: "Pegue todas as metas que já existem (...listaMetas) e adicione a novaMeta no final"
      setListaMetas([...listaMetas, novaMeta]);
      setTextoNovaMeta(''); // Limpa o campo de digitação
    }
  };

  // Função para excluir
  const excluirMeta = (idParaExcluir: string) => {
    // Filtra a lista, mantendo apenas as metas que NÃO tem esse ID
    const listaAtualizada = listaMetas.filter(meta => meta.id !== idParaExcluir);
    setListaMetas(listaAtualizada);
  };

  // Função para marcar como concluída (Futuramente vai dar +1 de água!)
  const concluirMeta = (idParaConcluir: string) => {
    const listaAtualizada = listaMetas.map(meta => {
      if (meta.id === idParaConcluir) {
        return { ...meta, concluida: true }; // Muda o status para verdadeiro
      }
      return meta;
    });
    setListaMetas(listaAtualizada);
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
          onChangeText={setTextoNovaMeta} // Atualiza a memória a cada letra digitada
        />
        <TouchableOpacity style={styles.botaoAdicionar} onPress={adicionarMeta}>
          <Text style={styles.textoBotaoAdicionar}>Adicionar</Text>
        </TouchableOpacity>
      </View>

      {/* LISTA DE METAS */}
      <ScrollView style={styles.listaScroll}>
        {/* O comando 'map' repete o desenho para cada meta na lista */}
        {listaMetas.map((meta) => (
          <View key={meta.id} style={styles.itemMeta}>
            
            {/* O "Botão" da Meta (A Caixinha) */}
            <TouchableOpacity 
              style={styles.areaTextoMeta} 
              onPress={() => concluirMeta(meta.id)}
              disabled={meta.concluida} // Trava se já foi feita
            >
              <Text style={styles.checkbox}>
                {meta.concluida ? '✅' : '⬜'}
              </Text>
              <Text style={[styles.textoMeta, meta.concluida && styles.textoMetaConcluida]}>
                {meta.texto}
              </Text>
            </TouchableOpacity>

            {/* O Botão de Lixeira */}
            <TouchableOpacity onPress={() => excluirMeta(meta.id)}>
              <Text style={styles.iconeLixeira}>🗑️</Text>
            </TouchableOpacity>
            
          </View>
        ))}
      </ScrollView>

      {/* BOTÃO VOLTAR */}
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
  textoMetaConcluida: { color: '#CCCCCC', textDecorationLine: 'line-through' }, // Risca o texto quando concluído!
  iconeLixeira: { fontSize: 24, paddingLeft: 12 },
  botaoVoltar: { backgroundColor: '#4A8DB7', borderRadius: 8, padding: 16, alignItems: 'center' },
  textoBotaoVoltar: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 18 }
});