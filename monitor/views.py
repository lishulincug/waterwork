# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.shortcuts import get_object_or_404,render,redirect
from django.http import HttpResponse,JsonResponse,HttpResponseRedirect
from django.contrib import messages

import json
import random
import datetime
# from datetime import date, timedelta
import time
from django.template.loader import render_to_string
from django.shortcuts import render,HttpResponse
from django.views import View
from django.views.generic import TemplateView, ListView, DetailView, CreateView, UpdateView,DeleteView,FormView
from django.contrib.messages.views import SuccessMessageMixin
from django.contrib.auth.decorators import login_required
from django.contrib import admin
from django.contrib.auth.models import Permission
from django.utils.safestring import mark_safe
from django.urls import reverse_lazy
from django.contrib.auth.mixins import LoginRequiredMixin
from django.db.models import Count
from accounts.models import User,MyRoles

from legacy.models import HdbFlowDataDay,HdbFlowDataMonth,Bigmeter,Alarm
from ggis.models import FenceShape
from entm.models import Organizations
from dmam.models import DMABaseinfo,Station
from dmam.utils import merge_values, merge_values_with,merge_values_to_dict

from .serializers import StationSerializer
from legacy.serializers import AlarmSerializer
# from django.core.urlresolvers import reverse_lazy


def dmastasticinfo():
    organ = Organizations.objects.first()
    organs = organ.get_descendants(include_self=True)

    dmas = None
    for o in organs:
        if dmas is None:
            dmas = o.dma.all()
        else:
            dmas |= o.dma.all()

    data = []
    for dma in dmas:

        dmastation = dma.dmastation_set.first()
        if dmastation is None:
            continue
        commaddr = dmastation.station_id

        dmaflow = 0
        month_sale = 0
        lastmonth_sale = 0
        bili = 0
        today = datetime.date.today()
        today_str = today.strftime("%Y-%m-%d")
        today_flow = HdbFlowDataDay.objects.filter(commaddr=commaddr).filter(hdate=today_str)
        if today_flow.exists():
            dmaflow = today_flow.first().dosage

        month_str = today.strftime("%Y-%m")
        month_flow = HdbFlowDataMonth.objects.filter(commaddr=commaddr).filter(hdate=month_str)
        if month_flow.exists():
            month_sale = month_flow.first().dosage

        # lastmonth = datetime.datetime(year=today.year,month=today.month-1,day=1)
        
        # now = datetime.datetime.now()
        # lastmonth = now + dateutil.relativedelta.relativedelta(months=-1)
        lastmonth = datetime.date.today().replace(day=1) - datetime.timedelta(days=1)
        lastmonth_str = lastmonth.strftime("%Y-%m")
        lastmonth_flow = HdbFlowDataMonth.objects.filter(commaddr=commaddr).filter(hdate=lastmonth_str)
        if lastmonth_flow.exists():
            lastmonth_sale = lastmonth_flow.first().dosage

        if float(month_sale) > 0 and float(lastmonth_sale) > 0:
            bili =  (float(month_sale) - float(lastmonth_sale) ) / float(lastmonth_sale)

        data.append(
            {
                "dma_name":dma.dma_name,
                "belongto":dma.belongto.name,
                "dma_level":"二级",
                "dma_status":"在线",
                "dmaflow":round(float(dmaflow),2),
                "month_sale":round(float(month_sale),2),
                "lastmonth_sale":round(float(lastmonth_sale),2),
                "bili":round(bili,2)
            }
        )

    return data



def maprealdata(request):
    dma_no = request.POST.get("dma_no") or None

    result = {}

    if dma_no:
        dma = DMABaseinfo.objects.get(dma_no=dma_no)
        dmartdata = dma.dma_map_realdata()
        result["success"] = True
        result["dmartdata"] = dmartdata

        f=FenceShape.objects.filter(dma_no=dma_no)
        if f.exists():
            feature = f[0].featureCollection()
            result["feature"] = feature


    else:
        result["success"] = False
        return HttpResponse(json.dumps(result))


    return HttpResponse(json.dumps(result))
        
