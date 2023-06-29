import React, { useState, useEffect } from "react";
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, BackHandler, AppState, KeyboardAvoidingView, ScrollView, Image, Dimensions, Platform, FlatList } from "react-native";
import Modal from "react-native-modal";
import * as Notifications from "expo-notifications";
import { Feather } from "@expo/vector-icons";
import GestureRecognizer from "react-native-swipe-gestures";
import DropDownPicker from "react-native-dropdown-picker";
import { BarChart } from "react-native-chart-kit";

import Loading from "../components/Loading";
import GetDB from "../components/Get_databace";

import TagInput from "react-native-tags-input";
import { Icon } from "react-native-elements";

import * as SQLite from "expo-sqlite";

import * as ImagePicker from "expo-image-picker";
import * as Permissions from "expo-permissions";

const db = SQLite.openDatabase("db");

const screenWidth = Dimensions.get('window').width;

export default function Ranking(props) {
  
  if (AppState.currentState === "active") {
    Notifications.setBadgeCountAsync(0);
  }

  const { navigation, route } = props;

  const [isLoading, setLoading] = useState(false);

  navigation.setOptions({
    headerStyle: !global.fc_flg
      ? { backgroundColor: "#1d449a", height: 110 }
      : { backgroundColor: "#fd2c77", height: 110 },
    headerTitleAlign: "center",
    headerTitle: () =>
      !global.fc_flg ? (
        <Image source={require("../../assets/logo.png")} />
      ) : (
        <Image
          source={require("../../assets/logo_onetop.png")}
          style={styles.header_img}
        />
      ),
  });

  // スタッフ情報
  const [staffs, setStaffs] = useState(route.params);

  // 年
  const [year, setYear] = useState('2023');

  // 月
  const [month, setMonth] = useState('6');
  const [open_month, setOpen_month] = useState(false);
  const [month2, setMonth2] = useState('6');
  const [open_month2, setOpen_month2] = useState(false);

  const months = [
    { label: "1月", value: "1" },
    { label: "2月", value: "2" },
    { label: "3月", value: "3" },
    { label: "4月", value: "4" },
    { label: "5月", value: "5" },
    { label: "6月", value: "6" },
    { label: "7月", value: "7" },
    { label: "8月", value: "8" },
    { label: "9月", value: "9" },
    { label: "10月", value: "10" },
    { label: "11月", value: "11" },
    { label: "12月", value: "12" },
  ];

  // 店舗売上順位
  const [all, setAll] = useState('30');
  const [overall, setOverall] = useState('6');
  const rank = [
    { label: "売上", rank: "1", data: '¥123,456' },
    { label: "新規", rank: "2", data: '50' },
    { label: "紹介", rank: "3", data: '15' },
    { label: "決定", rank: "4", data: '50' },
    { label: "決定率", rank: "5", data: '56.2%' },
    { label: "反響率", rank: "6", data: '48.7%' },
    { label: "反響来店率", rank: "7", data: '61.5%' },
  ];
  
  const [isVisible, setVisible] = useState(false);
  const [record, setRecord] = useState({ label: "", rank: "", data: "" });
  const [rankdata, setRankdata] = useState([
    { date:'202301', rank: "3", data: '¥123,456' },
    { date:'202302', rank: "3", data: '¥123,456' },
    { date:'202303', rank: "3", data: '¥123,456' },
    { date:'202304', rank: "3", data: '¥123,456' },
    { date:'202305', rank: "1", data: '¥123,456' },
    { date:'202306', rank: "1", data: '¥123,456' },
  ]);

  useEffect(() => {

    
    var date = new Date();
    setYear((date.getFullYear()).toString());
    setMonth((date.getMonth() + 1).toString());
    setMonth2((date.getMonth() + 1).toString());

    navigation.setOptions({
      headerLeft: () => (
        <Feather
          name="chevron-left"
          color="white"
          size={30}
          onPress={() => {
            if (!isLoading) {
              navigation.reset({
                index: 0,
                routes: [
                  {
                    name: "CommunicationHistory",
                    params: route.params,
                    websocket: route.websocket,
                    station: route.station,
                    address: route.address,
                    profile: route.profile,
                    previous: "Ranking",
                  },
                ],
              });
            }
          }}
          style={{ paddingHorizontal: 20, paddingVertical: 10 }}
        />
      ),
    });

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();

  }, []);

  // 端末の戻るボタン
  const backAction = () => {
    if (!isLoading) {
      navigation.reset({
        index: 0,
        routes: [
          {
            name: "CommunicationHistory",
            params: route.params,
            websocket: route.websocket,
            station: route.station,
            address: route.address,
            profile: route.profile,
            previous: "Ranking",
          },
        ],
      });
    }
    return true;
  };

  const rankItem = ({ item,index }) => {
    return(
      <TouchableOpacity
        style={styles.rankList}
        onPress={()=>{
          setVisible(true);
          setRecord(item);
        }}
      >
        <Text style={styles.rankLabel}>{item.label}</Text>
        <Text style={styles.rankData}>{item.data}</Text>
        <Text style={styles.rankRank}>{item.rank}位</Text>
      </TouchableOpacity>
    )
  }

  const rankdataItem = ({ item,index }) => {

    if (index>4) return;

    var year = (item.date).substring(0, 4);
    var month = (item.date).substring(4, 6);

    return(
      <View style={[styles.rankdataList,index==4&&{borderBottomWidth:0}]}>
        <Text style={styles.rankdataLabel}>{year}年{month}月</Text>
        <Text style={styles.rankdataData}>{item.data}</Text>
        <Text style={styles.rankdataRank}>{item.rank}位</Text>
      </View>
    )
  }

  return (
    <>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "position" : null}
        keyboardVerticalOffset={Platform.OS === "ios" ? 50 : 70}
      >
        <Loading isLoading={isLoading} />
        <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
          <GestureRecognizer
            onSwipeRight={() => {
              backAction();
            }}
            style={{ flex: 1 }}
          >
            <Text style={styles.title}>売上順位</Text>
            <View style={{ flexDirection: "row",zIndex:997 }}>
              <DropDownPicker
                style={styles.dropDown}
                containerStyle={{ width: 160 }}
                dropDownContainerStyle={[styles.dropDownContainer,{width:160}]}
                open={open_month}
                value={month}
                items={months}
                setOpen={setOpen_month}
                setValue={setMonth}
                dropDownDirection={"BOTTOM"}
              />
              <TouchableOpacity
                onPress={() => {
                  setMonth('6');
                }}
                style={styles.btn}
              >
                <Text style={styles.btn_text}>集 計</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.total}>
              <View style={styles.overall}>
                <Text style={styles.overall_text}>店舗売上順位</Text>
              </View>
              <Text style={styles.overallRank}>{overall}位 / {all}位</Text>
            </View>
            <View style={{width:'80%',alignSelf:'center',marginBottom:20}}>
              <FlatList
                initialNumToRender={7}
                data={rank}
                renderItem={rankItem}
              />
            </View>
            <View style={{ flexDirection: "row",zIndex:997,alignItems:'center' }}>
              <Text style={styles.title}>売上月別推移</Text>
              <Text style={styles.year}>{year}年度</Text>
              <DropDownPicker
                style={styles.dropDown2}
                containerStyle={{ width: 100 }}
                dropDownContainerStyle={[styles.dropDownContainer,{width:100}]}
                open={open_month2}
                value={month2}
                items={months}
                setOpen={setOpen_month2}
                setValue={setMonth2}
                dropDownDirection={"BOTTOM"}
              />
            </View>
            <Modal
              isVisible={isVisible}
              swipeDirection={['up']}
              onSwipeComplete={() => { setVisible(false) }}
              animationInTiming={300}
              animationOutTiming={500}
              animationIn={'slideInDown'}
              animationOut={'slideOutUp'}
              propagateSwipe={true}
              style={{alignItems: 'center'}}
              backdropOpacity={0.5}
              onBackdropPress={() => { setVisible(false); }}
            >
              <View style={styles.modal}>
                <TouchableOpacity
                  style={styles.close}
                  onPress={() => { setVisible(false); }}
                >
                  <Feather name="x-circle" color="gray" size={35} />
                </TouchableOpacity>
                <View style={{justifyContent: "center"}}>
                  <Text style={styles.title2}>{record.label}</Text>
                  {rankdata.length==0?
                  (
                    <View style={styles.notdata}>
                      <Text style={styles.notdatatxt}>集計データがありません</Text>
                    </View>
                  ):(
                    <FlatList
                      initialNumToRender={5}
                      data={rankdata}
                      renderItem={rankdataItem}
                    />
                  )
                  }
                </View>
              </View>
            </Modal>
            <View style={{marginBottom:30}}>
              <BarChart
                data={{
                  labels: ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'],
                  datasets: [
                    {
                      data: [
                        Math.random() * 1000000,
                        Math.random() * 1000000,
                        Math.random() * 1000000,
                        Math.random() * 1000000,
                        Math.random() * 1000000,
                        Math.random() * 1000000,
                        Math.random() * 1000000,
                        Math.random() * 1000000,
                        Math.random() * 1000000,
                        Math.random() * 1000000,
                        Math.random() * 1000000,
                        Math.random() * 1000000
                      ],
                      color: (opacity = 1) => `rgba(134, 65, 244, ${opacity})` // optional
                    },
                  ],
                }}
                width={screenWidth*0.9}
                height={220}
                yAxisLabel={'¥'}
                chartConfig={{
                  backgroundColor: '#fff',
                  backgroundGradientFrom: "#fff",
                  backgroundGradientTo: "#fff",
                  decimalPlaces: 0, 
                  color: (opacity = 1) => `rgba(255, 100, 100, 1)`,
                  labelColor:(opacity = 1) => '#373737',
                  style: {
                    borderRadius: 16
                  },
                  fillShadowGradientOpacity: 1,
                  decimalPlaces: 0, // 左の小数点以下の桁数
                  barPercentage:0.5,
                  paddingVertical:50
                }}
                style={{
                  marginVertical: 8,
                  borderRadius: 0,
                }}
                // verticalLabelRotation={-45}
              />
            </View>
          </GestureRecognizer>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  header_img: {
    width: 150,
    height: 45,
  },
  form: {
    flex:1,
    width: "90%",
    alignSelf: "center",
    flexGrow: 1
  },
  title: {
    fontSize: 20,
    color: "#1d449a",
    fontWeight: "bold",
    marginVertical: 20,
  },
  title2: {
    fontSize: 20,
    color: "#1d449a",
    fontWeight: "bold",
    marginTop: 20,
    marginBottom:5
  },
  dropDown: {
    width:160,
    height: 50,
    backgroundColor: "#fff",
    borderColor: "#191970",
    borderWidth: 1.5,
    borderRadius: 8,
  },
  dropDown2: {
    width:100,
    height: 40,
    backgroundColor: "#fff",
    borderColor: "#191970",
    borderWidth: 1.5,
    borderRadius: 8,
  },
  dropDownContainer: {
    borderColor: "#191970",
    borderWidth: 1.5,
  },
  btn: {
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    borderRadius: 8,
    width: 90,
    height: 50,
    backgroundColor: "#1f2d53",
    marginLeft:'auto'
  },
  btn_text: {
    fontSize:16,
    color: "#ffffff",
  },
  total: {
    flexDirection: "row",
    marginTop:20,
    alignItems:'center'
  },
  overall: {
    width:120,
    height:45,
    backgroundColor:'#5f6983',
    justifyContent:'center',
    alignItems:'center'
  },
  overall_text: {
    color:'#fff',
    fontSize:16
  },
  overallRank: {
    fontSize:20,
    marginLeft:20
  },
  rankList: {
    height:60,
    borderBottomWidth:1,
    borderBottomColor:'#202e53',
    flexDirection:'row',
    paddingHorizontal:10,
    alignItems:'center'
  },
  rankLabel: {
    fontSize:20,
    color:'#202e53',
  },
  rankData: {
    fontSize:16,
    color:'#4d4d4d',
    marginLeft:'auto'
  },
  rankRank: {
    fontSize:16,
    color:'#4d4d4d',
    marginLeft:20
  },
  rankdataList: {
    height:45,
    borderBottomWidth:0.5,
    borderBottomColor:'#C8C8C8',
    flexDirection:'row',
    paddingHorizontal:10,
    alignItems:'center'
  },
  rankdataLabel: {
    fontSize:18,
    color:'#202e53',
  },
  rankdataData: {
    fontSize:16,
    color:'#4d4d4d',
    marginLeft:'auto'
  },
  rankdataRank: {
    fontSize:16,
    color:'#4d4d4d',
    marginLeft:20
  },
  year: {
    fontSize:16,
    color:'#4d4d4d',
    marginLeft:'auto',
    marginRight:5
  },
  modal: {
    paddingHorizontal:30,
    backgroundColor: "#ffffff",
    width: "100%",
    height:300
  },
  close: {
    position: "absolute",
    top: 10,
    right: 12,
    zIndex: 999
  },
  notdata: {
    width:'100%',
    height:200,
    justifyContent: "center",
    alignItems: "center",
  },
  notdatatxt: {
    color: '#C8C8C8'
  }
});
