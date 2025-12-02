import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Keyboard,
  TouchableWithoutFeedback,
  Alert,
} from "react-native";
import { Video } from "expo-av";
import { signOut } from "firebase/auth";
import { auth, db } from "./firebaseConfig";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useFonts } from "expo-font";
import { FontAwesome6, AntDesign, Feather } from "@expo/vector-icons";
import * as Speech from "expo-speech";

export default function Teclado({ navigation }) {
  const [texto, setTexto] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [timeoutId, setTimeoutId] = useState(null);
  const [lendo, setLendo] = useState(false);
  const [mostrandoLibras, setMostrandoLibras] = useState(false);
  const [mostrarVideo, setMostrarVideo] = useState(false);

  const handlePrincipal = () => {
    signOut(auth)
      .then(() => navigation.replace("Menu"))
      .catch((error) => alert(error.message));
  };

  // Salvamento automático no Firebase
  useEffect(() => {
    if (texto.trim() === "") return;

    setSalvando(true);
    if (timeoutId) clearTimeout(timeoutId);

    const novoTimeout = setTimeout(async () => {
      try {
        const ref = doc(db, "conversas", "1");
        await setDoc(ref, {
          conteudo: texto,
          atualizadoEm: serverTimestamp(),
        });
        setSalvando(false);
      } catch (error) {
        console.error("Erro ao salvar:", error);
        setSalvando(false);
      }
    }, 1000);

    setTimeoutId(novoTimeout);
  }, [texto]);

  // Função para ler texto - CORRIGIDA PARA ANDROID
  const handleLerTexto = async () => {
    if (!texto.trim()) {
      Alert.alert("Aviso", "Digite algum texto para ouvir.");
      return;
    }

    try {
      // Para o áudio se já estiver tocando
      const isSpeaking = await Speech.isSpeakingAsync();
      if (isSpeaking) {
        await Speech.stop();
        setLendo(false);
        return;
      }

      setLendo(true);

      // Configurações otimizadas para Android
      const options = {
        language: "pt-BR",
        pitch: 1.0,
        rate: 0.9, // Velocidade um pouco mais lenta para melhor clareza
        volume: 1.0, // Volume máximo
        voice: null, // Deixa o sistema escolher a melhor voz
        onStart: () => {
          console.log("Começou a falar");
          setLendo(true);
        },
        onDone: () => {
          console.log("Terminou de falar");
          setLendo(false);
        },
        onStopped: () => {
          console.log("Foi parado");
          setLendo(false);
        },
        onError: (error) => {
          console.error("Erro ao falar:", error);
          setLendo(false);
          Alert.alert(
            "Erro",
            "Não foi possível reproduzir o áudio. Verifique se o volume do dispositivo está ligado."
          );
        },
      };

      await Speech.speak(texto, options);
    } catch (error) {
      console.error("Erro no speech:", error);
      setLendo(false);
      Alert.alert(
        "Erro",
        "Ocorreu um erro ao tentar reproduzir o áudio. Tente novamente."
      );
    }
  };

  // Função para parar a leitura
  const handlePararLeitura = async () => {
    try {
      await Speech.stop();
      setLendo(false);
    } catch (error) {
      console.error("Erro ao parar:", error);
    }
  };

  // Função para mostrar Libras por 14 segundos
  const handleMostrarVideo = () => {
    setMostrandoLibras(true);
    setMostrarVideo(true);
    setTimeout(() => {
      setMostrarVideo(false);
      setMostrandoLibras(false);
    }, 14000);
  };

  // Limpar timeout ao desmontar componente
  useEffect(() => {
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      Speech.stop(); // Para o áudio ao sair da tela
    };
  }, []);

  const [fontsLoaded] = useFonts({
    titulos: require("./assets/fonts/gliker-regular.ttf"),
    textos: require("./assets/fonts/sanchez-font.ttf"),
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#4C7DFF" />
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        {/* Cabeçalho */}
        <View style={styles.menu}>
          <Text style={styles.titulo}>Conecta Libras</Text>
          <TouchableOpacity style={styles.botao} onPress={handlePrincipal}>
            <Feather name="menu" size={50} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Área de texto */}
        <View style={styles.areaTexto}>
          <TextInput
            style={styles.inputGrande}
            placeholder="Digite aqui..."
            placeholderTextColor="#ffffff"
            multiline
            scrollEnabled
            value={texto}
            onChangeText={setTexto}
            textAlignVertical="top"
          />
        </View>

        {/* Botões */}
        <View style={styles.botoes}>
          <TouchableOpacity
            style={styles.libra}
            onPress={handleMostrarVideo}
            activeOpacity={0.7}
          >
            <FontAwesome6
              name="hands"
              size={45}
              color={mostrandoLibras ? "#FFD05A" : "#fff"}
              style={{ transform: [{ rotate: "45deg" }] }}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.som, lendo && styles.somAtivo]}
            onPress={lendo ? handlePararLeitura : handleLerTexto}
            activeOpacity={0.7}
          >
            <AntDesign
              name={lendo ? "pausecircle" : "sound"}
              size={45}
              color={lendo ? "#FFD05A" : "#fff"}
            />
            {lendo && <Text style={styles.textoLendo}>Tocando...</Text>}
          </TouchableOpacity>
        </View>

        {/* Indicador de salvamento */}
        {salvando && (
          <Text style={styles.salvando}>Salvando automaticamente...</Text>
        )}

        {/* Linha divisória */}
        <View style={styles.linha} />

        {/* View do vídeo */}
        {mostrarVideo && (
          <View style={styles.videoContainer}>
            <Video
              source={require("./assets/videos/libras-demo.mp4")}
              rate={1.0}
              volume={0.0}
              isMuted={false}
              resizeMode="contain"
              shouldPlay
              style={{ width: 300, height: 450 }}
            />
          </View>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    backgroundColor: "#000",
  },
  menu: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 50,
  },
  titulo: {
    fontSize: 50,
    marginRight: 120,
    color: "#fff",
    fontFamily: "titulos",
  },
  botao: {
    padding: 10,
  },
  areaTexto: {
    width: "100%",
    alignItems: "center",
    marginTop: 50,
  },
  inputGrande: {
    width: "85%",
    height: 360,
    backgroundColor: "#000",
    padding: 15,
    borderRadius: 15,
    fontSize: 30,
    color: "#fff",
    fontFamily: "textos",
  },
  botoes: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 25,
    width: "85%",
  },
  som: {
    marginLeft: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  somAtivo: {
    opacity: 0.8,
  },
  libra: {
    marginLeft: 20,
  },
  textoLendo: {
    color: "#FFD05A",
    fontSize: 12,
    marginTop: 5,
    fontFamily: "textos",
  },
  salvando: {
    color: "#4C7DFF",
    fontSize: 12,
    marginTop: 10,
    fontFamily: "textos",
  },
  linha: {
    height: 2,
    backgroundColor: "#fff",
    width: "90%",
    marginVertical: 20,
  },
  videoContainer: {
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 15,
    marginTop: 40,
  },
});