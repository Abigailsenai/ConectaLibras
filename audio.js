import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
  TextInput,
} from "react-native";
import { signOut } from "firebase/auth";
import { auth } from "./firebaseConfig";
import { useFonts } from "expo-font";
import Feather from "@expo/vector-icons/Feather";
import { Audio as ExpoAudio } from "expo-av";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system'; 

const DEFAULT_API_URL = "http://10.221.24.4:5000/api"; // mantenha seu IP

export default function Audio({ navigation }) {
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcriptionText, setTranscriptionText] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [apiUrl, setApiUrl] = useState(DEFAULT_API_URL);
  const [showSettings, setShowSettings] = useState(false);
  const [debugLog, setDebugLog] = useState([]);

  // Log de debug
  const addLog = (message) => {
    console.log(message);
    setDebugLog(prev => [...prev.slice(-10), `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  React.useEffect(() => {
    loadSavedApiUrl();
  }, []);

  const loadSavedApiUrl = async () => {
    try {
      const savedUrl = await AsyncStorage.getItem('api_url');
      if (savedUrl) {
        setApiUrl(savedUrl);
        addLog(`URL carregada: ${savedUrl}`);
      }
    } catch (error) {
      addLog(`Erro ao carregar URL: ${error.message}`);
    }
  };

  const saveApiUrl = async (url) => {
    try {
      await AsyncStorage.setItem('api_url', url);
      setApiUrl(url);
      Alert.alert('✅ Sucesso', 'URL da API salva!');
      setShowSettings(false);
      addLog(`URL salva: ${url}`);
    } catch (error) {
      Alert.alert('❌ Erro', 'Não foi possível salvar a URL');
      addLog(`Erro ao salvar: ${error.message}`);
    }
  };

  const testConnection = async () => {
    addLog(`🔍 Testando: ${apiUrl}/get_status`);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      addLog("Enviando requisição GET...");
      
      const response = await fetch(`${apiUrl}/get_status`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      addLog(`Resposta recebida: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        addLog(`Dados: ${JSON.stringify(data)}`);
        Alert.alert('✅ Sucesso!', `Servidor está online!\n\nStatus: ${response.status}\nResposta: ${JSON.stringify(data, null, 2)}`);
      } else {
        const text = await response.text();
        addLog(`Erro: ${text}`);
        Alert.alert('⚠️ Servidor Respondeu', `Status: ${response.status}\n\n${text.substring(0, 200)}`);
      }
    } catch (error) {
      addLog(`❌ Exceção: ${error.name} - ${error.message}`);
      
      let errorMsg = '❌ Falha na Conexão\n\n';
      
      if (error.name === 'AbortError') {
        errorMsg += '⏱️ TIMEOUT (5s)\n\nO servidor não respondeu.\n\n';
      } else if (error.message.includes('Network request failed')) {
        errorMsg += '🌐 ERRO DE REDE\n\nO dispositivo não conseguiu conectar.\n\n';
      } else {
        errorMsg += `Erro: ${error.message}\n\n`;
      }
      
      errorMsg += '🔧 Diagnósticos:\n\n';
      errorMsg += `1. Servidor Python rodando?\n`;
      errorMsg += `2. PC e Tablet na mesma WiFi?\n`;
      errorMsg += `3. Firewall liberado (porta 5000)?\n`;
      errorMsg += `4. IP correto: ${apiUrl.replace('/api', '')}?\n\n`;
      errorMsg += `📍 Testado: ${apiUrl}/get_status`;
      
      Alert.alert('Erro de Conexão', errorMsg);
    }
  };

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

  async function startRecording() {
    try {
      addLog("🎙️ Solicitando permissão...");
      const permission = await ExpoAudio.requestPermissionsAsync();

      if (permission.status !== "granted") {
        Alert.alert("❌ Erro", "Permissão para gravar áudio negada");
        addLog("❌ Permissão negada");
        return;
      }

      addLog("✅ Permissão concedida");

      await ExpoAudio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      addLog("🎙️ Configurando gravação WAV 16kHz...");

      const recordingOptions = {
        isMeteringEnabled: true,
        android: {
          extension: '.wav',
          outputFormat: ExpoAudio.AndroidOutputFormat.DEFAULT,
          audioEncoder: ExpoAudio.AndroidAudioEncoder.DEFAULT,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: '.wav',
          outputFormat: ExpoAudio.IOSOutputFormat.LINEARPCM,
          audioQuality: ExpoAudio.IOSAudioQuality.HIGH,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/wav',
          bitsPerSecond: 128000,
        },
      };

      const { recording } = await ExpoAudio.Recording.createAsync(
        recordingOptions
      );

      setRecording(recording);
      setIsRecording(true);
      setStatusMessage("🎙️ Gravando...");
      setTranscriptionText("");
      
      addLog("✅ Gravação iniciada!");
    } catch (err) {
      addLog(`❌ Erro ao gravar: ${err.message}`);
      Alert.alert("❌ Erro", `Não foi possível gravar:\n${err.message}`);
    }
  }

  // --- Alterado para ler Base64 e enviar ao novo endpoint ---
  async function stopRecordingAndProcess() {
    if (!recording) return;

    try {
      addLog("⏸️ Parando gravação...");
      setStatusMessage("⏳ Processando...");
      setIsRecording(false);

      await recording.stopAndUnloadAsync();
      await ExpoAudio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      const uri = recording.getURI();
      addLog(`📁 URI: ${uri}`);
      
      setRecording(null);

      if (!uri) {
        Alert.alert("❌ Erro", "URI do áudio não encontrada");
        addLog("❌ URI nula");
        setStatusMessage("");
        return;
      }

      addLog("📦 Lendo arquivo local em Base64...");
      // ler como Base64
      const base64Audio = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      if (!base64Audio || base64Audio.length === 0) {
        addLog("❌ Arquivo Base64 vazio");
        Alert.alert("❌ Erro", "Não foi possível ler o arquivo de áudio");
        setStatusMessage("");
        return;
      }

      addLog(`📤 Tamanho Base64 (chars): ${base64Audio.length}`);
      // envia para o servidor (endpoint /process_audio_b64)
      await uploadBase64(base64Audio);

    } catch (err) {
      addLog(`❌ Erro ao parar: ${err.message}`);
      Alert.alert("❌ Erro", `Não foi possível parar:\n${err.message}`);
      setStatusMessage("");
    }
  }

  // Função que envia Base64 para o Flask
  async function uploadBase64(b64Audio) {
    setIsProcessing(true);
    setStatusMessage("📤 Enviando áudio (base64)...");

    try {
      addLog("📤 Preparando envio Base64...");
      addLog(`🌐 URL: ${apiUrl}/process_audio_b64`);

      const response = await fetch(`${apiUrl}/process_audio_b64`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          audio_base64: b64Audio
        }),
      });

      addLog(`📥 Status upload (B64): ${response.status}`);

      if (!response.ok) {
        const text = await response.text();
        addLog(`❌ Erro servidor B64: ${text.substring(0,200)}`);
        throw new Error(`Servidor retornou ${response.status}: ${text}`);
      }

      const data = await response.json();
      addLog(`✅ Resposta parseada (B64): ${JSON.stringify(data)}`);

      if (!data.success) {
        throw new Error(data.error || "Erro desconhecido no servidor");
      }

      addLog("⏳ Iniciando polling...");
      setStatusMessage("⏳ Processando no servidor...");
      await pollForTranscription();

    } catch (error) {
      addLog(`❌ Erro no upload (B64): ${error.name} - ${error.message}`);
      
      let errorMessage = error.message;
      if (error.name === 'AbortError') {
        errorMessage = "⏱️ Timeout (60s)\n\nServidor demorou muito.";
      } else if (errorMessage.includes('Network request failed')) {
        errorMessage = "🌐 Falha na Rede\n\nVerifique IP/Firewall/WiFi.";
      }

      Alert.alert("❌ Erro no Upload", errorMessage);
      setStatusMessage("❌ Erro no upload");
    } finally {
      setIsProcessing(false);
    }
  }

  async function uploadAndWaitForTranscription_original(audioUri) {
    // função antiga mantida (não chamada). Se quiser usar, descomente as chamadas.
    setIsProcessing(true);
    setStatusMessage("📤 Enviando áudio (FormData)...");
    try {
      addLog("🚀 Criando FormData...");
      const formData = new FormData();
      formData.append('audio', {
        uri: audioUri,
        type: 'audio/wav',
        name: 'audio.wav'
      });

      addLog("🚀 Enviando com fetch + FormData...");
      const response = await fetch(`${apiUrl}/process_audio`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
        },
        body: formData,
      });

      addLog(`📥 Upload status: ${response.status}`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Servidor retornou ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      if (!data.success) throw new Error(data.error || "Erro desconhecido");

      addLog("⏳ Iniciando polling...");
      await pollForTranscription();

    } catch (error) {
      addLog(`❌ Erro no upload (FormData): ${error.name} - ${error.message}`);
      Alert.alert("❌ Erro no Upload", error.message);
      setStatusMessage("❌ Erro no upload");
    } finally {
      setIsProcessing(false);
    }
  }

  async function pollForTranscription() {
    const maxAttempts = 60;
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        addLog(`📊 Verificando status (${attempts + 1}/60)...`);
        
        const statusResponse = await fetch(`${apiUrl}/get_status`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });
        
        if (!statusResponse.ok) {
          throw new Error(`Status ${statusResponse.status}`);
        }
        
        const statusData = await statusResponse.json();

        if (statusData.success && statusData.status) {
          addLog(`📊 Status: ${statusData.status}`);
          setStatusMessage(statusData.status);

          if (statusData.status === "CONCLUÍDO") {
            addLog("✅ Concluído! Buscando transcrição...");
            
            const transcriptionResponse = await fetch(`${apiUrl}/get_transcription`);
            const transcriptionData = await transcriptionResponse.json();

            if (transcriptionData.success && transcriptionData.transcription) {
              addLog("📝 Transcrição recebida!");
              setTranscriptionText(transcriptionData.transcription);
              setStatusMessage("✅ Transcrição concluída!");
              return;
            } else {
              throw new Error("Transcrição não encontrada");
            }
          }

          if (statusData.status.startsWith("ERRO:")) {
            throw new Error(statusData.status);
          }
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;

      } catch (error) {
        addLog(`❌ Erro no polling: ${error.message}`);
        Alert.alert("❌ Erro", `Falha ao obter transcrição:\n${error.message}`);
        setStatusMessage("❌ Erro na transcrição");
        return;
      }
    }

    addLog("⏱️ Timeout no polling");
    Alert.alert("⏱️ Timeout", "Processamento demorou muito. Tente novamente.");
    setStatusMessage("⏱️ Timeout");
  }

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#4C7DFF" />
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      {/* MENU SUPERIOR */}
      <View style={styles.menu}>
        <Text style={styles.titulo}>Aúdio</Text>
        <View style={styles.menuButtons}>
          <TouchableOpacity
            style={styles.botao}
            onPress={() => setShowSettings(!showSettings)}
          >
            <Ionicons name="settings-outline" size={34} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* CONFIGURAÇÕES */}
      {showSettings && (
        <View style={styles.settingsContainer}>
          <Text style={styles.settingsTitle}>⚙️ Configurações</Text>
          <Text style={styles.settingsHelp}>Digite o endereço do Flask:</Text>

          <TextInput
            style={styles.urlInput}
            placeholder="http://192.168.1.100:5000/api"
            placeholderTextColor="#666"
            value={apiUrl}
            onChangeText={setApiUrl}
          />

          <View style={styles.settingsButtons}>
            <TouchableOpacity
              style={[styles.settingsButton, styles.testButton]}
              onPress={testConnection}
            >
              <Text style={styles.settingsButtonText}>🔍 Testar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.settingsButton, styles.saveButton]}
              onPress={() => alert("Salvo!")}
            >
              <Text style={styles.settingsButtonText}>💾 Salvar</Text>
            </TouchableOpacity>
          </View>

          {/* DEBUG LOG */}
          {debugLog.length > 0 && (
            <ScrollView style={styles.debugLog}>
              <Text style={styles.debugTitle}>📋 Log de Debug:</Text>
              {debugLog.map((log, index) => (
                <Text key={index} style={styles.debugText}>{log}</Text>
              ))}
            </ScrollView>
          )}
        </View>
      )}

      {/* GRAVAÇÃO */}
      <View style={styles.recordSection}>
        <Text style={styles.instructionText}>
          {isRecording
            ? "Clique para parar e transcrever"
            : "Clique para gravar (mín 2s)"}
        </Text>

        <TouchableOpacity
          style={[
            styles.recordButton,
            isRecording && styles.recordButtonActive,
            isProcessing && styles.recordButtonDisabled,
          ]}
          onPress={isRecording ? stopRecordingAndProcess : startRecording}
          disabled={isProcessing}
        >
          <Text style={styles.recordButtonText}>
            {isRecording ? "⏹️ Parar" : "🔴 Gravar"}
          </Text>
        </TouchableOpacity>

        {statusMessage !== "" && (
          <Text style={styles.statusMessage}>{statusMessage}</Text>
        )}

        {isProcessing && (
          <ActivityIndicator
            size="large"
            color="#164ce2ff"
            style={{ marginTop: 15 }}
          />
        )}
      </View>

      {/* RESULTADO */}
      {transcriptionText !== "" && (
        <ScrollView style={styles.resultsContainer}>
          <View style={styles.resultCard}>
            <Text style={styles.sectionTitle}>📝 Transcrição</Text>
            <Text style={styles.transcriptionText}>
              {transcriptionText}
            </Text>
          </View>
        </ScrollView>
      )}
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
    marginTop: 50,
    paddingHorizontal: 20,
  },
  menuButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  titulo: {
    fontSize: 50,
    color: "#fff",
    fontFamily: "titulos",
  },
  botao: {
    padding: 10,
  },
  settingsContainer: {
    backgroundColor: "#1a1a1a",
    borderRadius: 15,
    padding: 20,
    margin: 20,
    borderWidth: 2,
    borderColor: "#4C7DFF",
    maxHeight: 500,
  },
  settingsTitle: {
    fontSize: 24,
    color: "#fff",
    fontFamily: "titulos",
    marginBottom: 10,
  },
  settingsHelp: {
    fontSize: 14,
    color: "#999",
    fontFamily: "textos",
    marginBottom: 10,
  },
  urlInput: {
    backgroundColor: "#000",
    color: "#fff",
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    fontFamily: "textos",
    borderWidth: 1,
    borderColor: "#333",
    marginBottom: 15,
  },
  settingsButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 15,
  },
  settingsButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  testButton: {
    backgroundColor: "#FFD05A",
  },
  saveButton: {
    backgroundColor: "#4C7DFF",
  },
  settingsButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "textos",
  },
  debugLog: {
    backgroundColor: "#000",
    borderRadius: 10,
    padding: 10,
    marginVertical: 10,
    maxHeight: 150,
  },
  debugTitle: {
    color: "#4C7DFF",
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 5,
  },
  debugText: {
    color: "#0f0",
    fontSize: 11,
    fontFamily: "Courier",
    marginBottom: 2,
  },
  helpText: {
    fontSize: 12,
    color: "#666",
    fontFamily: "textos",
    lineHeight: 18,
  },
  recordSection: {
    backgroundColor: "#000000",
    borderRadius: 15,
    padding: 20,
    margin: 20,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#4C7DFF",
  },
  instructionText: {
    fontSize: 20,
    color: "#fff",
    textAlign: "center",
    marginBottom: 20,
    fontFamily: "textos",
  },
  recordButton: {
    backgroundColor: "#A7C7E7",
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    marginBottom: 15,
  },
  recordButtonActive: {
    backgroundColor: "#FFBE1D",
  },
  recordButtonDisabled: {
    backgroundColor: "#666666",
  },
  recordButtonText: {
    color: "#01283C",
    fontSize: 25,
    fontWeight: "bold",
    fontFamily: "textos",
  },
  statusMessage: {
    fontSize: 18,
    color: "#4C7DFF",
    marginTop: 10,
    textAlign: "center",
    fontFamily: "textos",
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  resultCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#333",
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 15,
    fontFamily: "titulos",
  },
  transcriptionText: {
    fontSize: 17,
    color: "#fff",
    lineHeight: 24,
    fontFamily: "textos",
  },
});
