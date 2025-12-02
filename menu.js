// Menu.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
} from "react-native";
import { auth, db } from "./firebaseConfig";
import { signOut, onAuthStateChanged, reload } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useFonts } from "expo-font";
import Ionicons from "@expo/vector-icons/Ionicons";
import Octicons from "@expo/vector-icons/Octicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

export default function Menu({ navigation }) {
  const [userName, setUserName] = useState("");
  const [loadingName, setLoadingName] = useState(true);

  const [fontsLoaded] = useFonts({
    titulos: require("./assets/fonts/gliker-regular.ttf"),
    textos: require("./assets/fonts/sanchez-font.ttf"),
  });

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
        setLoadingName(false);
      }
    });

    return unsubscribe;
  }, []);

  if (!fontsLoaded || loadingName) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#4C7DFF" />
      </View>
    );
  }

  const Fechar = () => {
    navigation.navigate("Voltar");
  };

  const Sair = () => {
    signOut(auth)
      .then(() => {
        navigation.replace("Login");
      })
      .catch((error) => {
        alert(error.message);
      });
  };

  return (
    <View style={styles.container}>
      <Image
        source={require("./assets/img/Logo1.png")}
        style={styles.imagem}
      />
      <View style={styles.usuario}>
        <TouchableOpacity style={styles.fechar} onPress={Fechar}>
          <Ionicons name="close" size={45} color="#fff" />
        </TouchableOpacity>
        <View style={styles.fotoUsuario}>
          <Image
            source={require("./assets/img/Conta.png")}
            style={styles.imgusuario}
          />
          {/* 🔹 Exibe o nome buscado do Authentication */}
          <Text style={styles.tituloUsuario}>
            Olá!
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.historico}
        onPress={() => navigation.navigate("Historico")}
      >
        <Octicons name="history" size={40} color="#fff" />
        <Text style={styles.textoHist}>Histórico</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.Sair} onPress={Sair}>
        <MaterialIcons name="logout" size={40} color="#fff" />
        <Text style={styles.textoSair}>Sair da conta</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    backgroundColor: "#000",
  },
  imagem: {
    width: 540,
    height: 340,
    marginBottom: 60,
    marginTop: 50,
  },
  usuario: {
    backgroundColor: "#01283C",
    width: "80%",
    padding: 30,
    borderRadius: 20,
    alignItems: "center",
    position: "relative",
    marginBottom: 60,
  },
  fechar: {
    backgroundColor: "#01283C",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    position: "absolute",
    top: 10,
    right: 10,
  },
  fotoUsuario: {
    justifyContent: "center",
    alignItems: "center",
    width: "80%",
    marginTop: 15,
  },
  imgusuario: {
    width: 300,
    height: 310,
    marginBottom: 20,
  },
  tituloUsuario: {
    fontSize: 35,
    marginBottom: 20,
    color: "#fff",
    fontFamily: "titulos",
  },
  historico: {
    backgroundColor: "#01283C",
    width: "80%",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingLeft: 20,
  },
  textoHist: {
    fontSize: 35,
    marginBottom: 20,
    color: "#fff",
    fontFamily: "titulos",
    marginTop: 20,
    paddingLeft: 20,
  },
  Sair: {
    backgroundColor: "#01283C",
    width: "80%",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 60,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    paddingLeft: 20,
  },
  textoSair: {
    fontSize: 35,
    marginBottom: 20,
    color: "#fff",
    fontFamily: "titulos",
    marginTop: 20,
    paddingLeft: 20,
  },
});