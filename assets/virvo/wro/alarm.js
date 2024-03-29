(function($,window){
    var selectTreeId = '';
    var selectDistrictId = '';
    var selectTreeType = '';
    var zNodes = null;
    var log, className = "dark";
    var newCount = 1;
    var columnDefs;
    var columns;
    var setting;
    var treeSetting;
    var idStr;
    var OperationId;
    var selectTreeIdAdd="";
    var startOperation;// 点击运营资质类别的修改按钮时，弹出界面时运营资质类别文本的内容
    var expliant;// 点击运营资质类别的修改按钮时，弹出界面时说明文本的内容
    var vagueSearchlast = $("#operationType").val();

    var dataListArray = [];
    var endTime;// 当天时间
    var sTime;
    var eTime;
    var key = true;
    var vid;
    
    var organ = '';
    var station = '';
    var bflag = true;
    var zTreeIdJson = {};
    var barWidth;
    var number;
    var checkFlag = false; //判断组织节点是否是勾选操作
    var size;//当前权限监控对象数量
    var online_length;
    

    var commaddr = $("#commaddr").val();
    console.log("commaddr",commaddr)
    //显示隐藏列
    var menu_text = "";
    var table = $("#dataTable tr th:gt(1)");

    alarmObj = {
        init: function(){
            menu_text += "<li><label><input type=\"checkbox\" checked=\"checked\" class=\"toggle-vis\" data-column=\"" + parseInt(2) +"\" disabled />"+ table[0].innerHTML +"</label></li>"
            for(var i = 1; i < table.length; i++){
                menu_text += "<li><label><input type=\"checkbox\" checked=\"checked\" class=\"toggle-vis\" data-column=\"" + parseInt(i+2) +"\" />"+ table[i].innerHTML +"</label></li>"
            };
            $("#Ul-menu-text").html(menu_text);
            //表格列定义
            var columnDefs = [ 
                { "orderable": false, "targets": [ 0 ] },
                { "orderSequence": [ "asc","desc" ], "targets": [ 1 ] },
                { "orderable": false, "targets": [ 2 ] },
                // { "orderable": false, "targets": [ 3 ] },
                // { "orderSequence": [ "desc", "asc", "asc" ], "targets": [ 2 ] },
                { "orderSequence": [ "asc","desc" ], "targets": [ 3 ] }
            ];
            var columns = [
                    {
                        //第一列，用来显示序号
                        "data" : null,
                        "class" : "text-center"
                    },
                    
                    {
                        "data" : "alarmtime",
                        "class" : "text-center",
                        
                    }, 
                    {
                        "data" : "alarmevent",
                        "class" : "text-center",
                        

                    },{
                        "data" : "alarmtype",
                        "class" : "text-center",
                        
                    }, {
                        "data" : "alarmlevel",
                        "class" : "text-center",
                        
                    }, {
                        "data" : "alarmcontent",
                        "class" : "text-center",
                        
                    }, {
                        "data" : "alarmstate",
                        "class" : "text-center",
                        
                    },{
                        "data" : "dealtime",
                        "class" : "text-center",
                        
                    
                    },{
                        "data":"dealcontent",
                        "class":"text-center",
                        
                    },{
                        "data" : "dealjob",
                        "class" : "text-center",
                        
                    
                    },{
                        "data" : "alarmobj",
                        "class" : "text-center",
                        
                    
                    },{
                        "data" : "communityid",
                        "class" : "text-center",
                        
                    
                    },{
                       "data" : "waterid",
                        "class" : "text-center",
                        
                    
                    },{
                        "data" : "commaddr",
                        "class" : "text-center",
                        
                    
                    },
                    ];
            //ajax参数
            var ajaxDataParamFun = function(d) {
                d.simpleQueryParam = $('#simpleQueryParam').val(); //模糊查询
                d.groupName = selectTreeId;
                d.groupType = selectTreeType;

                d.startTime = sTime
                d.endTime = eTime
                d.commaddr = commaddr

            };
            //表格setting
            var setting = {
                suffix  : '/',
                listUrl : '/api/legacy/alarms/?format=datatables',
                requestType : 'GET',
                columnDefs : columnDefs, //表格列定义
                columns : columns, //表格列
                dataTableDiv : 'dataTable', //表格
                ajaxDataParamFun : ajaxDataParamFun, //ajax参数
                pageable : true, //是否分页
                showIndexColumn : true, //是否显示第一列的索引列
                enabledChange : true
            };
            //创建表格
            myTable = new TG_Tabel.createNew(setting);
            //表格初始化
            myTable.init();
        },
        userTree : function(){
            // 初始化文件树
            treeSetting = {
                async : {
                    url : "/dmam/district/dmatree/",
                    type : "post",
                    enable : true,
                    autoParam : [ "id" ],
                    dataType : "json",
                    data:{'csrfmiddlewaretoken': '{{ csrf_token }}'},
                    otherParam : {  // 是否可选 Organization
                        "isOrg" : "1",
                        "isStation" : "1",
                        "isPressure" : "1",
                        // "csrfmiddlewaretoken": "{{ csrf_token }}"
                    },
                    dataFilter: alarmObj.ajaxDataFilter
                },
                view : {
                    // addHoverDom : alarmObj.addHoverDom,
                    // removeHoverDom : alarmObj.removeHoverDom,
                    selectedMulti : false,
                    nameIsHTML: true,
                    fontCss: setFontCss_ztree
                },
                edit : {
                    enable : true,
                    editNameSelectAll : true,
                    showRemoveBtn : false,//alarmObj.showRemoveBtn,
                    showRenameBtn : false
                },
                data : {
                    simpleData : {
                        enable : true
                    }
                },
                callback : {
                    // beforeDrag : alarmObj.beforeDrag,
                    // beforeEditName : alarmObj.beforeEditName,
                    // beforeRemove : alarmObj.beforeRemove,
                    // beforeRename : alarmObj.beforeRename,
                    // onRemove : alarmObj.onRemove,
                    // onRename : alarmObj.onRename,
                    onClick : alarmObj.zTreeOnClick
                }
            };
            $.fn.zTree.init($("#treeDemo"), treeSetting, zNodes);
            var treeObj = $.fn.zTree.getZTreeObj('treeDemo');treeObj.expandAll(true);
           
        },

        
        // 组织树预处理函数
        ajaxDataFilter: function(treeId, parentNode, responseData){
            var treeObj = $.fn.zTree.getZTreeObj("treeDemo");
            if (responseData) {
                for (var i = 0; i < responseData.length; i++) {
                        responseData[i].open = true;
                }
            }
            return responseData;
        },
        
        showLog: function(str){
            if (!log)
                log = $("#log");
                log.append("<li class='"+className+"'>" + str + "</li>");
            if (log.children("li").length > 8) {
                log.get(0).removeChild(log.children("li")[0]);
            }
        },
        getTime: function(){
            var now = new Date(), h = now.getHours(), m = now.getMinutes(), s = now
                .getSeconds(), ms = now.getMilliseconds();
            return (h + ":" + m + ":" + s + " " + ms);
        },
        selectAll: function(){
            var zTree = $.fn.zTree.getZTreeObj("treeDemo");
            zTree.treeSetting.edit.editNameSelectAll = $("#selectAll").attr("checked");
        },
        //点击节点
        zTreeOnClick: function(event, treeId, treeNode){
            selectTreeId = treeNode.id;
            selectTreeType = treeNode.type;
            selectDistrictId = treeNode.districtid;
            selectTreeIdAdd = treeNode.uuid;
            station = treeNode.id;
            $('#simpleQueryParam').val("");
            $("#organ_name").attr("value",treeNode.name);
            $("#station_name").attr("value","");
            if(treeNode.type == "station" || treeNode.type == "pressure"){
                var pNode = treeNode.getParentNode();
                $("#organ_name").attr("value",pNode.name);
                $("#station_name").attr("value",treeNode.name);
                organ = pNode.id;
                station = treeNode.id;
                commaddr = treeNode.commaddr;

                alarmObj.inquireClick(1);
            }

            // alarmObj.inquireClick(1);
            // myTable.requestData();
        },
        
        
         
        findDownKey:function(event){
            if(event.keyCode==13){
                alarmObj.findOperation();
            }
        },
        exportdata:function(){
            dataListArray = [];
            var url = "/reports/historydata/export/?commaddr="+commaddr+"&startTime="+sTime+"&endTime="+eTime;
            window.location.href=url
            // var data = {"commaddr": commaddr, 'startTime': sTime, "endTime": eTime};
            // json_ajax("GET", url, "json", false, data, function(){layer.msg("导出成功")});     //发送请求
        },

        //开始时间
        startDay: function (day) {
            var timeInterval = $('#timeInterval').val().split('--');
            var startValue = timeInterval[0];
            var endValue = timeInterval[1];
            if (startValue == "" || endValue == "") {
                var today = new Date();
                var targetday_milliseconds = today.getTime() + 1000 * 60 * 60
                    * 24 * day;

                today.setTime(targetday_milliseconds); //注意，这行是关键代码

                var tYear = today.getFullYear();
                var tMonth = today.getMonth();
                var tDate = today.getDate();
                tMonth = alarmObj.doHandleMonth(tMonth + 1);
                tDate = alarmObj.doHandleMonth(tDate);
                var num = -(day + 1);
                startTime = tYear + "-" + tMonth + "-" + tDate + " "
                    + "00:00:00";
                var end_milliseconds = today.getTime() + 1000 * 60 * 60 * 24
                    * parseInt(num);
                today.setTime(end_milliseconds); //注意，这行是关键代码
                var endYear = today.getFullYear();
                var endMonth = today.getMonth();
                var endDate = today.getDate();
                endMonth = alarmObj.doHandleMonth(endMonth + 1);
                endDate = alarmObj.doHandleMonth(endDate);
                endTime = endYear + "-" + endMonth + "-" + endDate + " "
                    + "23:59:59";
            } else {
                var startTimeIndex = startValue.slice(0, 10).replace("-", "/").replace("-", "/");
                var vtoday_milliseconds = Date.parse(startTimeIndex) + 1000 * 60 * 60 * 24 * day;
                var dateList = new Date();
                dateList.setTime(vtoday_milliseconds);
                var vYear = dateList.getFullYear();
                var vMonth = dateList.getMonth();
                var vDate = dateList.getDate();
                vMonth = alarmObj.doHandleMonth(vMonth + 1);
                vDate = alarmObj.doHandleMonth(vDate);
                startTime = vYear + "-" + vMonth + "-" + vDate + " "
                    + "00:00:00";
                if (day == 1) {
                    endTime = vYear + "-" + vMonth + "-" + vDate + " "
                        + "23:59:59";
                } else {
                    var endNum = -1;
                    var vendtoday_milliseconds = Date.parse(startTimeIndex) + 1000 * 60 * 60 * 24 * parseInt(endNum);
                    var dateEnd = new Date();
                    dateEnd.setTime(vendtoday_milliseconds);
                    var vendYear = dateEnd.getFullYear();
                    var vendMonth = dateEnd.getMonth();
                    var vendDate = dateEnd.getDate();
                    vendMonth = alarmObj.doHandleMonth(vendMonth + 1);
                    vendDate = alarmObj.doHandleMonth(vendDate);
                    endTime = vendYear + "-" + vendMonth + "-" + vendDate + " "
                        + "23:59:59";
                }
            }
        },
        doHandleMonth: function (month) {
            var m = month;
            if (month.toString().length == 1) {
                m = "0" + month;
            }
            return m;
        },
        //当前时间
        getsTheCurrentTime: function () {
            var nowDate = new Date();
            startTime = nowDate.getFullYear()
                + "-"
                + (parseInt(nowDate.getMonth() + 1) < 10 ? "0"
                    + parseInt(nowDate.getMonth() + 1)
                    : parseInt(nowDate.getMonth() + 1))
                + "-"
                + (nowDate.getDate() < 10 ? "0" + nowDate.getDate()
                    : nowDate.getDate()) + " " + "00:00:00";
            endTime = nowDate.getFullYear()
                + "-"
                + (parseInt(nowDate.getMonth() + 1) < 10 ? "0"
                    + parseInt(nowDate.getMonth() + 1)
                    : parseInt(nowDate.getMonth() + 1))
                + "-"
                + (nowDate.getDate() < 10 ? "0" + nowDate.getDate()
                    : nowDate.getDate())
                + " "
                + ("23")
                + ":"
                + ("59")
                + ":"
                + ("59");
            var atime = $("#atime").val();
            if (atime != undefined && atime != "") {
                startTime = atime;
            }
        },
        unique: function (arr) {
            var result = [], hash = {};
            for (var i = 0, elem; (elem = arr[i]) != null; i++) {
                if (!hash[elem]) {
                    result.push(elem);
                    hash[elem] = true;
                }
            }
            return result;
        },
        inquireClick: function (num) {
            $(".mileage-Content").css("display", "block");  //显示图表主体
            number = num;
            if (number == 0) {
                alarmObj.getsTheCurrentTime();
            } else if (number == -1) {
                alarmObj.startDay(-1)

            } 
            if (num != 1) {
                $('#timeInterval').val(startTime + '--' + endTime);
            }
            // $('#timeInterval').val(startTime + '--' + endTime);
            alarmObj.estimate();
console.log('time query',sTime,eTime);
            myTable.requestData();

            // dataListArray = [];
            // var url = "/analysis/flowdata_mnf/";

            // var data = {"organ": organ,"treetype":selectTreeType,"station":station,"qmonth":number, 'startTime': sTime, "endTime": eTime};
            // json_ajax("POST", url, "json", false, data, alarmObj.findOnline);     //发送请求


        },
        

        estimate: function () {
            var timeInterval = $('#timeInterval').val().split('--');
            sTime = timeInterval[0];
            eTime = timeInterval[1];
            alarmObj.getsTheCurrentTime();
            if (eTime > endTime) {                              //查询判断
                layer.msg(endTimeGtNowTime, {move: false});
                key = false
                return;
            }
            if (sTime > eTime) {
                layer.msg(endtimeComStarttime, {move: false});
                key = false;
                return;
            }
            var nowdays = new Date();                       // 获取当前时间  计算上个月的第一天
            var year = nowdays.getFullYear();
            var month = nowdays.getMonth();
            if (month == 0) {
                month = 12;
                year = year - 1;
            }
            if (month < 10) {
                month = "0" + month;
            }
            var firstDay = year + "-" + month + "-" + "01 00:00:00";//上个月的第一天
            if (sTime < firstDay) {                                 //查询判断开始时间不能超过       上个月的第一天
                $("#timeInterval-error").html(starTimeExceedOne).show();
                /*layer.msg(starTimeExceedOne, {move: false});
                key = false;*/
                return;
            }
            $("#timeInterval-error").hide();
            var treeObj = $.fn.zTree.getZTreeObj("treeDemo");       //遍历树节点，获取vehicleID 存入集合
            var nodes = treeObj.getCheckedNodes(true);
            vid = "";
            for (var j = 0; j < nodes.length; j++) {
                if (nodes[j].type == "vehicle") {
                    vid += nodes[j].id + ",";
                }
            }
            key = true;
        },
        reloadData: function (dataList) {
            var currentPage = myTable.page()
            myTable.clear()
            myTable.rows.add(dataList)
            myTable.page(currentPage).draw(false);
        },
        
        
    }
    $(function(){
        $('input').inputClear().on('onClearEvent',function(e,data){
            var id = data.id;
            if(id == 'search_condition'){
                search_ztree('treeDemo',id,'station');
            };
        });
        
        alarmObj.userTree();
        
        
        $('#timeInterval').dateRangePicker({dateLimit:30});
        alarmObj.getsTheCurrentTime();  
        // alarmObj.startDay(-1);  
        $('#timeInterval').val(startTime + '--' + endTime);

        alarmObj.init();
        alarmObj.inquireClick(1);
        // alarmObj.findOperation();
        // IE9
        if(navigator.appName=="Microsoft Internet Explorer" && navigator.appVersion.split(";")[1].replace(/[ ]/g,"")=="MSIE9.0") {
            alarmObj.refreshTable();
            var search;
            $("#search_condition").bind("focus",function(){
                search = setInterval(function(){
                    search_ztree('treeDemo', 'search_condition','station');
                },500);
            }).bind("blur",function(){
                clearInterval(search);
            });
        }
        // IE9 end
        // $("#selectAll").bind("click", alarmObj.selectAll);
        // 组织架构模糊搜索
        $("#search_condition").on("input oninput",function(){
            search_ztree('treeDemo', 'search_condition','station');
        });       
        
        
        $("#addId").on("click",alarmObj.addId);
        $("#closeAdd").on("click",alarmObj.closeClean);
        $("#updateClose").on("click",alarmObj.updateClean);
    })
})($,window)
