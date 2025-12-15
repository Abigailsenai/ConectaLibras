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
  Platform,
} from "react-native";
import { Video, Audio } from "expo-av";
import { signOut } from "firebase/auth";
import { auth, db } from "./firebaseConfig";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
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

  // Configurar áudio ao montar componente (IMPORTANTE PARA TABLET)
  useEffect(() => {
    configurarAudio();
    carregarTextoDoFirebase();
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      Speech.stop();
    };
  }, []);

  // Configuração de áudio para dispositivos físicos
  const configurarAudio = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      console.log("✅ Áudio configurado com sucesso");
    } catch (error) {
      console.error("❌ Erro ao configurar áudio:", error);
    }
  };

  // Carregar texto do Firebase ao iniciar
  const carregarTextoDoFirebase = async () => {
    try {
      const ref = doc(db, "conversas", "1");
      const snapshot = await getDoc(ref);
      if (snapshot.exists()) {
        const dados = snapshot.data();
        setTexto(dados.conteudo || "");
        console.log("✅ Texto carregado do Firebase");
      }
    } catch (error) {
      console.error("❌ Erro ao carregar texto:", error);
    }
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
        console.log("✅ Texto salvo no Firebase");
      } catch (error) {
        console.error("❌ Erro ao salvar:", error);
        setSalvando(false);
      }
    }, 1000);

    setTimeoutId(novoTimeout);
  }, [texto]);

  // Função para ler texto - OTIMIZADA PARA TABLET ANDROID 12
  const handleLerTexto = async () => {
    if (!texto.trim()) {
      Alert.alert("Aviso", "Digite algum texto para ouvir.");
      return;
    }

    try {
      // Para se já estiver falando
      const isSpeaking = await Speech.isSpeakingAsync();
      if (isSpeaking) {
        await Speech.stop();
        setLendo(false);
        console.log("⏹️ Leitura parada");
        return;
      }

      console.log("🔊 Iniciando leitura...");
      setLendo(true);

      // Configurações testadas e funcionando
      const opcoes = {
        language: "pt-BR",
        pitch: 1.0,
        rate: 0.9, // Velocidade ajustada para clareza
        volume: 1.0, // Volume máximo
        onStart: () => {
          console.log("▶️ Leitura iniciada");
          setLendo(true);
        },
        onDone: () => {
          console.log("✅ Leitura concluída");
          setLendo(false);
        },
        onStopped: () => {
          console.log("⏹️ Leitura interrompida");
          setLendo(false);
        },
        onError: (error) => {
          console.error("❌ Erro na leitura:", error);
          setLendo(false);
          Alert.alert(
            "Erro no Áudio",
            "Não foi possível reproduzir o áudio.\n\n" +
            "Verifique:\n" +
            "• Volume do tablet está alto?\n" +
            "• Modo silencioso desativado?\n" +
            "• Aplicativo em primeiro plano?\n\n" +
            `Detalhes: ${error}`
          );
        },
      };

      // Fala o texto
      await Speech.speak(texto, opcoes);

    } catch (error) {
      console.error("❌ Erro crítico:", error);
      setLendo(false);
      Alert.alert(
        "Erro",
        `Não foi possível iniciar o áudio.\n\n${error.message || error}`
      );
    }
  };

  // Função para parar a leitura
  const handlePararLeitura = async () => {
    try {
      await Speech.stop();
      setLendo(false);
      console.log("⏹️ Leitura parada manualmente");
    } catch (error) {
      console.error("❌ Erro ao parar:", error);
      setLendo(false);
    }
  };

  // Função para mostrar Libras por 14 segundos
  const handleMostrarVideo = () => {
    setMostrandoLibras(true);
    setMostrarVideo(true);
    console.log("👐 Mostrando vídeo Libras");
    setTimeout(() => {
      setMostrarVideo(false);
      setMostrandoLibras(false);
      console.log("👐 Vídeo Libras finalizado");
    }, 14000);
  };

  // Botão de teste de áudio
  const handleTesteAudio = async () => {
    try {
      console.log("🧪 Iniciando teste de áudio...");
      await Speech.speak("Teste de áudio funcionando perfeitamente", {
        language: "pt-BR",
        pitch: 1.0,
        rate: 0.9,
        onDone: () => {
          Alert.alert(
            "✅ Teste Bem-Sucedido",
            "Se você ouviu a mensagem, o Text-to-Speech está funcionando!\n\n" +
            "O botão principal também deve funcionar."
          );
        },
        onError: (error) => {
          Alert.alert(
            "❌ Teste Falhou",
            `O áudio não funcionou.\n\n` +
            `Verifique:\n` +
            `• Volume do dispositivo\n` +
            `• Configurações de som\n` +
            `• TTS instalado (Google Text-to-Speech)\n\n` +
            `Erro: ${error}`
          );
        },
      });
    } catch (error) {
      Alert.alert("❌ Erro no Teste", `${error.message || error}`);
    }
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
            placeholderTextColor="#000"
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
    backgroundColor: "#1a1a1a",
    padding: 15,
    borderRadius: 15,
    fontSize: 30,
    color: "#fff",
    fontFamily: "textos",
    borderWidth: 1,
    borderColor: "#333",
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
  botaoTeste: {
    marginLeft: 20,
    backgroundColor: "#4C7DFF",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
  },
  textoTeste: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "textos",
    fontWeight: "bold",
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