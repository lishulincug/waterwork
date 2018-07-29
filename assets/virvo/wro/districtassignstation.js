(function($,window){
    var $subChk = $("input[name='subChk']");
    var selectTreeId = '';
    var selectTreeType = '';
    var selectDistrictId = '';
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
    var stationdataListArray = [];
    var dataListArray = [];
    var endTime;// 当天时间
    var sTime;
    var eTime;
    var key = true;
    var vid;
    var carLicense = [];
    var activeDays = [];
    var organ = '';
    var station = '';
    var bflag = true;
    var zTreeIdJson = {};
    var barWidth;
    var number;
    var checkFlag = false; //判断组织节点是否是勾选操作
    var size;//当前权限监控对象数量
    var dma_pk =$("#dma_pk").val();
    var dma_no =$("#dma_no").val();
    var dma_name =$("#dma_name").val();

    var meter_types = ["出水表","进水表","贸易结算表","未计费水表","官网检测表"];

    var dmastation_list = $("#dmastation_list").val()

    console.log(dmastation_list);


    var myTable;
    var rows_selected = [];

    dmaStation = {
        init: function(){
            console.log("dmaStation init");
            dmaStation.tableFilter();
            // dmaStation.getsTheMaxTime();
            // laydate.render({elem: '#endtime',max: dmaStation.getsTheMaxTime(),theme: '#6dcff6'});
        },
        tableFilter: function(){
            //显示隐藏列
            var menu_text = "";
            var table = $("#stationdataTable tr th:gt(1)");
            menu_text += "<li><label><input type=\"checkbox\" checked=\"checked\" class=\"toggle-vis\" data-column=\"" + parseInt(2) +"\" disabled />"+ table[0].innerHTML +"</label></li>"
            for(var i = 1; i < table.length; i++){
                menu_text += "<li><label><input type=\"checkbox\" checked=\"checked\" class=\"toggle-vis\" data-column=\"" + parseInt(i+2) +"\" />"+ table[i].innerHTML +"</label></li>"
            };
            $("#Ul-menu-text").html(menu_text);
        },
        getsTheMaxTime: function () {
            
                var nowDate = new Date();
                maxTime = parseInt(nowDate.getFullYear())
                    + "-"
                    + (parseInt(nowDate.getMonth() + 1) < 10 ? "0"
                        + parseInt(nowDate.getMonth() + 1)
                        : parseInt(nowDate.getMonth() + 1))
                    + "-"
                    + (nowDate.getDate() < 10 ? "0" + nowDate.getDate()
                        : nowDate.getDate()) + " ";
                $("#endtime").val(maxTime);
                return maxTime
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
                        "isStation" : "1",
                        // "csrfmiddlewaretoken": "{{ csrf_token }}"
                    },
                    dataFilter: dmaStation.ajaxDataFilter
                },
                view : {
                    // addHoverDom : dmaStation.addHoverDom,
                    // removeHoverDom : dmaStation.removeHoverDom,
                    selectedMulti : true,
                    nameIsHTML: true,
                    fontCss: setFontCss_ztree
                },
                edit : {
                    enable : true,
                    editNameSelectAll : true,
                    showRemoveBtn : false,//dmaStation.showRemoveBtn,
                    showRenameBtn : false
                },
                data : {
                    simpleData : {
                        enable : true
                    }
                },
                callback : {
                    // beforeDrag : dmaStation.beforeDrag,
                    // beforeEditName : dmaStation.beforeEditName,
                    // beforeRemove : dmaStation.beforeRemove,
                    // beforeRename : dmaStation.beforeRename,
                    // onRemove : dmaStation.onRemove,
                    // onRename : dmaStation.onRename,
                    beforeClick : dmaStation.beforeClick,
                    onClick : dmaStation.zTreeOnClick
                }
            };
            $.fn.zTree.init($("#stationtreeDemo"), treeSetting, zNodes);
            var treeObj = $.fn.zTree.getZTreeObj('stationtreeDemo');treeObj.expandAll(true);
           
        },
        beforeClick: function(treeId, treeNode){
            var zTree = $.fn.zTree.getZTreeObj("stationtreeDemo");
            if(treeNode.type != "station"){
                zTree.cancelSelectedNode(treeNode);
                
            }
            // var check = (treeNode);
            // return check;
        },
        
        // 组织树预处理函数
        ajaxDataFilter: function(treeId, parentNode, responseData){
            var treeObj = $.fn.zTree.getZTreeObj("stationtreeDemo");
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
            var zTree = $.fn.zTree.getZTreeObj("stationtreeDemo");
            zTree.treeSetting.edit.editNameSelectAll = $("#selectAll").attr("checked");
        },
        //点击节点
        zTreeOnClick: function(event, treeId, treeNode){

            var zTree = $.fn.zTree.getZTreeObj("stationtreeDemo");
            if(treeNode.type != "station"){
                zTree.cancelSelectedNode(treeNode);
                
            }else{
                selectTreeId = treeNode.id;
                selectTreeType = treeNode.type;
                selectDistrictId = treeNode.districtid;
                selectTreeIdAdd = treeNode.uuid;
                station = treeNode.id;
                $('#simpleQueryParam').val("");
                $("#organ_name").attr("value",treeNode.name);
                if(treeNode.type == "dma"){
                    var pNode = treeNode.getParentNode();
                    // $("#organ_name").attr("value",pNode.name);
                    $("#station_name").attr("value",treeNode.name);
                    organ = pNode.id;
                    station = treeNode.id;
                }

            }
        },

        initdmastations:function(){
            console.log(dmastation_list);
            var data = $.parseJSON(dmastation_list);//转成json对象
            var stationdataListArray = [];//用来储存显示数据
            if(data.obj.dmastationlist !=null&&data.obj.dmastationlist.length!=0){
                var ustasticinfo=data.obj.dmastationlist;
                console.log(ustasticinfo);
                for(var i=0;i<ustasticinfo.length;i++){
                    
                    var dateList=
                            {
                              "pnode_id":ustasticinfo[i].pid,
                              "station_id":ustasticinfo[i].id,
                              "dma_name":dma_name,
                              "station_name":ustasticinfo[i].username,
                              "metertype":ustasticinfo[i].dmametertype
                              
                            };
                    // var dateList=
                    //     {
                    //         // "id":ustasticinfo.pk,
                    //         "username":ustasticinfo[i].username,
                    //         "usertype":ustasticinfo[i].usertype,
                    //         "simid":ustasticinfo[i].simid,
                    //         "dn":ustasticinfo[i].dn,
                    //         "belongto":ustasticinfo[i].belongto,
                    //         "metertype":ustasticinfo[i].metertype,
                    //         "serialnumber":ustasticinfo[i].serialnumber,
                    //         "createdate":ustasticinfo[i].createdate
                    //     }
//                      if(stasticinfo[i].majorstasticinfo!=null||  stasticinfo[i].speedstasticinfo!=null|| stasticinfo[i].vehicleII!=null
//                        ||stasticinfo[i].timeoutParking!=null||stasticinfo[i].routeDeviation!=null||
//                       stasticinfo[i].tiredstasticinfo!=null||stasticinfo[i].inOutArea!=null||stasticinfo[i].inOutLine!=null){
                        stationdataListArray.push(dateList);
//                      }
                }
                console.log(dateList);
                dmaStation.reloadData(stationdataListArray);
                
            }else{
                dmaStation.reloadData(stationdataListArray);
                
            }
        },
        export:function(){
            var zTree = $.fn.zTree.getZTreeObj("stationtreeDemo"), nodes = zTree.getSelectedNodes(), v = "";

                console.log(nodes);
            n = "";
            if(nodes.length == 0){
                layer.msg("没有站点选中",{move:false});
                return
            }
            nodes.sort(function compare(a, b) {
                return a.id - b.id;
            });
            // var oTable = $('#stationdataTable').dataTable();
            // var rowLength = oTable.rows().count();
            var oTable = document.getElementById('stationdataTable');

            // //gets rows of table
            var rowLength = oTable.rows.length;
            
            stationdataListArray=[];
            for (var i = 0, l = nodes.length; i < l; i++) {
                n += nodes[i].name;
                v += nodes[i].id + ",";
            
                var dateList=
                            {
                              "pnode_id":nodes[i].pId,
                              "station_id":nodes[i].id,
                              "dma_name":dma_name,
                              "station_name":nodes[i].name,
                              "metertype":""
                              
                            };
                // oTable.row.add(dateList);
                stationdataListArray.push(dateList);
                zTree.removeNode(nodes[i]);
            }
            dmaStation.rowaddData(stationdataListArray);
            console.log("row add data:",stationdataListArray);
            if (v.length > 0)
                v = v.substring(0, v.length - 1);

            zTree.cancelSelectedNode();
            var tnodes = zTree.getSelectedNodes();
            console.log("after cancle:",tnodes);
            
        },
        import:function(){
            var chechedNum = $("input[name='subChk']:checked").length;
            if (chechedNum == 0) {
                layer.msg("没有站点选中",{move:false});
                return
            }

            var table = $("#stationdataTable").dataTable();
            var rows = table.fnGetNodes();
            var list = [];
            var zTree = $.fn.zTree.getZTreeObj("stationtreeDemo");
            $.each(table.fnGetNodes(), function (index, value) {
                console.log(index,value);
                var obj = {};
                var checked_flag = $(value).find('input[type="checkbox"]:checked').length;
                if(checked_flag != 0 ){
                    // var station_id = $(value).find('input').val();
                    var dma_name = $(value).find('td:eq(2)').html();
                    var station_name = $(value).find('td:eq(3)').html();
                    var metertype = $(value).find('select').val();

                    var sid = $(value).find('input[type="checkbox"]').attr('sid');
                    var pid = $(value).find('input[type="checkbox"]').attr('pid');
                    var pnode = zTree.getNodeByParam("id", pid, null);
                    var newNode = { id:sid, pId:pid, name:station_name,icon:"/static/virvo/resources/img/station.png",type:"station"};
                    zTree.addNodes(pnode,0,newNode);

                    obj.station_id = sid;
                    obj.dma_name = dma_name;
                    obj.station_name = station_name;
                    obj.metertype = metertype;

                    list.push(obj);
                }
            });  
            var dmastation_json = JSON.stringify(list);
            console.log(dmastation_json);

            dmaStation.removeseleted();
            
            // var anSelected = table.$('tr.selected');
            
            // $(anSelected).remove();
            
            zTree.cancelSelectedNode();
            
            
        },
        // ajax参数
        ajaxDataParamFun: function(d){
            d.simpleQueryParam = $('#simpleQueryParam').val(); // 模糊查询
            d.groupName = selectTreeId;
            d.districtId = selectDistrictId;
        },
        saveDmaStation:function(){
            console.log("saveDmaStation");
            var table = $("#stationdataTable").dataTable();
            var rows = table.fnGetNodes();
            var list = [];
            $.each(table.fnGetNodes(), function (index, value) {
                // console.log(index,value);
                var obj = {};
                
                var dma_name = $(value).find('td:eq(2)').html();
                var station_name = $(value).find('td:eq(3)').html();
                var metertype = $(value).find('select').val();

                var sid = $(value).find('input[type="checkbox"]').attr('sid');
                

                obj.station_id = sid;
                obj.dma_name = dma_name;
                obj.station_name = station_name;
                obj.metertype = metertype;

                list.push(obj);
                
            });  
            var dmastation_json = JSON.stringify(list);
            $("#dmastation_json").val(dmastation_json);
            $("#dmastationform").attr("action","district/assignstation/"+dma_pk+"/");
            $("#dmastationform").ajaxSubmit(function(data) {
                    console.log('sdfe:',data);
                    if (data != null && typeof(data) == "object" &&
                        Object.prototype.toString.call(data).toLowerCase() == "[object object]" &&
                        !data.length) {//判断data是字符串还是json对象,如果是json对象
                            if(data.success == true){
                                $("#addType").modal("hide");//关闭窗口
                                layer.msg(publicAddSuccess,{move:false});
                                
                            }else{
                                layer.msg(data.msg,{move:false});
                            }
                    }else{//如果data不是json对象
                            var result = $.parseJSON(data);//转成json对象
                            if (result.success == true) {
                                    $("#addType").modal("hide");//关闭窗口
                                    layer.msg(publicAddSuccess,{move:false});
                                    
                            }else{
                                layer.msg(result.msg,{move:false});
                            }
                    }
                });
            
            console.log(dmastation_json);
        },
        doSubmit:function () {
            if(dmaStation.validates()){
                $("#eadOperation").ajaxSubmit(function(data) {
                    console.log('sdfe:',data);
                    if (data != null && typeof(data) == "object" &&
                        Object.prototype.toString.call(data).toLowerCase() == "[object object]" &&
                        !data.length) {//判断data是字符串还是json对象,如果是json对象
                            if(data.success == true){
                                $("#addType").modal("hide");//关闭窗口
                                layer.msg(publicAddSuccess,{move:false});
                                dmaStation.closeClean();//清空文本框
                                $("#operationType").val("");
                                dmaStation.findOperation();
                            }else{
                                layer.msg(data.msg,{move:false});
                            }
                    }else{//如果data不是json对象
                            var result = $.parseJSON(data);//转成json对象
                            if (result.success == true) {
                                    $("#addType").modal("hide");//关闭窗口
                                    layer.msg(publicAddSuccess,{move:false});
                                    $("#operationType").val("");
                                    dmaStation.closeClean();//清空文本框
                                    dmaStation.findOperation();
                            }else{
                                layer.msg(result.msg,{move:false});
                            }
                    }
                });
            }
        },
        updateDoSubmit:function () {
            dmaStation.init();
            if(dmaStation.upDateValidates()){
                var operationType=$("#updateOperationType").val();// 运营资质类型
                var explains=$("#updateDescription").val();// 说明
                var data={"id":OperationId,"operationType":operationType,"explains":explains};
                var url="group/updateOperation";
                json_ajax("POST", url, "json", true,data,dmaStation.updateCallback);
            }
        },
        
        checkAll : function(e){
            $("input[name='subChk']").not(':disabled').prop("checked", e.checked);

        },
        checkAllTwo : function(e){
            $("input[name='subChkTwo']").prop("checked", e.checked);
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
        
        inquireDmastations: function (number) {
            var dma_id = 1;
            var url="dmaStation/dmastations/";
            // var parameter={"dma_id":dma_id};
            var data = {"organ": organ,'treetype':selectTreeType,"station":station,"endTime": endTime};
            json_ajax("POST",url,"json",true,data,dmaStation.getCallback);
        },
        getCallback:function(date){
            if(date.success==true){
                stationdataListArray = [];//用来储存显示数据
                if(date.obj!=null&&date.obj.length!=0){
                    var stasticinfo=date.obj;
                    for(var i=0;i<stasticinfo.length;i++){
                        
                        var dateList=
                            [
                              i+1,
                              stasticinfo[i].organ,
                              stasticinfo[i].total,
                              stasticinfo[i].sale,
                              stasticinfo[i].uncharg,
                              stasticinfo[i].leak,
                              stasticinfo[i].cxc,
                              stasticinfo[i].cxc_percent,
                              stasticinfo[i].huanbi,
                              stasticinfo[i].leak_percent,
                              leak_tmp_str,
                              stasticinfo[i].tongbi,
                              stasticinfo[i].mnf,
                              stasticinfo[i].back_leak,
                              stasticinfo[i].other_leak,
                              stasticinfo[i].statis_date
                            ];
//                      if(stasticinfo[i].majorstasticinfo!=null||  stasticinfo[i].speedstasticinfo!=null|| stasticinfo[i].vehicleII!=null
//                        ||stasticinfo[i].timeoutParking!=null||stasticinfo[i].routeDeviation!=null||
//                       stasticinfo[i].tiredstasticinfo!=null||stasticinfo[i].inOutArea!=null||stasticinfo[i].inOutLine!=null){
                            stationdataListArray.push(dateList);
//                      }
                    }
                    dmaStation.reloadData(stationdataListArray);
                    $("#simpleQueryParam").val("");
                    $("#search_button").click();
                }else{
                    dmaStation.reloadData(stationdataListArray);
                    $("#simpleQueryParam").val("");
                    $("#search_button").click();
                }
            }else{
                layer.msg(data.msg,{move:false});
            }
        },
        getTable: function(table){
            $('.toggle-vis').prop('checked', true);
            myTable = $(table).DataTable({
              "destroy": true,
              "dom": 'tiprl',// 自定义显示项
              "lengthChange": true,// 是否允许用户自定义显示数量
              "bPaginate": false, // 翻页功能
              "bFilter": false, // 列筛序功能
              "searching": true,// 本地搜索
              "ordering": false, // 排序功能
              "Info": false,// 页脚信息
              "autoWidth": true,// 自动宽度
              "stripeClasses" : [],
              "lengthMenu" : [ 10, 20, 50, 100, 200 ],
              "columns": [
                    { "data": null,
                        "render" : function(data, type, row, meta) {
                            // console.log("data:",data);
                            // console.log("row:",row);

                        var result = '';
                        result += '<input  type="checkbox" name="subChk"  sid="' + row.station_id + '" pid="'+ row.pnode_id +'" />';
                        return result;
                        
                        // if (idStr != userId) {
                        //     var result = '';
                        //     result += '<input  type="checkbox" name="subChk"  value="' + idStr + '" uid="'+ uid+'" />';
                        //     return result;
                        // }else{
                        //     var result = '';
                        //     result += '<input  type="checkbox" name="subChk" />';
                        //     return result;
                        // }
                        }
                    },
                    { "data": null },
                    { "data": "dma_name",
                        "render": function (data, type, row, meta) {
                            
                            if(data == "null" || data == null || data == undefined){
                                data = "";
                            }
                            return data;
                            // return row[2];
                        }
                    },
                    { "data": "station_name",
                        "render": function (data, type, row, meta) {
                            if(data == "null" || data == null || data == undefined){
                                data = "";
                            }
                            return data;
                            // return row[3];
                        }
                    },
                    {
                        "data": "metertype",
                        "render": function (data, type, row, meta) {
                        
                            var $select = $("<select></select>", {"id": "meter_type"+data,
                                "value": data
                            });
                            $.each(meter_types, function (k, v) {

                                var $option = $("<option></option>", {
                                    "text": v,
                                    "value": v
                                });
                                if (data === v) {
                                    $option.attr("selected", "selected")
                                }
                                $select.append($option);
                            });
                            return $select.prop("outerHTML");
                        }
                    }
                ],
                'rowCallback': function(row, data, dataIndex){
                     // Get row ID
                     var rowId = data[0];

                     // If row ID is in the list of selected row IDs
                     if($.inArray(rowId, rows_selected) !== -1){
                        $(row).find('input[type="checkbox"]').prop('checked', true);
                        $(row).addClass('selected');
                     }
                  },
              "pagingType" : "full_numbers", // 分页样式
              "dom" : "t" + "<'row'<'col-md-3 col-sm-12 col-xs-12'l><'col-md-4 col-sm-12 col-xs-12'i><'col-md-5 col-sm-12 col-xs-12'p>>",
              "oLanguage": {// 国际语言转化
                  "oAria": {
                      "sSortAscending": " - click/return to sort ascending",
                      "sSortDescending": " - click/return to sort descending"
                  },
                  "sLengthMenu": "显示 _MENU_ 记录",
                  "sInfo": "",
                  "sZeroRecords": "该分区还没有站点",
                  "sEmptyTable": "该分区还没有站点",
                  "sLoadingRecords": "正在加载数据-请等待...",
                  "sInfoEmpty": "",
                  "sInfoFiltered": "（数据库中共为 _MAX_ 条记录）",
                  "sProcessing": "<img src='../resources/user_share/row_details/select2-spinner.gif'/> 正在加载数据...",
                  "sSearch": "模糊查询：",
                  "sUrl": "",
                  "oPaginate": {
                      "sFirst": "首页",
                      "sPrevious": " 上一页 ",
                      "sNext": " 下一页 ",
                      "sLast": " 尾页 "
                  },
                  "columnDefs": [
                    { 'width': "10%", "targets": 0 },
                    { 'width': "20%", "targets": 1 },
                    { 'width': "30%", "targets": 2 },
                    { 'width': "30%", "targets": 3 },
                    
                ],
                
              },
              "order": [
                  [0, null]
              ],// 第一列排序图标改为默认

              });
              myTable.on('order.dt search.dt', function () {
                  myTable.column(1, {
                      search: 'applied',
                      order: 'applied'
                  }).nodes().each(function (cell, i) {
                      cell.innerHTML = i + 1;
                  });
              }).draw();
              //显示隐藏列
              
        },
        reloadData: function (dataList) {
            var currentPage = myTable.page()
            myTable.clear()
            myTable.rows.add(dataList)
            // myTable.page(currentPage).draw(false);
            myTable.columns.adjust().draw(false);

        },
        rowaddData: function (dataList) {
            var currentPage = myTable.page()
            // myTable.clear()
            myTable.rows.add(dataList)
            // myTable.page(currentPage).draw(false);
            myTable.columns.adjust().draw(false);

        },
        removeseleted: function (dataList) {
            var currentPage = myTable.page()
            // myTable.clear()
            myTable.row('.selected').remove().draw( false ); 
            

        },
        // 查询全部
        refreshTable: function(){
            selectTreeId = "";
            selectDistrictId = "";
            $('#simpleQueryParam').val("");
            var zTree = $.fn.zTree.getZTreeObj("stationtreeDemo");
            zTree.selectNode("");
            zTree.cancelSelectedNode();
            // myTable.requestData();
            dmaStation.inquireClick(1);
        },
        
    }
    $(function(){
        $('input').inputClear().on('onClearEvent',function(e,data){
            var id = data.id;
            if(id == 'search_station_condition'){
                search_ztree('stationtreeDemo',id,'station');
            };
        });

        
        function updateDataTableSelectAllCtrl(table){
           var $table             = myTable.table().node();
           var $chkbox_all        = $('tbody input[type="checkbox"]', $table);
           var $chkbox_checked    = $('tbody input[type="checkbox"]:checked', $table);
           var chkbox_select_all  = $('thead input[name="select_all"]', $table).get(0);

           // If none of the checkboxes are checked
           if($chkbox_checked.length === 0){
              chkbox_select_all.checked = false;
              if('indeterminate' in chkbox_select_all){
                 chkbox_select_all.indeterminate = false;
              }

           // If all of the checkboxes are checked
           } else if ($chkbox_checked.length === $chkbox_all.length){
              chkbox_select_all.checked = true;
              if('indeterminate' in chkbox_select_all){
                 chkbox_select_all.indeterminate = false;
              }

           // If some of the checkboxes are checked
           } else {
              chkbox_select_all.checked = true;
              if('indeterminate' in chkbox_select_all){
                 chkbox_select_all.indeterminate = true;
              }
           }
        }
        
        dmaStation.userTree();
        
        dmaStation.init();
        
        dmaStation.getTable('#stationdataTable');

        dmaStation.initdmastations();

        // Handle click on checkbox
   $('#stationdataTable tbody').on('click', 'input[type="checkbox"]', function(e){
      var $row = $(this).closest('tr');


      // Get row data
      var data = myTable.row($row).data();

      // Get row ID
      var rowId = data[0];

      // Determine whether row ID is in the list of selected row IDs 
      var index = $.inArray(rowId, rows_selected);

      // If checkbox is checked and row ID is not in list of selected row IDs
      if(this.checked && index === -1){
         rows_selected.push(rowId);

      // Otherwise, if checkbox is not checked and row ID is in list of selected row IDs
      } else if (!this.checked && index !== -1){
         rows_selected.splice(index, 1);
      }

      if(this.checked){
         $row.addClass('selected');
      } else {
         $row.removeClass('selected');
      }

      // Update state of "Select all" control
      // updateDataTableSelectAllCtrl(table);

      // Prevent click event from propagating to parent
      e.stopPropagation();
   });

   // Handle click on table cells with checkboxes
   $('#stationdataTable').on('click', 'tbody td, thead th:first-child', function(e){
      $(this).parent().find('input[type="checkbox"]').trigger('click');
   });

   // Handle click on "Select all" control
   $('thead input[name="select_all"]').on('click', function(e){
      if(this.checked){
         $('#stationdataTable tbody input[type="checkbox"]:not(:checked)').trigger('click');
      } else {
         $('#stationdataTable tbody input[type="checkbox"]:checked').trigger('click');
      }

      // Prevent click event from propagating to parent
      e.stopPropagation();
   });

        // dmaStation.inquireClick(1);
        //dmaStation.inquireDmastations(1);
        // IE9
        if(navigator.appName=="Microsoft Internet Explorer" && navigator.appVersion.split(";")[1].replace(/[ ]/g,"")=="MSIE9.0") {
            dmaStation.refreshTable();
            var search;
            $("#search_station_condition").bind("focus",function(){
                search = setInterval(function(){
                    search_ztree('stationtreeDemo', 'search_station_condition','station');
                },500);
            }).bind("blur",function(){
                clearInterval(search);
            });
        }
        // IE9 end
        $("#checkAll").bind("click", dmaStation.checkAll);
        // 全选
        $("input[name='subChk']").click(function() {
            $("#checkAll").prop(
                "checked",
                subChk.length == subChk.filter(":checked").length ? true: false);
        });
        $("#export").on("click",dmaStation.export);
        $("#import").on("click",dmaStation.import);
        $("#saveDmaStation").on("click",dmaStation.saveDmaStation);

        // $("#selectAll").bind("click", dmaStation.selectAll);
        // 组织架构模糊搜索
        $("#search_station_condition").on("input oninput",function(){
            search_ztree('stationtreeDemo', 'search_station_condition','station');
        });       
        
        
        
    })
})($,window)