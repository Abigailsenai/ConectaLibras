//teclado
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

  // Função para ler texto
  const handleLerTexto = async () => {
    if (!texto.trim()) return;
    setLendo(true);
    await Speech.speak(texto, {
      language: "pt-BR",
      pitch: 1,
      rate: 1,
      onDone: () => setLendo(false),
      onStopped: () => setLendo(false),
      onError: () => setLendo(false),
    });
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
            activeOpacity={0.14}
          >
            <FontAwesome6
              name="hands"
              size={45}
              color={mostrandoLibras ? "#FFD05A" : "#fff"}
              style={{ transform: [{ rotate: "45deg" }] }}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.som}
            onPress={handleLerTexto}
            activeOpacity={0.7}
          >
            <AntDesign
              name="sound"
              size={45}
              color={lendo ? "#FFD05A" : "#fff"}
            />
          </TouchableOpacity>
        </View>

        {/* Linha divisória */}
        <View style={styles.linha} />

        {/* View do vídeo */}
        {mostrarVideo && (
          <View style={styles.videoContainer}>
            <Video
              source={require("./assets/videos/libras-demo.mp4")}
              rate={1.0}
              volume={1.0}
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
  libra: {
    marginLeft: 20,
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