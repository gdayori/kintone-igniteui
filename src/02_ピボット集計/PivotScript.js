(function () {
    "use strict";
    kintone.events.on('app.record.index.show', function (event){
        if (!($("#pivotGrid").length)) {
            return;
        }
        //データ取得
        var jsonData = createJsonDatasetsFromKintoneRecords(event.records);
        //日付でソート
        jsonData.sort(function(val1,val2){
            return ( val1.見込み時期 < val2.見込み時期 ? -1 : 1);
        });

        var $pivotGrid = $("#pivotGrid"),
            $transposeCheckBox = $("#transpose"),
            $chart = $("#olapChart"),
            hasValue = function (value) {
                return value !== undefined && value !== null && value.count() > 0;
            },
            //分析用Olapデータの定義（Datasource, Cube）
            dataSource = new $.ig.OlapFlatDataSource({
                dataSource: jsonData,
                metadata: {
                    cube: {
                        name: "Sales",
                        caption: "案件情報",
                        measuresDimension: {
                            caption: "メジャー",
                            measures: [
                            { caption: "単価", name: "単価", aggregator: $.ig.OlapUtilities.prototype.sumAggregator('単価') },
                            { caption: "ユーザー数", name: "ユーザー数", aggregator: $.ig.OlapUtilities.prototype.sumAggregator('ユーザー数') },
                            { caption: "小計", name: "小計", aggregator: $.ig.OlapUtilities.prototype.sumAggregator('小計') }]
                        },
                        dimensions: [
                            {
                                caption: "見込み時期", name: "見込み時期", hierarchies: [
                                    $.ig.OlapUtilities.prototype.getDateHierarchy(
                                        "見込み時期", ["year", "month", "date"], "Dates", "見込み時期",
                                        ["年", "月", "日"], "すべての期間")]
                            },
                            {
                                caption: "案件担当者", name: "案件担当者", hierarchies: [{
                                    caption: "案件担当者", name: "案件担当者", levels: [
                                    { name: "全案件担当者", levelCaption: "すべての案件担当者", memberProvider: function (item) { return "すべての案件担当者"; } },
                                    { name: "案件担当者", levelCaption: "案件担当者", memberProvider: function (item) { return item.案件担当者; } }]
                                }]
                            },
                            {
                                caption: "確度", name: "確度", hierarchies: [{
                                    caption: "確度", name: "確度", levels: [
                                    { name: "全確度", levelCaption: "すべての確度", memberProvider: function (item) { return "すべての確度"; } },
                                    { name: "確度", levelCaption: "確度", memberProvider: function (item) { return item.確度; } }]
                                }]
                            },
                            {
                                caption: "製品名", name: "製品名", hierarchies: [{
                                    caption: "製品名", name: "製品名", levels: [
                                    { name: "全製品", levelCaption: "全製品", memberProvider: function (item) { return "すべての製品"; } },
                                    { name: "製品名", levelCaption: "製品名", memberProvider: function (item) { return item.製品名; } }]
                                }]
                            }
                        ]
                    }
                },
                rows: "[見込み時期].[Dates]",
                columns: "[製品名].[製品名]",
                measures: "[Measures].[小計]"
            }),
            getCellData = function (rowIndex, columnIndex, columnCount, cells) {
                var cellOrdinal = (rowIndex * columnCount) + columnIndex;
                if (!hasValue(cells)) {
                    return 0;
                }
                for (var index = 0; index < cells.count() ; index++) {
                    var cell = cells.item(index);
                    if (cell.cellOrdinal() == cellOrdinal) {
                        return new Number(cell.value());
                    }
                }
                return 0;
            },
            //ピボットグリッドが再描画された際にチャート側も表示変更を行う。
            //(ピボットグリッドの構成状況を分析し、チャートのseriesを再構成している)
            updateChart = function (tableView, transpose) {
                var columnHeaders,
                    rowHeaders,
                    cells = tableView.resultCells(),
                    dataArray = [],
                    series = [],
                    rowHeaderIndex,
                    columnHeaderIndex,
                    ds,
                    headerCell,
                    columnCount,
                    rowCount,
                    data;

                if (transpose) {
                    columnHeaders = tableView.rowHeaders(),
                        rowHeaders = tableView.columnHeaders()
                }
                else {
                    columnHeaders = tableView.columnHeaders(),
                        rowHeaders = tableView.rowHeaders()
                }

                if (!hasValue(cells) && !hasValue(rowHeaders) && !hasValue(columnHeaders)) {
                    $chart.igDataChart("destroy");
                    return;
                }

                if (!hasValue(rowHeaders)) {
                    rowHeaders = [{ caption: function () { return ""; } }];
                }

                if (!hasValue(columnHeaders)) {
                    columnHeaders = [{ caption: function () { return ""; } }];
                }

                if(columnHeaders.count()>1){
                    for (columnHeaderIndex = columnHeaders.count()-1; columnHeaderIndex >= 0 ; columnHeaderIndex--) {
                        //if(columnHeaders[columnHeaderIndex].isExpanded() && columnHeaders[columnHeaderIndex].isExpandable()){
                        if(columnHeaders[columnHeaderIndex].isExpandable() && columnHeaders.count()>1){
                            columnHeaders.splice(columnHeaderIndex,1);
                        }
                    }
                }
                    columnCount = columnHeaders.count();
                    rowCount = rowHeaders.count();


                for (rowHeaderIndex = 0; rowHeaderIndex < rowHeaders.count() ; rowHeaderIndex++) {
                    headerCell = rowHeaders.item(rowHeaderIndex);
                    data = { caption: headerCell.caption() };
                    var value;
                    for (columnHeaderIndex = 0; columnHeaderIndex < columnCount; columnHeaderIndex++) {
                        if (transpose) {
                            value = getCellData(columnHeaderIndex, rowHeaderIndex, rowCount, cells, transpose);
                        }
                        else {
                            value = getCellData(rowHeaderIndex, columnHeaderIndex, columnCount, cells, transpose);
                        }
                        data["col" + columnHeaderIndex] = value;
                    }

                    dataArray[rowHeaderIndex] = data;
                };

                for (columnHeaderIndex = 0; columnHeaderIndex < columnHeaders.count() ; columnHeaderIndex++) {
                    series[columnHeaderIndex] = {
                        name: "series" + columnHeaderIndex,
                        title: columnHeaders.item(columnHeaderIndex).caption(),
                        type: "column",
                        xAxis: "xAxis",
                        yAxis: "yAxis",
                        valueMemberPath: "col" + columnHeaderIndex
                    };
                };

                ds = new $.ig.DataSource({ dataSource: dataArray });

                if ($chart.data("igDataChart")) {
                    $chart.igDataChart("destroy");
                }
                $chart.igDataChart({
                    width: "98%",
                    height: "565px",
                    dataSource: ds,
                    series: series,
                    legend: { element: "olapChartLegend" },
                    axes: [{
                        name: "xAxis",
                        type: "categoryX",
                        label: "caption"
                    },
                    {
                        name: "yAxis",
                        type: "numericY",
                        minimumValue: 0
                    }],
                    horizontalZoomable: true,
                    verticalZoomable: true,
                    windowResponse: "immediate"
                });
            };

        //ピボットデータセレクタの定義
        $('#dataSelector').igPivotDataSelector({
            dataSource: dataSource,
            height: "565px",
            width: "300px"
        });

        //ピボットグリッドの定義
        $pivotGrid.igPivotGrid({
                height: "565px",
                width: "98%",
                dataSource: dataSource,
                pivotGridRendered: function () {
                    //カンマ区切りのフォーマッティングをかける。
                    var cells = $("#pivotGrid").find(".ui-igpivotgrid td");
                    for (var i = 0; i < cells.length; i++) {
                        cells.eq(i).text(cells.eq(i).text().replace( /(\d)(?=(\d\d\d)+(?!\d))/g, '$1,' ));
                    }
                    updateChart($pivotGrid.data("igPivotGrid")._tableView, $transposeCheckBox.is(':checked'));
                },
                gridOptions:
                {
                     defaultColumnWidth: 120
                },
        });

    });

})();