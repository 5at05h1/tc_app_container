import React,{useState,useEffect} from 'react';
import { View, LogBox, Image,ImageBackground,StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import Feather from 'react-native-vector-icons/Feather';
import { RootSiblingParent } from 'react-native-root-siblings';

import LogInScreen from './src/screens/LogInScreen';
import CommunicationHistoryScreen from './src/screens/CommunicationHistoryScreen';
import TalkScreen from './src/screens/TalkScreen';
import Setting from './src/screens/Setting';
import Loading from './src/components/Loading';
import BellScreen from './src/screens/BellScreen';


const Stack = createStackNavigator();
LogBox.ignoreLogs(['Setting a timer']);

export default function App() {
  
  return (
    <RootSiblingParent>
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="LogIn"
        screenOptions={{
          headerTitleAlign: 'left',
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
        }}
      >
        <Stack.Screen
          name="LogIn"
          component={LogInScreen}
        />
        <Stack.Screen
          name="CommunicationHistory"
          component={CommunicationHistoryScreen} 
          options={{
            gestureDirection: "horizontal-inverted",
          }}
        />
        <Stack.Screen
          name="Setting"
          component={Setting}
        />
        <Stack.Screen
          name="TalkScreen"
          component={TalkScreen}
        />
        <Stack.Screen
          name="BellScreen"
          component={BellScreen}
        />
      </Stack.Navigator>
    </NavigationContainer>
    </RootSiblingParent>
  );
}

const styles = StyleSheet.create({
  
})