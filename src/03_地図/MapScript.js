(function () {
    "use strict";
    kintone.events.on('app.record.index.show', function (event){
        if (!($("#map").length)) {
            return;
        }

        //データ取得（jQueryTemplatesに日本語名が使用できないためCommonを利用せずここで定義）
        var jsonData = [];
        for(var recordKey in event.records){
            var addedRecord = {};
            for(var key in event.records[recordKey]){
                //各セル単位の情報の取得
                var targetObject = event.records[recordKey][key];

                //列の属性に合わせてスキップ有無や格納するコンテンツを変える
                switch (targetObject["type"]){
                  case "USER_SELECT":  //スキップ対象のカラム
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
                    if(key=="小計"){
                        addedRecord["Amount"] = Number(targetObject["value"]);
                    }else{
                        addedRecord[key] = Number(targetObject["value"]);
                    }
                    break;
                  case "MODIFIER":  //更新者、作成者はname属性から値を取得
                  case "CREATOR":
                    addedRecord[key] = targetObject["value"]["name"];
                    break;
                  default:   //上記以外のケースはvalueをそのまま格納:
                    if(key=="会社名"){
                        addedRecord["CompanyName"] = targetObject["value"];
                    }else if(key=="製品名"){
                        addedRecord["ProductName"] = targetObject["value"];
                    }else{
                        addedRecord[key] = targetObject["value"];
                    }
                    break;
                }
            };
            //jsonデータとして蓄積する。
            jsonData.push(addedRecord);
        };

        //ツールチップテンプレート
        var tooltipTemplate = '<table id="tooltipTable" ><tr><th class="tooltipHeading" colspan="2">${item.CompanyName}</th></tr><tr><td>製品:</td><td>${item.ProductName}</td></tr><tr><td>売上:</td><td>${item.Amount}</td></tr></table>';

            $("#map").igMap({
                width: "100%",
                height: "500px",
                series: [{
                    type: "geographicSymbol",
                    name: "worldCities",
                    dataSource: jsonData,
                    latitudeMemberPath: "緯度",
                    longitudeMemberPath: "経度",
                    markerOutline: "#000000",
                    markerBrush: "#000000",
                    showTooltip: true,
                    tooltipTemplate: tooltipTemplate,
                    markerTemplate: {
                        measure: function (measureInfo) {
                            var radius = 5;
                            measureInfo.width = radius * 2;
                            measureInfo.height = radius * 2;
                        },
                        render: function (renderInfo) {
                            var ctx = renderInfo.context;
                            var x = renderInfo.xPosition;
                            var y = renderInfo.yPosition;
                            var radius = Math.min(renderInfo.availableWidth, renderInfo.availableHeight) / 2.0;
                            if (renderInfo.isHitTestRender) {
                                ctx.fillStyle = renderInfo.data.actualItemBrush().fill();
                                ctx.strokeStyle = renderInfo.data.actualItemBrush().fill();
                            }
                            else {
                                var stage = renderInfo.data.item()["確度"];
                                var color;
                                switch(stage){
                                  case "A":
                                    color="red";
                                    break;
                                  case "B":
                                    color="orange";
                                    break;
                                  case "C":
                                    color="Blue";
                                    break;
                                  default:
                                    color="black";
                                    break;
                                }
                                ctx.fillStyle = color;
                                ctx.strokeStyle = color;
                                ctx.lineWidth = 2.0;
                            }

                            ctx.beginPath();
                            ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
                            ctx.fill();
                            ctx.lineWidth = 1;
                            ctx.stroke();
                            ctx.closePath();
                        }
                    },
                }],
                seriesMouseLeftButtonUp: function (evt, ui) {
                    //アプリID取得
                    var appId = kintone.app.getId();                    
                    window.open('https://infragistics.cybozu.com/k/' + appId + '/show#record=' + ui.item.__id)
                },
            });

            //特定の位置（東京）へズーム
            $("#map").igMap("flush");
            var zoom = $("#map").igMap("getZoomFromGeographic", {
            left: 139.5,
            top: 35.3,
            width: 0.5,
            height: 0.5
            });
            $("#map").igMap("option", "windowRect", zoom);

        });

})();