class MapMonitorView(LoginRequiredMixin,TemplateView):
    template_name = "monitor/mapmonitor.html"

    def get_context_data(self, *args, **kwargs):
        context = super(MapMonitorView, self).get_context_data(*args, **kwargs)
        context["page_menu"] = "数据监控"
        # context["page_submenu"] = "组织和用户管理"
        context["page_title"] = "地图监控"

        stat_list = dmastasticinfo()
        statsinfo = json.dumps({"statsinfo":stat_list})
        
        context["dmastasticinfo"] = statsinfo

        

        return context          


class MapMonitorView2(LoginRequiredMixin,TemplateView):
    template_name = "monitor/mapmonitor.html"

    def get_context_data(self, *args, **kwargs):
        context = super(MapMonitorView2, self).get_context_data(*args, **kwargs)
        context["page_menu"] = "数据监控"
        # context["page_submenu"] = "组织和用户管理"
        context["page_title"] = "地图监控"

        stat_list = dmastasticinfo()
        statsinfo = json.dumps({"statsinfo":stat_list})
        
        context["dmastasticinfo"] = statsinfo
        

        return context          



class MapStationView(LoginRequiredMixin,TemplateView):
    template_name = "monitor/mapstation.html"

    def get_context_data(self, *args, **kwargs):
        context = super(MapStationView, self).get_context_data(*args, **kwargs)
        context["page_menu"] = "数据监控"
        # context["page_submenu"] = "组织和用户管理"
        context["page_title"] = "站点监控"

        stat_list = dmastasticinfo()
        statsinfo = json.dumps({"statsinfo":stat_list})
        
        context["dmastasticinfo"] = statsinfo

        

        return context          

# 返回站点地图组织树下站点信息
@login_required
def getmapstationlist(request):
    print('getmapstationlist:',request.POST)

    groupName = request.POST.get("groupName")
    user = request.user
    organs = user.belongto
    print(organs,type(organs))
    if groupName == '':
        selectedgroup = Organizations.objects.filter(cid=organs.cid).values().first()
    else:
        selectedgroup = Organizations.objects.filter(cid=groupName).values().first()

    stations = user.station_list_queryset('') 
    
    if groupName != "":
        stations = stations.filter(belongto__cid=groupName)
    
    # 一次获取全部所需数据，减少读取数据库耗时
    stations_value_list = stations.values_list('meter__simid__simcardNumber','username','belongto__name',
        'meter__serialnumber','meter__metertype','meter__dn','lng','lat')
    
    bgms = Bigmeter.objects.all().values_list('commaddr','commstate','fluxreadtime','flux','totalflux','pressure','signlen')
    
    def append_data(s):
        # query station from bigmeter commaddrss
        commaddr = s[0]
        b=None
        for b0 in bgms:
            if b0[0] == commaddr:
                b = b0
        if s[5] is None:
            return None
        if s[6] is None:
            return None
        if b:
        
            return {
                "stationname":s[1],
                "belongto":s[2],
                "serialnumber":s[3],#
                "metertype":s[4],
                "dn":s[5],
                "lng":s[6],
                "lat":s[7],
                "status":"在线" if b[1] == '1' else "离线",
                "readtime":b[2] ,
                "flux":round(float(b[3]),2) if b[3] else '',
                "totalflux":b[4],
                "press":round(float(b[5]),2) if b[5] else '',
                "signal":round(float(b[6]),2) if b[6] else '',
                
            }
        else:
            return None

    data = []
    # s:station b:bigmeter
    for s in stations_value_list:

        ret=append_data(s)
        
        if ret is not None:
            data.append(ret)

    entminfo = {
        "coorType":selectedgroup["coorType"],
        "longitude":selectedgroup["longitude"],
        "latitude":selectedgroup["latitude"],
        "zoomIn":selectedgroup["zoomIn"],
        "islocation":selectedgroup["islocation"],
        "adcode":selectedgroup["adcode"],
        "districtlevel":selectedgroup["districtlevel"],

    }

    result = dict()
    result["success"] = "true"
    result["obj"] = data
    result["entminfo"] = entminfo

    
    
    return HttpResponse(json.dumps(result))


