(function () {
    "use strict";
    kintone.events.on('app.record.index.show', function (event){
        if (event.viewName != 'ダッシュボード') {
            return;
        }

        //案件管理アプリのID設定
        var appId_MonthlySummary = 21; //月別見込み集計
        var appId_Opportunities = 15; //案件管理
        var appId_UserNumberHistory = 46; //ユーザ数履歴

        //ダッシュボードの枠の作成
        createDashboardFrame();

        //月別集計チャートの表示
        loadMonthlySummary();

        //契約ユーザ数推移チャートの表示
        loadUserNumberHistory();

        //大規模案件（Grid）の表示
        loadLargeDeals();

        //当月達成度合い（BulletGraph）の表示
        showPercentageAchievement();

        // ************************
        // ダッシュボードの枠の作成
        // ************************
        function createDashboardFrame(){
            //igTileManagerコントロールにより、ベースとなるタイルを生成する
            $('#dashboard').igTileManager({
                columnWidth: '33%',
                marginLeft: 10,
                marginTop: 10,
                splitterOptions: {
                    enabled: true,
                    collapsed: false,
                    collapsible: true
                },
                items: [
                    { rowIndex: 0, colIndex: 0, rowSpan: 2, colSpan: 2 },
                    { rowIndex: 0, colIndex: 2, rowSpan: 1, colSpan: 1 },
                    { rowIndex: 1, colIndex: 2, rowSpan: 1, colSpan: 1 },
                    { rowIndex: 2, colIndex: 0, rowSpan: 1, colSpan: 3 }
                ]
            });
            //タイル拡大時イベントハンダラ
            $(document).delegate("#dashboard", "igtilemanagertilemaximized", function (evt, ui) {
                //現在最大化されているタイルのIndexを取得
                var currentIndex = ui.tile[0].attributes.getNamedItem("data-index").value;
                //現在最大化されているタイルが横長のzoombar付きチャートの場合はzoombar表示
                if(currentIndex==3){
                  $("#zoombar").css("visibility", "visible");
                }
            });
            //タイル縮小時イベントハンダラ
            $(document).delegate("#dashboard", "igtilemanagertileminimized", function (evt, ui) {
                //現在最大化されているタイルのIndexを取得
                var currentIndex = ui.tile[0].attributes.getNamedItem("data-index").value;
                //現在最大化されているタイルが横長のzoombar付きチャートの場合はzoombar表示
                if(currentIndex==3){
                  $("#zoombar").css("visibility", "collapse");
                }
            });
        }

        // ************************
        // 月別集計チャートのロード
        // ************************
        function loadMonthlySummary(){
            kintone.api(
                kintone.api.url('/k/v1/records', true),
                'GET',
                {'app': appId_MonthlySummary,
                 "query": "order by targetMonth asc limit 500"},
                function(resp) {
                   showMonthlySummary(resp.records);
                }
            );
        }


        // ************************
        // 月別集計チャートの表示
        // ************************
        function showMonthlySummary(records){

            //月別売上データ取得
            var jsonData = createJsonDatasetsFromKintoneRecords(records);

            console.log("月別売上データ取得");
            console.log(jsonData);

            $("#chartMonthlySummary").igDataChart({
                dataSource: jsonData,
                height: "95%",
                width: "100%",
                brushes: ["#FFD338","#CFB7FF","#8DF4BD","#B29427","#9180B2","#8DD0BD"],
                axes: [{
                        name: "Month",
                        type: "categoryX",
                        label: "targetMonth",
                        title: "年月",
                        gap: 1,
                    },
                    {
                        name: "Volume",
                        type: "numericY",
                        title: "製品ごと売上合計"
                    }],
                series: [{
                        name: "thisYear",
                        xAxis: "Month",
                        yAxis: "Volume",
                        type: "stackedColumn",
                        outline: "transparent",
                        legend: { element: "legend1" },
                        series: [{
                            name: "kintone",
                            title: "kintone(今年)",
                            type: "stackedFragment",
                            showTooltip: true,
                            valueMemberPath: "kintone"
                        }, {
                            name: "office",
                            title: "office(今年)",
                            showTooltip: true,
                            type: "stackedFragment",
                            valueMemberPath: "office"
                        }, {
                            name: "Garoon",
                            title: "Garoon(今年)",
                            showTooltip: true,
                            type: "stackedFragment",
                            valueMemberPath: "Garoon"
                        }]
                    },{
                        name: "LastYear",
                        xAxis: "Month",
                        yAxis: "Volume",
                        type: "stackedColumn",
                        outline: "transparent",
                        legend: { element: "legend2" },
                        series: [{
                            name: "kintoneLastYear",
                            title: "kintone(去年)",
                            type: "stackedFragment",
                            showTooltip: true,
                            valueMemberPath: "kintoneLastYear"
                        }, {
                            name: "officeLastYear",
                            title: "Office(去年)",
                            showTooltip: true,
                            type: "stackedFragment",
                            valueMemberPath: "officeLastYear"
                        }, {
                            name: "GaroonLastYear",
                            title: "Garoon(去年)",
                            showTooltip: true,
                            type: "stackedFragment",
                            valueMemberPath: "GaroonLastYear"
                        }]
                    }],
                horizontalZoomable: true,
                verticalZoomable: true,
                windowResponse: "immediate"
            });

            $("#zoombar").css("visibility", "collapse");  //初期は非表示
        }

        // ************************
        // 案件管理から規模の大きな案件を取得
        // ************************
        function loadLargeDeals(){
            kintone.api(
                kintone.api.url('/k/v1/records', true),
                'GET',
                {'app': appId_Opportunities,
                 "query": "order by 小計 desc limit 20"},
                function(resp) {
                   showLargeDeals(resp.records);
                }
            );
        }

        // ************************
        // 売上の高い順に一覧表示
        // ************************
        function showLargeDeals(records){

            //案件データ取得
            var jsonData = createJsonDatasetsFromKintoneRecords(records);

            console.log("案件データ取得");
            console.log(jsonData);

            //グリッドの定義
            $("#grid").igGrid({
                dataSource: jsonData,
                autoGenerateColumns: false,
                width: "100%",
                columns: [
                    { headerText: "会社名", key: "会社名", dataType: "string", width:"20%" },
                    { headerText: "見込み時期", key: "見込み時期", dataType: "date", width:"20%", format:"yyyy-MM-dd" },
                    { headerText: "確度", key: "確度", dataType: "string", width:"10%" },
                    { headerText: "案件担当者", key: "案件担当者", dataType: "string", width:"15%", hidden: true },
                    { headerText: "製品名", key: "製品名", dataType: "string", width:"15%" },
                    { headerText: "小計", key: "小計", dataType: "number", width:"20%", format: "\#,##0", columnCssClass:"numberCell"}
                ],
                features: [
                    {
                        name: "Responsive",
                        enableVerticalRendering: false,
                        columnSettings: [
                            {
                                columnKey: "見込み時期",
                                configuration: {
                                    customPhone: {
                                        hidden: true
                                    }
                                }
                            },
                            {
                                columnKey: "案件担当者",
                                configuration: {
                                    customPhone: {
                                        hidden: true
                                    }
                                }
                            },
                            {
                                columnKey: "製品名",
                                configuration: {
                                    customPhone: {
                                        hidden: true
                                    }
                                }
                            },
                            {
                                columnKey: "単価",
                                configuration: {
                                    customPhone: {
                                        hidden: true
                                    }
                                }
                            },
                            {
                                columnKey: "ユーザー数",
                                configuration: {
                                    customPhone: {
                                        hidden: true
                                    }
                                }
                            },
                        ],
                        responsiveModes: {
                            customPhone: {
                                minWidth: 0,
                                maxWidth: 1000
                            },
                            // alternative mode
                            customAlt: {
                                minWidth: 1001,
                                maxWidth: Number.MAX_VALUE
                            }
                        }
                    },
                    {
                        name: "Sorting"
                    }
                ]
            });
        }


        // ************************
        // 契約ユーザ数履歴のロード
        // ************************
        function loadUserNumberHistory(){
            kintone.api(
                kintone.api.url('/k/v1/records', true),
                'GET',
                {'app': appId_UserNumberHistory,
                 "query": "order by summaryDate asc limit 500"},
                function(resp) {
                   showUserNumberHistory(resp.records);
                }
            );
        }


        // ************************
        // ユーザ数推移チャートの表示
        // ************************
        function showUserNumberHistory(records){

            //契約ユーザ数履歴データ取得
            var jsonData = createJsonDatasetsFromKintoneRecords(records);

            console.log("契約ユーザ数履歴データ取得");
            console.log(jsonData);

            $("#chartUserNumberHistory").igDataChart({
                dataSource: jsonData,
                height: "80%",
                width: "100%",
                brushes: ["#FFD338","#CFB7FF","#8DF4BD"],
                axes: [{
                        name: "Date",
                        type: "categoryX",
                        label: "summaryDate"
                    },
                    {
                        name: "Volume",
                        type: "numericY",
                        title: "契約ユーザ数",
                        majorStroke: "#E0E0E0",
                    }],
                series: [{
                        name: "lineKintone",
                        xAxis: "Date",
                        yAxis: "Volume",
                        type: "line",
                        outline: "transparent",
                        thickness: 3,
                        title: "kintone",
                        valueMemberPath: "kintone",
                        showTooltip: true,
                        isTransitionInEnabled: true,
                        isHighlightingEnabled: true
                    },{
                        name: "lineOffice",
                        xAxis: "Date",
                        yAxis: "Volume",
                        type: "line",
                        outline: "transparent",
                        thickness: 3,
                        title: "Office",
                        valueMemberPath: "office",
                        showTooltip: true,
                        isTransitionInEnabled: true,
                        isHighlightingEnabled: true
                    },{
                        name: "lineGaroon",
                        xAxis: "Date",
                        yAxis: "Volume",
                        type: "line",
                        outline: "transparent",
                        thickness: 3,
                        title: "Garoon",
                        valueMemberPath: "Garoon",
                        showTooltip: true,
                        isTransitionInEnabled: true,
                        isHighlightingEnabled: true
                    },
                    {
                        name: "crosshairLayer",
                        title: "crosshair",
                        type: "crosshairLayer",
                        useInterpolation: false,
                        transitionDuration: 100
                    },
                    {
                        name: "catItemHighlightLayer",
                        title: "categoryItemHighlight",
                        type: "categoryItemHighlightLayer",
                        useInterpolation: false,
                        transitionDuration: 100
                    },
                    {
                        name: "categoryToolTipLayer",
                        title: "categoryToolTip",
                        type: "categoryToolTipLayer",
                        useInterpolation: false,
                        toolTipPosition: "Auto",
                        transitionDuration: 100
                    }
                ],
                horizontalZoomable: true,
                verticalZoomable: false,
                windowResponse: "immediate",
                //tooltipShown: function (evt, ui) {  
                //    /* ツールチップのフォーマット */  
                //    // ツールチップの取得  
                //    var tooltip = ui.element;  
                //    // 日付の取得
                //    console.log(ui);
                //    var date = ui.item.summaryDate;  
                //    // 日付のフォーマット  
                //    var formattedDate = "日付：" + date.getFullYear() + "/" +  date.getMonth() + "/" + date.getDate() + "<br />";  
                //    // アクセス数  
                //    var kintoneLabel = "kintone: " + ui.item.kintone + "<br />";
                //    var officeLabel = "Office: " + ui.item.office + "<br />";
                //    var garoonLabel = "Garoon: " + ui.item.Garoon + "<br />";
                //    // ツールチップの書き換え  
                //    $(tooltip).html(formattedDate + kintoneLabel + officeLabel + garoonLabel);
                //}
            });

            ////ズームバーの定義
            $("#zoombar").igZoombar({
            	height: "10%",
              target: "#chartUserNumberHistory",
              zoomWindowMinWidth: 1.2,
              defaultZoomWindow: {left: 100,width: 100},
            });
            $("#zoombar").css("visibility", "collapse");  //初期は非表示
        }

        // ************************
        // 当月達成度合いの表示
        // ************************
        function showPercentageAchievement(records){
            //BulletGraphの定義
            $("#bulletgraph").igBulletGraph({
                height: "80px",
                width: "100%",
                minimumValue: 8, // default is 0
                maximumValue: 24, // default is 100
                interval: 4,
                value: 18.6,
                showToolTip: true,
                showToolTipTimeout: 100,
                targetValue: 20,
                rangeBrushes: ["#FFC2BF", "#FFF9CC", "#CCFFF4", "black"],
                targetValueBrush: "#888",
                valueBrush: "#888",
                tickBrush: "#888",
                fontBrush: "#888",
                ranges: [
                    {
                        name: '80%以下',
                        startValue: 0,
                        endValue: 16
                    },
                    {
                        name: '80%～100%',
                        startValue: 16,
                        endValue: 20
                    },
                    {
                        name: '100%達成',
                        startValue: 20,
                        endValue: 24
                    }], 
                formatLabel: function (evt, ui) {
                        ui.label = ui.label+"百万";
                    }
            });

        }
    });



})();
