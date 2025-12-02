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
import { auth, db } from "./firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export default function HomeScreen({ navigation }) {
  const [fontsLoaded] = useFonts({
    titulos: require("./assets/fonts/gliker-regular.ttf"),
    textos: require("./assets/fonts/sanchez-font.ttf"),
  });

  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 🔹 Observa o usuário logado e busca o nome do Firestore
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          // Busca os dados do usuário no Firestore
          const userDoc = await getDoc(doc(db, "usuarios", user.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log("✅ Nome do usuário no Firestore:", userData.nome);
            setUserName(userData.nome || "Usuário");
          } else {
            // Fallback para displayName se não encontrar no Firestore
            console.log("⚠️ Documento não encontrado, usando displayName");
            setUserName(user.displayName || "Usuário");
          }
        } else {
          setUserName("Visitante");
        }
      } catch (error) {
        console.error("❌ Erro ao buscar nome do usuário:", error);
        setUserName("Usuário");
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const handleIntro = () => {
    navigation.navigate("Voltar");
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

      {/* 🔹 Exibe o nome buscado do Firestore */}
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