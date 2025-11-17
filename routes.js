import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Login from "./login";
import RotaInterna from "./rotaInterna";
import HomeScreen from "./home";
import Cadastro from "./cadastro";
import Principal from "./principal";
import Menu from "./menu";
import Historico from "./historico";

const Stack = createNativeStackNavigator();

export default function Routes() {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Voltar" component={RotaInterna} />
      <Stack.Screen name="Cadastro" component={Cadastro} />
      <Stack.Screen name="Principal" component={Principal} />
      <Stack.Screen name="Menu" component={Menu} />
      <Stack.Screen name="Historico" component={Historico} />
    </Stack.Navigator>
  );
}