class RealTimeDataView(LoginRequiredMixin,TemplateView):
    template_name = "monitor/realtimedata.html"

    def get_context_data(self, *args, **kwargs):
        context = super(RealTimeDataView, self).get_context_data(*args, **kwargs)
        context["page_menu"] = "数据监控"
        # context["page_submenu"] = "组织和用户管理"
        context["page_title"] = "实时数据"

        stations = self.request.user.station_list_queryset('')

        total_station_num = stations.count()
        online_station = stations.filter(meter__state=1)
        online_station_num = online_station.count()
        biguser_station = stations.filter(biguser=1)
        biguser_station_num = biguser_station.count()
        focus_station = stations.filter(focus=1)
        focus_station_num = focus_station.count()

        alarm_station_num = 0

        context["total_station_num"] = total_station_num
        context["online_station_num"] = online_station_num
        context["offline_station_num"] = total_station_num - online_station_num
        context["biguser_station_num"] = biguser_station_num
        context["focus_station_num"] = focus_station_num
        context["alarm_station_num"] = alarm_station_num

        return context          

# 返回实时数据页面站点列表
def stationlist_old(request):
    
    draw = 1
    length = 0
    start=0
    
    if request.method == "GET":
        draw = int(request.GET.get("draw", 1))
        length = int(request.GET.get("length", 10))
        start = int(request.GET.get("start", 0))
        search_value = request.GET.get("search[value]", None)
        # order_column = request.GET.get("order[0][column]", None)[0]
        # order = request.GET.get("order[0][dir]", None)[0]
        groupName = request.GET.get("groupName")
        simpleQueryParam = request.POST.get("simpleQueryParam")
        # print("simpleQueryParam",simpleQueryParam)

    if request.method == "POST":
        draw = int(request.POST.get("draw", 1))
        length = int(request.POST.get("length", 10))
        start = int(request.POST.get("start", 0))
        pageSize = int(request.POST.get("pageSize", 10))
        search_value = request.POST.get("search[value]", None)
        order_column = int(request.POST.get("order[0][column]", None))
        order = request.POST.get("order[0][dir]", None)
        groupName = request.POST.get("groupName")
        districtId = request.POST.get("districtId")
        simpleQueryParam = request.POST.get("simpleQueryParam")
        # print(request.POST.get("draw"))
        # print("groupName",groupName)
        # print("districtId:",districtId)
        # print("post simpleQueryParam",simpleQueryParam)
    
    
    user = request.user
    organs = user.belongto

    stations = user.station_list_queryset(simpleQueryParam) 
    pressures = user.pressure_list_queryset(simpleQueryParam)
    print("pressures ",pressures)
    if groupName != "":
        stations = stations.filter(belongto__uuid=groupName)
        pressures = pressures.filter(belongto__uuid=groupName)
    
    # 一次获取全部所需数据，减少读取数据库耗时
    stations_value_list = stations.values_list('meter__simid__simcardNumber','username','belongto__name','meter__serialnumber','meter__dn')
    pressures_value_list = pressures.values_list('simid__simcardNumber','username','belongto__name','serialnumber','dn')
    bgms = Bigmeter.objects.all().order_by('-fluxreadtime').values_list('commaddr','commstate','fluxreadtime','pickperiod','reportperiod',
        'flux','plustotalflux','reversetotalflux','pressure','meterv','gprsv','signlen')
    
    alams_sets = Alarm.objects.values('commaddr').annotate(Count('id'))
    alarm_dict = {}
    for alm in alams_sets:
        alarm_dict[alm['commaddr']] = alm['id__count']
    
    

    # 用户权限拥有的站点通讯识别号
    commaddrs = [s[0] for s in stations_value_list ]
    commaddrs += [s[0] for s in pressures_value_list]
    # print("commaddrs",commaddrs)
    tmp_bgms = [b for b in bgms if b[0] in commaddrs]
    # print("tmp_bgms",tmp_bgms)
    # print("stations",stations)
    
    def bgm_data(b):
        # query station from bigmeter commaddrss
        commaddr = b[0]
        alarm_count = alarm_dict.get(commaddr,0)

        # print('alarm_count',alarm_count,commaddr)
        s=None
        for s0 in stations_value_list:
            if s0[0] == commaddr:
                s=s0

        # pressure
        for s0 in pressures_value_list:
            if s0[0] == commaddr:
                s=s0
        # try:
        #     s =  stations.select_related("meter__simid").select_related("belongto").get(meter__simid__simcardNumber=commaddr)   #meter__simid__simcardNumber
        # except :
        #     s = None
        if s:
        
            return {
                "stationname":s[1],
                "belongto":s[2],
                "serialnumber":s[3],#
                "alarm":alarm_count,
                "status":b[1],
                "dn":s[4],
                "readtime":b[2] ,
                "collectperiod":b[3],
                "updataperiod":b[4],
                "influx":round(float(b[5]),2) if b[5] else '',
                "plusflux":round(float(b[6]),2)  if b[6] else '',
                "revertflux":round(float(b[7]),2) if b[7] else '',
                "press":round(float(b[8]),2) if b[8] else '',
                "baseelectricity":round(float(b[9]),2) if b[9] else '',
                "remoteelectricity":round(float(b[10]),2) if b[10] else '',
                "signal":round(float(b[11]),2) if b[11] else '',
                
            }
        else:
            return None
    data = []
    
    
    for b in tmp_bgms[start:start+length]:  #[start:start+length]
        
        ret=bgm_data(b)
        
        if ret is not None:
            data.append(ret)
    
    
    recordsTotal = stations.count()
    # recordsTotal = bgms.count()
    
    result = dict()
    result["records"] = data
    result["draw"] = draw
    result["success"] = "true"
    result["pageSize"] = pageSize
    result["totalPages"] = recordsTotal/pageSize
    result["recordsTotal"] = recordsTotal
    result["recordsFiltered"] = recordsTotal
    result["start"] = 0
    result["end"] = 0

    # print(draw,pageSize,recordsTotal/pageSize,recordsTotal)
    
    return HttpResponse(json.dumps(result))


