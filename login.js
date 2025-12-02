// LoginScreen.js
import React, { useState } from "react";
import {
  View,
  TextInput,
  Alert,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebaseConfig";
import { useFonts } from "expo-font";

export default function Login({ navigation }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  const handleLogin = () => {
    if (!email || !senha) {
      Alert.alert("Erro", "Preencha todos os campos");
      return;
    }

    signInWithEmailAndPassword(auth, email, senha)
      .then(() => {
        navigation.replace("Home");
      })
      .catch((error) => {
        Alert.alert("Erro", error.message);
      });
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
    <View style={styles.container}>
      <View style={styles.containerImagem}>
        <View style={styles.imagemCaixa1}>
          <Image
            source={require("./assets/img/Circulo1.png")}
            style={styles.imagem1}
          />
        </View>
        <Image
          source={require("./assets/img/Logo4.png")}
          style={styles.imagem2}
        />
        <Text style={styles.titulo}>Login</Text>
      </View>

      {/* campos de entrada */}
      <View style={styles.form}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          placeholder="Seu email"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          style={styles.input}
        />

        <Text style={styles.label}>Senha</Text>
        <TextInput
          placeholder="Senha"
          placeholderTextColor="#999"
          value={senha}
          onChangeText={setSenha}
          secureTextEntry
          style={styles.input}
        />

        <TouchableOpacity style={styles.botao} onPress={handleLogin}>
          <Text style={styles.textoBotao}>Entrar</Text>
        </TouchableOpacity>
      </View>

      {/* separador e login social */}
      <View style={styles.orContainer}>
        <Text style={styles.orText}>-Ou-</Text>
      </View>

      {/* imagens dos logins sociais */}
      <View style={styles.socialContainer}>
        <TouchableOpacity>
          <Image
            source={require("./assets/img/Google.png")}
            style={styles.socialIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>

        <TouchableOpacity>
          <Image
            source={require("./assets/img/face.png")}
            style={styles.socialIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>

        <TouchableOpacity>
          <Image
            source={require("./assets/img/apple.png")}
            style={styles.socialIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>

      {/* link de cadastro */}
      <View style={styles.footer}>
        <Text style={styles.textoSimples}>Não tem uma conta?</Text>
        <TouchableOpacity onPress={() => navigation.navigate("Cadastro")}>
          <Text style={styles.linkCadastro}>Cadastre-se</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
    container: {
    flex: 1,
    justifyContent: "flex-start",
    backgroundColor: "#fff",
  },
  containerImagem: {
    justifyContent: "flex-start",
    height: 650,
  },
  imagemCaixa1: {
    alignItems: "center",
    width: "100%",
    height: 630,
    position: "relative",
  },
  imagem1: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
  },
  imagem2: {
    width: "90%",
    height: 430,
    position: "absolute",
    right: 40,
    top: 40,
  },
  titulo: {
    fontSize: 65,
    marginBottom: 20,
    position: "absolute",
    left: 330,
    top: 490,
    color: "#fff",
    fontFamily: "titulos",
  },
  form: {
    marginTop: 30,
    paddingHorizontal: 25,
  },
  label: {
    color: "#01283C",
    fontSize: 35,
    fontFamily: "titulos",
    marginBottom: 5,
  },
  input: {
    borderWidth: 1.3,
    borderColor: "#A7C7E7",
    borderRadius: 16,
    padding: 22,
    marginBottom: 15,
    backgroundColor: "#fff",
    fontFamily: "textos",
    fontSize:24,
  },
  botao: {
    backgroundColor: "#FFBE1D",
    borderRadius: 16,
    paddingVertical: 15,
    marginTop: 10,
  },
  textoBotao: {
    textAlign: "center",
    fontSize: 36,
    fontFamily: "titulos",
    color: "#01283C",
  },
  orContainer: {
    alignItems: "center",
    marginVertical: 10,
    marginTop:40,
    marginBottom:15,
  },
  orText: {
    fontFamily: "titulos",
    fontSize: 27,
    color: "#999",
  },
  socialContainer: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    marginHorizontal: 60,
    marginTop: 10,
  },
  socialIcon: {
    width: 65,
    height: 65,
  },
  footer: {
    alignItems: "center",
    marginTop: 25,
  },
  textoSimples: {
    color: "#01283C",
    fontSize: 27,
    fontFamily: "textos",
  },
  linkCadastro: {
    color: "#419EBD",
    fontSize: 25,
    fontFamily: "titulos",
    textDecorationLine: "underline",
    marginTop: 5,
  },
});