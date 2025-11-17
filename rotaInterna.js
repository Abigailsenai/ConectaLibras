//rotaInterna
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { FontAwesome6, AntDesign, FontAwesome5 } from "@expo/vector-icons";
import Audio from "./audio";
import Libras from "./libras";
import Teclado from "./teclado";
import Principal from "./principal";
import { View } from "react-native";

const Tab = createBottomTabNavigator();

export default function RotaInterna() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarShowLabel: false,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#01283C",
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          height: 170,
          paddingBottom: 53,
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          borderTopWidth: 0,
          overflow: "hidden",
        },
      }}
    >
      {/* Tela Boas Vindas */}
      <Tab.Screen
        name="Boas Vindas"
        component={Principal}
        options={{
          tabBarIcon: ({ focused }) => (
            <View
              style={{
                backgroundColor: focused ? "#FFD05A" : "#419EBD",
                height: 100,
                width: 100,
                borderRadius: 100,
                alignItems: "center",
                justifyContent: "center",
                top: 25,
              }}
            >
              <FontAwesome5 
              name="home" 
              size={55} 
              color={focused ? "#000" : "#FFFFFF"}
               />
            </View>
          ),
        }}
      />
      {/* Tela Teclado */}
      <Tab.Screen
        name="Teclado"
        component={Teclado}
        options={{
          tabBarIcon: ({ focused }) => (
            <View
              style={{
                backgroundColor: focused ? "#FFD05A" : "#419EBD",
                height: 100,
                width: 100,
                borderRadius: 100,
                alignItems: "center",
                justifyContent: "center",
                top: 25,
              }}
            >
              <FontAwesome6
                name="keyboard"
                size={55}
                color={focused ? "#000" : "#FFFFFF"}
              />
            </View>
          ),
        }}
      />

      {/* Tela Libras */}
      <Tab.Screen
        name="Libras"
        component={Libras}
        options={{
          tabBarIcon: ({ focused }) => (
            <View
              style={{
                backgroundColor: focused ? "#FFD05A" : "#419EBD",
                height: 100,
                width: 100,
                borderRadius: 100,
                alignItems: "center",
                justifyContent: "center",
                top: 25,
              }}
            >
              <FontAwesome6
                name="hands"
                size={55}
                color={focused ? "#000" : "#FFFFFF"}
                style={{ transform: [{ rotate: "45deg" }] }}
              />
            </View>
          ),
        }}
      />

      {/* Tela Áudio */}
      <Tab.Screen
        name="Audio"
        component={Audio}
        options={{
          tabBarIcon: ({ focused }) => (
            <View
              style={{
                backgroundColor: focused ? "#FFD05A" : "#419EBD",
                height: 100,
                width: 100,
                borderRadius: 100,
                alignItems: "center",
                justifyContent: "center",
                top: 25,
              }}
            >
              <AntDesign
                name="sound"
                size={55}
                color={focused ? "#000" : "#FFFFFF"}
              />
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
}