# 返回实时数据页面站点列表 new
def stationlist(request):
    
    draw = 1
    length = 0
    start=0
    
    if request.method == "GET":
        draw = int(request.GET.get("draw", 1))
        length = int(request.GET.get("length", 10))
        start = int(request.GET.get("start", 0))
        search_value = request.GET.get("search[value]", None)
        # order_column = request.GET.get("order[0][column]", None)[0]
        # order = request.GET.get("order[0][dir]", None)[0]
        groupName = request.GET.get("groupName")
        simpleQueryParam = request.POST.get("simpleQueryParam")
        # print("simpleQueryParam",simpleQueryParam)

    if request.method == "POST":
        draw = int(request.POST.get("draw", 1))
        length = int(request.POST.get("length", 10))
        start = int(request.POST.get("start", 0))
        pageSize = int(request.POST.get("pageSize", 10))
        search_value = request.POST.get("search[value]", None)
        order_column = int(request.POST.get("order[0][column]", None))
        order = request.POST.get("order[0][dir]", None)
        groupName = request.POST.get("groupName")
        districtId = request.POST.get("districtId")
        simpleQueryParam = request.POST.get("simpleQueryParam")
        # print(request.POST.get("draw"))
        # print("groupName",groupName)
        # print("districtId:",districtId)
        # print("post simpleQueryParam",simpleQueryParam)
    
    user = request.user
    organs = user.belongto

    stations = user.station_list_queryset(simpleQueryParam) 
    pressures = user.pressure_list_queryset(simpleQueryParam)
    if groupName != "":
        stations = stations.filter(belongto__uuid=groupName)
        pressures = pressures.filter(belongto__uuid=groupName)

    station_values = stations.values('meter__simid__simcardNumber','username','belongto__name','meter__serialnumber','meter__dn')
    merged_station = merge_values_to_dict(station_values,'meter__simid__simcardNumber')
    
    # 一次获取全部所需数据，减少读取数据库耗时
    
    pressures_values = pressures.values('simid__simcardNumber','username','belongto__name','serialnumber','dn')
    merged_pressure = merge_values_to_dict(pressures_values,'simid__simcardNumber')
    bgms = Bigmeter.objects.all().order_by('-fluxreadtime').values('commaddr','commstate','fluxreadtime','pickperiod','reportperiod',
        'flux','plustotalflux','reversetotalflux','pressure','meterv','gprsv','signlen','pressurereadtime')
    merged_bgms = merge_values_to_dict(bgms,'commaddr')
    t1=time.time()
    alams_sets = Alarm.objects.values("commaddr").annotate(Count('id'))
    
    # 报警信息数据库记录超过800万条，数据查询比较耗时，暂时不取，
    # print("1.t",time.time()-t1)
    # alarm_dict = {}
    

    # for alm in alams_sets:
    #     alarm_dict[alm['commaddr']] = alm['id__count']
        
    # print("2.t",time.time()-t1)
    
    
    
    # 用户权限拥有的站点通讯识别号
    
    
    data = []
    
    for b in merged_bgms.keys():  #[start:start+length]
        
        if b in merged_station.keys():
            alarm_count = 0 #alarm_dict.get(b,0)
            # alarm_count = [a['alm_count'] for a in alams_sets if a['commaddr'] == b ]
            # alarm_item = list(filter(lambda alarm: alarm[0] == b, alarm_all))[0]
            
            data.append({
                "stationname":merged_station[b]['username'],
                "belongto":merged_station[b]['belongto__name'],
                "serialnumber":merged_station[b]['meter__serialnumber'],#
                "alarm":alarm_count,
                "status":merged_bgms[b]['commstate'],
                "dn":merged_station[b]['meter__dn'],
                "readtime":merged_bgms[b]['fluxreadtime'] ,
                "collectperiod":merged_bgms[b]['pickperiod'],
                "updataperiod":merged_bgms[b]['reportperiod'],
                "influx":round(float(merged_bgms[b]['flux']),2) if merged_bgms[b]['flux'] else '',
                "plusflux":round(float(merged_bgms[b]['plustotalflux']),2)  if merged_bgms[b]['plustotalflux'] else '',
                "revertflux":round(float(merged_bgms[b]['reversetotalflux']),2) if merged_bgms[b]['reversetotalflux'] else '',
                "press":round(float(merged_bgms[b]['pressure']),2) if merged_bgms[b]['pressure'] else '',
                "baseelectricity":round(float(merged_bgms[b]['meterv']),2) if merged_bgms[b]['meterv'] else '',
                "remoteelectricity":round(float(merged_bgms[b]['gprsv']),2) if merged_bgms[b]['gprsv'] else '',
                "signal":round(float(merged_bgms[b]['signlen']),2) if merged_bgms[b]['signlen'] else '',
                
            })

        if b in merged_pressure.keys():
            
            data.append({
                "stationname":merged_pressure[b]['username'],
                "belongto":merged_pressure[b]['belongto__name'],
                "serialnumber":merged_pressure[b]['serialnumber'],#
                "alarm":0,
                "status":merged_bgms[b]['commstate'],
                "dn":merged_pressure[b]['dn'],
                "readtime":merged_bgms[b]['pressurereadtime'] ,
                "collectperiod":merged_bgms[b]['pickperiod'],
                "updataperiod":merged_bgms[b]['reportperiod'],
                "influx":'-',
                "plusflux":'-',
                "revertflux":'-',
                "press":round(float(merged_bgms[b]['pressure']),3) if merged_bgms[b]['pressure'] else '',
                "baseelectricity":round(float(merged_bgms[b]['meterv']),2) if merged_bgms[b]['meterv'] else '',
                "remoteelectricity":round(float(merged_bgms[b]['gprsv']),2) if merged_bgms[b]['gprsv'] else '',
                "signal":round(float(merged_bgms[b]['signlen']),2) if merged_bgms[b]['signlen'] else '',
                
            })
        
    
    recordsTotal = stations.count() + pressures.count()
    # recordsTotal = bgms.count()
    
    result = dict()
    result["records"] = data[start:start+length]
    result["draw"] = draw
    result["success"] = "true"
    result["pageSize"] = pageSize
    result["totalPages"] = recordsTotal/pageSize
    result["recordsTotal"] = recordsTotal
    result["recordsFiltered"] = recordsTotal
    result["start"] = 0
    result["end"] = 0

    # print(draw,pageSize,recordsTotal/pageSize,recordsTotal)
    
    return HttpResponse(json.dumps(result))




