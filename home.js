// HomeScreen.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
} from "react-native";
import { useFonts } from "expo-font";
import { auth } from "./firebaseConfig";
import { onAuthStateChanged, reload } from "firebase/auth";

export default function HomeScreen({ navigation }) {
  const [fontsLoaded] = useFonts({
    titulos: require("./assets/fonts/gliker-regular.ttf"),
    textos: require("./assets/fonts/sanchez-font.ttf"),
  });

  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 🔹 Observa o usuário logado e obtém o nome salvo no Authentication
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          // força recarregar dados atualizados (garante pegar displayName recente)
          await reload(user);
          console.log("Nome do usuário logado:", user.displayName); // 🔹 TESTE
          setUserName(user.displayName || "Usuário");
        } else {
          setUserName("Visitante");
        }
      } catch (error) {
        console.log("Erro ao buscar nome do usuário:", error);
        setUserName("Usuário");
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

 const handleIntro = () => {
  navigation.navigate("Voltar"); // Em vez de replace
};
  if (!fontsLoaded || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4C7DFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image
        source={require("./assets/img/Logo2.png")}
        style={styles.imagem}
      />

      {/* 🔹 Exibe o nome salvo no Firebase Authentication */}
      <Text style={styles.titulo}>Olá, {userName}!</Text>

      <Text style={styles.texto}>
        Transcreva fala em libras, texto em fala ou vice-versa. Nosso app ajuda
        na comunicação de pessoas com deficiência auditiva!
      </Text>

      <TouchableOpacity style={styles.botao} onPress={handleIntro}>
        <Text style={styles.textoBotao}>Vamos começar!</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#01283C",
  },
  imagem: {
    width: "100%",
    height: 810,
    marginBottom: 20,
  },
  titulo: {
    fontSize: 40,
    marginBottom: 20,
    color: "#fff",
    fontFamily: "titulos",
    textAlign: "center",
  },
  texto: {
    fontSize: 32,
    marginBottom: 30,
    color: "#fff",
    fontFamily: "textos",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  botao: {
    backgroundColor: "#FFBE1D",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  textoBotao: {
    color: "#01283C",
    fontSize: 25,
    fontFamily: "titulos",
  },
});