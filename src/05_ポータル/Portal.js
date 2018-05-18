(function () {
    "use strict";

function customPortal(){
    console.log($('.ocean-portal-body').length);
    //ポータル画面判断（※もっと確実な判断方法在るかも）
    if($('.ocean-portal-body').length){

        // タイル表示に変換するボタンを埋め込む
        $('.gaia-header-toolbar-menu > ul').append('<li class="gaia-header-bookmark"><div><button type="button"  id="loadButton" class="gaia-header-img gaia-header-img-star" title="ポータルのタイル表示"><img src="https://jp.infragistics.com/assets/images/favicon.ico" alt="" style="width:24px;"></button></div></li>');
        // タイルのタネとなる要素を埋め込む
        $('.ocean-portal-body').prepend('<div id="tileParent"></div>');

        //アプリの検索ボックスの追加と制御
        $('.ocean-portal-applist-dropdown > div').append('<input id="appSearchBox" class="appSearchBox">');
        $('#appSearchBox').change(searchApps);  //変更イベントで検索実行
        $('#appSearchBox').keyup(searchApps);   //キーアップで検索実行
        function searchApps(){
            var val = $(this).val();
            $(".gaia-argoui-appscrollinglist-list li").each(function(i, elem) {
                if($(elem).children("a").attr('title').indexOf(val)!=-1){
                    $(elem).removeClass("hiddenApp");
                }else{
                    $(elem).addClass("hiddenApp");
                }
            });
        }

        //Infragistics ライブラリのロード
        $('#loadButton').on('click',function(){
            $.ig.loader({
                scriptPath: 'https://cdn-na.infragistics.com/igniteui/2017.1/latest/js/',
                cssPath: 'https://cdn-na.infragistics.com/igniteui/2017.1/latest/css/',
                resources: 'igTileManager',
                locale: 'ja',
                ready: function () {
                    console.log('IG Resources are loaded');
                    //ダッシュボードのタグ追加
                    var tileParent = $('#tileParent').get(0);
                    //タイルコンテンツの移動
                    $(".ocean-portal-widget").each(function(i, elem) {
                        if($(elem).children().length){
                            console.log(elem);
                            $(elem).appendTo(tileParent);
                        }
                    });

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
                            { rowIndex: 0, colIndex: 1, rowSpan: 2, colSpan: 1 }
                        ]
                    });

                }
            });
        });

    }
}

 setTimeout(customPortal, 500);


})();