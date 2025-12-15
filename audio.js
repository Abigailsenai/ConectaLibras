//Audio
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { signOut } from "firebase/auth"; 
import { auth } from "./firebaseConfig";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { useFonts } from "expo-font";
import Feather from "@expo/vector-icons/Feather";

// Inicializar Firestore
const db = getFirestore();

export default function Audio({ navigation }) {
  const [transcricao, setTranscricao] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePrincipal = () => {
    signOut(auth)
      .then(() => {
        navigation.replace("Menu");
      })
      .catch((error) => {
        alert(error.message);
      });
  };

  const [fontsLoaded] = useFonts({
    titulos: require("./assets/fonts/gliker-regular.ttf"),
    textos: require("./assets/fonts/sanchez-font.ttf"),
  });

  const buscarTranscricao = async () => {
    try {
      setLoading(true);
      setTranscricao('');

      // Buscar documento do Firestore
      const docRef = doc(db, 'textoTranscricao', '653cgeO9NsObnNftR5vk');
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        
        if (data.texto) {
          setTranscricao(data.texto);
        } else {
          Alert.alert('Aviso', 'O campo "texto" está vazio no documento');
        }
      } else {
        Alert.alert('Erro', 'Documento não encontrado no Firebase');
      }

      setLoading(false);
    } catch (error) {
      console.error('Erro ao buscar transcrição:', error);
      setLoading(false);
      Alert.alert('Erro', 'Não foi possível buscar a transcrição: ' + error.message);
    }
  };

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#000" }}>
        <ActivityIndicator size="large" color="#419EBC" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Menu no topo */}
      <View style={styles.menu}>
        <Text style={styles.titulo}>Conecta Libras</Text>
        <TouchableOpacity style={styles.botao} onPress={handlePrincipal}>
          <Feather name="menu" size={50} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Conteúdo Principal */}
      <View style={styles.content}>
        <Text style={styles.pageTitle}>Transcrição de Áudio</Text>

        <TouchableOpacity
          style={styles.btnBuscar}
          onPress={buscarTranscricao}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Feather name="download" size={24} color="#fff" style={styles.btnIcon} />
              <Text style={styles.btnBuscarText}>Buscar Transcrição</Text>
            </>
          )}
        </TouchableOpacity>

        {transcricao ? (
          <ScrollView style={styles.transcricaoBox} showsVerticalScrollIndicator={true}>
            <Text style={styles.transcricaoText}>{transcricao}</Text>
          </ScrollView>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  menu: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: 50,
    marginBottom: 30,
  },
  titulo: {
    fontSize: 50,
    color: "#fff",
    fontFamily: "titulos",
  },
  botao: {
    padding: 10,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 30,
    fontFamily: 'titulos',
  },
  btnBuscar: {
    flexDirection: 'row',
    backgroundColor: '#419EBC',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#419EBC',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 30,
  },
  btnIcon: {
    marginRight: 10,
  },
  btnBuscarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'textos',
  },
  transcricaoBox: {
    width: '80%',
    backgroundColor: '#000',
    borderRadius: 10,
    padding: 20,
    borderWidth: 2,
    borderColor: '#419EBC',
    maxHeight: '70%',
  },
  transcricaoText: {
    fontSize: 18,
    color: '#fff',
    lineHeight: 28,
    fontFamily: 'textos',
  },
});