(function () {
    "use strict";

    function customPortal() {
        //ポータル画面判断（※もっと確実な判断方法在るかも）
        if (!$('.ocean-portal-body').length) {
            return;
        }

        var appId_UserNumberHistory = 46; //ユーザ数履歴

        // タイル表示に変換するボタンを埋め込む
        $('.gaia-header-toolbar-menu > ul').append('<li class="gaia-header-bookmark"><div><button type="button"  id="loadButton" class="gaia-header-img gaia-header-img-star" title="ポータルのタイル表示"><img src="https://jp.infragistics.com/assets/images/favicon.ico" alt="" style="width:24px;"></button></div></li>');
        // タイルのタネとなる要素を埋め込む
        $('.ocean-portal-body').prepend('<div id="tileParent"></div>');

        //Infragistics ライブラリのロード        
        $('#loadButton').on('click', function () {
            // Loading...の表示
            $('.gaia-header-toolbar-menu > ul').append('<li id="igLoadingMessage"style="margin-top: 15px; color: white;">Loading...</li>');
            // IG モジュールの読み込み
            $.ig.loader({
                scriptPath: 'https://cdn-na.infragistics.com/igniteui/2017.1/latest/js/',
                cssPath: 'https://cdn-na.infragistics.com/igniteui/2017.1/latest/css/',
                resources: 'igTileManager, igDataChart.Category.Annotation ',
                locale: 'ja',
                ready: function () {
                    console.log('IG Resources are loaded');
                    makeCustomTiles();  // タイルの生成
                    $('#igLoadingMessage').remove();// Loading...の削除
                }
            });
        });

        // ***********************************
        // 検索ボックスの生成、タイルの生成、データチャートの生成
        // ***********************************
        function makeCustomTiles() {
            // ***********************************
            // アプリの検索ボックスの追加と制御
            // ***********************************
            $('.ocean-portal-applist-dropdown > div').append('<input id="appSearchBox" class="appSearchBox">');
            $('#appSearchBox').change(searchApps);  //変更イベントで検索実行
            $('#appSearchBox').keyup(searchApps);   //キーアップで検索実行
            function searchApps() {
                var val = $(this).val();
                $(".gaia-argoui-appscrollinglist-list li").each(function (i, elem) {
                    if ($(elem).children("a").attr('title').indexOf(val) != -1) {
                        $(elem).removeClass("hiddenApp");
                    } else {
                        $(elem).addClass("hiddenApp");
                    }
                });
            }

            // ***********************************
            // タイル表示
            // ***********************************
            //ダッシュボードのタグ追加
            var tileParent = $('#tileParent').get(0);
            //タイルコンテンツの移動
            $(".ocean-portal-widget").each(function (i, elem) {
                if ($(elem).children().length) {
                    $(elem).appendTo(tileParent);
                }
            });
            //チャートの表示要素の追加
            // tileParent.append('<div id="chartUserNumberHistory"></div>');
            $('<div id="chartUserNumberHistory" class="chart-in-tile"></div>').appendTo(tileParent);

            //TitleManagerの生成
            var otherContentHeight = 210;
            var tileHeight = $(window).height() - otherContentHeight;
            $('#tileParent').igTileManager({
                columnWidth: '33%',
                height: tileHeight,
                marginLeft: 10,
                marginTop: 10,
                splitterOptions: {
                    enabled: true,
                    collapsed: false,
                    collapsible: true
                },
                items: [
                    { rowIndex: 0, colIndex: 0, rowSpan: 2, colSpan: 1 },
                    { rowIndex: 0, colIndex: 2, rowSpan: 1, colSpan: 1 },
                    { rowIndex: 0, colIndex: 1, rowSpan: 2, colSpan: 1 },
                    { rowIndex: 1, colIndex: 2, rowSpan: 1, colSpan: 1 }
                ]
            });
            //契約ユーザ数推移チャートの表示
            loadUserNumberHistory();
        }

        // ************************
        // 契約ユーザ数履歴のロード
        // ************************
        function loadUserNumberHistory() {
            kintone.api(
                kintone.api.url('/k/v1/records', true),
                'GET',
                {
                    'app': appId_UserNumberHistory,
                    "query": "order by summaryDate asc limit 500"
                },
                function (resp) {
                    showUserNumberHistory(resp.records);
                }
            );
        }



        // ************************
        // ユーザ数推移チャートの表示
        // ************************
        function showUserNumberHistory(records) {

            //契約ユーザ数履歴データ取得
            var jsonData = createJsonDatasetsFromKintoneRecords(records);

            $("#chartUserNumberHistory").igDataChart({
                dataSource: jsonData,
                height: "80%",
                width: "100%",
                brushes: ["#FFD338", "#CFB7FF", "#8DF4BD"],
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
                }, {
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
                }, {
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
            });
        }
    }

    setTimeout(customPortal, 500);


})();