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

let domain = "https://www.total-cloud.net/";

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
  const [all, setAll] = useState('-');
  const [overall, setOverall] = useState('-');
  const [rank, setRank] = useState([
    { label: "売上総見込", rank: "-", data: '0' },
    { label: "新規", rank: "-", data: '0' },
    { label: "紹介", rank: "-", data: '0' },
    { label: "決定", rank: "-", data: '0' },
    { label: "決定率", rank: "-", data: '0' },
    { label: "反響来店率", rank: "-", data: '0' }
  ]);
  
  const [isVisible, setVisible] = useState(false);
  const [record, setRecord] = useState({ label: "", rank: "", data: "" });
  const [rankdata, setRankdata] = useState([
    { date:'202301', rank: "-", data: '¥123,456' },
    { date:'202302', rank: "-", data: '¥123,456' },
    { date:'202303', rank: "-", data: '¥123,456' },
    { date:'202304', rank: "-", data: '¥123,456' },
    { date:'202305', rank: "-", data: '¥123,456' },
    { date:'202306', rank: "-", data: '¥123,456' },
  ]);
  
  const [barChart, setBarChart] = useState([0,0,0,0,0,0,0,0,0,0,0,0]);
  
  //**********************************************
  // 
  // 【業務進捗表】 付帯の種類
  // 
  //**********************************************
  const incidentalArray = [
    {
      "key"  : "pesticide",
      "name" : "消毒",
    },
    {
      "key"  : "aircon",
      "name" : "エアコン清掃",
    },
    {
      "key"  : "aircon_sales",
      "name" : "エアコン販売",
    },
    {
      "key"  : "guarantee",
      "name" : "賃貸保証",
    },
    {
      "key"  : "key_exchange",
      "name" : "鍵交換",
    },
    {
      "key"  : "grasupo",
      "name" : "グラサポ",
    },
    {
      "key"  : "aqua",
      "name" : "アクア",
    },
    {
      "key"  : "moving",
      "name" : "引越",
    },
    {
      "key"  : "jcom",
      "name" : "J:COM",
    },
    {
      "key"  : "net",
      "name" : "ネット",
    },
    {
      "key"  : "focus",
      "name" : "フォーカス",
    },
    {
      "key"  : "life",
      "name" : "ライフ",
    },
    {
      "key"  : "nhk",
      "name" : "NHK",
    },
    {
      "key"  : "fitech",
      "name" : "ファイテック",
    },
    {
      "key"  : "mirable",
      "name" : "ミラブル",
    },
  ];

  //*******************************************************
  // 
  // 数値変換(Number Convert)
  // 
  //*******************************************************
  function cNum(val){
    if(isNaN(val)){
      val = 0;
    }
    return Number(val);
  }

  //*******************************************************
  // 
  // 3桁カンマ区切り
  // 
  //*******************************************************
  function addFigure (str) {
    if(str == undefined) str = "0";
    var num = String(str).replace(/,/g, "");
    while(num != (num = num.replace(/^(-?\d+)(\d{3})/, "$1,$2")));
    return num;
  }

  var scopeData_S;    // 業務進捗データ(スタッフ情報)を保持する
  var scopeData_C;    // 業務進捗データ(顧客情報)を保持する
  var scopeData_O;    // 他業者付け等その他売上データを保持する
  var scopeData_R;    // 反響数を保持する
  var scopeData_B;    // 総入金を保持する
  var scopeData_T;    // 当月目標データを保持する
  var tax = 1.1;      // 消費税

  //********************************************************
  // 
  // 売上データを取得する
  // 
  //********************************************************
  async function getRanking(flg) {

    setLoading(true);

    // フラグがあったらデータ取得しなおす
    if (flg) {

      var date = new Date();
      var month_ = (date.getFullYear()).toString() + "-" + addZero((date.getMonth() + 1).toString(),2);
  
      if (month) {
        month_ = (date.getFullYear()).toString() + "-" + addZero(month,2);
      }
  
      const getAPI = () => {
  
        return new Promise((resolve, reject)=>{
          fetch(domain + "batch_app/api_system_app.php?" + Date.now(), {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: JSON.stringify({
              ID: route.params.account,
              pass: route.params.password,
              act: "ranking",
              month: month_,
              fc_flg: global.fc_flg,
              flg:"2",
            }),
          })
          .then((response) => response.json())
          .then((json) => {
            resolve(json);
          })
          .catch((error) => {
            console.log(error);
            resolve(false);
          });
        })
      }
  
      console.log('-----getRanking-----')
  
      const DATA = await getAPI();
  
      scopeData_S = DATA["gwp"]["staff"];              // 業務進捗データ(スタッフ情報)
      scopeData_C = DATA["gwp"]["customer"];           // 業務進捗データ(顧客情報)
      scopeData_O = await get_other_data(DATA["god"]); // 他業者付け等その他売上データ
      scopeData_R = DATA["grc"]&&DATA["grc"]["data"];  // 反響数

    }

    var staff_id = route.params.account;

    // 来店媒体のカウントをする
    // const dm = await dsp_mediaTable(staff_id);

    // 来店・決定数を表示する
    const dc = await dsp_comingTable(staff_id);

    // 付帯のカウントをする
    // const di = await dsp_incidentalTable(staff_id);

    // 売上金額を表示する
    const ds = await dsp_salesTable(staff_id,scopeData_C);

    // 反響来店率を取得する
    const comrev =  await rev_Count(staff_id);

    setRank([
      { label: "売上総見込", rank: "-", data: '¥'+addFigure(ds["estimate"]) },
      { label: "新規", rank: "-", data: dc["coming"]["new"] },
      { label: "紹介", rank: "-", data: dc["coming"]["intro"] },
      { label: "決定", rank: "-", data: dc["agreement"]["total"] },
      { label: "決定率", rank: "-", data: dc["agreement"]["rate"] },
      { label: "反響来店率", rank: "-", data: comrev+'%' }
    ]);

    setLoading(false);
  }
  
  //********************************************************
  // 
  // 売上年間データを取得する
  // 
  //********************************************************
  async function getBarChart() {

    setLoading(true);

    var date = new Date();
    var month_ = (date.getFullYear()).toString() + "-" + addZero((date.getMonth() + 1).toString(),2);

    if (month) {
      month_ = (date.getFullYear()).toString() + "-" + addZero(month,2);
    }

    const getAPI = () => {

      return new Promise((resolve, reject)=>{
        fetch(domain + "batch_app/api_system_app.php?" + Date.now(), {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: JSON.stringify({
            ID: route.params.account,
            pass: route.params.password,
            act: "ranking",
            month: month_,
            fc_flg: global.fc_flg,
            flg:"1",
          }),
        })
        .then((response) => response.json())
        .then((json) => {
          resolve(json);
        })
        .catch((error) => {
          console.log(error);
          resolve(false);
        });
      })
    }

    console.log('-----getBarChart-----')

    const DATA = await getAPI();

    scopeData_S = DATA["gwp"]["staff"];              // 業務進捗データ(スタッフ情報)
    scopeData_C = DATA["gwp"]["customer"];           // 業務進捗データ(顧客情報)
    scopeData_O = await get_other_data(DATA["god"]); // 他業者付け等その他売上データ
    scopeData_R = DATA["grc"]&&DATA["grc"]["data"];  // 反響数
    scopeData_B = DATA["all_gwp"];                   // 売上月間データ

    var staff_id = route.params.account;

    // 売上月間データを集計する
    const comblc = await black_Count(staff_id);

    setBarChart(comblc);

    await getRanking(false);

    setLoading(false);
  }

  //*******************************************************
  // 
  // 【他業者付け等その他売上】月データ取得
  // 
  //*******************************************************
  function get_other_data(list){
    // 集計表に反映するために売上金額のトータルを入れる配列を宣言
    var other_total = {};
    Object.keys(scopeData_S).forEach(function (i) {
      other_total[i] = {
        0:0, 
        1:0, 
        "total":0, 
        "other":        {0:0, 1:0, "total":0}, 
        "extra":        {0:0, 1:0, "total":0}
      };
      Object.keys(incidentalArray).forEach(function (j) {
        var inc = incidentalArray[j];
        other_total[i][inc["key"]] = {0:0, 1:0, "total":0, "cnt":0};
      });
    });

    
    if(list != "failed"){

      var cnt = 1;

      Object.keys(list).forEach(function (i) {
        var v = list[i];

        // 種別が数値になっているので文字に変換 & 売上金額の編集
        var reform_type = "";
        var reform_sales = "";
        var reformType = Number(v["reform_type"]);
        switch(reformType){
          case 1:
            reform_type = "内装";
            reform_sales = "\\"+cNum(v["reform_sales"]).toLocaleString();
            break;
            
          case 2:
            reform_type = "外壁";
            reform_sales = "\\"+cNum(v["reform_sales"]).toLocaleString();
            break;
            
          case 3:
            reform_type = "他業者付け";
            reform_sales = "\\"+(cNum(v["reform_sales"])+cNum(v["other_brokerage"])).toLocaleString();
            break;
            
          case 4:
            reform_type = "その他";
            reform_sales = "\\"+cNum(v["reform_sales"]).toLocaleString();
            break;
            
          default:
            Object.keys(incidentalArray).forEach(function (j) {
              var inc = incidentalArray[j];
              if(reformType == Number(j) + 5){
                reform_type = inc["name"];
                reform_sales = "\\"+cNum(v["other_" + inc["key"]]).toLocaleString();
                return false;
              }
            });
            break;
        }

        cnt++;
        
        // 集計表に反映するために売上金額のトータルを取得する
        var reformType = Number(v["reform_type"]);
        switch(reformType){
          // リフォーム売上の合計を計算する
          case 1:
          case 2:
            if(v["reform_flg"] == 1){
              // 入金済のトータル
              other_total[v["staff"]][1] += cNum(v["reform_sales"]);
            }else{
              // 未入金のトータル
              other_total[v["staff"]][0] += cNum(v["reform_sales"]);
            }
            // 売上金額のトータル
            other_total[v["staff"]]["total"] += cNum(v["reform_sales"]);
            break;
          
          // その他売上の合計を計算する
          case 4:
            if(v["reform_flg"] == 1){
              // 入金済のトータル
              other_total[v["staff"]]["extra"][1] += cNum(v["reform_sales"]);
            }else{
              // 未入金のトータル
              other_total[v["staff"]]["extra"][0] += cNum(v["reform_sales"]);
            }
            // 売上金額のトータル
            other_total[v["staff"]]["extra"]["total"] += cNum(v["reform_sales"]);
            break;
          
          
          // 他業者付け売上と付帯の合計を計算する
          default:
            if(v["reform_flg"] == 1){
              // 売上金額と付帯それぞれの入金済トータル
              other_total[v["staff"]]["other"][1] += cNum(v["reform_sales"]);
              other_total[v["staff"]]["other"][1] += cNum(v["other_brokerage"]);
              
              Object.keys(incidentalArray).forEach(function (j) {
                var inc = incidentalArray[j];
                other_total[v["staff"]][inc["key"]][1] += cNum(v["other_" + inc["key"]]);
              });
              
              // 付帯獲得数のカウントをする
              Object.keys(incidentalArray).forEach(function (j) {
                var inc = incidentalArray[j];
                other_total[v["staff"]][inc["key"]]["cnt"] += cNum(v["other_" + inc["key"] + "_flg"]);
              });
              
            }else{
              // 売上金額と付帯それぞれの未入金トータル
              other_total[v["staff"]]["other"][0] += cNum(v["reform_sales"]);
              other_total[v["staff"]]["other"][0] += cNum(v["other_brokerage"]);
              
              Object.keys(incidentalArray).forEach(function (j) {
                var inc = incidentalArray[j];
                other_total[v["staff"]][inc["key"]][0] += cNum(v["other_" + inc["key"]]);
              });
            }
            
            // 売上金額と付帯それぞれのトータル
            other_total[v["staff"]]["other"]["total"] += cNum(v["reform_sales"]);
            other_total[v["staff"]]["other"]["total"] += cNum(v["other_brokerage"]);
            
            Object.keys(incidentalArray).forEach(function (j) {
              var inc = incidentalArray[j];
              other_total[v["staff"]][inc["key"]]["total"] += cNum(v["other_" + inc["key"]]);
            });
            break;
        }
      })

    }

    return other_total;
  }

  //*******************************************************
  // 
  // 【データ表示】 来店媒体をテーブルに表示する
  // 
  //*******************************************************
  function dsp_mediaTable(key){

    // 合計値を入れる配列を用意
    var total = {};
    
    // 来店媒体のカウントデータを取得
    var media = cnt_mediaTable();

    // 該当スタッフのデータだけまとめる
    Object.keys(media).forEach(function (i) {
      total[i] = media[i][key];
    })

    return total;

  }

  //*******************************************************
  // 
  // 【カウント】 来店媒体のカウントをする
  // 
  //*******************************************************
  function cnt_mediaTable(){

    var all_data = scopeData_C;
    var media1 = {};
    var media2 = {};
    
    // スタッフごとのカウントとは別に合計値も出しておく
    media1["total"] = {};
    media2["total"] = {};

    if (all_data) {
      Object.keys(all_data).forEach(function (buf_i) {

        // スタッフごとにカウントするためuser_idをインデックスに設定
        media1[buf_i] = {};
        media2[buf_i] = {};

        var buf_v = all_data[buf_i];

        // 来店
        if(buf_v.hasOwnProperty("coming")){
          Object.keys(buf_v["coming"]).forEach(function (i) {
            var v = buf_v["coming"][i];
            if(v["campany_device"] == "反響" && v["media"]){
              var mediaType = v["media"];
              switch(mediaType){
                // 「NET外」にカウント
                case "チラシ":
                case "現地看板":
                case "法人":
                case "その他":
                case "紹介":
                case "リピーター":
                case "不明":
                case "":
                  // スタッフ別でのカウント
                  if(v["media"] in media2[buf_i]){
                    media2[buf_i][v["media"]]++;
                  }else{
                    media2[buf_i][v["media"]] = 1;
                  }
                  // 店全体でのカウント
                  if(v["media"] in media2["total"]){
                    media2["total"][v["media"]]++;
                  }else{
                    media2["total"][v["media"]] = 1;
                  }
                  break;
                  
                // 「NET」にカウント
                default:
                  // スタッフ別でのカウント
                  if(v["media"] in media1[buf_i]){
                    media1[buf_i][v["media"]]++;
                  }else{
                    media1[buf_i][v["media"]] = 1;
                  }
                  // 店全体でのカウント
                  if(v["media"] in media1["total"]){
                    media1["total"][v["media"]]++;
                  }else{
                    media1["total"][v["media"]] = 1;
                  }
                  break;
              }
            } else { // 「NET外」にカウント
              var device = v["campany_device"];
              
              // 空なら「不明」を入れる
              if(device == ""){
                device = "不明";
              }
              
              // スタッフ別でのカウント
              if(device in media2[buf_i]){
                media2[buf_i][device]++;
              }else{
                media2[buf_i][device] = 1;
              }
              // 店全体でのカウント
              if(device in media2["total"]){
                media2["total"][device]++;
              }else{
                media2["total"][device] = 1;
              }
            }
          })
        }

        // 再来店
        if(buf_v.hasOwnProperty("recoming")){
          Object.keys(buf_v["recoming"]).forEach(function (i) {
            var v = buf_v["recoming"][i];
            if(v["campany_device"] == "反響" && v["media"]){
              var mediaType = v["media"];
              switch(mediaType){
                // 「NET外」にカウント
                case "チラシ":
                case "現地看板":
                case "法人":
                case "その他":
                case "紹介":
                case "リピーター":
                case "不明":
                case "":
                  // スタッフ別でのカウント
                  if("再来" in media2[buf_i]){
                    media2[buf_i]["再来"]++;
                  }else{
                    media2[buf_i]["再来"] = 1;
                  }
                  // 店全体でのカウント
                  if("再来" in media2["total"]){
                    media2["total"]["再来"]++;
                  }else{
                    media2["total"]["再来"] = 1;
                  }
                  break;
                  
                // 「NET」にカウント
                default:
                  // スタッフ別でのカウント
                  if("再来" in media1[buf_i]){
                    media1[buf_i]["再来"]++;
                  }else{
                    media1[buf_i]["再来"] = 1;
                  }
                  // 店全体でのカウント
                  if("再来" in media1["total"]){
                    media1["total"]["再来"]++;
                  }else{
                    media1["total"]["再来"] = 1;
                  }
                  break;
              }
            }
            // 「NET外」にカウント
            else{
              // スタッフ別でのカウント
              if("再来" in media2[buf_i]){
                media2[buf_i]["再来"]++;
              }else{
                media2[buf_i]["再来"] = 1;
              }
              // 店全体でのカウント
              if("再来" in media2["total"]){
                media2["total"]["再来"]++;
              }else{
                media2["total"]["再来"] = 1;
              }
            }
          });
        }
      })
    }

    // 配列を一つにまとめる
    var media = {
      "media":media1,
      "device":media2
    };

    return media;

  }

  //*******************************************************
  // 
  // 【データ表示】 来店・決定数をカウントしてテーブルに表示する
  // 
  //*******************************************************
  function dsp_comingTable(key){

    // 合計値を入れる配列を用意
    var result = {};

    // 来店・決定数のカウントデータを取得
    var total = cnt_comingTable();
    
    Object.keys(total).forEach(function (type) {
      Object.keys(total[type]).forEach(function (id) {
        var val2 = total[type][id];
        if((key == "" && id == "total") || id == key){
          Object.keys(val2).forEach(function (type2) {
            var cnt = val2[type2];
          });
        }
      })
    })

    // 該当スタッフのデータだけまとめる
    Object.keys(total).forEach(function (i) {
      result[i] = total[i][key];
    })

    return result;

  }

  //*******************************************************
  // 
  // 【カウント】 来店・決定数をカウントする
  // 
  //*******************************************************
  function cnt_comingTable(){

    // スタッフデータを取得
    var staff_data = scopeData_S;
    
    // 全データを取得
    var all_data = scopeData_C;
    
    if(!all_data){
      all_data = [];
    }

    // 決定数のカウント
    var agreement = {"total":{"total":0,"rate":0,"half":0}};
    
    Object.keys(staff_data).forEach(function (id) {
      agreement[id] = {"total":0,"rate":0,"half":0};
      if(all_data[id]){
        // 【来店状況】
        if(all_data[id]["coming"]){
          Object.keys(all_data[id]["coming"]).forEach(function (i) {
            var v = all_data[id]["coming"][i];
            if(v["important_flg"] != ""){
              agreement[id]["total"]++;
              agreement["total"]["total"]++;
            }
          });
        }
        // 【再来】
        if(all_data[id]["recoming"]){
          Object.keys(all_data[id]["recoming"]).forEach(function (i) {
            var v = all_data[id]["recoming"][i];
            if(v["important_flg"] != ""){
              agreement[id]["total"]++;
              agreement["total"]["total"]++;
            }
          });
        }
      }
    })

    // 媒体のカウントデータを取得
    var media = cnt_mediaTable();

    // 来店媒体「NET」「NET外」 の合計値を算出
    var coming = {"total":{"total":0,"new":0,"intro":0,"repeater":0,"recoming":0}};
    Object.keys(staff_data).forEach(function (id) {
      // スタッフID取得 - 配列化
      coming[id] = {};
      Object.keys(media).forEach(function (type) {
        var v = media[type];
        // カウントする項目を定義
        if(!coming[id]["total"]){
          coming[id] = {"total":0,"new":0,"intro":0,"repeater":0,"recoming":0};
        }
        if(v[id]){
          // カウント開始
          Object.keys(v[id]).forEach(function (m) {
            var c = v[id][m];
            coming[id]["total"] += cNum(c);
            coming["total"]["total"] += cNum(c);
            var cntMediaType = m;
            switch(cntMediaType){
              case "紹介":
                coming[id]["intro"] += cNum(c);
                coming["total"]["intro"] += cNum(c);
                break;
                
              case "リピーター":
                coming[id]["repeater"] += cNum(c);
                coming["total"]["repeater"] += cNum(c);
                break;
                
              case "再来":
                coming[id]["recoming"] += cNum(c);
                coming["total"]["recoming"] += cNum(c);
                break;
                
              default:
                coming[id]["new"] += cNum(c);
                coming["total"]["new"] += cNum(c);
                break;
            }
          });
        }
      })
    })

    Object.keys(agreement).forEach(function (i) {
      var v = agreement[i];
      if(coming[i]["total"] == 0){
        agreement[i]["rate"] = 0;
      }else{
        if(v["total"] == 0){
          agreement[i]["rate"] = 0;
        }else{
          agreement[i]["rate"] = (v["total"] / coming[i]["total"]*100).toFixed(1);
        }
      }
    })

    // 来店・決定の配列を合体
    var total = {"coming":coming,"agreement":agreement};

    return total;
  }

  //*******************************************************
  // 
  // 【データ表示】 付帯関係のデータをカウントしてテーブルに表示する
  // 
  //*******************************************************
  function dsp_incidentalTable(key){

    // 合計値を入れる配列を用意
    var result = {};

    // 付帯のカウントデータを取得する
    var incidental = cnt_incidentalTable();
    
    // 該当スタッフのデータだけまとめる
    Object.keys(incidental).forEach(function () {
      result = incidental[key];
    })

    return result;
  }

  //*******************************************************
  // 
  // 【カウント】 付帯をカウントする
  // 
  //*******************************************************
  function cnt_incidentalTable(){

    // スタッフデータを取得
    var staff_data = scopeData_S;
    
    // 全データを取得
    var all_data = scopeData_C;
    
    // 全データで付帯のカウントを行う
    var incidental = {"total":{}};

    Object.keys(staff_data).forEach(function (id) {
      incidental[id] = {};
      if(all_data && Object.keys(all_data).indexOf(id) > -1){
        Object.keys(all_data[id]).forEach(function (statuses) {
          var v2 = all_data[id][statuses];
          Object.keys(v2).forEach(function (n) {
            var v3 = v2[n];
            Object.keys(v3).forEach(function (i) {
              var v4 = v3[i];
              var incidentalType = i;
              Object.keys(incidentalArray).forEach(function (j) {
                var inc = incidentalArray[j];
                if(incidentalType == inc["key"] + "_agreement_flg"){
                  // カラム名を「_」で3分割して、先頭の文字列を配列のキーにする
                  var key_arr = i.split("_");
                  if(key_arr.length > 3){
                    var key = key_arr[0] + "_" + key_arr[1];
                  }else{
                    var key = key_arr[0];
                  }
                  // 【スタッフ】カウント0を定義
                  if(!incidental[id][key]){
                    incidental[id][key] = {"cnt":0};
                  }
                  // 【トータル】カウント0を定義
                  if(!incidental["total"][key]){
                    incidental["total"][key] = {"cnt":0,"rate":""};
                  }
                  // 付帯が決定していればカウント
                  if(v4 > 0){
                    incidental[id][key]["cnt"] += cNum(v4);
                    incidental["total"][key]["cnt"] += cNum(v4);
                  }
                  return false;
                }
              })
            })
          })
        })
      } else {
        Object.keys(incidentalArray).forEach(function (j) {
          var inc = incidentalArray[j];
          incidental[id][inc["key"]] = {"cnt":0};
        })
      }
    })

    // トータルにデータがなければ0データを入れる
    if(!incidental["total"]["pesticide"]){
      Object.keys(incidentalArray).forEach(function (j) {
        var v = incidentalArray[j];
        incidental["total"][v["key"]] = {"cnt":0};
      });
    }

    // 決定数を取得
    var come_agree = cnt_comingTable();
    var agreement = come_agree["agreement"];

    // 付帯決定率を算出
    if(incidental["total"]){
      Object.keys(incidental).forEach(function (i) {
        var v = incidental[i];
        Object.keys(v).forEach(function (i2) {
          var v2 = v[i2];
          if(agreement[i]["total"] > 0 && v2["cnt"] > 0){
            incidental[i][i2]["rate"] = ((v2["cnt"]/agreement[i]["total"])*100).toFixed(1)+"%";
          }
        });
      });
    }

    return incidental;
  }

  //*******************************************************
  // 
  // 【データ表示】 売上金額を表示する
  // 
  //*******************************************************
  function dsp_salesTable(key,Data_C){
    // データを取得
    var sales = cnt_salesTable(key,Data_C);
    return sales;
  }

  //*******************************************************
  // 
  // 【カウント】 売上表用のデータをカウントして配列で返す
  // 
  //*******************************************************
  function cnt_salesTable(key,Data_C){
    // 必要なスタッフ情報を取り出す
    var s_data = {};
    if(key){
      s_data[key] = scopeData_S[key];
    }else{
      s_data = scopeData_S;
    }
    
    // 変数rtnに入るデータを数値型として定義する
    var rtn = {};
    rtn["estimate"]           = cNum(0); // 売上総見込
    rtn["white_sales"]        = cNum(0); // 白売上
    rtn["m_contract"]         = cNum(0); // 当月:契約(左表)
    rtn["m_incidental"]       = cNum(0); // 当月:付帯(左表)
    rtn["m_article_manager"]  = cNum(0); // 当月:物担(左表)
    rtn["other"]              = cNum(0); // 当月:他業者付け(左表)
    rtn["other_estimate"]     = cNum(0); // 決定前の売上見込(左表)
    rtn["o_contract"]         = cNum(0); // 繰越:契約(左表)
    rtn["o_incidental"]       = cNum(0); // 繰越:付帯(左表)
    rtn["over"]               = cNum(0); // 繰越確定金額
    rtn["black_sales"]        = cNum(0); // 黒-総入金(税抜)
    rtn["black_sales2"]       = cNum(0); // 黒-総入金(税込)
    rtn["m_contract2"]        = cNum(0); // 当月:契約(右表)
    rtn["m_incidental2"]      = cNum(0); // 当月:付帯(右表)
    rtn["m_article_manager2"] = cNum(0); // 当月:物担(右表)
    rtn["other2"]             = cNum(0); // 当月:他業者付け(右表)
    rtn["other_estimate2"]    = cNum(0); // 決定前の売上見込(右表)
    rtn["o_contract2"]        = cNum(0); // 繰越:契約(右表)
    rtn["o_incidental2"]      = cNum(0); // 繰越:付帯(右表)
    rtn["not_payment"]        = cNum(0); // 未入金額
    
    rtn["incidental"] = cNum(0); // 付帯入金額
    rtn["reform"]     = cNum(0); // リフォーム
    rtn["extra"]      = cNum(0); // その他
    
    Object.keys(incidentalArray).forEach(function (i) {
      var v = incidentalArray[i];
      rtn[v["key"]] = cNum(0);
    });

    // 全てのデータを取得
    var c_data = Data_C;

    Object.keys(s_data).forEach(function (id) {
      
      // 「店全体」の売上表に「店舗外」の数字が含まれないように処理をスキップ
      if(!key && id == "tenpogai"){
        return true;
      }

      if(c_data && Object.keys(c_data).indexOf(id) > -1){
        Object.keys(c_data[id]).forEach(function (type) {
          Object.keys(c_data[id][type]).forEach(function (i) {
            var v = c_data[id][type][i];
            // 当月か繰越かで処理を分ける
            var dataType = type;
            switch(dataType){
              case "coming":
              case "recoming":
                // 「状況:決定」が条件の場合
                if(v["important_flg"]){
                  // 【当月:契約(左表)】
                  rtn["m_contract"] += cNum(v["brokerage"]);
                  rtn["m_contract"] += cNum(v["ad"]);
                  rtn["m_contract"] += cNum(v["garage"]);
                  rtn["m_contract"] += cNum(v["referral"]);
                  rtn["m_contract"] += cNum(v["article_manager"]);
                  
                  // 【当月:付帯(左表)】
                  Object.keys(incidentalArray).forEach(function (j) {
                    var inc = incidentalArray[j];
                    rtn["m_incidental"] += cNum(v[inc["key"]]);
                  });
                  
                }else{
                  // 【決定前の売上見込(左表)】
                  rtn["other_estimate"] += cNum(v["brokerage"]);
                  rtn["other_estimate"] += cNum(v["ad"]);
                  rtn["other_estimate"] += cNum(v["garage"]);
                  rtn["other_estimate"] += cNum(v["referral"]);
                  rtn["other_estimate"] += cNum(v["article_manager"]);
                  
                  Object.keys(incidentalArray).forEach(function (j) {
                    var inc = incidentalArray[j];
                    rtn["other_estimate"] += cNum(v[inc["key"]]);
                  });
                }
                
                // 【当月:契約(右表)】
                rtn["m_contract2"] += v["brokerage_flg"] == "★" ? cNum(v["brokerage"]) : 0;
                rtn["m_contract2"] += v["advertisement_flg"] == "★" ? cNum(v["ad"]) : 0;
                rtn["m_contract2"] += v["garage_flg"] == "★" ? cNum(v["garage"]) : 0;
                rtn["m_contract2"] += v["referral_flg"] == "★" ? cNum(v["referral"]) : 0;
                rtn["m_contract2"] += v["article_manager_flg"] == "★" ? cNum(v["article_manager"]) : 0;
                
                // 【当月:付帯(右表)】
                Object.keys(incidentalArray).forEach(function (j) {
                  var inc = incidentalArray[j];
                  rtn["m_incidental2"] += v[inc["key"] + "_payment"] == "★" ? cNum(v[inc["key"]]) : 0;
                });
                break;
                
              case "article":
                // 「状況:決定」が条件の場合
                if(v["important_flg"] != ""){
                  // 【当月:物担(左表)】
                  rtn["m_article_manager"] += cNum(v["brokerage"]);
                  rtn["m_article_manager"] += cNum(v["ad"]);
                  rtn["m_article_manager"] += cNum(v["garage"]);
                  rtn["m_article_manager"] += cNum(v["referral"]);
                  rtn["m_article_manager"] += cNum(v["article_manager"]) * (-1);
                  
                }else{
                  // 【決定前の売上見込(左表)】
                  rtn["other_estimate"] += cNum(v["brokerage"]);
                  rtn["other_estimate"] += cNum(v["ad"]);
                  rtn["other_estimate"] += cNum(v["garage"]);
                  rtn["other_estimate"] += cNum(v["referral"]);
                  rtn["other_estimate"] += cNum(v["article_manager"]) * (-1);
                }
                
                // 【当月:物担(右表)】
                rtn["m_article_manager2"] += v["brokerage_flg"] == "★" ? cNum(v["brokerage"]) : 0;
                rtn["m_article_manager2"] += v["advertisement_flg"] == "★" ? cNum(v["ad"]) : 0;
                rtn["m_article_manager2"] += v["garage_flg"] == "★" ? cNum(v["garage"]) : 0;
                rtn["m_article_manager2"] += v["referral_flg"] == "★" ? cNum(v["referral"]) : 0;
                rtn["m_article_manager2"] += v["article_manager_flg"] == "★" ? cNum(v["article_manager"]) * (-1) : 0;
                break;
              
              case "over":
                // 【繰越:契約(左表)】
                rtn["o_contract"] += cNum(v["brokerage"]);
                rtn["o_contract"] += cNum(v["ad"]);
                rtn["o_contract"] += cNum(v["garage"]);
                rtn["o_contract"] += cNum(v["referral"]);
                rtn["o_contract"] += cNum(v["article_manager"]);
                
                // 【繰越:付帯(左表)】
                Object.keys(incidentalArray).forEach(function (j) {
                  var inc = incidentalArray[j];
                  rtn["o_incidental"] += cNum(v[inc["key"]]);
                });
                
                // 【繰越:契約(右表)】
                rtn["o_contract2"] += v["brokerage_flg"] == "★" ? cNum(v["brokerage"]) : 0;
                rtn["o_contract2"] += v["advertisement_flg"] == "★" ? cNum(v["ad"]) : 0;
                rtn["o_contract2"] += v["garage_flg"] == "★" ? cNum(v["garage"]) : 0;
                rtn["o_contract2"] += v["referral_flg"] == "★" ? cNum(v["referral"]) : 0;
                rtn["o_contract2"] += v["article_manager_flg"] == "★" ? cNum(v["article_manager"]) : 0;
                
                // 【繰越:付帯(右表)】
                Object.keys(incidentalArray).forEach(function (j) {
                  var inc = incidentalArray[j];
                  rtn["o_incidental2"] += v[inc["key"] + "_payment"] == "★" ? cNum(v[inc["key"]]) : 0;
                });
                break;
              
              case "other":
              case "incidental":
                // 【他業者】【付帯】は計算処理をしない
                return true;
                break;
            }
            
            // 【売上総見込】
            var article_manager = type != "article" ? cNum(v["article_manager"]) : cNum(v["article_manager"]) * (-1);
            rtn["estimate"] += cNum(v["brokerage"]);
            rtn["estimate"] += cNum(v["ad"]);
            rtn["estimate"] += cNum(v["garage"]);
            rtn["estimate"] += cNum(v["referral"]);
            rtn["estimate"] += article_manager;
            
            Object.keys(incidentalArray).forEach(function (j) {
              var inc = incidentalArray[j];
              rtn["estimate"] += cNum(v[inc["key"]]);
            });
            
            // 【繰越確定金額】
            // 契約
            rtn["over"] += v["brokerage_flg"] == "-" ? cNum(v["brokerage"]) : 0;
            rtn["over"] += v["advertisement_flg"] == "-" ? cNum(v["ad"]) : 0;
            rtn["over"] += v["garage_flg"] == "-" ? cNum(v["garage"]) : 0;
            rtn["over"] += v["referral_flg"] == "-" ? cNum(v["referral"]) : 0;
            rtn["over"] += v["article_manager_flg"] == "-" ? article_manager : 0;
            
            // 付帯
            Object.keys(incidentalArray).forEach(function (j) {
              var inc = incidentalArray[j];
              rtn["over"] += v[inc["key"] + "_payment"] == "-" ? cNum(v[inc["key"]]) : 0;
            });
            
            // 【付帯売上】
            Object.keys(incidentalArray).forEach(function (j) {
              var inc = incidentalArray[j];
              rtn[inc["key"]] += v[inc["key"] + "_payment"] == "★" ? cNum(v[inc["key"]]) : 0;
            });
            
            // 【売上総見込】に【繰越確定金額】を引く
            rtn["estimate"] -= cNum(v["over"]);
            
          });
        });
      }

      // 【売上総見込】 他業者付け等その他売上
      rtn["estimate"] += cNum(scopeData_O[id]["total"]);
      rtn["estimate"] += cNum(scopeData_O[id]["other"]["total"]);
      rtn["estimate"] += cNum(scopeData_O[id]["extra"]["total"]);
      
      Object.keys(incidentalArray).forEach(function (j) {
        var inc = incidentalArray[j];
        rtn["estimate"] += cNum(scopeData_O[id][inc["key"]]["total"]);
      });
      
      // 【当月:付帯(左表)】
      rtn["m_incidental"] += cNum(scopeData_O[id]["total"]);
      rtn["m_incidental"] += cNum(scopeData_O[id]["extra"]["total"]);
      
      Object.keys(incidentalArray).forEach(function (j) {
        var inc = incidentalArray[j];
        rtn["m_incidental"] += cNum(scopeData_O[id][inc["key"]]["total"]);
      });
      
      // 【当月:付帯(右表)】
      rtn["m_incidental2"] += cNum(scopeData_O[id][1]);
      rtn["m_incidental2"] += cNum(scopeData_O[id]["extra"][1]);
      
      Object.keys(incidentalArray).forEach(function (j) {
        var inc = incidentalArray[j];
        rtn["m_incidental2"] += cNum(scopeData_O[id][inc["key"]][1]);
      });
      
      // 【付帯売上】 他業者付けの付帯を追加
      Object.keys(incidentalArray).forEach(function (j) {
        var inc = incidentalArray[j];
        rtn[inc["key"]] += cNum(scopeData_O[id][inc["key"]][1]);
      });
      
      // 【付帯売上】 他業者付け等その他売上
      rtn["reform"] += cNum(scopeData_O[id][1]);
      rtn["other"]  += cNum(scopeData_O[id]["other"]["total"]);
      rtn["other2"] += cNum(scopeData_O[id]["other"][1]);
      rtn["extra"]  += cNum(scopeData_O[id]["extra"][1]);

    })

    // 付帯入金額 【付帯売上】
    Object.keys(incidentalArray).forEach(function (i) {
      var v = incidentalArray[i];
      rtn["incidental"] = rtn["incidental"] + rtn[v["key"]];
    });
    rtn["incidental"] = rtn["incidental"] + rtn["reform"];
    rtn["incidental"] = rtn["incidental"] + rtn["extra"];
    
    // 【売上総見込】
    rtn["estimate"] -= rtn["over"];
    
    // 【白売上】
    rtn["white_sales"] += rtn["m_contract"];
    rtn["white_sales"] += rtn["m_incidental"];
    rtn["white_sales"] += rtn["m_article_manager"];
    rtn["white_sales"] += rtn["other"];
    
    // 【黒-総入金(税抜)】
    rtn["black_sales"] += Math.floor(rtn["m_contract2"] / tax);
    rtn["black_sales"] += Math.floor(rtn["m_incidental2"] / tax);
    rtn["black_sales"] += Math.floor(rtn["m_article_manager2"] / tax);
    rtn["black_sales"] += Math.floor(rtn["other2"] / tax);
    rtn["black_sales"] += Math.floor(rtn["o_contract2"] / tax);
    rtn["black_sales"] += Math.floor(rtn["o_incidental2"] / tax);
    
    // 【黒-総入金(税込)】
    rtn["black_sales2"] =  rtn["m_contract2"] + rtn["m_incidental2"] + rtn["m_article_manager2"] + rtn["other2"] + rtn["o_contract2"] + rtn["o_incidental2"];
    
    // 未入金額 【黒-総入金】
    rtn["not_payment"] = rtn["estimate"] - rtn["black_sales2"];

    return rtn;
  }

  //*******************************************************
  // 
  // 【カウント】 全体の反響数からスタッフの分だけ抽出
  // 
  //*******************************************************
  function rev_Count(key){

    if (!scopeData_R) return 0;

    // 反響数
    var countArray = {
      rev: 0,
      comrev: 0,
    }
    scopeData_R.forEach(function (v) {
      if(v["account"] == key) {
        countArray["rev"] += 1;
      }
    })

    var salesArray = scopeData_C[key];
    Object.keys(salesArray).forEach(function (sales_type) {
      var customerArray = salesArray[sales_type];
      Object.keys(customerArray).forEach(function (i) {
        if (sales_type == "coming") {
          var v = customerArray[i];
          if (v["campany_device"] == '反響') {
            countArray["comrev"] += 1;
          }
        }
      });
    });

		let rate = Number(Math.round((countArray["comrev"] / countArray["rev"]) * 1000) / 10);
		rate = rate ? rate : 0;

    return rate;

  }

  //*******************************************************
  // 
  // 【カウント】 総入金年間データを表示する
  // 
  //*******************************************************
  function black_Count(key){

    var obj = []

    if (!scopeData_B) {
      for (var m=1; m<=12; m++) {
        obj[m] = 0;
      }
    } else {
      for (var m=1; m<=12; m++) {
        var sales = cnt_salesTable(key,scopeData_B[m]);
        obj[m-1] = sales["black_sales"];
      }
    }

    return obj;
  }

  useEffect(() => {

    var date = new Date();
    setYear((date.getFullYear()).toString());
    setMonth((date.getMonth() + 1).toString());

    getBarChart();

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

  function addZero(num, length) {
    var minus = "";
    var zero = ('0'.repeat(length)).slice(-length);
    if (parseInt(num) < 0) {
      // マイナス値の場合
      minus = "-";
      num = -num;
      zero = zero.slice(-(length - 1 - String(num).length));	// -の1桁+数値の桁数分引く
    }
  
    return (minus + zero + num).slice(-length);
  }

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
                  Alert.alert(
                    '確認',
                    '売上順位を集計しますか？',
                    [
                      {
                        text: "はい",
                        onPress: () => {
                          getRanking(true)
                        }
                      },
                      {
                        text: "いいえ",
                      },
                    ]
                  )
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
              <Text style={styles.title}>売上年間推移</Text>
              <Text style={styles.sub_title}>総入金(税抜)</Text>
              <Text style={styles.year}>{year}年</Text>
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
                      data: barChart,
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
  sub_title: {
    fontSize: 12,
    color: "#9B9B9B",
    marginVertical: 20,
    marginLeft:10
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
