// CadastroScreen.js
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
  ScrollView,
} from "react-native";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "./firebaseConfig";
import { useFonts } from "expo-font";

export default function CadastroScreen({ navigation }) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  const handleCadastro = () => {
    if (!nome || !email || !senha) {
      Alert.alert("Erro", "Preencha todos os campos");
      return;
    }

    createUserWithEmailAndPassword(auth, email, senha)
      .then((userCredential) => {
        updateProfile(userCredential.user, { displayName: nome })
          .then(() => {
            navigation.replace("Home");
          })
          .catch((error) => {
            Alert.alert("Erro ao salvar nome", error.message);
          });
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
    <ScrollView 
      style={styles.scrollView}
      contentContainerStyle={styles.scrollViewContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
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
          <Text style={styles.titulo}>Cadastro</Text>
        </View>

        {/* Campos do formulário */}
        <View style={styles.form}>
          <Text style={styles.label}>Nome</Text>
          <TextInput
            placeholder="Nome"
            placeholderTextColor="#999"
            value={nome}
            onChangeText={setNome}
            style={styles.input}
            autoCapitalize="words"
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            placeholder="Email"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
          />

          <Text style={styles.label}>Senha</Text>
          <TextInput
            placeholder="6 dígitos"
            placeholderTextColor="#999"
            value={senha}
            onChangeText={setSenha}
            secureTextEntry
            style={styles.input}
            autoCorrect={false}
            textContentType="newPassword"
          />

          <TouchableOpacity style={styles.botao} onPress={handleCadastro}>
            <Text style={styles.textoBotao}>Registre-se</Text>
          </TouchableOpacity>
        </View>

        {/* Rodapé com link de login */}
        <View style={styles.footer}>
          <Text style={styles.textoSimples}>Já tem uma conta?</Text>
          <TouchableOpacity onPress={() => navigation.navigate("Login")}>
            <Text style={styles.linkLogin}>Entrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollViewContent: {
    flexGrow: 1,
  },
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
    left: 265,
    top: 490,
    color: "#fff",
    fontFamily: "titulos",
  },
  form: {
    marginTop: 25,
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
    padding: 20,
    marginBottom: 15,
    backgroundColor: "#fff",
    fontFamily: "textos",
    fontSize: 24,
    color: "#01283C", // Cor do texto explícita
  },
  botao: {
    backgroundColor: "#FFBE1D",
    borderRadius: 16,
    paddingVertical: 18,
    marginTop: 10,
  },
  textoBotao: {
    textAlign: "center",
    fontSize: 36,
    fontFamily: "titulos",
    color: "#01283C",
  },
  footer: {
    alignItems: "center",
    marginTop: 25,
    marginBottom: 30,
  },
  textoSimples: {
    color: "#01283C",
    fontSize: 25,
    fontFamily: "textos",
  },
  linkLogin: {
    color: "#419EBD",
    fontSize: 27,
    fontFamily: "titulos",
    textDecorationLine: "underline",
    marginTop: 5,
    marginBottom: 20,
  },
});