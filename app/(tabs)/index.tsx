import React, { useState } from 'react'; // 1. Importamos o useState (a memória!)
import { StyleSheet, Text, View, TouchableOpacity, StatusBar, Alert } from 'react-native'; // Importamos o Alert para avisos na tela

export default function HomeScreen() {
  // ==========================================
  // O CÉREBRO: Criando a memória do nosso app
  // ==========================================
  
  // "agua" é o valor. "setAgua" é o comando para alterar o valor. Começa em 0.
  const [agua, setAgua] = useState(0); 
  
  // 0: Vaso, 1: Semente, 2: Broto, 3: Flor
  const [estagioPlanta, setEstagioPlanta] = useState(0); 
  
  const MAX_AGUA = 10;

  // Função que roda quando clicamos no botão "+"
  const adicionarAgua = () => {
    if (agua < MAX_AGUA) {
      setAgua(agua + 1); // Aumenta 1 gota. O React vai atualizar a barra de progresso sozinho!
    } else {
      Alert.alert('Regador Cheio!', 'Seu regador já está no limite de 10 gotas.');
    }
  };

  // Função que roda quando clicamos no regador "🚿"
  const regarPlanta = () => {
    if (agua > 0 && estagioPlanta < 3) {
      setAgua(agua - 1); // Gasta 1 gota
      setEstagioPlanta(estagioPlanta + 1); // Planta cresce!
    } else if (agua === 0) {
      Alert.alert('Falta Água', 'Você precisa cumprir metas (clicar no +) para ter água!');
    }
  };

  // ==========================================
  // LÓGICA VISUAL: O que mostrar na tela?
  // ==========================================
  
  let emojiPlanta = '🪴';
  let textoStatus = 'Vaso pronto para a semente!';

  if (estagioPlanta === 1) {
    emojiPlanta = '🟤';
    textoStatus = 'Semente plantada. Regue mais!';
  } else if (estagioPlanta === 2) {
    emojiPlanta = '🌱';
    textoStatus = 'Um lindo broto! Continue regando.';
  } else if (estagioPlanta === 3) {
    emojiPlanta = '🌻';
    textoStatus = 'Seu jardim floresceu! Parabéns!';
  }

  // Matemática simples para calcular a porcentagem da barra de água (Ex: 5 de água = 50%)
  const porcentagemAgua = (agua / MAX_AGUA) * 100;

  // ==========================================
  // O ROSTO: Desenhando a tela
  // ==========================================
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF9E6" />

      {/* TOPO */}
      <View style={styles.topBar}>
        <TouchableOpacity>
          <Text style={styles.iconText}>≡</Text>
        </TouchableOpacity>
        
        {/* Adicionamos o "onPress" aqui! Ele chama a nossa função. */}
        <TouchableOpacity onPress={adicionarAgua}>
          <Text style={styles.iconText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* CENTRO */}
      <View style={styles.centerArea}>
        <Text style={styles.sunIcon}>☀️</Text>
        
        {/* Agora o texto puxa a nossa variável inteligente */}
        <Text style={styles.plantIcon}>{emojiPlanta}</Text>
        <Text style={styles.statusText}>{textoStatus}</Text>
      </View>

      {/* BASE */}
      <View style={styles.bottomArea}>
        
        {/* Adicionamos o "onPress" no regador também! */}
        <TouchableOpacity onPress={regarPlanta}>
          <Text style={styles.wateringCanIcon}>🚿</Text>
        </TouchableOpacity>
        
        <Text style={styles.waterLabel}>WATER</Text>
        
        <View style={styles.progressBarBackground}>
          {/* A MÁGICA DA BARRA: O tamanho agora é calculado automaticamente! */}
          <View style={[styles.progressBarFill, { width: `${porcentagemAgua}%` }]} />
        </View>
      </View>

    </View>
  );
}

// O Estilo (StyleSheet) continua idêntico!
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF9E6', paddingTop: 60, paddingHorizontal: 24, paddingBottom: 40, justifyContent: 'space-between' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between' },
  iconText: { fontSize: 40, color: '#8CB369', fontWeight: 'bold' },
  centerArea: { alignItems: 'center', justifyContent: 'center' },
  sunIcon: { fontSize: 80, position: 'absolute', top: -60, left: -20, opacity: 0.8 },
  plantIcon: { fontSize: 120 },
  statusText: { fontSize: 18, color: '#5A5A5A', marginTop: 16, textAlign: 'center' },
  bottomArea: { alignItems: 'center' },
  wateringCanIcon: { fontSize: 70, marginBottom: 8 },
  waterLabel: { color: '#4A8DB7', fontWeight: 'bold', letterSpacing: 2, marginBottom: 8 },
  progressBarBackground: { width: '100%', height: 20, backgroundColor: '#E0E0E0', borderRadius: 10, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#4A8DB7' }, // Tiramos o width fixo daqui
});