class RealcurlvView(LoginRequiredMixin,TemplateView):
    template_name = "monitor/realcurlv.html"

    def get_context_data(self, *args, **kwargs):
        context = super(RealcurlvView, self).get_context_data(*args, **kwargs)
        context["page_title"] = "实时曲线"
        context["page_menu"] = "数据监控"
        
        return context  




class VehicleView(LoginRequiredMixin,TemplateView):
    template_name = "monitor/vehicle.html"

    def get_context_data(self, *args, **kwargs):
        context = super(VehicleView, self).get_context_data(*args, **kwargs)
        context["page_title"] = "车辆监控"
        context["page_menu"] = "数据监控"
        
        return context  

 

class VedioView(LoginRequiredMixin,TemplateView):
    template_name = "monitor/vedio.html"

    def get_context_data(self, *args, **kwargs):
        context = super(VedioView, self).get_context_data(*args, **kwargs)
        context["page_title"] = "实时视频"
        context["page_menu"] = "数据监控"
        
        return context  

 

class SecondwaterView(LoginRequiredMixin,TemplateView):
    template_name = "monitor/secondwater.html"

    def get_context_data(self, *args, **kwargs):
        context = super(SecondwaterView, self).get_context_data(*args, **kwargs)
        context["page_title"] = "二次供水"
        context["page_menu"] = "数据监控"
        
        return context  

 
