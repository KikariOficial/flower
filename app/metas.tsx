import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Alert, Modal, Switch, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import DateTimePicker from '@react-native-community/datetimepicker';

// ==========================================
// UTILITÁRIOS
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
  
  const [listaMetas, setListaMetas] = useState<any[]>([]);
  const [dataSelecionada, setDataSelecionada] = useState(formatarData(new Date()));
  const [diasCalendario] = useState(gerarDiasCalendario());

  // ==========================================
  // ESTADOS DO MODAL SOFISTICADO
  // ==========================================
  const [modalVisivel, setModalVisivel] = useState(false);
  const [novaMetaTexto, setNovaMetaTexto] = useState('');
  const [novaMetaDesc, setNovaMetaDesc] = useState('');
  const [novaMetaTipo, setNovaMetaTipo] = useState('unica'); // unica, diaria, semanal, mensal
  const [novaMetaAlarme, setNovaMetaAlarme] = useState(false);
  
  // Novos Estados do Relógio e Dias
  const [horaAlarme, setHoraAlarme] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [diasSelecionados, setDiasSelecionados] = useState<number[]>([]); // Ex: [1, 3, 5] para Seg, Qua, Sex

  const diasDaSemanaTexto = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

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
  // LÓGICA DE AGENDAMENTO AVANÇADO
  // ==========================================
  const salvarNovaMeta = async () => {
    if (novaMetaTexto.trim() === '') {
      Alert.alert('Aviso', 'O título da meta é obrigatório.');
      return;
    }

    if (novaMetaTipo === 'semanal' && novaMetaAlarme && diasSelecionados.length === 0) {
      Alert.alert('Aviso', 'Selecione pelo menos um dia da semana para o alarme tocar.');
      return;
    }

    const formatadorHora = horaAlarme.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const novaMeta = { 
      id: Date.now().toString(), 
      texto: novaMetaTexto, 
      descricao: novaMetaDesc,
      tipo: novaMetaTipo,
      dataCriacao: dataSelecionada,
      historico: [], 
      temAlarme: novaMetaAlarme,
      horaAlarme: formatadorHora,
      diasAlarme: diasSelecionados // Guarda os dias específicos escolhidos
    };

    // MOTOR DE ALARMES MÚLTIPLOS
    if (novaMetaAlarme) {
      const hora = horaAlarme.getHours();
      const minuto = horaAlarme.getMinutes();
      
      try {
        if (novaMetaTipo === 'semanal') {
          // Agenda um alarme diferente para CADA dia da semana selecionado!
          for (const dia of diasSelecionados) {
            await Notifications.scheduleNotificationAsync({
              content: { title: `Lembrete: ${novaMetaTexto} ⏰`, body: novaMetaDesc || 'Chegou a hora!', sound: true},
              trigger: { weekday: dia + 1, hour: hora, minute: minuto, repeats: true } as any
            });
          }
        } else {
          // Diária ou Única
          await Notifications.scheduleNotificationAsync({
            content: { title: `Lembrete: ${novaMetaTexto} ⏰`, body: novaMetaDesc || 'Chegou a hora!', sound: true},
            trigger: { hour: hora, minute: minuto, repeats: novaMetaTipo === 'diaria' } as any 
          });
        }
      } catch (e) { console.log('Erro no alarme', e); }
    }

    salvarListaNaMemoria([...listaMetas, novaMeta]);
    fecharModalLimpo();
  };

  const fecharModalLimpo = () => {
    setNovaMetaTexto(''); setNovaMetaDesc(''); setNovaMetaAlarme(false); setNovaMetaTipo('unica'); setDiasSelecionados([]);
    setModalVisivel(false);
  };

  const excluirMeta = (idParaExcluir: string) => {
    const listaAtualizada = listaMetas.filter(meta => meta.id !== idParaExcluir);
    salvarListaNaMemoria(listaAtualizada);
  };

  const alternarConclusao = async (meta: any) => {
    const isConcluidaHoje = meta.historico?.includes(dataSelecionada);
    const listaAtualizada = listaMetas.map(m => {
      if (m.id === meta.id) {
        let novoHistorico = m.historico || [];
        if (isConcluidaHoje) novoHistorico = novoHistorico.filter((d: string) => d !== dataSelecionada);
        else novoHistorico = [...novoHistorico, dataSelecionada];
        return { ...m, historico: novoHistorico };
      }
      return m;
    });

    salvarListaNaMemoria(listaAtualizada);

    if (!isConcluidaHoje) {
      try {
        const aguaAtualString = await AsyncStorage.getItem('aguaEstoque');
        let aguaAtual = aguaAtualString ? parseInt(aguaAtualString) : 0;
        await AsyncStorage.setItem('aguaEstoque', (aguaAtual + 1).toString());
        Alert.alert('Parabéns! 🎉', '+1 gota no seu regador 💧');
      } catch (e) {}
    }
  };

  const metasDoDia = listaMetas.filter(meta => {
    const dataMeta = new Date(meta.dataCriacao + 'T00:00:00');
    const dataAtual = new Date(dataSelecionada + 'T00:00:00');
    if (dataAtual < dataMeta) return false; 
    if (meta.tipo === 'unica') return meta.dataCriacao === dataSelecionada;
    if (meta.tipo === 'diaria') return true;
    if (meta.tipo === 'semanal') {
      // Se for semanal e tiver dias específicos configurados, checa se hoje é um desses dias
      const diaSemanaHoje = dataAtual.getDay();
      return meta.diasAlarme?.length > 0 ? meta.diasAlarme.includes(diaSemanaHoje) : dataMeta.getDay() === diaSemanaHoje;
    }
    if (meta.tipo === 'mensal') return dataMeta.getDate() === dataAtual.getDate();
    return false;
  });

  // FUNÇÕES DE INTERFACE DO ALARME
  const onChangeTime = (event: any, selectedDate?: Date) => {
    setShowTimePicker(Platform.OS === 'ios'); // iOS mantém aberto, Android fecha após selecionar
    if (selectedDate) setHoraAlarme(selectedDate);
  };

  const toggleDiaSemana = (index: number) => {
    if (diasSelecionados.includes(index)) {
      setDiasSelecionados(diasSelecionados.filter(d => d !== index));
    } else {
      setDiasSelecionados([...diasSelecionados, index].sort());
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Minhas Metas</Text>

      {/* CALENDÁRIO */}
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

      {/* LISTA */}
      <ScrollView style={styles.listaScroll}>
        {metasDoDia.length === 0 ? (
          <Text style={styles.textoVazio}>Nenhuma meta para este dia.</Text>
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
                      {meta.tipo === 'semanal' && `📅 Semanal`}
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
      {/* BOTÕES INFERIORES (Escondidos quando o Modal abre) */}
      {!modalVisivel && (
        <>
          <TouchableOpacity style={styles.botaoNovaMeta} onPress={() => setModalVisivel(true)}>
            <Text style={styles.textoBotaoNovaMeta}>+ Criar Nova Meta</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.botaoVoltar} onPress={() => router.back()}>
            <Text style={styles.textoBotaoVoltar}>Voltar para o Jardim</Text>
          </TouchableOpacity>
        </>
      )}

      {/* ========================================== */}
      {/* NOVO MODAL SOFISTICADO                     */}
      {/* ========================================== */}
      <Modal visible={modalVisivel} animationType="slide" transparent={true}>
        <View style={styles.modalFundo}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitulo}>Nova Meta</Text>
            
            <TextInput style={styles.inputModal} placeholder="Título da meta..." value={novaMetaTexto} onChangeText={setNovaMetaTexto} />
            <TextInput style={[styles.inputModal, { height: 60 }]} placeholder="Descrição opcional..." value={novaMetaDesc} onChangeText={setNovaMetaDesc} multiline />

            <Text style={styles.modalLabel}>Frequência:</Text>
            <View style={styles.linhaBotoes}>
              {['unica', 'diaria', 'semanal'].map((tipo) => (
                <TouchableOpacity key={tipo} style={[styles.btnOpcao, novaMetaTipo === tipo && styles.btnOpcaoAtivo]} onPress={() => setNovaMetaTipo(tipo)}>
                  <Text style={novaMetaTipo === tipo && styles.textoBranco}>{tipo.charAt(0).toUpperCase() + tipo.slice(1)}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.divisoriaModal} />

            {/* SEÇÃO DO ALARME SOFISTICADA */}
            <View style={styles.linhaConfigModal}>
              <Text style={styles.modalLabel}>Lembrete de Alarme</Text>
              <Switch value={novaMetaAlarme} onValueChange={setNovaMetaAlarme} trackColor={{ false: '#E0E0E0', true: '#8CB369' }} thumbColor="#FFF" />
            </View>

            {novaMetaAlarme && (
              <View style={styles.painelAlarme}>
                {/* 1. RELÓGIO GIGANTE CLICÁVEL */}
                <TouchableOpacity style={styles.btnRelogio} onPress={() => setShowTimePicker(true)}>
                  <Text style={styles.textoRelogio}>
                    {horaAlarme.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                  <Text style={styles.textoSubRelogio}>Toque para alterar o horário</Text>
                </TouchableOpacity>

                {showTimePicker && (
                  <DateTimePicker value={horaAlarme} mode="time" is24Hour={true} display="spinner" onChange={onChangeTime} />
                )}

                {/* 2. SELETOR DE DIAS DA SEMANA (Aparece só se for Semanal) */}
                {novaMetaTipo === 'semanal' && (
                  <View style={styles.seletorDias}>
                    <Text style={styles.modalLabelPequeno}>Quais dias?</Text>
                    <View style={styles.linhaDias}>
                      {diasDaSemanaTexto.map((letra, index) => {
                        const selecionado = diasSelecionados.includes(index);
                        return (
                          <TouchableOpacity key={index} style={[styles.bolinhaDia, selecionado && styles.bolinhaDiaAtiva]} onPress={() => toggleDiaSemana(index)}>
                            <Text style={[styles.textoDia, selecionado && styles.textoDiaAtivo]}>{letra}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}
              </View>
            )}

            <View style={styles.linhaBotoesModal}>
              <TouchableOpacity style={styles.btnCancelar} onPress={fecharModalLimpo}><Text style={styles.textoBtnModal}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity style={styles.btnSalvar} onPress={salvarNovaMeta}><Text style={[styles.textoBtnModal, styles.textoBranco]}>Salvar</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  // ... (Estilos da tela principal mantidos iguais, focaremos nos novos estilos do Modal)
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

  // NOVOS ESTILOS DO MODAL
  modalFundo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#FFF', width: '100%', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, elevation: 10, maxHeight: '90%' },
  modalTitulo: { fontSize: 24, fontWeight: 'bold', color: '#8CB369', marginBottom: 16, textAlign: 'center' },
  inputModal: { backgroundColor: '#F5F5F5', borderRadius: 12, padding: 14, fontSize: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E0E0E0' },
  modalLabel: { fontSize: 16, fontWeight: 'bold', color: '#5A5A5A', marginBottom: 8, marginTop: 8 },
  linhaBotoes: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  btnOpcao: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: '#F0F0F0', alignItems: 'center' },
  btnOpcaoAtivo: { backgroundColor: '#4A8DB7' },
  textoBranco: { color: '#FFF', fontWeight: 'bold' },
  divisoriaModal: { height: 1, backgroundColor: '#E0E0E0', marginVertical: 16 },
  linhaConfigModal: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  
  // PAINEL DO ALARME
  painelAlarme: { backgroundColor: '#F9F9F9', borderRadius: 16, padding: 16, marginTop: 12, borderWidth: 1, borderColor: '#E0E0E0', alignItems: 'center' },
  btnRelogio: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, width: '100%', alignItems: 'center', borderWidth: 1, borderColor: '#8CB369', shadowColor: '#8CB369', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  textoRelogio: { fontSize: 42, fontWeight: 'bold', color: '#5A5A5A', letterSpacing: 2 },
  textoSubRelogio: { fontSize: 12, color: '#A0A0A0', marginTop: 4 },
  
  // SELETOR DE DIAS DA SEMANA
  seletorDias: { width: '100%', marginTop: 16, alignItems: 'center' },
  modalLabelPequeno: { fontSize: 14, fontWeight: 'bold', color: '#A0A0A0', marginBottom: 8 },
  linhaDias: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', gap: 4 },
  bolinhaDia: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#E0E0E0', justifyContent: 'center', alignItems: 'center' },
  bolinhaDiaAtiva: { backgroundColor: '#F4A261' }, // Cor laranja amigável para destacar os dias
  textoDia: { fontSize: 14, fontWeight: 'bold', color: '#5A5A5A' },
  textoDiaAtivo: { color: '#FFF' },

  linhaBotoesModal: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 24, marginBottom: Platform.OS === 'ios' ? 20 : 0 },
  btnCancelar: { flex: 1, padding: 16, borderRadius: 12, backgroundColor: '#F0F0F0', alignItems: 'center' },
  btnSalvar: { flex: 1, padding: 16, borderRadius: 12, backgroundColor: '#8CB369', alignItems: 'center' },
  textoBtnModal: { fontSize: 16, fontWeight: 'bold', color: '#5A5A5A' }
});