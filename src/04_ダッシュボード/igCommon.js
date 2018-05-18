//KintoneのRecordsをフラットなjsonData構造に変換して返す。
function createJsonDatasetsFromKintoneRecords(records){
    var jsonData = [];
    for(var recordKey in records){
        var addedRecord = {};
        for(var key in records[recordKey]){
            //各セル単位の情報の取得
            var targetObject = records[recordKey][key];

            //列の属性に合わせてスキップ有無や格納するコンテンツを変える
            switch (targetObject["type"]){
              case "SUBTABLE":
                break;
              case "__ID__":  //ID及びリビジョンは$マークを変換する(igGridの仕様のため$マークを使わない)
              case "__REVISION__":
                addedRecord[key.replace("$","__")] = targetObject["value"];
                break;
              case "DATE":  //日付項目はスラッシュ区切りに変換
                addedRecord[key] = new Date(targetObject["value"].split("-").join("/"));
                break;
              case "NUMBER":  //数値項目は数値として格納
              case "CALC":
                addedRecord[key] = Number(targetObject["value"]);
                break;
              case "USER_SELECT":  //ユーザ選択(複数あり得る？先頭だけ取得)
                addedRecord[key] = (targetObject["value"].length > 0) ? targetObject["value"][0]["name"]: "";
                break;
              case "MODIFIER":  //更新者、作成者はname属性から値を取得
              case "CREATOR":
                addedRecord[key] = targetObject["value"]["name"];
                break;
              default:   //上記以外のケースはvalueをそのまま格納:
                addedRecord[key] = targetObject["value"];
                break;
            }
        };
        //jsonデータとして蓄積する。
        jsonData.push(addedRecord);
    };
    return jsonData;
}