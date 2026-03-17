import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, StatusBar } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF9E6" />

      {/* ========================================== */}
      {/* TOPO: Menu e Botão de Adicionar Tarefas    */}
      {/* ========================================== */}
      <View style={styles.topBar}>
        <TouchableOpacity>
          <Text style={styles.iconText}>≡</Text>
        </TouchableOpacity>
        
        <TouchableOpacity>
          <Text style={styles.iconText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* ========================================== */}
      {/* CENTRO: A Planta e o Sol                   */}
      {/* ========================================== */}
      <View style={styles.centerArea}>
        <Text style={styles.sunIcon}>☀️</Text>
        
        <Text style={styles.plantIcon}>🪴</Text>
        <Text style={styles.statusText}>Vaso pronto para a semente!</Text>
      </View>

      {/* ========================================== */}
      {/* BASE: Regador e Barra de Água              */}
      {/* ========================================== */}
      <View style={styles.bottomArea}>
        <TouchableOpacity>
          <Text style={styles.wateringCanIcon}>🚿</Text>
        </TouchableOpacity>
        
        <Text style={styles.waterLabel}>WATER</Text>
        
        <View style={styles.progressBarBackground}>
          <View style={styles.progressBarFill} />
        </View>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF9E6', 
    paddingTop: 60, 
    paddingHorizontal: 24,
    paddingBottom: 40,
    justifyContent: 'space-between', 
  },
  topBar: {
    flexDirection: 'row', 
    justifyContent: 'space-between', 
  },
  iconText: {
    fontSize: 40,
    color: '#8CB369', 
    fontWeight: 'bold',
  },
  centerArea: {
    alignItems: 'center', 
    justifyContent: 'center',
  },
  sunIcon: {
    fontSize: 80,
    position: 'absolute', 
    top: -60,
    left: -20,
    opacity: 0.8,
  },
  plantIcon: {
    fontSize: 120,
  },
  statusText: {
    fontSize: 18,
    color: '#5A5A5A',
    marginTop: 16,
    textAlign: 'center',
  },
  bottomArea: {
    alignItems: 'center',
  },
  wateringCanIcon: {
    fontSize: 70,
    marginBottom: 8,
  },
  waterLabel: {
    color: '#4A8DB7',
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 8,
  },
  progressBarBackground: {
    width: '100%',
    height: 20,
    backgroundColor: '#E0E0E0',
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressBarFill: {
    width: '30%', 
    height: '100%',
    backgroundColor: '#4A8DB7',
  },
});