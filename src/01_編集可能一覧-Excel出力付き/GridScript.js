(function () {
    "use strict";
    kintone.events.on('app.record.index.show', function (event){
        if (!($("#grid").length)) {
            return;
        }

        //データ取得
        var jsonData = createJsonDatasetsFromKintoneRecords(event.records);

        //グリッド生成
        $("#grid").igGrid({
            primaryKey: "__id",
            width: "100%",
            height: "600px",
            dataSource: jsonData,   
            autoGenerateColumns: false,
            autofitLastColumn : false,
            columns: [
                { headerText: "__id", key: "__id", dataType: "number", hidden: true, width:"80px" },
                { headerText: "__revision", key: "__revision", dataType: "number", hidden: true, width:"80px" },
                { headerText: "会社名", key: "会社名", dataType: "string", width:"200px", formatter: sanitaize.encode },
                { headerText: "先方担当者名", key: "先方担当者名", dataType: "string", width:"150px", formatter: sanitaize.encode },
                { headerText: "TEL", key: "TEL", dataType: "string", width:"150px", formatter: sanitaize.encode },
                { headerText: "FAX", key: "FAX", dataType: "string", width:"150px", formatter: sanitaize.encode },
                { headerText: "メールアドレス", key: "メールアドレス", dataType: "string", width:"170px", formatter: sanitaize.encode },
                { headerText: "見込み時期", key: "見込み時期", dataType: "date", width:"150px", format:"yyyy-MM-dd" },
                { headerText: "案件担当者", key: "案件担当者", dataType: "string", width:"150px", hidden: true },
                { headerText: "緯度", key: "緯度", dataType: "string", width:"150px", hidden: true },
                { headerText: "経度", key: "経度", dataType: "string", width:"150px", hidden: true },
                { headerText: "確度", key: "確度", dataType: "string", width:"80px" },
                { headerText: "製品名", key: "製品名", dataType: "string", width:"150px" },
                { headerText: "単価", key: "単価", dataType: "number", width:"80px", format: "number", columnCssClass:"numberCell" },
                { headerText: "ユーザー数", key: "ユーザー数", dataType: "number", width:"110px", format: "number", columnCssClass:"numberCell" },
                { headerText: "小計", key: "小計", dataType: "number", width:"110px", format: "\#,##0", columnCssClass:"numberCell", unbound: true , formula: "calcSum"},
                //{ headerText: "作成者", key: "作成者", dataType: "string", width:"130px" },
                //{ headerText: "更新者", key: "更新者", dataType: "string", width:"130px" },
            ],
            features : [
                {
                    name: "Updating",
                    editMode: "cell",
                    enableAddRow: false,
                    enableDeleteRow: false,
                    excelNavigationMode: false,
                    columnSettings: [
                        {
                            columnKey : "見込み時期",
                            editorType: "datepicker"
                        },
                        {
                            columnKey : "確度",
                            editorType: "combo",
                            editorOptions: {
                                    dataSource: new Array("A","B","C")
                                }   
                        },
                        {
                            columnKey : "製品名",
                            editorType: "combo",
                            editorOptions: {
                                    dataSource: new Array("kintone","Office","Garoon")
                                }
                        },
                        {
                            columnKey : "小計",
                            readOnly: true
                        }
                    ]
                },
                {
                    name : "ColumnMoving"
                },
                {
                    name: "Resizing"
                },
                {
                    name: "Filtering"
                },
                {
                    name: "Sorting"
                }
            ]
        });
    });

    //小計の自動計算ロジック
    $(document).delegate("#grid", "iggridupdatingeditcellended", function (evt, ui) {
        if(ui.update && (ui.columnKey=="ユーザー数" || ui.columnKey=="単価")){
            var userCount = $("#grid").igGrid("getCellValue", ui.rowID, "ユーザー数");
            var unitPrice = $("#grid").igGrid("getCellValue", ui.rowID, "単価");
            //掛け算の結果を代入
            var cell = $("#grid").igGrid("cellById", ui.rowID, "小計");
            cell[0].innerText = String(userCount*unitPrice).replace( /(\d)(?=(\d\d\d)+(?!\d))/g, '$1,' )
//            $("#grid").igGridUpdating("setCellValue", ui.rowID,'小計',userCount * unitPrice);

        }
    });

    //タッチサポートによりスクロールバーの非表示を防ぐ
    if (Modernizr) {
        // JS
        Modernizr.touch = false;
        // CSS
        $('html').removeClass('touch').removeClass('no-touch').addClass('no-touch');
    }

})();

    function calcSum(row, grid) {  
        // 合計をリターン  
        return row.ユーザー数 * row.単価;  
    };  
    //データ一括更新時の処理
    function commitRecords(){
        //アプリID取得
        var appId = kintone.app.getId();
        //トランザクションデータの取得
        var allTransactions = $("#grid").data("igGrid").dataSource.allTransactions();

        //トランザクションデータをkintone更新APIように加工する。
        var records = [];
        for(var tranKey in allTransactions){
            //if(tranKey=="小計") continue;   //小計は計算用項目のため読み飛ばし
            //新しいセル値の更新設定（API用）
            var fieldValue = {};
            switch (allTransactions[tranKey].col){
              case "小計":
                continue;
              case "見込み時期":
                fieldValue["value"] = formatDateToKintoneDate(allTransactions[tranKey].value);
                break;
              default:
                fieldValue["value"] = allTransactions[tranKey].value;
                break;
            }

            //既に登録済みの行かどうかの判定
            var existingRecord = records.filter(function(item, index){
                if (item.id == allTransactions[tranKey].rowId) return true;
            })
            var newRecord;
            if(existingRecord.length == 0){
                //未登録の行の場合
                newRecord = {};
                newRecord["id"] = allTransactions[tranKey].rowId;
                newRecord["record"] = {};
                newRecord["record"][allTransactions[tranKey].col] = fieldValue;
                //1セルの編集内容をレコードの編集内容としてAPIに適合する形式で追加していく。
                records.push(newRecord);
            }else{
                //登録済みの行の場合
                existingRecord[0]["record"][allTransactions[tranKey].col] = fieldValue;
            }
        };


        //// CSRFトークンのの取得
        var token = kintone.getRequestToken();
        var requestData = { "app": appId, "records": records, "__REQUEST_TOKEN__": token };

        kintone.api("/k/v1/records", "PUT", requestData, 
            function(res){
                //更新完了
                alert("更新が完了しました。");
                $("#grid").igGrid("commit");
        }, function(res){
                //更新完了
                alert("更新が失敗しました。");
        });
    }


    //エクセル出力を行う
    function exportExcel(){
        $.ig.GridExcelExporter.export($("#grid"), {fileName: "案件一覧"});
    }

    //サニタイズ(HTML Encoding)の処理
    sanitaize = {
      encode : function (str) {
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
      },

      decode : function (str) {
        return str.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, '\'').replace(/&amp;/g, '&');
      }
    };