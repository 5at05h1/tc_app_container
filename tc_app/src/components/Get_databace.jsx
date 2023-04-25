import * as SQLite from "expo-sqlite";

// DB接続
const db = SQLite.openDatabase("db");

export default function GetDB(obj,table){
    
        
  return new Promise((resolve, reject)=>{
    db.transaction((tx) => {
      tx.executeSql(
        `select * from `+table+`;`,
        [],
        (_, { rows }) => {
          if (rows._array.length) {
            if(table=="staff_profile"){
              console.log(rows._array);
            }
            rows._array.map((data) => {
              obj.push(data)
              
            })
          } else {
            return
          }
        },
        () => {
          console.log("select "+table+" faileaaaaaaaaaaaaaa");
        }
      )
    })
    resolve();
  })
  // return obj;
}