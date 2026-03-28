import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Alert, Modal, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

// ==========================================
// UTILITÁRIOS DE DATA E REPETIÇÃO
// ==========================================
const formatarData = (data: Date) => data.toISOString().split('T')[0];

const gerarDiasCalendario = () => {
  const dias = [];
  const hoje = new Date();
  const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  for (let i = -2; i <= 14; i++) {
    const data = new Date();
    data.setDate(hoje.getDate() + i);
    dias.push({
      id: formatarData(data),
      numero: data.getDate(),
      diaSemana: diasSemana[data.getDay()],
      isHoje: i === 0,
    });
  }
  return dias;
};

export default function MetasScreen() {
  const router = useRouter();
  
  // Lista principal e Calendário
  const [listaMetas, setListaMetas] = useState<any[]>([]);
  const [dataSelecionada, setDataSelecionada] = useState(formatarData(new Date()));
  const [diasCalendario] = useState(gerarDiasCalendario());

  // ==========================================
  // ESTADOS DO MODAL DE NOVA META
  // ==========================================
  const [modalVisivel, setModalVisivel] = useState(false);
  const [novaMetaTexto, setNovaMetaTexto] = useState('');
  const [novaMetaDesc, setNovaMetaDesc] = useState('');
  const [novaMetaTipo, setNovaMetaTipo] = useState('unica'); // unica, diaria, semanal, mensal
  const [novaMetaAlarme, setNovaMetaAlarme] = useState(false);
  const [novaMetaHora, setNovaMetaHora] = useState(''); // Ex: "14:30"

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      const metasSalvas = await AsyncStorage.getItem('listaDeMetasCompleta');
      if (metasSalvas !== null) setListaMetas(JSON.parse(metasSalvas));
    } catch (e) { console.log('Erro ao carregar dados'); }
  };

  const salvarListaNaMemoria = async (novaLista: any[]) => {
    setListaMetas(novaLista);
    await AsyncStorage.setItem('listaDeMetasCompleta', JSON.stringify(novaLista));
  };

  // ==========================================
  // LÓGICA DE CRIAÇÃO (COM ALARMES)
  // ==========================================
  const salvarNovaMeta = async () => {
    if (novaMetaTexto.trim() === '') {
      Alert.alert('Aviso', 'O título da meta é obrigatório.');
      return;
    }

    const novaMeta = { 
      id: Date.now().toString(), 
      texto: novaMetaTexto, 
      descricao: novaMetaDesc,
      tipo: novaMetaTipo,
      dataCriacao: dataSelecionada,
      historico: [], // Array de datas em que foi concluída!
      temAlarme: novaMetaAlarme,
      horaAlarme: novaMetaHora
    };

    // Agendar Alarme (Se o usuário preencheu o horário)
    if (novaMetaAlarme && novaMetaHora.includes(':')) {
      const [hora, minuto] = novaMetaHora.split(':').map(Number);
      
      let repeticao = null;
      if (novaMetaTipo === 'diaria') repeticao = { hour: hora, minute: minuto, repeats: true };
      else if (novaMetaTipo === 'semanal') repeticao = { weekday: new Date(dataSelecionada + 'T00:00:00').getDay() + 1, hour: hora, minute: minuto, repeats: true };

      try {
        await Notifications.scheduleNotificationAsync({
          content: { title: `Lembrete: ${novaMetaTexto} ⏰`, body: novaMetaDesc || 'Chegou a hora de cumprir sua meta!', sound: true },
          trigger: repeticao || { hour: hora, minute: minuto, repeats: false } as any, // Se for única, toca hoje
        });
      } catch (e) { console.log('Erro no alarme'); }
    }

    salvarListaNaMemoria([...listaMetas, novaMeta]);
    
    // Limpa o formulário e fecha
    setNovaMetaTexto(''); setNovaMetaDesc(''); setNovaMetaHora(''); setNovaMetaAlarme(false); setNovaMetaTipo('unica');
    setModalVisivel(false);
  };

  const excluirMeta = (idParaExcluir: string) => {
    const listaAtualizada = listaMetas.filter(meta => meta.id !== idParaExcluir);
    salvarListaNaMemoria(listaAtualizada);
  };

  // ==========================================
  // LÓGICA DE CONCLUSÃO INTELIGENTE
  // ==========================================
  const alternarConclusao = async (meta: any) => {
    const isConcluidaHoje = meta.historico?.includes(dataSelecionada);
    
    const listaAtualizada = listaMetas.map(m => {
      if (m.id === meta.id) {
        let novoHistorico = m.historico || [];
        if (isConcluidaHoje) {
          novoHistorico = novoHistorico.filter((d: string) => d !== dataSelecionada); // Desmarca
        } else {
          novoHistorico = [...novoHistorico, dataSelecionada]; // Marca como feito!
        }
        return { ...m, historico: novoHistorico };
      }
      return m;
    });

    salvarListaNaMemoria(listaAtualizada);

    // Se marcou como concluída (e não desmarcou), ganha água!
    if (!isConcluidaHoje) {
      try {
        const aguaAtualString = await AsyncStorage.getItem('aguaEstoque');
        let aguaAtual = aguaAtualString ? parseInt(aguaAtualString) : 0;
        const metaMaxString = await AsyncStorage.getItem('metaMaxima');
        let metaMax = metaMaxString ? parseInt(metaMaxString) : 10;

        if (aguaAtual < metaMax) {
          await AsyncStorage.setItem('aguaEstoque', (aguaAtual + 1).toString());
          Alert.alert('Parabéns!', '+1 gota no seu regador 💧');
        } else {
          Alert.alert('Regador Cheio!', 'Volte ao jardim para regar sua planta!');
        }
      } catch (e) { console.log('Erro ao salvar água'); }
    }
  };

  // ==========================================
  // FILTRO DO CALENDÁRIO (CÉREBRO DA REPETIÇÃO)
  // ==========================================
  const metasDoDia = listaMetas.filter(meta => {
    const dataMeta = new Date(meta.dataCriacao + 'T00:00:00');
    const dataAtual = new Date(dataSelecionada + 'T00:00:00');
    
    if (dataAtual < dataMeta) return false; // Não mostra metas no passado de quando foram criadas

    if (meta.tipo === 'unica') return meta.dataCriacao === dataSelecionada;
    if (meta.tipo === 'diaria') return true;
    if (meta.tipo === 'semanal') return dataMeta.getDay() === dataAtual.getDay();
    if (meta.tipo === 'mensal') return dataMeta.getDate() === dataAtual.getDate();
    return false;
  });

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Minhas Metas</Text>

      {/* CALENDÁRIO HORIZONTAL */}
      <View style={styles.areaCalendario}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollCalendario}>
          {diasCalendario.map((dia) => {
            const isSelecionado = dia.id === dataSelecionada;
            return (
              <TouchableOpacity key={dia.id} style={[styles.diaCard, isSelecionado && styles.diaCardSelecionado]} onPress={() => setDataSelecionada(dia.id)}>
                <Text style={[styles.diaSemana, isSelecionado && styles.textoSelecionado]}>{dia.isHoje ? 'Hoje' : dia.diaSemana}</Text>
                <Text style={[styles.diaNumero, isSelecionado && styles.textoSelecionado]}>{dia.numero}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* LISTA DE METAS */}
      <ScrollView style={styles.listaScroll}>
        {metasDoDia.length === 0 ? (
          <Text style={styles.textoVazio}>Nenhuma meta para este dia. Que tal planejar algo?</Text>
        ) : (
          metasDoDia.map((meta) => {
            const concluida = meta.historico?.includes(dataSelecionada);
            return (
              <View key={meta.id} style={styles.itemMeta}>
                <TouchableOpacity style={styles.areaTextoMeta} onPress={() => alternarConclusao(meta)}>
                  <Text style={styles.checkbox}>{concluida ? '✅' : '⬜'}</Text>
                  <View style={{flex: 1}}>
                    <Text style={[styles.textoMeta, concluida && styles.textoMetaConcluida]}>{meta.texto}</Text>
                    {meta.descricao ? <Text style={styles.descMeta}>{meta.descricao}</Text> : null}
                    <Text style={styles.badgeTipo}>
                      {meta.tipo === 'diaria' && '🔁 Todo dia'}
                      {meta.tipo === 'semanal' && '📅 Toda semana'}
                      {meta.tipo === 'mensal' && '📆 Todo mês'}
                      {meta.temAlarme && ` ⏰ ${meta.horaAlarme}`}
                    </Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => excluirMeta(meta.id)}>
                  <Text style={styles.iconeLixeira}>🗑️</Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* BOTÕES INFERIORES */}
      <TouchableOpacity style={styles.botaoNovaMeta} onPress={() => setModalVisivel(true)}>
        <Text style={styles.textoBotaoNovaMeta}>+ Criar Nova Meta</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.botaoVoltar} onPress={() => router.back()}>
        <Text style={styles.textoBotaoVoltar}>Voltar para o Jardim</Text>
      </TouchableOpacity>

      {/* ========================================== */}
      {/* MODAL DE CRIAÇÃO AVANÇADA                  */}
      {/* ========================================== */}
      <Modal visible={modalVisivel} animationType="slide" transparent={true}>
        <View style={styles.modalFundo}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitulo}>Nova Meta</Text>
            
            <TextInput style={styles.inputModal} placeholder="Título da meta (ex: Beber Água)" value={novaMetaTexto} onChangeText={setNovaMetaTexto} />
            <TextInput style={[styles.inputModal, { height: 60 }]} placeholder="Descrição opcional..." value={novaMetaDesc} onChangeText={setNovaMetaDesc} multiline />

            <Text style={styles.modalLabel}>Frequência:</Text>
            <View style={styles.linhaBotoes}>
              <TouchableOpacity style={[styles.btnOpcao, novaMetaTipo === 'unica' && styles.btnOpcaoAtivo]} onPress={() => setNovaMetaTipo('unica')}><Text style={novaMetaTipo === 'unica' && styles.textoBranco}>Hoje</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.btnOpcao, novaMetaTipo === 'diaria' && styles.btnOpcaoAtivo]} onPress={() => setNovaMetaTipo('diaria')}><Text style={novaMetaTipo === 'diaria' && styles.textoBranco}>Diária</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.btnOpcao, novaMetaTipo === 'semanal' && styles.btnOpcaoAtivo]} onPress={() => setNovaMetaTipo('semanal')}><Text style={novaMetaTipo === 'semanal' && styles.textoBranco}>Semanal</Text></TouchableOpacity>
            </View>

            <View style={styles.linhaConfigModal}>
              <Text style={styles.modalLabel}>Adicionar Alarme?</Text>
              <Switch value={novaMetaAlarme} onValueChange={setNovaMetaAlarme} trackColor={{ false: '#E0E0E0', true: '#8CB369' }} thumbColor="#FFF" />
            </View>

            {novaMetaAlarme && (
              <TextInput style={styles.inputModal} placeholder="Horário (ex: 14:30)" value={novaMetaHora} onChangeText={setNovaMetaHora} keyboardType="numbers-and-punctuation" />
            )}

            <View style={styles.linhaBotoesModal}>
              <TouchableOpacity style={styles.btnCancelar} onPress={() => setModalVisivel(false)}><Text style={styles.textoBtnModal}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity style={styles.btnSalvar} onPress={salvarNovaMeta}><Text style={[styles.textoBtnModal, styles.textoBranco]}>Salvar Meta</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF9E6', paddingTop: 60, paddingHorizontal: 24, paddingBottom: 40 },
  titulo: { fontSize: 28, fontWeight: 'bold', color: '#8CB369', textAlign: 'center', marginBottom: 20 },
  
  areaCalendario: { height: 80, marginBottom: 20 },
  scrollCalendario: { paddingRight: 20 },
  diaCard: { backgroundColor: '#FFFFFF', borderRadius: 16, paddingVertical: 10, paddingHorizontal: 16, marginRight: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E0E0E0', minWidth: 65 },
  diaCardSelecionado: { backgroundColor: '#8CB369', borderColor: '#8CB369', elevation: 4 },
  diaSemana: { fontSize: 12, color: '#A0A0A0', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: 4 },
  diaNumero: { fontSize: 22, color: '#5A5A5A', fontWeight: 'bold' },
  textoSelecionado: { color: '#FFFFFF' },
  
  listaScroll: { flex: 1, marginBottom: 16 },
  textoVazio: { textAlign: 'center', color: '#A0A0A0', fontSize: 16, marginTop: 40, fontStyle: 'italic' },
  itemMeta: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, marginBottom: 12, elevation: 1 },
  areaTextoMeta: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  checkbox: { fontSize: 20, marginRight: 12 },
  textoMeta: { fontSize: 18, color: '#5A5A5A', fontWeight: 'bold' },
  textoMetaConcluida: { color: '#CCCCCC', textDecorationLine: 'line-through' },
  descMeta: { fontSize: 14, color: '#888', marginTop: 2 },
  badgeTipo: { fontSize: 11, color: '#4A8DB7', marginTop: 6, fontWeight: 'bold' },
  iconeLixeira: { fontSize: 24, paddingLeft: 12 },
  
  botaoNovaMeta: { backgroundColor: '#8CB369', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 12 },
  textoBotaoNovaMeta: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 18 },
  botaoVoltar: { backgroundColor: '#4A8DB7', borderRadius: 12, padding: 16, alignItems: 'center' },
  textoBotaoVoltar: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 18 },

  // Estilos do Modal
  modalFundo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { backgroundColor: '#FFF', width: '100%', borderRadius: 20, padding: 24, elevation: 5 },
  modalTitulo: { fontSize: 22, fontWeight: 'bold', color: '#8CB369', marginBottom: 16, textAlign: 'center' },
  inputModal: { backgroundColor: '#F5F5F5', borderRadius: 8, padding: 14, fontSize: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E0E0E0' },
  modalLabel: { fontSize: 16, fontWeight: 'bold', color: '#5A5A5A', marginBottom: 8, marginTop: 8 },
  linhaBotoes: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  btnOpcao: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: '#E0E0E0', alignItems: 'center' },
  btnOpcaoAtivo: { backgroundColor: '#4A8DB7' },
  textoBranco: { color: '#FFF', fontWeight: 'bold' },
  linhaConfigModal: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  linhaBotoesModal: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 16 },
  btnCancelar: { flex: 1, padding: 16, borderRadius: 12, backgroundColor: '#F0F0F0', alignItems: 'center' },
  btnSalvar: { flex: 1, padding: 16, borderRadius: 12, backgroundColor: '#8CB369', alignItems: 'center' },
  textoBtnModal: { fontSize: 16, fontWeight: 'bold', color: '#5A5A5A' }
});