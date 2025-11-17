// HomeScreen.js
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator,} from "react-native";
import { signOut } from "firebase/auth";
import { auth } from "./firebaseConfig";
import { useFonts } from 'expo-font';

export default function HomeScreen({ navigation }) {
  const handleIntro = () => {
    signOut(auth)
      .then(() => {
        navigation.replace("Voltar"); // vai pra página principal
      })
      .catch((error) => {
        alert(error.message);
      });
  };
 const [fontsLoaded] = useFonts({
    "titulos": require('./assets/fonts/gliker-regular.ttf'),
    "textos": require('./assets/fonts/sanchez-font.ttf'),
  });

if (!fontsLoaded) {
  return (
    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
      <ActivityIndicator size="large" color="#4C7DFF" />
    </View>
  );
}

  return (
    <View style={styles.container}>
       <Image
        source={require('./assets/img/Logo2.png')}
        style={styles.imagem}
      />
      <Text style={styles.titulo}>Sua comunicação no Conecta Libras</Text>
      <Text style={styles.texto}>
        Transcreva fala em libras, texto em fala ou vice-versa, nos propomos a
        auxiliar a comunicação de deficientes auditivos em ambiente escolar e na
        vida!
      </Text>
      <TouchableOpacity style={styles.botao} onPress={handleIntro}>
        <Text style={styles.textoBotao}>Vamos começar!</Text>
      </TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#01283C",
  },
  imagem:{
    width: '100%', 
    height: 400,
    marginBottom: 20,
  },
  titulo: {
    fontSize: 30,
    marginBottom: 20,
    color: "#fff",
    fontFamily: "titulos",   
    textAlign: 'center',
  
  },
  texto: {
    fontSize: 25,
    marginBottom: 15,
    color: "#fff",
    fontFamily: "textos", 
    textAlign: 'center',
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