# 返回二供信息
@login_required
def getmapsecondwaterlist(request):
    print('getmapsecondwaterlist:',request.POST)

    groupName = request.POST.get("groupName")
    user = request.user
    organs = user.belongto
    print(organs,type(organs))
    if groupName == '':
        selectedgroup = Organizations.objects.filter(cid=organs.cid).values().first()
    else:
        selectedgroup = Organizations.objects.filter(cid=groupName).values().first()

    secondwaters = user.secondwater_list_queryset('') 
    
    if groupName != "":
        secondwaters = secondwaters.filter(belongto__cid=groupName)
    
    # 一次获取全部所需数据，减少读取数据库耗时
    stations_value_list = secondwaters.values('name','belongto__name','lng','lat','coortype')
    
    
    def append_data(s):
        return {
                "stationname":s["name"],
                "belongto":s["belongto__name"],
                "coortype":s["coortype"],
                "lng":s["lng"],
                "lat":s["lat"],
                "status":"在线" ,
                "readtime":"13:14" ,
                "flux":'3.14',
                "press_out":"1",
                "press_in":'',
                
                
            }
        

    data = []
    # s:station b:bigmeter
    for s in stations_value_list:

        ret=append_data(s)
        
        if ret is not None:
            data.append(ret)

    entminfo = {
        "coorType":selectedgroup["coorType"],
        "longitude":selectedgroup["longitude"],
        "latitude":selectedgroup["latitude"],
        "zoomIn":selectedgroup["zoomIn"],
        "islocation":selectedgroup["islocation"],
        "adcode":selectedgroup["adcode"],
        "districtlevel":selectedgroup["districtlevel"],

    }

    result = dict()
    result["success"] = "true"
    result["obj"] = data
    result["entminfo"] = entminfo

    
    
    return HttpResponse(json.dumps(result))




# api
def station_list(request):
    if request.method == 'GET':
        station = Station.objects.all()
        serializer = StationSerializer(station, many=True)
        return JsonResponse(serializer.data, safe=False)


def station_detail(request,pk):
    try:
        print('pk=',pk)
        station = Station.objects.get(pk=pk)
    except Station.DoesNotExist:
        print('Station DoesNotExist')
        return HttpResponse(status=404)

    if request.method == 'GET':
        serializer = StationSerializer(station)
        print('serializer.data:',serializer.data)
        return JsonResponse(serializer.data)


def alarm_detail(request,pk):
    try:
        alarm = Alarm.objects.get(pk=pk)
    except Alarm.DoesNotExist:
        return HttpResponse(status=404)

    if request.method == 'GET':
        serializer = AlarmSerializer(alarm)
        return JsonResponse(serializer.data)